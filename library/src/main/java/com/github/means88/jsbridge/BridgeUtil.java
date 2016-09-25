package com.github.means88.jsbridge;

import android.content.Context;
import android.webkit.WebView;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.List;

public class BridgeUtil {
	private String overrideSchema = "schema";
    private String returnData = "return/";//格式为   schema://return/{function}/returncontent
    private String emptyStr = "";
    private String underlineStr = "_";
    private String splitMark = "/";

    private String callbackIdFormat = "JAVA_CB_%s";
    private String jsHandleMessageFromJava = "javascript:WebViewJavascriptBridge._handleMessageFromNative('%s');";
    private String jsFetchQueueFromJava = "javascript:WebViewJavascriptBridge._fetchQueue();";
	public final String JAVASCRIPT_STR = "javascript:";

	public BridgeUtil() {

	}

	public BridgeUtil(String prefix) {
        setOverrideSchema(prefix);
	}

    public String getOverrideSchema() {
        return overrideSchema;
    }

    public void setOverrideSchema(String overrideSchema) {
        this.overrideSchema = overrideSchema;
    }

    public String getReturnData() {
        return returnData;
    }

    public void setReturnData(String returnData) {
        this.returnData = returnData;
    }

    public String getFetchQueue() {
        return overrideSchema + returnData + "_fetchQueue/";
    }

    public String getEmptyStr() {
        return emptyStr;
    }

    public void setEmptyStr(String emptyStr) {
        this.emptyStr = emptyStr;
    }

    public String getUnderlineStr() {
        return underlineStr;
    }

    public void setUnderlineStr(String underlineStr) {
        this.underlineStr = underlineStr;
    }

    public String getSplitMark() {
        return splitMark;
    }

    public void setSplitMark(String splitMark) {
        this.splitMark = splitMark;
    }

    public String getCallbackIdFormat() {
        return callbackIdFormat;
    }

    public void setCallbackIdFormat(String callbackIdFormat) {
        this.callbackIdFormat = callbackIdFormat;
    }

    public String getJsHandleMessageFromJava() {
        return jsHandleMessageFromJava;
    }

    public void setJsHandleMessageFromJava(String jsHandleMessageFromJava) {
        this.jsHandleMessageFromJava = jsHandleMessageFromJava;
    }

    public String getJsFetchQueueFromJava() {
        return jsFetchQueueFromJava;
    }

    public void setJsFetchQueueFromJava(String jsFetchQueueFromJava) {
        this.jsFetchQueueFromJava = jsFetchQueueFromJava;
    }

    public String parseFunctionName(String jsUrl){
		return jsUrl.replace("javascript:WebViewJavascriptBridge.", "").replaceAll("\\(.*\\);", "");
	}
	
	
	public String getDataFromReturnUrl(String url) {
		if(url.startsWith(getFetchQueue())) {
			return url.replace(getFetchQueue(), emptyStr);
		}
		
		String temp = url.replace(overrideSchema + "://" + returnData, emptyStr);
		String[] functionAndData = temp.split(splitMark);

        if(functionAndData.length >= 2) {
            StringBuilder sb = new StringBuilder();
            for (int i = 1; i < functionAndData.length; i++) {
                sb.append(functionAndData[i]);
            }
            return sb.toString();
        }
		return null;
	}

	public String getFunctionFromReturnUrl(String url) {
		String temp = url.replace(overrideSchema + "://" + returnData, emptyStr);
		String[] functionAndData = temp.split(splitMark);
		if(functionAndData.length >= 1){
			return functionAndData[0];
		}
		return null;
	}

	
	
	/**
	 * js 文件将注入为第一个script引用
	 * @param view
	 * @param url
	 */
	public void webViewLoadJs(WebView view, String url){
		String js = "var newscript = document.createElement(\"script\");";
		js += "newscript.src=\"" + url + "\";";
		js += "document.head.appendChild(newscript);";
		view.loadUrl("javascript:" + js);
	}

	public void webViewLoadJs(WebView view, List<String> urls) {
		for (String url : urls) {
			webViewLoadJs(view, url);
		}
	}

    public void webViewLoadLocalJs(WebView view, String path){
        String jsContent = assetFile2Str(view.getContext(), path);
        view.loadUrl("javascript:" + jsContent);
    }

	public void webViewLoadLocalJs(WebView view, List<String> paths){
		for (String path : paths) {
			webViewLoadLocalJs(view, path);
		}
	}
	
	public String assetFile2Str(Context c, String urlStr){
		InputStream in = null;
		try{
			in = c.getAssets().open(urlStr);
            BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(in));
            String line = null;
            StringBuilder sb = new StringBuilder();
            do {
                line = bufferedReader.readLine();
                if (line != null && !line.matches("^\\s*\\/\\/.*")) {
                    sb.append(line);
                }
            } while (line != null);

            bufferedReader.close();
            in.close();
 
            return sb.toString();
		} catch (Exception e) {
			e.printStackTrace();
		} finally {
			if(in != null) {
				try {
					in.close();
				} catch (IOException e) {
				}
			}
		}
		return null;
	}
}
