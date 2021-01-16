package com.forsterlewis.trakdoku;

import android.content.Context;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.Toast;

/**
 * Created by Owner on 07/10/2014.
 */
public class JSInterface {
    WebPageFragment webpage_fragment;
    //WebView webpage_webview;

    // Container Activity must implement this interface
    public interface PageListener {
        public void next_page(final String url);
    }

    JSInterface(WebPageFragment fragment)
    {
        webpage_fragment = fragment;
        //webpage_webview = web_view;
    }

    /** Show a toast from the web page */
    @JavascriptInterface
    public void showToast(String toast) {
        Context context = webpage_fragment.getActivity().getApplicationContext();
        Toast.makeText(context, toast, Toast.LENGTH_SHORT).show();
    }

    /** Get sample string */
    @JavascriptInterface
    public String getString() {
        return "Hello World?";
    }

    /** Move to next slide */
    @JavascriptInterface
    public String next_page(String url)
    {
        webpage_fragment.next_page(url);
        return "JS next_page OK " + url;
    }

}
