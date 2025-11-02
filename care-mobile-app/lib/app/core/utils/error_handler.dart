import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:dio/dio.dart';
import '../../core/i18n/translations_loader.dart';

/// Global Error Handler
/// 
/// Handles all errors in the app and displays user-friendly messages
/// in the user's preferred language
class ErrorHandler {
  
  /// Handle any error and show message
  static void handleError(dynamic error, {String? customMessage}) {
    String message;

    if (customMessage != null) {
      message = customMessage;
    } else if (error is DioException) {
      message = _handleDioError(error);
    } else if (error is FormatException) {
      message = TranslationsLoader.translate('error_invalid_format');
    } else if (error is StateError) {
      message = TranslationsLoader.translate('error_generic');
    } else {
      message = error.toString();
    }

    // Show error message
    Get.snackbar(
      TranslationsLoader.translate('error_title'),
      message,
      backgroundColor: Colors.red.shade100,
      colorText: Colors.red.shade900,
      icon: Icon(Icons.error_outline, color: Colors.red.shade700),
      duration: Duration(seconds: 4),
      isDismissible: true,
      snackPosition: SnackPosition.BOTTOM,
      margin: EdgeInsets.all(10),
      borderRadius: 10,
    );
  }

  /// Handle Dio/HTTP errors
  static String _handleDioError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return TranslationsLoader.translate('error_timeout');

      case DioExceptionType.badResponse:
        switch (error.response?.statusCode) {
          case 400:
            return TranslationsLoader.translate('error_bad_request');
          case 401:
            return TranslationsLoader.translate('error_unauthorized');
          case 403:
            return TranslationsLoader.translate('error_forbidden');
          case 404:
            return TranslationsLoader.translate('error_not_found');
          case 409:
            return TranslationsLoader.translate('error_conflict');
          case 422:
            return TranslationsLoader.translate('error_validation');
          case 500:
            return TranslationsLoader.translate('error_server');
          case 503:
            return TranslationsLoader.translate('error_service_unavailable');
          default:
            return TranslationsLoader.translate('error_server');
        }

      case DioExceptionType.cancel:
        return TranslationsLoader.translate('error_cancelled');

      case DioExceptionType.connectionError:
        return TranslationsLoader.translate('error_connection');

      case DioExceptionType.unknown:
        return TranslationsLoader.translate('error_no_internet');

      case DioExceptionType.badCertificate:
        return TranslationsLoader.translate('error_certificate');
    }
  }

  /// Show success message
  static void showSuccess(String message) {
    Get.snackbar(
      TranslationsLoader.translate('success_title'),
      message,
      backgroundColor: Colors.green.shade100,
      colorText: Colors.green.shade900,
      icon: Icon(Icons.check_circle_outline, color: Colors.green.shade700),
      duration: Duration(seconds: 3),
      isDismissible: true,
      snackPosition: SnackPosition.BOTTOM,
      margin: EdgeInsets.all(10),
      borderRadius: 10,
    );
  }

  /// Show warning message
  static void showWarning(String message) {
    Get.snackbar(
      TranslationsLoader.translate('warning_title'),
      message,
      backgroundColor: Colors.orange.shade100,
      colorText: Colors.orange.shade900,
      icon: Icon(Icons.warning_amber_rounded, color: Colors.orange.shade700),
      duration: Duration(seconds: 3),
      isDismissible: true,
      snackPosition: SnackPosition.BOTTOM,
      margin: EdgeInsets.all(10),
      borderRadius: 10,
    );
  }

  /// Show info message
  static void showInfo(String message) {
    Get.snackbar(
      TranslationsLoader.translate('info_title'),
      message,
      backgroundColor: Colors.blue.shade100,
      colorText: Colors.blue.shade900,
      icon: Icon(Icons.info_outline, color: Colors.blue.shade700),
      duration: Duration(seconds: 3),
      isDismissible: true,
      snackPosition: SnackPosition.BOTTOM,
      margin: EdgeInsets.all(10),
      borderRadius: 10,
    );
  }

  /// Show loading dialog
  static void showLoading([String? message]) {
    Get.dialog(
      WillPopScope(
        onWillPop: () async => false,
        child: Center(
          child: Container(
            padding: EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                CircularProgressIndicator(),
                SizedBox(height: 16),
                Text(
                  message ?? TranslationsLoader.translate('loading'),
                  style: TextStyle(fontSize: 16),
                ),
              ],
            ),
          ),
        ),
      ),
      barrierDismissible: false,
    );
  }

  /// Hide loading dialog
  static void hideLoading() {
    if (Get.isDialogOpen ?? false) {
      Get.back();
    }
  }

  /// Show confirmation dialog
  static Future<bool> showConfirm({
    required String title,
    required String message,
    String? confirmText,
    String? cancelText,
  }) async {
    final result = await Get.dialog<bool>(
      AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Get.back(result: false),
            child: Text(cancelText ?? TranslationsLoader.translate('cancel')),
          ),
          ElevatedButton(
            onPressed: () => Get.back(result: true),
            child: Text(confirmText ?? TranslationsLoader.translate('ok')),
          ),
        ],
      ),
    );
    return result ?? false;
  }
}

