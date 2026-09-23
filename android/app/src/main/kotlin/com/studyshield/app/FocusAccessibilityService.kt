package com.studyshield.app

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.view.accessibility.AccessibilityEvent
import android.util.Log

class FocusAccessibilityService : AccessibilityService() {

    companion object {
        var isFocusModeActive: Boolean = false
        var activeTopic: String = ""
        var restrictedPackages: Set<String> = setOf(
            "com.instagram.android",
            "com.snapchat.android",
            "com.google.android.youtube",
            "com.zhiliaoapp.musically", // TikTok
            "com.twitter.android",
            "com.supercell.clashofclans"
        )
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (!isFocusModeActive || event == null) return

        if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            val packageName = event.packageName?.toString() ?: return
            
            // Allow StudyShield itself
            if (packageName == applicationContext.packageName) return

            Log.d("FocusAccessibility", "Foreground package detected: $packageName")

            // Check if launched application matches restricted list
            if (restrictedPackages.contains(packageName) || isPackageBlocked(packageName)) {
                Log.w("FocusAccessibility", "Restricted app launched! Intercepting $packageName")
                
                val intent = Intent(this, FocusBlockActivity::class.java).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
                    putExtra("BLOCKED_PACKAGE", packageName)
                    putExtra("STUDY_TOPIC", activeTopic)
                }
                startActivity(intent)
            }
        }
    }

    private fun isPackageBlocked(pkg: String): Boolean {
        return restrictedPackages.any { pkg.contains(it, ignoreCase = true) }
    }

    override fun onInterrupt() {
        Log.d("FocusAccessibility", "Accessibility Service Interrupted")
    }
}
