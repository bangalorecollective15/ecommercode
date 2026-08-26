package com.banglorecolletive.app;

import android.graphics.Bitmap;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    // Local file bundled in the APK (place at android/app/src/main/assets/public/offline.html
    // — Capacitor copies your webDir contents here automatically on `npx cap sync`).
    private static final String OFFLINE_PAGE = "file:///android_asset/public/offline.html";

    // The remote URL your app actually points at.
    private static final String REMOTE_APP_URL = "https://bangalorecollective.com/";

    private boolean isShowingOfflinePage = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = this.bridge.getWebView();

        // Exposes retryLoad() to offline.html as window.AndroidBridge.retryLoad()
        webView.addJavascriptInterface(new Object() {
            @JavascriptInterface
            public void retryLoad() {
                MainActivity.this.retryLoad();
            }
        }, "AndroidBridge");

        webView.setWebViewClient(new WebViewClient() {

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                // Reset the flag whenever a real navigation starts, so a later
                // successful load doesn't get treated as "still offline".
                if (!url.contains("offline.html")) {
                    isShowingOfflinePage = false;
                }
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);

                // Only react to the main page failing to load, not sub-resources
                // (images, fonts, etc.) — those shouldn't nuke the whole screen.
                if (request.isForMainFrame() && !isShowingOfflinePage) {
                    isShowingOfflinePage = true;
                    view.loadUrl(OFFLINE_PAGE);
                }
            }
        });
    }

    // Called from JS via the bridge (see retry button wiring below) to attempt
    // reloading the real app after the user taps "Retry".
    public void retryLoad() {
        runOnUiThread(() -> {
            WebView webView = this.bridge.getWebView();
            isShowingOfflinePage = false;
            webView.loadUrl(REMOTE_APP_URL);
        });
    }
}