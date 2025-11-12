# QUICK_COMMANDS.md

Useful commands and shortcuts for working with the StepWake project.

## Build & run

Windows (PowerShell):

```powershell
# Build debug APK
./gradlew assembleDebug

# Install onto a connected device/emulator
adb install -r app\build\outputs\apk\debug\app-debug.apk

# Start the app
adb shell am start -n com.mahi.stepalarm/.MainActivity
```

## Logs & debugging

```powershell
# Show connected devices
adb devices

# View logcat (filter by package)
adb logcat --pid=$(adb shell pidof -s com.mahi.stepalarm)
```

## Serve web preview (from project root)

```powershell
# Bind to 127.0.0.1 so browser access works reliably
py -3 -m http.server 8000 --bind 127.0.0.1 --directory web-preview
```

## Common Gradle commands

- `./gradlew clean`
- `./gradlew assembleDebug`
- `./gradlew test`

---

Keep this page as a quick reference when working locally.