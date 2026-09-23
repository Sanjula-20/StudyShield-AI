package com.studyshield.app

import android.content.Context
import android.content.Intent
import android.provider.Settings
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel

class FocusPlatformChannel(private val context: Context) : MethodChannel.MethodCallHandler {

    companion object {
        const val CHANNEL = "com.studyshield.app/focus_channel"
    }

    override fun onMethodCall(call: MethodCall, result: MethodChannel.Result) {
        when (call.method) {
            "checkPermissions" -> {
                val usageGranted = isUsageStatsGranted()
                val overlayGranted = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                    Settings.canDrawOverlays(context)
                } else true

                val res = mapOf(
                    "usageAccess" to usageGranted,
                    "overlayPermission" to overlayGranted,
                    "accessibilityService" to (FocusAccessibilityService.isFocusModeActive)
                )
                result.success(res)
            }
            "startFocusMode" -> {
                val topic = call.argument<String>("topic") ?: "Study Session"
                val pkgs = call.argument<List<String>>("restrictedApps") ?: emptyList()

                FocusAccessibilityService.isFocusModeActive = true
                FocusAccessibilityService.activeTopic = topic
                FocusAccessibilityService.restrictedPackages = pkgs.toSet()

                // Start Foreground Service
                val serviceIntent = Intent(context, FocusModeService::class.java).apply {
                    putExtra("TOPIC", topic)
                }
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent)
                } else {
                    context.startService(serviceIntent)
                }

                result.success(true)
            }
            "stopFocusMode" -> {
                FocusAccessibilityService.isFocusModeActive = false
                val serviceIntent = Intent(context, FocusModeService::class.java)
                context.stopService(serviceIntent)
                result.success(true)
            }
            "openSettings" -> {
                val settingType = call.argument<String>("type") ?: "usage"
                if (settingType == "usage") {
                    context.startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    })
                } else if (settingType == "overlay") {
                    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                        context.startActivity(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION).apply {
                            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        })
                    }
                }
                result.success(true)
            }
            else -> result.notImplemented()
        }
    }

    private fun isUsageStatsGranted(): Boolean {
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as android.app.AppOpsManager
        val mode = appOps.checkOpNoThrow(
            android.app.AppOpsManager.OPSTR_GET_USAGE_STATS,
            android.os.Process.myUid(),
            context.packageName
        )
        return mode == android.app.AppOpsManager.MODE_ALLOWED
    }
}
