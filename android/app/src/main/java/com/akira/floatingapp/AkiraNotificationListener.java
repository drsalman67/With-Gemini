package com.akira.floatingapp;

import android.os.Handler;
import android.os.Looper;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;

public class AkiraNotificationListener extends NotificationListenerService {

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        // Jab bhi naya notification aaye
        if (OverlayService.overlayWebView != null) {
            // Android UI thread (Main thread) pe JavaScript run karna zaroori hai
            new Handler(Looper.getMainLooper()).post(new Runnable() {
                @Override
                public void run() {
                    OverlayService.overlayWebView.evaluateJavascript("javascript:triggerPulse()", null);
                }
            });
        }
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {
        // Notification hatne par kuch nahi karna
    }
}
