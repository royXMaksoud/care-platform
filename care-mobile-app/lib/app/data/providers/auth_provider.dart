import '../../core/utils/app_constants.dart';
import 'api_provider.dart';

class AuthProvider {
  final ApiProvider _apiProvider = ApiProvider(
    baseUrl: AppConstants.authBaseUrl,
  );

  // Login
  Future<Map<String, dynamic>> login({
    required String username,
    required String password,
  }) async {
    try {
      final response = await _apiProvider.post(
        AppConstants.loginEndpoint,
        data: {
          'username': username,
          'password': password,
        },
      );
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  // Register
  Future<Map<String, dynamic>> register({
    required String username,
    required String email,
    required String password,
    String? phone,
    String? fullName,
  }) async {
    try {
      final response = await _apiProvider.post(
        AppConstants.registerEndpoint,
        data: {
          'username': username,
          'email': email,
          'password': password,
          if (phone != null) 'phone': phone,
          if (fullName != null) 'fullName': fullName,
        },
      );
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  // Logout
  Future<void> logout() async {
    try {
      await _apiProvider.post(AppConstants.logoutEndpoint);
    } catch (e) {
      rethrow;
    }
  }

  // Get Current User
  Future<Map<String, dynamic>> getCurrentUser() async {
    try {
      final response = await _apiProvider.get('/auth/me');
      return response.data;
    } catch (e) {
      rethrow;
    }
  }
}
