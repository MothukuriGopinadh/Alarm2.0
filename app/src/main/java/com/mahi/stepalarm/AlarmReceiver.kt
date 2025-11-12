package com.mahi.stepalarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class AlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val steps = intent.getIntExtra("steps", 20)
    val i = Intent(context, AlarmActivity::class.java).apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK); putExtra("steps", steps)
    }
    context.startActivity(i)
  }
}