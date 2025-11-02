import 'package:get/get.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/utils/app_constants.dart';

class StorageService extends GetxService {
  late SharedPreferences _prefs;

  Future<StorageService> init() async {
    _prefs = await SharedPreferences.getInstance();
    return this;
  }

  // Token Management
  Future<void> saveToken(String token) async {
    await _prefs.setString(AppConstants.keyToken, token);
  }

  String? getToken() {
    return _prefs.getString(AppConstants.keyToken);
  }

  Future<void> saveRefreshToken(String token) async {
    await _prefs.setString(AppConstants.keyRefreshToken, token);
  }

  String? getRefreshToken() {
    return _prefs.getString(AppConstants.keyRefreshToken);
  }

  // User Info
  Future<void> saveUserInfo({
    required int userId,
    required String username,
    required String email,
  }) async {
    await _prefs.setInt(AppConstants.keyUserId, userId);
    await _prefs.setString(AppConstants.keyUsername, username);
    await _prefs.setString(AppConstants.keyEmail, email);
    await _prefs.setBool(AppConstants.keyIsLoggedIn, true);
  }

  int? getUserId() {
    return _prefs.getInt(AppConstants.keyUserId);
  }

  String? getUsername() {
    return _prefs.getString(AppConstants.keyUsername);
  }

  String? getEmail() {
    return _prefs.getString(AppConstants.keyEmail);
  }

  bool isLoggedIn() {
    return _prefs.getBool(AppConstants.keyIsLoggedIn) ?? false;
  }

  // Language
  Future<void> saveLanguage(String language) async {
    await _prefs.setString(AppConstants.keyLanguage, language);
  }

  String getLanguage() {
    return _prefs.getString(AppConstants.keyLanguage) ?? 'ar';
  }

  // Theme
  Future<void> saveThemeMode(String mode) async {
    await _prefs.setString(AppConstants.keyThemeMode, mode);
  }

  String getThemeMode() {
    return _prefs.getString(AppConstants.keyThemeMode) ?? 'light';
  }

  // Clear All (Logout)
  Future<void> clearAll() async {
    await _prefs.clear();
  }

  // Generic Methods
  Future<void> write(String key, dynamic value) async {
    if (value is String) {
      await _prefs.setString(key, value);
    } else if (value is int) {
      await _prefs.setInt(key, value);
    } else if (value is bool) {
      await _prefs.setBool(key, value);
    } else if (value is double) {
      await _prefs.setDouble(key, value);
    } else if (value is List<String>) {
      await _prefs.setStringList(key, value);
    }
  }

  T? read<T>(String key) {
    return _prefs.get(key) as T?;
  }

  Future<void> remove(String key) async {
    await _prefs.remove(key);
  }

  // Welcome Screen
  bool hasWelcomeShown() {
    return _prefs.getBool('welcome_shown') ?? false;
  }

  Future<void> setWelcomeShown(bool shown) async {
    await _prefs.setBool('welcome_shown', shown);
  }

  bool isWelcomeDisabled() {
    return _prefs.getBool('welcome_disabled') ?? false;
  }

  Future<void> setWelcomeDisabled(bool disabled) async {
    await _prefs.setBool('welcome_disabled', disabled);
  }
}
