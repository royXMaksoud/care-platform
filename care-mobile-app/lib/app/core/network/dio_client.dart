import 'package:dio/dio.dart';
import 'package:pretty_dio_logger/pretty_dio_logger.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/app_constants.dart';

/// Dio HTTP Client with interceptors
/// 
/// Features:
/// - JWT Authentication interceptor
/// - Logging interceptor
/// - Error handling interceptor
/// - Retry logic for failed requests
/// 
/// Usage:
/// ```dart
/// final dio = DioClient.getInstance();
/// final response = await dio.get('/api/endpoint');
/// ```
class DioClient {
  static Dio? _instance;
  
  static Dio getInstance() {
    _instance ??= _createDio();
    return _instance!;
  }

  static Dio _createDio() {
    final dio = Dio(
      BaseOptions(
        baseUrl: AppConstants.baseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        sendTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    // Add interceptors
    dio.interceptors.addAll([
      _AuthInterceptor(),
      _ErrorInterceptor(),
      PrettyDioLogger(
        requestHeader: true,
        requestBody: true,
        responseBody: true,
        error: true,
        compact: true,
      ),
      _RetryInterceptor(),
    ]);

    return dio;
  }
}

/// JWT Authentication Interceptor
/// 
/// Automatically adds Authorization header to requests
/// Gets token from shared preferences
class _AuthInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access_token');
    
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      // Token expired - remove and redirect to login
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('access_token');
      await prefs.remove('beneficiary_id');
      
      // Navigate to login (if GetX is available)
      // Get.offAllNamed(Routes.welcome);
    }
    
    handler.next(err);
  }
}

/// Error Handling Interceptor
/// 
/// Maps HTTP errors to user-friendly messages
class _ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    // Custom error messages based on status code
    String message = 'حدث خطأ غير متوقع';
    
    switch (err.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        message = 'انتهت مهلة الاتصال';
        break;
      case DioExceptionType.badResponse:
        switch (err.response?.statusCode) {
          case 400:
            message = 'طلب غير صالح';
            break;
          case 401:
            message = 'غير مصرح';
            break;
          case 403:
            message = 'غير مسموح';
            break;
          case 404:
            message = 'غير موجود';
            break;
          case 500:
            message = 'خطأ في الخادم';
            break;
          default:
            message = 'خطأ في الاتصال';
        }
        break;
      case DioExceptionType.cancel:
        message = 'تم إلغاء الطلب';
        break;
      case DioExceptionType.unknown:
        message = 'لا يوجد اتصال بالإنترنت';
        break;
      case DioExceptionType.badCertificate:
        message = 'خطأ في الشهادة';
        break;
      case DioExceptionType.connectionError:
        message = 'خطأ في الاتصال';
        break;
    }
    
    // Modify error with user-friendly message
    err.response?.data = {'message': message};
    
    handler.next(err);
  }
}

/// Retry Interceptor
/// 
/// Automatically retries failed requests up to 3 times
class _RetryInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    // Only retry on network errors
    if (err.type == DioExceptionType.connectionTimeout ||
        err.type == DioExceptionType.sendTimeout ||
        err.type == DioExceptionType.receiveTimeout ||
        err.type == DioExceptionType.unknown) {
      
      // Check retry count
      final retryCount = err.requestOptions.extra['retryCount'] ?? 0;
      
      if (retryCount < 3) {
        // Wait before retry
        await Future.delayed(Duration(seconds: retryCount + 1));
        
        // Create new request with incremented retry count
        final opts = err.requestOptions;
        opts.extra['retryCount'] = retryCount + 1;
        
        try {
          final response = await DioClient.getInstance().fetch(opts);
          handler.resolve(response);
          return;
        } catch (e) {
          // Continue to next interceptor
        }
      }
    }
    
    handler.next(err);
  }
}

