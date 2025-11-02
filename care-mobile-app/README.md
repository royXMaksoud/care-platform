# Care Mobile App 🏥

A humanitarian services mobile application built with Flutter for displaced persons and refugees.

## Overview

Care is a comprehensive mobile application that provides access to essential services including healthcare appointments, financial services, voice assistance, inquiries, complaints management, and messaging system.

## Features

### Current (Milestone 1) ✅
- **Welcome Screen** with voice greeting
- **Home Dashboard** with 6 service modules
- **Voice Assistant** with speech recognition
- **Bilingual Support** (Arabic/English)
- **RTL Layout** for Arabic
- **Material Design 3** UI

### Service Modules
1. 📅 **Appointments** - Schedule and manage appointments
2. 💰 **Financial Services** - Access financial aid information
3. 🎤 **Voice Chat** - Voice-based communication
4. ❓ **Inquiry** - Submit inquiries
5. 📋 **Complaints** - File and track complaints
6. 💬 **Messages** - Internal messaging system

## Technical Stack

- **Framework:** Flutter 3.27.2
- **Language:** Dart 3.6.1
- **State Management:** GetX
- **Architecture:** Clean Architecture (MVC)
- **Min SDK:** Android 21 (Lollipop 5.0)
- **Target SDK:** Android 34

## Quick Start

### Prerequisites
```bash
flutter --version  # Must be 3.0+
```

### Installation
```bash
# Clone repository
git clone <repository-url>
cd care-mobile-app

# Install dependencies
flutter pub get

# Run on device/emulator
flutter run
```

### Build APK
```bash
# Release APK
flutter build apk --release

# APK location:
# build/app/outputs/flutter-apk/app-release.apk
```

## Project Structure

```
lib/
├── main.dart                  # App entry point
├── app/
│   ├── core/                  # Core utilities
│   │   ├── theme/            # App theme
│   │   ├── utils/            # Constants, helpers
│   │   └── values/           # Colors, strings
│   ├── data/                  # Data layer
│   │   ├── models/           # Data models
│   │   ├── providers/        # API providers
│   │   └── services/         # Business services
│   ├── modules/              # Feature modules
│   │   ├── splash/          # Splash screen
│   │   ├── welcome/         # Welcome/Onboarding
│   │   └── home/            # Home dashboard
│   ├── widgets/              # Shared widgets
│   └── routes/               # App routing
```

## Configuration

### Backend URLs
Edit: `lib/app/core/utils/app_constants.dart`

```dart
// For Android Emulator
static const String authBaseUrl = 'http://10.0.2.2:6061';

// For Real Device
static const String authBaseUrl = 'http://YOUR_IP:6061';
```

## Device Testing

### Enable Developer Mode
1. Go to **Settings** → **About Phone**
2. Tap **Build Number** 7 times
3. Go back to **Settings** → **Developer Options**
4. Enable **USB Debugging**

### Run on Device
```bash
# List devices
flutter devices

# Run on specific device
flutter run -d <device-id>
```

### Install APK
1. Build APK: `flutter build apk --release`
2. Transfer APK to device
3. Enable installation from unknown sources
4. Install and run

## Development

### Code Style
- Follow [Dart Style Guide](https://dart.dev/guides/language/effective-dart/style)
- Use meaningful names
- Keep functions small and focused
- Add comments for complex logic

### Useful Commands
```bash
# Clean build
flutter clean

# Analyze code
flutter analyze

# Format code
flutter format .

# Run tests
flutter test

# Check outdated packages
flutter pub outdated
```

## Dependencies

### Core
- `get` - State management & routing
- `flutter_screenutil` - Responsive UI
- `dio` - HTTP client
- `shared_preferences` - Local storage

### UI
- `google_fonts` - Typography
- `flutter_iconly` - Icons
- `animate_do` - Animations
- `badges` - Notification badges
- `shimmer` - Loading effects
- `lottie` - Lottie animations

### Voice Features
- `flutter_tts` - Text-to-Speech
- `speech_to_text` - Speech recognition

### Maps & Location
- `google_maps_flutter` - Maps integration
- `geolocator` - Location services
- `geocoding` - Address lookup

## Roadmap

### Milestone 2 - Authentication
- [ ] Login/Register screens
- [ ] OAuth integration
- [ ] JWT token management
- [ ] User profile

### Milestone 3 - Service Modules
- [ ] Appointments CRUD
- [ ] Financial services
- [ ] Messages/Chat
- [ ] Complaints system

### Milestone 4 - Advanced Features
- [ ] Google Maps integration
- [ ] Real-time notifications
- [ ] AI Chatbot
- [ ] Offline mode

### Milestone 5 - Production
- [ ] Security hardening
- [ ] Performance optimization
- [ ] Testing suite
- [ ] App store deployment

## Documentation

- **SETUP_GUIDE.md** - Detailed setup instructions
- **QUICK_START.md** - 5-minute quick start
- **help/MILESTONE_1.md** - Milestone 1 documentation
- **VERSION.md** - Version history

## License

Copyright © 2025 Care Humanitarian Services

## Support

For issues and questions, please check the documentation in the `/help` folder.

---

**Version:** 1.0.0 - Milestone 1  
**Status:** Production Ready ✅  
**Last Updated:** October 2025
