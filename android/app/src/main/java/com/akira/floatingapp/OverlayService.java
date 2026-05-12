package com.akira.floatingapp;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.os.BatteryManager;
import android.os.Build;
import android.os.IBinder;
import android.provider.Settings;
import android.util.DisplayMetrics;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.core.app.NotificationCompat;
import android.content.pm.PackageManager;

public class OverlayService extends Service {

    private WindowManager windowManager;
    public static WebView overlayWebView; // Static so Notification Listener can access it
    private WindowManager.LayoutParams params;
    private BroadcastReceiver batteryReceiver;

    @Override
    public void onCreate() {
        super.onCreate();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel("overlay_channel", "Overlay Service", NotificationManager.IMPORTANCE_MIN);
            getSystemService(NotificationManager.class).createNotificationChannel(channel);
        }
        startForeground(1, new NotificationCompat.Builder(this, "overlay_channel")
                .setContentTitle("Akira Floating Mode")
                .setContentText("System active")
                .setSmallIcon(android.R.drawable.ic_dialog_info).build());

        overlayWebView = new WebView(this);
        overlayWebView.setBackgroundColor(Color.TRANSPARENT);
        overlayWebView.getSettings().setJavaScriptEnabled(true);
        overlayWebView.setLayerType(WebView.LAYER_TYPE_HARDWARE, null);
        
        overlayWebView.addJavascriptInterface(new WebAppInterface(), "NativeBridge");

        // CRITICAL UPDATE: Ab ye overlay file load karega
        overlayWebView.loadUrl("file:///android_asset/public/overlay.html");

        // Box size thoda bada kiya Timer Strip ke liye
        DisplayMetrics metrics = getResources().getDisplayMetrics();
        int size = (int) (300 * metrics.density); 

        params = new WindowManager.LayoutParams(
                size, size,
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                        | WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL
                        | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                PixelFormat.TRANSLUCENT
        );
        params.gravity = Gravity.TOP | Gravity.START;
        params.x = 0;
        params.y = 200;

        overlayWebView.setOnTouchListener(new View.OnTouchListener() {
            private int initialX, initialY;
            private float initialTouchX, initialTouchY;

            @Override
            public boolean onTouch(View v, MotionEvent event) {
                switch (event.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        initialX = params.x; initialY = params.y;
                        initialTouchX = event.getRawX(); initialTouchY = event.getRawY();
                        return false; 
                    case MotionEvent.ACTION_MOVE:
                        params.x = initialX + (int) (event.getRawX() - initialTouchX);
                        params.y = initialY + (int) (event.getRawY() - initialTouchY);
                        windowManager.updateViewLayout(overlayWebView, params);
                        return false;
                }
                return false;
            }
        });

        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        windowManager.addView(overlayWebView, params);

        // THE BATTERY RADAR: Background mein battery padh kar JS ko bhejna
        batteryReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                int level = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
                int scale = intent.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
                int status = intent.getIntExtra(BatteryManager.EXTRA_STATUS, -1);
                boolean isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING || status == BatteryManager.BATTERY_STATUS_FULL;
                float batteryPct = level * 100 / (float)scale;
                
                // WebView ko signal bhejna (Main Magic)
                overlayWebView.evaluateJavascript("javascript:updateBattery(" + batteryPct + ", " + isCharging + ")", null);
            }
        };
        registerReceiver(batteryReceiver, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (batteryReceiver != null) unregisterReceiver(batteryReceiver);
        if (overlayWebView != null) windowManager.removeView(overlayWebView);
    }

    @Override public IBinder onBind(Intent intent) { return null; }

    class WebAppInterface {
        @JavascriptInterface
        public void performAction(String action) {
            if (action.equals("home")) {
                Intent i = new Intent(Intent.ACTION_MAIN);
                i.addCategory(Intent.CATEGORY_HOME);
                i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(i);
            } else if (action.equals("settings")) {
                Intent i = new Intent(Settings.ACTION_SETTINGS);
                i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(i);
            } else if (action.equals("close")) {
                stopSelf();
            } else if (action.equals("search")) {
                Intent i = new Intent(Intent.ACTION_WEB_SEARCH);
                i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(i);
            }
        }

        // NEW POWER: Specific App Launcher
        @JavascriptInterface
        public void launchApp(String packageName) {
            PackageManager pm = getPackageManager();
            Intent intent = pm.getLaunchIntentForPackage(packageName);
            if (intent != null) {
                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(intent);
            }
        }
    }
}
