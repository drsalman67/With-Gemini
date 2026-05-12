package com.akira.floatingapp;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.net.Uri;
import android.os.BatteryManager;
import android.os.Build;
import android.os.IBinder;
import android.os.VibrationEffect;
import android.os.Vibrator;
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
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.List;

public class OverlayService extends Service {

    private WindowManager windowManager;
    public static WebView overlayWebView;
    private WindowManager.LayoutParams params;
    private BroadcastReceiver batteryReceiver;

    @Override
    public void onCreate() {
        super.onCreate();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel("overlay_channel", "Akira System", NotificationManager.IMPORTANCE_MIN);
            getSystemService(NotificationManager.class).createNotificationChannel(channel);
        }
        startForeground(1, new NotificationCompat.Builder(this, "overlay_channel")
                .setContentTitle("Akira Engine V1.3.1").setContentText("Premium Engine Active").setSmallIcon(android.R.drawable.ic_dialog_info).build());

        overlayWebView = new WebView(this);
        overlayWebView.setBackgroundColor(Color.TRANSPARENT);
        overlayWebView.getSettings().setJavaScriptEnabled(true);
        overlayWebView.setLayerType(WebView.LAYER_TYPE_HARDWARE, null);
        overlayWebView.addJavascriptInterface(new WebAppInterface(), "NativeBridge");
        overlayWebView.loadUrl("file:///android_asset/public/overlay.html");

        // FIXED SIZE PREMIUM JUGAAD: No more jumping bugs! Ek hi solid size rahega.
        DisplayMetrics metrics = getResources().getDisplayMetrics();
        int fixedSize = (int) (280 * metrics.density); 

        params = new WindowManager.LayoutParams(
                fixedSize, fixedSize,
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                PixelFormat.TRANSLUCENT
        );
        params.gravity = Gravity.TOP | Gravity.START;
        params.x = 0; params.y = 200;

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

        batteryReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                int level = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
                int scale = intent.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
                int status = intent.getIntExtra(BatteryManager.EXTRA_STATUS, -1);
                boolean isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING || status == BatteryManager.BATTERY_STATUS_FULL;
                float batteryPct = level * 100 / (float)scale;
                overlayWebView.evaluateJavascript("javascript:if(typeof updateBattery === 'function') updateBattery(" + batteryPct + ", " + isCharging + ")", null);
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
                Intent i = new Intent(Intent.ACTION_MAIN); i.addCategory(Intent.CATEGORY_HOME); i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK); startActivity(i);
            } else if (action.equals("settings")) {
                Intent i = new Intent(Settings.ACTION_SETTINGS); i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK); startActivity(i);
            }
        }

        @JavascriptInterface
        public void launchApp(String packageName) {
            PackageManager pm = getPackageManager();
            Intent intent = pm.getLaunchIntentForPackage(packageName);
            if (intent != null) { intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK); startActivity(intent); }
        }

        @JavascriptInterface
        public void launchGemini() {
            PackageManager pm = getPackageManager();
            Intent intent = pm.getLaunchIntentForPackage("com.google.android.apps.bard");
            if(intent == null) { intent = new Intent(Intent.ACTION_VIEW, Uri.parse("https://gemini.google.com")); }
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK); startActivity(intent);
        }

        @JavascriptInterface
        public void killService() { 
            saveSetting("master_switch", "false");
            stopSelf(); // Instant Death for Overlay
        }
        
        @JavascriptInterface
        public void vibrateSOS() {
            Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            if (v != null) {
                long[] pattern = {0, 150, 100, 150, 100, 150, 100, 400, 100, 400, 100, 400, 100, 150, 100, 150, 100, 150};
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    v.vibrate(VibrationEffect.createWaveform(pattern, -1));
                } else { v.vibrate(pattern, -1); }
            }
        }

        @JavascriptInterface
        public String getApps() {
            JSONArray list = new JSONArray();
            try {
                PackageManager pm = getPackageManager();
                List<ApplicationInfo> packages = pm.getInstalledApplications(PackageManager.GET_META_DATA);
                for (ApplicationInfo packageInfo : packages) {
                    if (pm.getLaunchIntentForPackage(packageInfo.packageName) != null) {
                        JSONObject obj = new JSONObject();
                        obj.put("name", packageInfo.loadLabel(pm).toString());
                        obj.put("pkg", packageInfo.packageName);
                        list.put(obj);
                    }
                }
            } catch(Exception e) {
                // PREMIUM JUGAAD: Agar fail ho toh default OP apps daal do
                try {
                    list.put(new JSONObject().put("name", "WhatsApp").put("pkg", "com.whatsapp"));
                    list.put(new JSONObject().put("name", "YouTube").put("pkg", "com.google.android.youtube"));
                    list.put(new JSONObject().put("name", "Instagram").put("pkg", "com.instagram.android"));
                    list.put(new JSONObject().put("name", "Free Fire").put("pkg", "com.dts.freefireth"));
                } catch(Exception ex){}
            }
            return list.toString();
        }

        @JavascriptInterface
        public void saveSetting(String key, String value) {
            getSharedPreferences("AkiraPrefs", MODE_PRIVATE).edit().putString(key, value).apply();
        }

        @JavascriptInterface
        public String getSetting(String key, String defaultVal) {
            return getSharedPreferences("AkiraPrefs", MODE_PRIVATE).getString(key, defaultVal);
        }
    }
}
