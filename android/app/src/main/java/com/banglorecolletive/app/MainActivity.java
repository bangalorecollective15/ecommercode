package com.banglorecolletive.app;

import android.content.Intent;
import android.content.Context;
import android.graphics.Bitmap;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkRequest;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final String TAG = "BackButtonDebug";

    // Local file bundled in the APK (Capacitor copies your webDir contents here
    // automatically on `npx cap sync`).
    private static final String OFFLINE_PAGE = "file:///android_asset/public/offline.html";

    // The remote URL your app actually points at.
    private static final String REMOTE_APP_URL = "https://bangalorecollective.com/";

    private boolean isShowingOfflinePage = false;
    private ConnectivityManager connectivityManager;
    private ConnectivityManager.NetworkCallback networkCallback;
    private WebView webView;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = this.bridge.getWebView();
        connectivityManager = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);

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
                if (!url.contains("offline.html")) {
                    isShowingOfflinePage = false;
                }
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                if (request.isForMainFrame() && !isShowingOfflinePage) {
                    showOfflinePage();
                }
            }

            // Also catch server-side failures (500s, maintenance mode, etc.) — a
            // dead server should show the offline/error page too, not a blank
            // or broken page.
            @Override
            public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse errorResponse) {
                super.onReceivedHttpError(view, request, errorResponse);
                if (request.isForMainFrame() && errorResponse.getStatusCode() >= 500 && !isShowingOfflinePage) {
                    showOfflinePage();
                }
            }
        });

        // THE KEY FIX: super.onCreate() above already told the bridge to start
        // loading REMOTE_APP_URL. If there's no network at all, don't wait for
        // that load to fail (it can fail faster than we can attach our own
        // error handling, causing the browser's own error page to flash up).
        // Stop it immediately and go straight to the offline page instead.
        if (!isNetworkAvailable()) {
            webView.stopLoading();
            showOfflinePage();
        }

        // IMPORTANT: super.onCreate() above already asynchronously kicked off
        // loading REMOTE_APP_URL (the homepage) via the Capacitor bridge. If we
        // call handleIncomingIntent() directly here, it races against that
        // homepage load — and the homepage often wins, silently overwriting our
        // deep-link navigation. Posting to the webView's message queue defers
        // our call until after that initial load call has been dispatched, so
        // our deep-link navigation happens last and actually sticks.
        webView.post(() -> handleIncomingIntent(getIntent()));

        configureBackButton();
        registerNetworkCallback();
    }

    // Called when the app is already running (e.g. singleTask reuses the
    // existing activity) and a new link is tapped. Without this, a second
    // deep link tap while the app is already open would be silently ignored.
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIncomingIntent(intent);
    }

    // Reads the URI that launched/resumed the activity and, if it's a real
    // product/page link (either an https App Link or our custom scheme),
    // loads that exact page in the webview instead of the bare homepage.
    private void handleIncomingIntent(Intent intent) {
        if (intent == null) return;
        Uri data = intent.getData();
        if (data == null) return;

        String scheme = data.getScheme();
        String targetUrl;

        if ("https".equals(scheme) || "http".equals(scheme)) {
            // Tapped an https App Link — load that exact page.
            targetUrl = data.toString();
        } else if ("banglorecollective".equals(scheme)) {
            // Tapped the custom-scheme fallback (banglorecollective://path)
            // — rebuild it into a real https URL on your domain.
            String path = data.getHost() != null ? data.getHost() + data.getPath() : data.getSchemeSpecificPart();
            if (path.startsWith("/")) path = path.substring(1);
            targetUrl = REMOTE_APP_URL + path;
        } else {
            return; // Not a link we care about (e.g. normal launcher tap)
        }

        Log.d(TAG, "Deep link received, loading: " + targetUrl);
        webView.loadUrl(targetUrl);
    }

    private void configureBackButton() {
        Log.d(TAG, "Native back callback registered");
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                String currentUrl = webView.getUrl();
                String currentPath = currentUrl == null ? "" : Uri.parse(currentUrl).getPath();
                Log.d(TAG, "Native back received: url=" + currentUrl + ", path=" + currentPath);

                if ("/userinterface".equals(currentPath)
                        || "/userinterface/".equals(currentPath)
                        || "/userinterface/home".equals(currentPath)
                        || "/userinterface/home/".equals(currentPath)) {
                    Log.d(TAG, "Home detected; closing app");
                    finishAndRemoveTask();
                    return;
                }

                if (webView.canGoBack()) {
                    Log.d(TAG, "Non-home detected; going back in WebView history");
                    webView.goBack();
                } else {
                    Log.d(TAG, "No WebView history; loading home");
                    webView.loadUrl(REMOTE_APP_URL + "userinterface/home");
                }
            }
        });
    }

    private void showOfflinePage() {
        isShowingOfflinePage = true;
        webView.loadUrl(OFFLINE_PAGE);
    }

    private boolean isNetworkAvailable() {
        if (connectivityManager == null) return false;
        Network network = connectivityManager.getActiveNetwork();
        if (network == null) return false;
        NetworkCapabilities capabilities = connectivityManager.getNetworkCapabilities(network);
        if (capabilities == null) return false;
        // Has a network interface AND it's actually validated to reach the
        // internet (not just connected to a Wi-Fi router with no WAN link,
        // e.g. a captive portal or a router with no upstream connection).
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                && capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED);
    }

    // Watches for connectivity changes WHILE the app is open, so that if the
    // user loses/regains internet mid-session (not just at launch) the app
    // reacts automatically instead of requiring a manual retry tap.
    private void registerNetworkCallback() {
        NetworkRequest request = new NetworkRequest.Builder()
                .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                .addCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
                .build();

        networkCallback = new ConnectivityManager.NetworkCallback() {
            @Override
            public void onAvailable(Network network) {
                // Internet just became available. If we're currently showing
                // the offline page, silently reload the real app.
                runOnUiThread(() -> {
                    if (isShowingOfflinePage) {
                        webView.loadUrl(REMOTE_APP_URL);
                    }
                });
            }

            @Override
            public void onLost(Network network) {
                runOnUiThread(() -> {
                    if (!isNetworkAvailable() && !isShowingOfflinePage) {
                        webView.stopLoading();
                        showOfflinePage();
                    }
                });
            }
        };

        connectivityManager.registerNetworkCallback(request, networkCallback);
    }

    // Called from JS via the bridge (retry button in offline.html).
    public void retryLoad() {
        runOnUiThread(() -> {
            if (isNetworkAvailable()) {
                isShowingOfflinePage = false;
                webView.loadUrl(REMOTE_APP_URL);
            }
            // If still offline, do nothing — stay on offline.html rather than
            // risking the browser's default error page flashing up again.
        });
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (connectivityManager != null && networkCallback != null) {
            connectivityManager.unregisterNetworkCallback(networkCallback);
        }
    }
}