import 'package:get/get.dart';

class HomeController extends GetxController {
  // Observable variables
  final notificationCount = 5.obs;
  final isLoggedIn = false.obs;
  final showAssistant = true.obs;

  @override
  void onInit() {
    super.onInit();

    // إخفاء المساعد بعد 10 ثوانٍ
    Future.delayed(const Duration(seconds: 10), () {
      if (showAssistant.value) {
        showAssistant.value = false;
      }
    });
  }

  void logout() {
    isLoggedIn.value = false;
    Get.snackbar(
      'تسجيل الخروج',
      'تم تسجيل الخروج بنجاح',
      snackPosition: SnackPosition.BOTTOM,
    );
  }

  void hideAssistant() {
    showAssistant.value = false;
  }

  void showAssistantAgain() {
    showAssistant.value = true;
  }
}
