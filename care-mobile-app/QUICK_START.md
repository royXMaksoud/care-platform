# Quick Start Guide - Care Mobile App

## 5-Minute Setup

### Prerequisites
- Flutter SDK installed
- Android device connected or emulator running

### Steps

#### 1. Get Dependencies
```bash
cd care-mobile-app
flutter pub get
```

#### 2. Run App
```bash
flutter run
```

#### 3. Build APK
```bash
flutter build apk --release
```

**APK Location:**
```
build/app/outputs/flutter-apk/app-release.apk
```

---

## Install on Samsung

### Method 1: USB Cable
1. Enable Developer Mode on Samsung
   - Settings → About Phone
   - Tap Build Number 7 times
2. Enable USB Debugging
   - Settings → Developer Options → USB Debugging
3. Connect device and run: `flutter run`

### Method 2: APK File
1. Build APK: `flutter build apk --release`
2. Send APK to device (WhatsApp, Email, etc.)
3. Open APK file on device
4. Allow unknown sources installation
5. Install and enjoy!

---

## What You'll See

### 1. Welcome Screen
- Voice greeting: "Welcome to Care program, we are here to help you"
- Service description
- Start button → Go to Home

### 2. Home Screen
- 6 service cards:
  - Appointments
  - Financial Services
  - Voice Chat
  - Inquiry
  - Complaints
  - Messages
- Voice assistant (blue circle)
- Language toggle
- Notifications

---

## Common Issues

### Build Failed
```bash
flutter clean
flutter pub get
flutter build apk --release
```

### Voice Not Working
- Test on real device (not emulator)
- Grant microphone permission

### Device Not Found
```bash
# Check connected devices
flutter devices

# Restart ADB
adb kill-server
adb start-server
```

---

## Next Steps

1. Test all features
2. Check SETUP_GUIDE.md for details
3. See MILESTONE_1.md for complete features list

**Done! 🎉**

