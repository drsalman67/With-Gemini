package com.withgemini

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.withgemini.service.FloatingService

class MainActivity : AppCompatActivity() {
    private val OVERLAY_PERMISSION_REQ_CODE = 1000

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Android System Check: Kiya humein screen pe udne ki ijazat hai?
        if (!Settings.canDrawOverlays(this)) {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:$packageName")
            )
            startActivityForResult(intent, OVERLAY_PERMISSION_REQ_CODE)
        } else {
            startFloatingService()
        }
    }

    // Jab user setting se wapis aata hai, toh ye function fire hota hai
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == OVERLAY_PERMISSION_REQ_CODE) {
            if (Settings.canDrawOverlays(this)) {
                startFloatingService()
            } else {
                Toast.makeText(this, "Permission denied! Akira Engine requires overlay permission.", Toast.LENGTH_LONG).show()
                finish() // Permission na mile toh app band
            }
        }
    }

    private fun startFloatingService() {
        val intent = Intent(this, FloatingService::class.java)
        // Android 8+ (Oreo) ke baad background services ke liye Foreground Service laazmi hai
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
        finish() // UI kill kar do, sirf Service zinda rahegi
    }
}
