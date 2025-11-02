# Care Mobile App - Setup Guide

## Prerequisites

### Required Software
- Flutter SDK 3.27.2 or higher
- Android Studio (latest version)
- VS Code or IntelliJ IDEA (optional)
- Android SDK (API 21+)
- Java JDK 11+

### Installation Steps

#### 1. Install Flutter
```bash
# Download Flutter SDK from:
https://docs.flutter.dev/get-started/install

# Add Flutter to PATH
# Verify installation
flutter doctor
```

#### 2. Accept Android Licenses
```bash
flutter doctor --android-licenses
```

#### 3. Install Dependencies
```bash
cd care-mobile-app
flutter pub get
```

---

## Project Structure

```
care-mobile-app/
├── lib/
│   ├── main.dart              # App entry point
│   ├── app/
│   │   ├── core/              # Theme, colors, constants
│   │   ├── data/              # Models, providers, services
│   │   ├── modules/           # Feature modules
│   │   ├── widgets/           # Shared widgets
│   │   └── routes/            # App routing
├── assets/                     # Images, icons, translations
├── build/                      # Build outputs
└── help/                       # Documentation

```

---

## Running the App

### Development Mode
```bash
# On emulator/device
flutter run

# On specific device
flutter run -d <device-id>

# View available devices
flutter devices
```

### Building APK
```bash
# Debug APK
flutter build apk --debug

# Release APK
flutter build apk --release

# APK location:
# build/app/outputs/flutter-apk/app-release.apk
```

---

## Configuration

### Backend URLs
Edit: `lib/app/core/utils/app_constants.dart`

```dart
// For Android Emulator
static const String authBaseUrl = 'http://10.0.2.2:6061';

// For Real Device (replace with your IP)
static const String authBaseUrl = 'http://192.168.1.100:6061';
```

### Find Your IP
```bash
# Windows
ipconfig

# Look for IPv4 Address
```

---

## Testing on Samsung Device

### Enable Developer Mode
1. Settings → About Phone
2. Tap "Build Number" 7 times
3. Go back to Settings
4. Developer Options → Enable USB Debugging

### Connect Device
1. Connect via USB cable
2. Allow USB debugging popup on device
3. Run: `flutter devices`
4. Should see your Samsung device listed

### Install APK
1. Build APK: `flutter build apk --release`
2. Transfer APK to device (WhatsApp, USB, etc.)
3. Open file manager on device
4. Go to Downloads
5. Tap app-release.apk
6. Allow installation from unknown sources
7. Install and open

---

## Troubleshooting

### Issue: flutter command not found
**Solution:**
```bash
# Add Flutter to PATH
# Verify: flutter --version
```

### Issue: Android licenses not accepted
**Solution:**
```bash
flutter doctor --android-licenses
# Press 'y' for all
```

### Issue: Build failed
**Solution:**
```bash
flutter clean
flutter pub get
flutter run
```

### Issue: TTS not working
**Solution:**
- Grant microphone permission in app settings
- Test on real device (emulator TTS may not work)

---

## Features

### Implemented
- ✅ Welcome screen with voice greeting
- ✅ Home screen with 6 service modules
- ✅ Voice assistant
- ✅ Arabic/English language support
- ✅ RTL support
- ✅ Material Design 3

### Coming Soon
- Authentication (Login/Register)
- Backend integration
- Appointments module
- Messages system
- Notifications
- Google Maps integration

---

## Development Guidelines

### Code Style
- Follow Dart/Flutter style guide
- Use meaningful variable names
- Add comments for complex logic
- Keep functions small and focused

### State Management
- Using GetX for state management
- Controllers handle business logic
- Views are stateless when possible

### File Naming
- `snake_case` for file names
- `PascalCase` for class names
- `camelCase` for variables and functions

---

## Resources

### Documentation
- Flutter: https://flutter.dev/docs
- GetX: https://pub.dev/packages/get
- Material Design: https://m3.material.io

### Support
- Check `/help` folder for detailed guides
- See VERSION.md for release notes
- Read MILESTONE_1.md for features overview

---

## Quick Commands

```bash
# Clean build
flutter clean

# Get dependencies
flutter pub get

# Run on device
flutter run

# Build release APK
flutter build apk --release

# Check Flutter setup
flutter doctor

# Analyze code
flutter analyze

# Format code
flutter format .
```

---

**Version:** 1.0.0  
**Last Updated:** October 2025  
**Status:** Production Ready

For detailed milestone information, see: `help/MILESTONE_1.md`

