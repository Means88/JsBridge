package com.github.means88.jsbridge;

import android.graphics.Bitmap;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;

/**
 * Created by bruce on 10/28/15.
 */
public class BridgeWebViewClient extends WebViewClient {
    private BridgeWebView webView;

    public BridgeWebViewClient(BridgeWebView webView) {
        this.webView = webView;
    }

    @Override
    public boolean shouldOverrideUrlLoading(WebView view, String url) {
        try {
            url = URLDecoder.decode(url, "UTF-8");
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        }
        if (url.startsWith(webView.bridgeUtil.getOverrideSchema() + "://" + webView.bridgeUtil.getReturnData())) { // 如果是返回数据
            webView.handlerReturnData(url);
            return true;
        } else if (url.startsWith(webView.bridgeUtil.getOverrideSchema() + "://")) { //
            webView.flushMessageQueue();
            return true;
        } else {
            return super.shouldOverrideUrlLoading(view, url);
        }
    }

    @Override
    public void onPageStarted(WebView view, String url, Bitmap favicon) {
        super.onPageStarted(view, url, favicon);
    }

    @Override
    public void onPageFinished(WebView view, String url) {
        super.onPageFinished(view, url);
        if (!isJsBridgeEnabled()) {
            return;
        }

        if (webView.preloadJsFiles() != null) {
            webView.bridgeUtil.webViewLoadLocalJs(view, webView.preloadJsFiles());
        }

        //
        if (webView.getStartupMessage() != null) {
            for (Message m : webView.getStartupMessage()) {
                webView.dispatchMessage(m);
            }
            webView.setStartupMessage(null);
        }
    }

    @Override
    public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
        super.onReceivedError(view, errorCode, description, failingUrl);
    }

    private boolean isJsBridgeEnabled() {
        if (webView.getJsBridgeRegexWhiteList().size() == 0) {
            return true;
        }
        for (String regex : webView.getJsBridgeRegexWhiteList()) {
            if (webView.getUrl().matches(regex)) {
                return true;
            }
        }
        return false;
    }
}