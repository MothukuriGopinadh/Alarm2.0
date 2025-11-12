package com.mahi.stepalarm

import android.content.Context
import android.content.Intent
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Bundle
import android.os.PowerManager
import android.widget.Button
import android.widget.TextView
import androidx.activity.ComponentActivity

class AlarmActivity : ComponentActivity(), SensorEventListener {
  private lateinit var sensorManager: SensorManager
  private var detector: Sensor? = null
  private var counter: Sensor? = null
  private var base: Float? = null
  private var needed = 20
  private var steps = 0
  private lateinit var progress: TextView
  private lateinit var status: TextView
  private lateinit var wake: PowerManager.WakeLock

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.activity_alarm)
    needed = intent.getIntExtra("steps", 20)
    progress = findViewById(R.id.progressText); status = findViewById(R.id.statusText)
    findViewById<Button>(R.id.stopBtn).setOnClickListener { if (steps >= needed) stopAlarm() }
    val pm = getSystemService(POWER_SERVICE) as PowerManager
    wake = pm.newWakeLock(PowerManager.SCREEN_DIM_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP, "wtsa:wake")
    wake.acquire(10*60*1000L)
    startService(Intent(this, AlarmService::class.java))
    sensorManager = getSystemService(Context.SENSOR_SERVICE) as SensorManager
    detector = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_DETECTOR)
    counter = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)
    update()
  }

  private fun update() { progress.text = getString(R.string.progress_fmt, steps, needed) }

  override fun onResume() {
    super.onResume()
    detector?.let { sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_NORMAL) }
    counter?.let { sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_NORMAL) }
  }

  override fun onPause() { super.onPause(); sensorManager.unregisterListener(this) }

  private fun stopAlarm() { stopService(Intent(this, AlarmService::class.java)); if (wake.isHeld) wake.release(); finish() }

  override fun onSensorChanged(e: SensorEvent?) {
    e ?: return
    when (e.sensor.type) {
      Sensor.TYPE_STEP_DETECTOR -> { steps += 1 }
      Sensor.TYPE_STEP_COUNTER -> {
        if (base == null) base = e.values[0]
        val d = (e.values[0] - (base ?: 0f)).toInt()
        if (d > steps) steps = d
      }
    }
    update()
    if (steps >= needed) stopAlarm()
  }

  override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
}