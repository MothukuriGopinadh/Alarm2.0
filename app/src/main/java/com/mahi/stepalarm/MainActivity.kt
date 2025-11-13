package com.mahi.stepalarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.net.Uri
import android.provider.OpenableColumns
import android.widget.Button
import android.widget.EditText
import android.widget.TimePicker
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.ComponentActivity
import java.util.Calendar
import android.content.SharedPreferences
import android.Manifest

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.activity_main)
    
    // Request camera permission on Android 6+
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      requestPermissions(arrayOf(Manifest.permission.CAMERA), 100)
    }
    
    val tp = findViewById<TimePicker>(R.id.timePicker)
    val stepsInput = findViewById<EditText>(R.id.stepsInput)
    val btn = findViewById<Button>(R.id.scheduleBtn)
    val chooseBtn = findViewById<Button>(R.id.chooseSoundBtn)
    val selected = findViewById<android.widget.TextView>(R.id.selectedSound)
    val prefs = getSharedPreferences("wtsa_prefs", Context.MODE_PRIVATE)

    // show previously selected sound
    val prev = prefs.getString("alarm_uri", null)
    if (prev != null) selected.text = prev

    val pick = registerForActivityResult(ActivityResultContracts.OpenDocument()) { uri: Uri? ->
      if (uri != null) {
        // persist permission and save
        try { contentResolver.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION) } catch (_: Exception) {}
        prefs.edit().putString("alarm_uri", uri.toString()).apply()
        selected.text = queryName(uri) ?: uri.lastPathSegment
      }
    }

    chooseBtn.setOnClickListener {
      // allow picking audio files
      pick.launch(arrayOf("audio/*"))
    }
    btn.setOnClickListener {
      val hour = if (Build.VERSION.SDK_INT >= 23) tp.hour else tp.currentHour
      val minute = if (Build.VERSION.SDK_INT >= 23) tp.minute else tp.currentMinute
      val cal = Calendar.getInstance().apply {
        set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0)
        set(Calendar.HOUR_OF_DAY, hour); set(Calendar.MINUTE, minute)
        if (timeInMillis <= System.currentTimeMillis()) add(Calendar.DAY_OF_YEAR, 1)
      }
      val steps = stepsInput.text.toString().toIntOrNull() ?: 20
      schedule(cal.timeInMillis, steps)
      Toast.makeText(this, "Alarm set with $steps steps", Toast.LENGTH_LONG).show()
    }
  }

  private fun schedule(whenMillis: Long, steps: Int) {
    val intent = Intent(this, AlarmReceiver::class.java).putExtra("steps", steps)
    val pi = PendingIntent.getBroadcast(this, 1001, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    val am = getSystemService(Context.ALARM_SERVICE) as AlarmManager
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, whenMillis, pi)
    } else {
      am.setExact(AlarmManager.RTC_WAKEUP, whenMillis, pi)
    }
  }

  private fun queryName(uri: Uri): String? {
    var name: String? = null
    val cursor = contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)
    cursor?.use {
      if (it.moveToFirst()) {
        name = it.getString(it.getColumnIndexOrThrow(OpenableColumns.DISPLAY_NAME))
      }
    }
    return name
  }
}