package com.akira.floatingapp;

import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final int OVERLAY_PERMISSION_REQUEST_CODE = 1001;

    @Override
    public void onStart() {
        super.onStart();
        
        // CHECK MASTER SWITCH: Agar dashboard se off kiya hai toh start mat karo
        SharedPreferences prefs = getSharedPreferences("AkiraPrefs", MODE_PRIVATE);
        boolean isMasterOn = prefs.getString("master_switch", "on").equals("on");

        if (isMasterOn) {
            if (!Settings.canDrawOverlays(this)) {
                requestOverlayPermission();
            } else {
                startOverlayService();
            }
        }
    }

    private void requestOverlayPermission() {
        Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + getPackageName()));
        startActivityForResult(intent, OVERLAY_PERMISSION_REQUEST_CODE);
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == OVERLAY_PERMISSION_REQUEST_CODE && Settings.canDrawOverlays(this)) {
            startOverlayService();
        }
    }

    private void startOverlayService() {
        Intent serviceIntent = new Intent(this, OverlayService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent);
        } else {
            startService(serviceIntent);
        }
    }
}
