# ARCHITECTURE.md

This document provides a technical deep-dive into StepWake's architecture. It complements the README and GETTING_STARTED guide.

## High-level components

- MainActivity — UI + scheduling with AlarmManager
- AlarmReceiver — receives the alarm broadcast and starts the foreground service
- StepForegroundService — handles playing the alarm sound, counting steps and stopping when the goal is reached
- BootReceiver — re-schedules alarms after device reboot

## Data flow

1. User schedules an alarm in `MainActivity` (stores settings in `SharedPreferences`).
2. `AlarmManager` triggers a `Broadcast` at the scheduled time, delivered to `AlarmReceiver`.
3. `AlarmReceiver` starts `StepForegroundService` (a foreground service) to play audio and monitor step sensor.
4. `StepForegroundService` listens to the step sensor and updates the notification with progress. When steps >= goal, it stops itself.

## Key implementation notes

- Use `takePersistableUriPermission()` when persisting user-selected URIs so the app can access audio across reboots.
- Use `MediaPlayer` for playing content URIs; handle exceptions and release resources in `onDestroy()`.
- Foreground service must create a persistent notification prior to `startForeground()` to avoid crashes on newer Android versions.
- Use `Sensor.TYPE_STEP_DETECTOR` if available for per-step events; fallback to `TYPE_STEP_COUNTER` with delta computation.

## Files of interest

- `app/src/main/java/com/mahi/stepalarm/MainActivity.kt` — scheduling and UI
- `app/src/main/java/com/mahi/stepalarm/AlarmReceiver.kt` — triggers the service
- `app/src/main/java/com/mahi/stepalarm/AlarmService.kt` — the foreground service (alarm playback)
- `app/src/main/java/com/mahi/stepalarm/AlarmActivity.kt` — activity shown while alarm rings (optional interaction)

## Security & permissions

- Use `READ_EXTERNAL_STORAGE` only if absolutely necessary; prefer persisted content URIs using SAF (Storage Access Framework).
- If targeting Android 13+ consider `READ_MEDIA_AUDIO` runtime permission checks.

## Extensibility

- Add support for multiple alarms by storing scheduled alarm entries in a small local database (Room).
- Allow selecting custom vibration patterns per alarm.

---

This file is a companion to README.md and GETTING_STARTED.md.
