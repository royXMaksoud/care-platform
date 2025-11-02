import 'package:get/get.dart';
import 'package:flutter/material.dart';
import '../../../data/services/storage_service.dart';
import '../../../data/providers/api_provider.dart';
import '../../../core/utils/app_constants.dart';
import '../../../data/api/appointment_api.dart';
import '../../../data/models/appointment_models.dart';

class LoginController extends GetxController {
  final StorageService storageSvc;
  final ApiProvider apiProvider;

  // Form Controllers
  late TextEditingController mobileController;
  late TextEditingController dobController;

  // States
  final isLoading = false.obs;
  final errorMessage = ''.obs;
  final isSuccess = false.obs;

  // Beneficiary API service
  final BeneficiaryApiService beneficiaryApi = BeneficiaryApiService(Get.find());

  LoginController({
    required this.storageSvc,
    required this.apiProvider,
  });

  @override
  void onInit() {
    super.onInit();
    mobileController = TextEditingController();
    dobController = TextEditingController();
  }

  @override
  void onClose() {
    mobileController.dispose();
    dobController.dispose();
    super.onClose();
  }

  /// Verify beneficiary with mobile number and date of birth
  ///
  /// Flow:
  /// 1. Validate inputs (mobile is 10 digits, DOB is valid date)
  /// 2. Call API: POST /api/mobile/beneficiaries/auth/verify
  /// 3. Store returned token in localStorage
  /// 4. Navigate to home/appointments
  Future<void> verifyBeneficiary() async {
    try {
      // Validate
      if (mobileController.text.isEmpty || dobController.text.isEmpty) {
        errorMessage.value = 'الرجاء ملء جميع الحقول';
        return;
      }

      if (mobileController.text.length != 10 || !mobileController.text.startsWith('07')) {
        errorMessage.value = 'رقم الهاتف يجب أن يكون 10 أرقام ويبدأ بـ 07';
        return;
      }

      // Parse DOB
      DateTime? dob;
      try {
        dob = DateTime.parse(dobController.text);
      } catch (e) {
        errorMessage.value = 'تاريخ الميلاد غير صحيح (yyyy-MM-dd)';
        return;
      }

      isLoading.value = true;
      errorMessage.value = '';

      // Call API
      final request = {
        'mobileNumber': mobileController.text,
        'dateOfBirth': dobController.text,
      };

      final beneficiary = await beneficiaryApi.verifyCredentials(request);
      
      // Store beneficiary info
      await storageSvc.saveToken('mock_jwt_token_${DateTime.now().millisecondsSinceEpoch}');
      await storageSvc.saveUserInfo(
        userId: int.tryParse(beneficiary.beneficiaryId ?? '0') ?? 0,
        username: beneficiary.fullName ?? mobileController.text,
        email: beneficiary.email ?? '',
      );

      isSuccess.value = true;
      Get.offAllNamed('/home');

    } catch (e) {
      errorMessage.value = 'حدث خطأ أثناء التحقق: ${e.toString()}';
    } finally {
      isLoading.value = false;
    }
  }

  /// Format date for display
  String formatDate(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }
}

