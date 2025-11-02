# Care Mobile App - Flutter Application

## Overview
The Care Mobile App is a comprehensive Flutter application that provides humanitarian services for displaced persons and refugees. It features a modern, user-friendly interface with voice assistance capabilities, appointment booking, financial services access, messaging, and comprehensive support for multiple service modules in both Arabic and English.

## Technology Stack
- **Framework**: Flutter 3.27.2
- **Language**: Dart 3.6.1
- **State Management**: GetX
- **Architecture**: Clean Architecture
- **Target Platforms**: Android (min SDK 21), iOS
- **Package Manager**: pub.dev

## Project Structure
```
care-mobile-app/
├── lib/
│   ├── app/
│   │   ├── core/
│   │   │   ├── theme/
│   │   │   │   ├── app_colors.dart      # Color palette
│   │   │   │   └── app_theme.dart       # Theme definitions
│   │   │   ├── translations/
│   │   │   │   ├── ar.json              # Arabic translations
│   │   │   │   └── en.json              # English translations
│   │   │   └── utils/
│   │   │       └── app_constants.dart   # App-wide constants
│   │   ├── data/
│   │   │   ├── models/
│   │   │   │   ├── appointment_model.dart
│   │   │   │   └── user_model.dart
│   │   │   ├── providers/
│   │   │   │   ├── api_provider.dart    # HTTP requests
│   │   │   │   └── auth_provider.dart   # Authentication
│   │   │   └── services/
│   │   │       └── storage_service.dart # Local storage
│   │   ├── modules/
│   │   │   ├── home/
│   │   │   │   ├── home_binding.dart    # Dependencies
│   │   │   │   ├── home_controller.dart # Business logic
│   │   │   │   └── home_view.dart       # UI
│   │   │   ├── splash/
│   │   │   │   ├── splash_binding.dart
│   │   │   │   ├── splash_controller.dart
│   │   │   │   └── splash_view.dart
│   │   │   └── welcome/
│   │   │       ├── welcome_binding.dart
│   │   │       ├── welcome_controller.dart
│   │   │       └── welcome_view.dart
│   │   ├── routes/
│   │   │   ├── app_pages.dart           # Route definitions
│   │   │   └── app_routes.dart          # Route names
│   │   └── widgets/
│   │       └── voice_assistant_widget.dart
│   └── main.dart                        # App entry point
│
├── assets/
│   └── translations/
│       ├── ar.json                      # Asset-level Arabic translations
│       └── en.json                      # Asset-level English translations
│
├── android/                             # Android native code
│   ├── app/
│   │   ├── build.gradle
│   │   └── src/
│   │       ├── main/
│   │       │   ├── AndroidManifest.xml
│   │       │   ├── kotlin/
│   │       │   │   └── MainActivity.kt
│   │       │   └── res/                 # Android resources
│   │       ├── debug/
│   │       ├── profile/
│   │       └── test/
│   ├── build.gradle
│   ├── gradle.properties
│   └── settings.gradle
│
├── ios/                                 # iOS native code
│   ├── Runner.xcodeproj
│   ├── Runner.xcworkspace
│   ├── Runner/
│   │   ├── AppDelegate.swift
│   │   ├── Runner-Bridging-Header.h
│   │   ├── Assets.xcassets/
│   │   ├── Base.lproj/
│   │   └── Info.plist
│   └── RunnerTests/
│
├── pubspec.yaml                         # Flutter dependencies
├── pubspec.lock                         # Dependency lock file
├── analysis_options.yaml                # Dart analysis configuration
├── devtools_options.yaml                # DevTools configuration
├── .gitignore
├── .metadata
└── README.md

# Helper Scripts
├── BUILD_APK.ps1                        # Build Android APK
├── QUICK_START.md                       # Quick start guide
├── VERSION.md                           # Version information
├── SETUP_GUIDE.md                       # Setup instructions
├── run-app.ps1                          # Run app script
└── start-backend.ps1                    # Start backend services
```

## Core Features

### 1. Splash Screen (`splash/`)
- Initial app loading screen
- App initialization
- Splash animation
- Automatic navigation to welcome/home

### 2. Welcome Screen (`welcome/`)
- Voice greeting in user's language
- Language selection (Arabic/English)
- Login option
- RTL support for Arabic

### 3. Home Module (`home/`)
- Dashboard with service overview
- User profile section
- Quick action buttons
- 6 Main Service Modules:
  1. **Appointments** - Schedule and manage appointments
  2. **Financial Services** - Access financial assistance
  3. **Voice Chat** - Voice-based assistance
  4. **Inquiry** - Submit inquiries
  5. **Complaints** - Report complaints
  6. **Messages** - Messaging system

### 4. Voice Assistant Widget (`widgets/voice_assistant_widget.dart`)
- Speech-to-text conversion
- Voice command processing
- Text-to-speech responses
- Multilingual voice support
- Accessible voice interface

## Technology Details

### GetX Framework
GetX provides:
- **State Management**: Reactive state management
- **Routing**: Powerful and intuitive routing
- **Dependency Injection**: Lightweight DI container
- **Translation**: Built-in i18n support

### Clean Architecture
The app follows clean architecture with:
- **Presentation Layer**: UI widgets and controllers
- **Domain Layer**: Business logic (not heavily used in small features)
- **Data Layer**: Models, providers, services

### GetX Binding Pattern
```dart
class HomeBinding extends Bindings {
  @override
  void dependencies() {
    Get.put(HomeController());
  }
}
```

### GetX Controller Pattern
```dart
class HomeController extends GetxController {
  var isLoading = false.obs;
  var userProfile = Rx<User?>(null);

  void fetchUserProfile() {
    // Business logic
  }
}
```

## Internationalization (i18n)

### Supported Languages
- **English** (en)
- **Arabic** (ar) - with RTL layout

### Translation Files
- `lib/app/core/translations/`: Dart translation files
- `assets/translations/`: JSON translation files

### Usage
```dart
// Using GetX i18n
Text('welcome_title'.tr);

// With parameters
Text('hello_user'.trParams({'name': 'Ahmed'}));
```

### RTL Support
- Automatic RTL layout for Arabic
- Text direction based on locale
- Flutter built-in RTL support
- Proper text alignment for RTL

## API Integration

### API Provider (`data/providers/api_provider.dart`)
- HTTP client configuration
- API endpoint definitions
- Request/response handling
- Error handling

### Auth Provider (`data/providers/auth_provider.dart`)
- JWT token management
- Login/logout endpoints
- Token refresh logic
- User authentication

### Storage Service (`data/services/storage_service.dart`)
- Local data persistence
- User preferences storage
- Token caching
- Offline data support

## Data Models

### User Model
```dart
class User {
  String id;
  String name;
  String email;
  String phone;
  String? profileImage;
  List<String> roles;
  String language; // 'en' or 'ar'
}
```

### Appointment Model
```dart
class Appointment {
  String id;
  DateTime appointmentDate;
  String time;
  String provider;
  String status; // scheduled, completed, cancelled
  String location;
  String? notes;
}
```

## Theme System (`core/theme/`)

### App Colors (`app_colors.dart`)
- Primary colors
- Secondary colors
- Accent colors
- Error/warning colors
- Background colors
- Text colors

### App Theme (`app_theme.dart`)
- Light theme configuration
- Dark theme support (optional)
- Typography
- Component themes

## Routing

### Route Definitions (`routes/app_routes.dart`)
```dart
abstract class Routes {
  static const SPLASH = '/splash';
  static const WELCOME = '/welcome';
  static const HOME = '/home';
  static const APPOINTMENTS = '/appointments';
  // ... more routes
}
```

### Page Bindings (`routes/app_pages.dart`)
```dart
GetPage(
  name: Routes.HOME,
  page: () => HomeView(),
  binding: HomeBinding(),
)
```

## Development

### Prerequisites
- Flutter 3.27.2 or higher
- Dart 3.6.1 or higher
- Android SDK (for Android development)
- Xcode (for iOS development)

### Get Dependencies
```bash
flutter pub get
```

### Run the App
```bash
flutter run
```

### Run on Specific Device
```bash
flutter run -d <device-id>
```

### Build APK (Android)
```bash
flutter build apk --release
```

### Build iOS App
```bash
flutter build ios --release
```

## Platform-Specific Configuration

### Android Configuration
- **Min SDK**: 21
- **Target SDK**: 33+
- **Main Activity**: MainActivity.kt (Kotlin)
- **Manifest**: AndroidManifest.xml
- **Resources**: res/ directory with drawables, layouts, values

### iOS Configuration
- **Minimum iOS**: 11.0+
- **App Delegate**: AppDelegate.swift
- **Assets**: Assets.xcassets
- **Storyboards**: LaunchScreen, Main
- **Info.plist**: App configuration

## Voice Features

### Speech Recognition
- Convert speech to text
- Multilingual support
- Noise handling
- Confidence scoring

### Text-to-Speech
- Convert text to voice
- Multilingual support
- Speech rate and pitch control
- Audio output routing

## Local Storage

### SharedPreferences
- User preferences
- App settings
- Language selection
- Token caching

### Hive/SQLite
- Offline data storage
- Appointment cache
- Message history
- User data sync

## Security Features

### JWT Token Management
- Secure token storage
- Token refresh logic
- Automatic token inclusion in requests
- Token expiration handling

### Data Security
- HTTPS for all API calls
- Certificate pinning (optional)
- Encrypted local storage
- Biometric authentication support

## Testing
- Unit tests for controllers
- Widget tests for UI
- Integration tests for features
- Mock API responses

## Build & Release

### Build APK
```bash
flutter build apk --split-per-abi --release
```

### Build iOS
```bash
flutter build ios --release
```

### Version Management
- Version specified in pubspec.yaml
- Update VERSION.md for release notes

## Helper Scripts

### BUILD_APK.ps1
PowerShell script to build APK for distribution

### run-app.ps1
Run app in debug mode with hot reload

### start-backend.ps1
Start backend services for development

## Troubleshooting

### Build Issues
- Clean build: `flutter clean && flutter pub get`
- Update dependencies: `flutter pub upgrade`
- Check SDK versions

### Runtime Issues
- Check logs: `flutter logs`
- Use DevTools: `flutter pub global run devtools`
- Clear app data and cache

### Performance
- Profile app: `flutter run --profile`
- Use DevTools Performance tab
- Check for memory leaks

## Recent Updates
- Flutter 3.27.2 with latest features
- Dart 3.6.1 compatibility
- Enhanced voice assistant
- Improved RTL support
- Modern UI with clean design
- Bilingual support (Arabic/English)
