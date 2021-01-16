package com.forsterlewis.trakdoku;

import android.os.Bundle;
import android.support.v4.app.FragmentActivity;
import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentManager;
import android.support.v4.app.FragmentStatePagerAdapter;
import android.support.v4.view.ViewPager;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;

import java.util.ArrayList;

public class PagerActivity extends FragmentActivity
{
    static class Pages
    {
        ArrayList<PageInfo> pages = new ArrayList<PageInfo>();

        Pages()
        {
            pages.add(new PageInfo("index.html", 0));
            pages.add(new PageInfo("puzzles.html", 1));
            pages.add(new PageInfo("puzzle.html", 2));
        }

        int size()
        {
            return pages.size();
        }

        PageInfo get(String url)
        {
            for (PageInfo p : pages)
            {
                if (p.url.equals(url)) return p;
            }
            return null;
        }

        PageInfo get(int position)
        {
            for (PageInfo p : pages)
            {
                if (p.position == position) return p;
            }
            return null;
        }
    }

    static class PageInfo
    {
        public String url;
        public int position;

        public PageInfo(String url, int position)
        {
            this.url = url;
            this.position = position;
        }
    }

    /**
     * The pager widget, which handles animation and allows swiping horizontally to access previous
     * and next wizard steps.
     */
    private ViewPager mPager;

    /**
     * The pager adapter, which provides the pages to the view pager widget.
     */
    public MyPageAdapter mPageAdapter;

    static Pages pages = new Pages();

    @Override
    public void onBackPressed() {
        int current_page = mPager.getCurrentItem();
        if(current_page > 0) {
            mPager.setCurrentItem(current_page-1, true);
        } else {
            super.onBackPressed(); // This will pop the Activity from the stack.
        }
    }

    private final ViewPager.SimpleOnPageChangeListener mPageChangeListener = new ViewPager.SimpleOnPageChangeListener() {

        @Override
        public void onPageSelected(final int position) {
            if (BuildConfig.DEBUG) Log.i("PagerActivity","onPageSelected("+position+")");
            WebPageFragment f = (WebPageFragment) mPageAdapter.instantiateItem(mPager, position);
            if (BuildConfig.DEBUG) Log.i("PagerActivity","onPageSelected found fragment "+f.get_url());

            f.page_refresh();

            if (BuildConfig.DEBUG) Log.i("PagerActivity", "onPageSelected called f.page_refresh, position="+position+", size="+pages.size());
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_pager);

        //debug logging
        if (BuildConfig.DEBUG) Log.i("PagerActivity", "onCreate: ");


        // Instantiate a ViewPager and a PagerAdapter.
        mPager = (ViewPager) findViewById(R.id.pager);

        mPager.setOnPageChangeListener(mPageChangeListener);

        mPageAdapter = new MyPageAdapter(super.getSupportFragmentManager());
        mPager.setAdapter(mPageAdapter);
    }

    @Override
    protected void onDestroy()
    {
        super.onDestroy();
        if (BuildConfig.DEBUG) Log.i("PagerActivity","onDestroy");
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.slide, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        // Handle action bar item clicks here. The action bar will
        // automatically handle clicks on the Home/Up button, so long
        // as you specify a parent activity in AndroidManifest.xml.
        int id = item.getItemId();
        if (id == R.id.action_settings) {
            return true;
        }
        return super.onOptionsItemSelected(item);
    }

    public class MyPageAdapter extends FragmentStatePagerAdapter {

        //private List<WebPageFragment> fragments;

        public MyPageAdapter(FragmentManager fm) {
            super(fm);
        //    //this.fragments = fragments;
        }

        @Override
        public Fragment getItem(int position)
        {
            if (BuildConfig.DEBUG) Log.i("MyPageAdapter", "getItem("+position+") ("+pages.size()+" pages)");

            return WebPageFragment.newInstance(pages.get(position));
        }

        @Override
        public int getCount()
        {
            return pages.size();
        }

        public void next_page(final String url)
        {
            runOnUiThread(new Runnable() {
                public void run() {
                    {
                        if (BuildConfig.DEBUG) Log.i("PagerActivity", "next_page("+url+")");
                        PageInfo page = pages.get(url);
                        int position = (page != null) ? page.position : 0;
                        if (BuildConfig.DEBUG) Log.i("PagerActivity", "next_page("+url+") found position="+position);

                        mPager.setCurrentItem(position);
                        if (BuildConfig.DEBUG) Log.i("PagerActivity", "next_page("+url+") called setCurrentItem("+position+")");
                    }
                }
            });
        }
    }

}
