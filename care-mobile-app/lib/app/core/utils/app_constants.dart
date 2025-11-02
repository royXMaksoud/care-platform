class AppConstants {
  // App Info
  static const String appName = 'نظام الرعاية الصحية';
  static const String appVersion = '1.0.0';

  // API Base URLs (عدّلها حسب حاجتك)
  static const String authBaseUrl = 'http://10.0.2.2:6061'; // للمحاكي
  static const String appointmentBaseUrl = 'http://10.0.2.2:8080';
  static const String accessManagementBaseUrl = 'http://10.0.2.2:6062';
  static const String gatewayBaseUrl = 'http://10.0.2.2:6060';

  // للجهاز الحقيقي: استبدل 10.0.2.2 بـ IP الخاص بك
  // static const String authBaseUrl = 'http://192.168.1.100:6061';

  // API Endpoints
  static const String loginEndpoint = '/auth/login';
  static const String registerEndpoint = '/auth/register';
  static const String logoutEndpoint = '/auth/logout';
  static const String appointmentsEndpoint = '/api/appointments';
  static const String messagesEndpoint = '/api/messages';
  static const String notificationsEndpoint = '/api/notifications';

  // Storage Keys
  static const String keyToken = 'auth_token';
  static const String keyRefreshToken = 'refresh_token';
  static const String keyUserId = 'user_id';
  static const String keyUsername = 'username';
  static const String keyEmail = 'email';
  static const String keyIsLoggedIn = 'is_logged_in';
  static const String keyLanguage = 'language';
  static const String keyThemeMode = 'theme_mode';

  // Timeouts
  static const int connectionTimeout = 30000; // 30 seconds
  static const int receiveTimeout = 30000;

  // Pagination
  static const int defaultPageSize = 20;

  // Date Format
  static const String dateFormat = 'yyyy-MM-dd';
  static const String dateTimeFormat = 'yyyy-MM-dd HH:mm:ss';
  static const String displayDateFormat = 'dd/MM/yyyy';
  static const String displayTimeFormat = 'HH:mm';

  // Validation
  static const int minPasswordLength = 6;
  static const int maxPasswordLength = 50;

  // Google Maps
  static const String googleMapsApiKey = 'YOUR_GOOGLE_MAPS_API_KEY';

  // Firebase
  // سيتم إضافة مفاتيح Firebase هنا إذا لزم الأمر
}
