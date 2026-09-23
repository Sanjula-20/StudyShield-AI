package com.studyshield.app

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class FocusBlockActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Simple programmatically created native Android layout
        val layout = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            gravity = android.view.Gravity.CENTER
            setPadding(64, 64, 64, 64)
            setBackgroundColor(android.graphics.Color.parseColor("#0F172A"))
        }

        val blockedPkg = intent.getStringExtra("BLOCKED_PACKAGE") ?: "Selected Application"
        val topic = intent.getStringExtra("STUDY_TOPIC") ?: "Your Learning Objective"

        val titleView = TextView(this).apply {
            text = "Focus Mode Active"
            textSize = 24f
            setTextColor(android.graphics.Color.parseColor("#34D399"))
            gravity = android.view.Gravity.CENTER
            setPadding(0, 0, 0, 16)
        }

        val msgView = TextView(this).apply {
            text = "You are currently studying:\n$topic\n\n$blockedPkg is restricted during your study session."
            textSize = 16f
            setTextColor(android.graphics.Color.parseColor("#F8FAFC"))
            gravity = android.view.Gravity.CENTER
            setPadding(0, 0, 0, 32)
        }

        val btnReturn = Button(this).apply {
            text = "Return to StudyShield Workspace"
            setBackgroundColor(android.graphics.Color.parseColor("#6366F1"))
            setTextColor(android.graphics.Color.WHITE)
            setOnClickListener {
                val returnIntent = Intent(applicationContext, MainActivity::class.java).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                }
                startActivity(returnIntent)
                finish()
            }
        }

        layout.addView(titleView)
        layout.addView(msgView)
        layout.addView(btnReturn)

        setContentView(layout)
    }

    override fun onBackPressed() {
        // Prevent back button bypass during active Focus Mode
        val returnIntent = Intent(applicationContext, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        }
        startActivity(returnIntent)
        finish()
    }
}
