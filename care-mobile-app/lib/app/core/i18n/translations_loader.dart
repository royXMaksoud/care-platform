import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:get/get.dart';

/// Translations loader for multi-language support
class TranslationsLoader {
  static Map<String, Map<String, String>> translations = {
    'ar': {},
    'en': {},
    'tr': {},
    'ku': {},
  };

  static Future<void> loadAll() async {
    try {
      // Load Arabic
      final arJson = await rootBundle.loadString('assets/translations/ar.json');
      translations['ar'] = Map<String, String>.from(json.decode(arJson));

      // Load English
      final enJson = await rootBundle.loadString('assets/translations/en.json');
      translations['en'] = Map<String, String>.from(json.decode(enJson));

      // TODO: Add Turkish and Kurdish translations later
      translations['tr'] = {};
      translations['ku'] = {};
    } catch (e) {
      print('Error loading translations: $e');
      // Continue with empty translations if loading fails
    }
  }

  static String translate(String key, [Map<String, String>? params]) {
    final locale = Get.locale?.languageCode ?? 'ar';
    // Try current locale first, then fallback to Arabic, then English, then return key
    var text = translations[locale]?[key] ?? 
               translations['ar']?[key] ?? 
               translations['en']?[key] ?? 
               key;

    // Replace parameters if provided
    if (params != null) {
      params.forEach((key, value) {
        text = text.replaceAll('{$key}', value);
      });
    }

    return text;
  }
}

