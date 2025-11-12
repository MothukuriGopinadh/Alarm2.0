package com.mahi.stepalarm

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.media.RingtoneManager
import android.os.Build
import android.os.IBinder

class AlarmService : Service() {
  private val channelId = "alarm"
  private var ringtone = RingtoneManager.getRingtone(this, RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM))
  override fun onCreate() {
    super.onCreate()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val chan = NotificationChannel(channelId, "Alarm", NotificationManager.IMPORTANCE_HIGH)
      (getSystemService(NOTIFICATION_SERVICE) as NotificationManager).createNotificationChannel(chan)
    }
  }
  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val n: Notification = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Notification.Builder(this, channelId).setContentTitle("Alarm").setContentText("Walk to stop").setSmallIcon(android.R.drawable.ic_lock_idle_alarm).setOngoing(true).build()
    } else {
      Notification.Builder(this).setContentTitle("Alarm").setContentText("Walk to stop").setSmallIcon(android.R.drawable.ic_lock_idle_alarm).setOngoing(true).build()
    }
    startForeground(1, n)
    try { ringtone.play() } catch (_: Exception) {}
    return START_STICKY
  }
  override fun onDestroy() { try { if (ringtone.isPlaying) ringtone.stop() } catch (_: Exception) {} ; super.onDestroy() }
  override fun onBind(intent: Intent?): IBinder? = null
}