package com.banglorecolletive.app;

import android.content.Context;
import android.content.Intent;
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
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {

    private static final String TAG = "MainActivity";

    private static final String OFFLINE_PAGE = "file:///android_asset/public/offline.html";
    private static final String REMOTE_APP_URL = "https://bangalorecollective.com/";

    private boolean isShowingOfflinePage = false;
    private ConnectivityManager connectivityManager;
    private ConnectivityManager.NetworkCallback networkCallback;
    private WebView webView;
    private String lastTargetUrl = null;

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

        // Use BridgeWebViewClient so Capacitor plugins and bridge JS injection keep working
        webView.setWebViewClient(new BridgeWebViewClient(this.bridge) {

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                if (url != null && !url.contains("offline.html")) {
                    isShowingOfflinePage = false;
                }
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                if (request != null && request.isForMainFrame() && !isShowingOfflinePage) {
                    if (!isNetworkAvailable()) {
                        showOfflinePage();
                    }
                }
            }

            @Override
            public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse errorResponse) {
                super.onReceivedHttpError(view, request, errorResponse);
                if (request != null && request.isForMainFrame() && errorResponse != null && errorResponse.getStatusCode() >= 500 && !isShowingOfflinePage) {
                    if (!isNetworkAvailable()) {
                        showOfflinePage();
                    }
                }
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (request != null && request.getUrl() != null) {
                    String scheme = request.getUrl().getScheme();
                    if ("intent".equalsIgnoreCase(scheme) || "banglorecollective".equalsIgnoreCase(scheme)) {
                        try {
                            Intent parsedIntent = Intent.parseUri(request.getUrl().toString(), Intent.URI_INTENT_SCHEME);
                            if (parsedIntent != null) {
                                String targetUrl = resolveTargetUrl(parsedIntent.getData());
                                if (targetUrl != null) {
                                    lastTargetUrl = targetUrl;
                                    view.loadUrl(targetUrl);
                                    return true;
                                }
                            }
                        } catch (Exception e) {
                            Log.e(TAG, "Failed to parse intent URL: " + request.getUrl(), e);
                        }
                    }
                }
                return super.shouldOverrideUrlLoading(view, request);
            }
        });

        // Handle incoming deep links (e.g. from WhatsApp, SMS, browser)
        Intent startIntent = getIntent();
        if (startIntent != null && startIntent.getData() != null) {
            String targetUrl = resolveTargetUrl(startIntent.getData());
            if (targetUrl != null) {
                lastTargetUrl = targetUrl;
                Log.d(TAG, "Cold launch deep link target: " + targetUrl);
                webView.post(() -> {
                    if (webView != null) {
                        webView.loadUrl(targetUrl);
                    }
                });
            }
        }

        configureBackButton();
        registerNetworkCallback();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        if (intent != null && intent.getData() != null) {
            String targetUrl = resolveTargetUrl(intent.getData());
            if (targetUrl != null) {
                lastTargetUrl = targetUrl;
                Log.d(TAG, "New intent deep link target: " + targetUrl);
                if (webView != null) {
                    webView.loadUrl(targetUrl);
                }
            }
        }
    }

    private String resolveTargetUrl(Uri data) {
        if (data == null) return null;
        String scheme = data.getScheme();
        if (scheme == null) return null;

        if ("https".equalsIgnoreCase(scheme) || "http".equalsIgnoreCase(scheme)) {
            return data.toString();
        }

        if ("banglorecollective".equalsIgnoreCase(scheme)) {
            String host = data.getHost() != null ? data.getHost() : "";
            String path = data.getPath() != null ? data.getPath() : "";
            String combined = (host + path).replaceAll("^/+", "");
            return REMOTE_APP_URL + combined;
        }

        return null;
    }

    private void configureBackButton() {
        Log.d(TAG, "Native back callback registered");
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView == null) {
                    finishAndRemoveTask();
                    return;
                }

                String currentUrl = webView.getUrl();
                String currentPath = currentUrl == null ? "" : Uri.parse(currentUrl).getPath();
                if (currentPath == null) currentPath = "";

                if ("/userinterface".equals(currentPath)
                        || "/userinterface/".equals(currentPath)
                        || "/userinterface/home".equals(currentPath)
                        || "/userinterface/home/".equals(currentPath)
                        || "/".equals(currentPath)) {
                    Log.d(TAG, "Home detected; closing app");
                    finishAndRemoveTask();
                    return;
                }

                if (webView.canGoBack()) {
                    Log.d(TAG, "Going back in WebView history");
                    webView.goBack();
                } else {
                    Log.d(TAG, "No history; redirecting to home");
                    webView.loadUrl(REMOTE_APP_URL + "userinterface/home");
                }
            }
        });
    }

    private void showOfflinePage() {
        isShowingOfflinePage = true;
        if (webView != null) {
            webView.loadUrl(OFFLINE_PAGE);
        }
    }

    private boolean isNetworkAvailable() {
        if (connectivityManager == null) return false;
        Network network = connectivityManager.getActiveNetwork();
        if (network == null) return false;
        NetworkCapabilities capabilities = connectivityManager.getNetworkCapabilities(network);
        if (capabilities == null) return false;
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
    }

    private void registerNetworkCallback() {
        NetworkRequest request = new NetworkRequest.Builder()
                .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                .build();

        networkCallback = new ConnectivityManager.NetworkCallback() {
            @Override
            public void onAvailable(Network network) {
                runOnUiThread(() -> {
                    if (isShowingOfflinePage) {
                        isShowingOfflinePage = false;
                        String urlToLoad = lastTargetUrl != null ? lastTargetUrl : REMOTE_APP_URL;
                        if (webView != null) {
                            webView.loadUrl(urlToLoad);
                        }
                    }
                });
            }

            @Override
            public void onLost(Network network) {
                runOnUiThread(() -> {
                    if (!isNetworkAvailable() && !isShowingOfflinePage) {
                        showOfflinePage();
                    }
                });
            }
        };

        connectivityManager.registerNetworkCallback(request, networkCallback);
    }

    public void retryLoad() {
        runOnUiThread(() -> {
            if (isNetworkAvailable()) {
                isShowingOfflinePage = false;
                String urlToLoad = lastTargetUrl != null ? lastTargetUrl : REMOTE_APP_URL;
                if (webView != null) {
                    webView.loadUrl(urlToLoad);
                }
            }
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