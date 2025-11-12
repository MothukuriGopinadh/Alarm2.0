# StepWake — Complete Project Guide

Welcome! This is **StepWake**, a step-activated alarm system. This guide will help you understand everything about the project.

---

## 🎯 What You'll Find Here

| Document | Purpose |
|----------|---------|
| **GETTING_STARTED.md** | **START HERE** - Step-by-step setup and running guide |
| **ARCHITECTURE.md** | Technical deep-dive into how the code works |
| **QUICK_COMMANDS.md** | Useful terminal commands and shortcuts |
| **README.md** (project root) | This file - Overview and navigation |

---

## Quick Links

### Just Want to Run It?
→ Open **[GETTING_STARTED.md](GETTING_STARTED.md)** and follow the steps

### Want to Understand the Code?
→ Read **[ARCHITECTURE.md](ARCHITECTURE.md)** for detailed explanations

### Need Help with Commands?
→ Check **[QUICK_COMMANDS.md](QUICK_COMMANDS.md)** for common tasks

---

## Project Overview

**StepWake** is an alarm system that requires you to take steps to dismiss it:

```
Timeline of an alarm:
1. Set alarm for 3:00 PM, goal: 10 steps
2. 3:00 PM arrives
3. Alarm plays sound and vibrates
4. Walk around with your phone
5. App counts your steps using device sensor
6. After 10 steps, alarm stops 🛑
```

### Key Features
- Set alarms for specific times
- Configure step goals
- Hardware step sensor counting (accurate)
- Alarm sound + vibration
- Alarm persists across reboots
- Debug/simulate mode for testing
- Beautiful persistent notification

---

## Project Structure

```
stepwake/
│
├── GETTING_STARTED.md      ← Start here!
├── ARCHITECTURE.md         ← Technical details
├── QUICK_COMMANDS.md       ← Common commands
│
└── stepwake/                  ← Android project
    ├── build.gradle           ← Root Gradle config
    ├── settings.gradle        ← Module settings
    │
    └── app/                   ← Android app module
        ├── build.gradle       ← App build config
        │
        └── src/main/
            ├── AndroidManifest.xml        ← Permissions & entry point
            │
            ├── java/com/example/stepwake/
            │   ├── MainActivity.kt            ← UI & alarm scheduling
            │   ├── AlarmReceiver.kt           ← Alarm trigger handler
            │   ├── BootReceiver.kt            ← Device reboot handler
            │   └── StepForegroundService.kt  ← Alarm execution & step counting
            │
            └── res/
                ├── layout/
                │   └── activity_main.xml        ← UI layout
                └── values/
                    └── strings.xml              ← Text strings
```

---

## 🚀 Quick Start (TL;DR)

### For Android App

```bash
# 1. Open Android Studio
# 2. Open folder: stepwake/stepwake
# 3. Connect Android phone with USB (developer mode enabled)
# 4. Click the Run button
# 5. Select your device
# 6. App installs and runs!

# For testing without motion, tap:
# "Start debug alarm (simulate steps)"
```

### For Web Version

```bash
# 1. Open any browser
# 2. Navigate to: stepwake/web/index.html
# 3. Set time and step goal
# 4. Use debug buttons to test
```

---

## How to Use This Repo

### Step 1: Choose Your Starting Point
- **Brand new?** → Read **GETTING_STARTED.md**
- **Setting up?** → Follow Android Studio section in **GETTING_STARTED.md**
- **Running into issues?** → Check troubleshooting in **GETTING_STARTED.md**
- **Want technical details?** → Read **ARCHITECTURE.md**

### Step 2: Run the App
Open **GETTING_STARTED.md** and follow the sections in order:
1. Check prerequisites
2. Open the project
3. Connect device
4. Run on device
5. Test the app

### Step 3: Explore & Modify
- Check the source code with added comments
- Read **ARCHITECTURE.md** to understand each component
- Try modifying values and rebuilding

### Step 4: Use Quick Commands
- Use **QUICK_COMMANDS.md** when debugging
- Check logs with adb commands
- Try different test scenarios

---

## 💡 Key Concepts

### Foreground Service
A service that displays a persistent notification. Required to keep the app running while the screen is off.

### Step Counter Sensor
Hardware sensor on Android devices that counts steps accurately. Not available on all devices or emulators.

### AlarmManager
Android system service that triggers events at specific times, even if the app is closed.

### BroadcastReceiver
Android component that listens for system-wide events (like alarm trigger or device boot).

### SharedPreferences
Simple key-value storage for Android app preferences and settings.

---

## 🎓 Learning Path

**Beginner** (Just want to run it)
1. Open GETTING_STARTED.md
2. Follow "Quick Start — Android App"
3. Tap buttons in the app
4. Done!

**Intermediate** (Want to modify)
1. Read GETTING_STARTED.md
2. Read ARCHITECTURE.md (section overview)
3. Open source files (they have comments!)
4. Try changing small values
5. Rebuild and test

**Advanced** (Want to understand everything)
1. Read all of ARCHITECTURE.md
2. Read all source code carefully (comments explain each part)
3. Read QUICK_COMMANDS.md
4. Debug with breakpoints
5. Check Logcat for deeper understanding

---

## 🔍 File-by-File Breakdown

### MainActivity.kt (UI)
- **What**: The main screen with buttons
- **Why**: Shows time picker, step goal, and alarm controls
- **How**: Uses Android Views and AlarmManager
- **Learn about**: Intent, PendingIntent, SharedPreferences

### AlarmReceiver.kt (Trigger Handler)
- **What**: Catches the alarm broadcast
- **Why**: Needs to start the service when alarm time arrives
- **How**: Extends BroadcastReceiver
- **Learn about**: BroadcastReceiver, Intent extras

### StepForegroundService.kt (Alarm Logic)
- **What**: The core alarm system
- **Why**: Runs the alarm, plays sound, counts steps
- **How**: Extends Service, implements SensorEventListener
- **Learn about**: Service lifecycle, Sensor API, MediaPlayer, Vibrator

### BootReceiver.kt (Reboot Handler)
- **What**: Catches device boot broadcast
- **Why**: Reschedules alarm after device restarts
- **How**: Extends BroadcastReceiver
- **Learn about**: BOOT_COMPLETED broadcast

### activity_main.xml (Layout)
- **What**: UI layout definition
- **Why**: Defines the visual structure
- **How**: XML layout file
- **Learn about**: ConstraintLayout, TimePicker, EditText, Button

---

## ⚙️ Configuration Tips

### Change the Default Step Goal
File: `MainActivity.kt`
```kotlin
val stepGoal = stepGoalInput.text.toString().toIntOrNull() ?: 8  // Change 8 here
```

### Change Alarm Sound
File: `StepForegroundService.kt`
```kotlin
val uri: Uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)  // Can use custom URI
```

### Change Vibration Pattern
File: `StepForegroundService.kt`
```kotlin
longArrayOf(0, 500, 500)  // Adjust timing here: [wait, vibrate, wait, ...]
```

### Change Target Android Version
File: `app/build.gradle`
```gradle
compileSdk 34    // Change here
targetSdk 34     // And here
```

---

## 🧪 Testing Checklist

- [ ] App opens and shows main screen
- [ ] Can set alarm time
- [ ] Can set step goal
- [ ] Tap "Set Alarm" without errors
- [ ] Tap "Start debug alarm (simulate steps)"
- [ ] Alarm sound plays
- [ ] Device vibrates
- [ ] Notification shows with step count
- [ ] Tapping "+1 Step" increments count
- [ ] When steps reach goal, alarm stops
- [ ] Cancel Alarm button works

---

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Device not found" | Enable USB Debugging on phone, accept connection prompt |
| "Gradle sync failed" | File → Invalidate Caches → Invalidate and Restart |
| "App crashes" | Check Logcat (View → Tool Windows → Logcat) |
| "No step sensor" | Use debug/simulate mode (button in app) |
| "Sound doesn't play" | Check device volume is on |

For more troubleshooting, see **GETTING_STARTED.md** Troubleshooting section.

---

## 🎯 Next Steps

1. **Set it up**: Follow GETTING_STARTED.md
2. **Run it**: Get the app on your phone
3. **Understand it**: Read ARCHITECTURE.md
4. **Modify it**: Change code and rebuild
5. **Debug it**: Use commands from QUICK_COMMANDS.md
6. **Share it**: Deploy to Play Store (if desired)

---

## Additional Resources

- **Android Developer Docs**: https://developer.android.com/docs
- **Kotlin Documentation**: https://kotlinlang.org/docs
- **Android Sensors**: https://developer.android.com/guide/topics/sensors
- **Android Alarms**: https://developer.android.com/training/scheduling/alarms
- **Android Services**: https://developer.android.com/guide/components/services

---

## 🤝 Support

1. **Read**: Check the documentation (especially GETTING_STARTED.md)
2. **Search**: Look in Logcat for error messages
3. **Troubleshoot**: See GETTING_STARTED.md troubleshooting section
4. **Commands**: Check QUICK_COMMANDS.md for useful commands
5. **Deep dive**: Read ARCHITECTURE.md for technical details

---

## 📝 Notes

- This is a prototype/educational project
- Step sensor only available on physical devices
- Emulator doesn't support step sensor
- Use debug/simulate mode for testing
- All code has comments explaining functionality
- Feel free to modify and customize!

---

## Ready to Start?

**→ Open [GETTING_STARTED.md](GETTING_STARTED.md) right now!**

---

*StepWake — Get moving to stop the alarm!*
