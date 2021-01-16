package com.forsterlewis.trakdoku;

import android.app.AlertDialog;
import android.content.DialogInterface;
import android.os.Bundle;
import android.support.v4.app.Fragment;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.JsResult;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;

/**
 * Created by Owner on 06/10/2014.
 */
public class WebPageFragment extends Fragment
        implements JSInterface.PageListener
{
    public static final String BUNDLE_URL = "URL";
    public static final String BUNDLE_POSITION = "POSITION";

    public static final String JS_INTERFACE_NAME = "Android";
    public static final String URL_PREFIX = "file:///android_asset/www/";

    //static boolean resumed = false;

    public static final WebPageFragment newInstance(PagerActivity.PageInfo p)
    {
        if (BuildConfig.DEBUG) Log.i("WebPageFragment","newInstance: "+p.url);
        WebPageFragment f = new WebPageFragment();
        Bundle bdl = new Bundle();
        bdl.putString(BUNDLE_URL, p.url);
        bdl.putInt(BUNDLE_POSITION, p.position);
        f.setArguments(bdl);
        return f;
    }

    /* @Override
    public void onAttach(Activity activity) {
        super.onAttach(activity);

        // This makes sure that the container activity has implemented
        // the callback interface. If not, it throws an exception
        try {
            mCallback = (PageListener) activity;
        } catch (ClassCastException e) {
            throw new ClassCastException(activity.toString()
                    + " must implement PageListener");
        }
    } */

    @Override
    public void onActivityCreated(Bundle savedInstanceState) {
        super.onActivityCreated(savedInstanceState);

        //debug logging
        if (BuildConfig.DEBUG) Log.i("WebPageFragment","onActivityCreated: "+get_url());
    }

    @Override
    public void onDestroy()
    {
        super.onDestroy();
        if (BuildConfig.DEBUG) Log.i("WebPageFragment","onDestroy: "+get_url());
    }

    @Override
    public void onResume()
    {
        super.onResume();
        //resumed = true;
        if (BuildConfig.DEBUG) Log.i("WebPageFragment","onResume: "+get_url());
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState)
    {
        if (BuildConfig.DEBUG) Log.i("WebPageFragment","onCreateView: "+get_url());

        ViewGroup page_view = (ViewGroup) inflater.inflate(R.layout.webview, container, false);
        // set up the WebView
        WebView web_view;

        web_view = (WebView) page_view.findViewById(R.id.webview);

        final JSInterface myJSInterface = new JSInterface(this);
        web_view.addJavascriptInterface(myJSInterface, JS_INTERFACE_NAME);
        web_view.setWebChromeClient(new JSAlertChromeClient());
        web_view.setScrollBarStyle(View.SCROLLBARS_INSIDE_INSET);

        WebSettings myWebSettings = web_view.getSettings();

        myWebSettings.setJavaScriptEnabled(true);
        myWebSettings.setDomStorageEnabled(true);
        myWebSettings.setDatabaseEnabled(true);
        // support localStorage
        if(android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.JELLY_BEAN) {
            myWebSettings.setAllowUniversalAccessFromFileURLs(true);
        }
        //myWebSettings.setAllowUniversalAccessFromFileURLs(true);

        web_view.loadUrl(URL_PREFIX + get_url());

        return page_view;
    }

    private class JSAlertChromeClient extends WebChromeClient
    {
        @Override
        public boolean onJsAlert(WebView view, String url, String message,
                                 final JsResult result)
        {
            // handle Alert event, here we are showing AlertDialog

            String next_page_command = "com.forsterlewis.next_page ";
            String alert_command = "com.forsterlewis.alert ";
            if (message.contains(next_page_command))
            {
                String next_url = message.substring(next_page_command.length());
                next_page(next_url);
                result.cancel();
                return true;
            }
            if (message.contains(alert_command))
            {
                String alert_msg = message.substring(alert_command.length());
                new AlertDialog.Builder(getActivity())
                        .setTitle("JavaScript Alert !?")
                        .setMessage(alert_msg)
                        .setPositiveButton(android.R.string.ok,
                                new AlertDialog.OnClickListener()
                                {
                                    public void onClick(DialogInterface dialog,
                                                        int which)
                                    {
                                        // do your stuff
                                        result.confirm();
                                    }
                                }).setCancelable(false).create().show();
                return true;
            }
            result.cancel();
            return true;
        }
    }

    public void next_page(String url)
    {
        ((PagerActivity) getActivity()).mPageAdapter.next_page(url);
    }

    public String get_url()
    {
        return getArguments().getString(BUNDLE_URL);
    }

    public int get_position()
    {
        return getArguments().getInt(BUNDLE_POSITION);
    }

    public void page_refresh()
    {
        if (BuildConfig.DEBUG) Log.i("WebPageFragment", "TRYING: page_refresh("+get_url()+")");
        if (isResumed())
        {
            if (BuildConfig.DEBUG) Log.i("WebPageFragment", "RESUMED: page_refresh("+get_url()+"): calling javascript:app_page_refresh()");
            WebView web_view = (WebView) getView().findViewById(R.id.webview);
            web_view.loadUrl("javascript:app_page_refresh('" + get_url() + "');");
            return;
        }
        if (BuildConfig.DEBUG) Log.i("WebPageFragment", "NOT RESUMED: page_refresh("+get_url()+") ignored");
    }

    public void load_url(String url)
    {
        if (BuildConfig.DEBUG) Log.i("WebPageFragment", "load_url("+get_url()+"): calling loadUrl("+url+")");
        WebView web_view = (WebView) getView().findViewById(R.id.webview);
        web_view.loadUrl(URL_PREFIX + url);
        if (BuildConfig.DEBUG) Log.i("WebPageFragment", "load_url(" + get_url() + "): called loadUrl(" + url + ")");
    }

}
