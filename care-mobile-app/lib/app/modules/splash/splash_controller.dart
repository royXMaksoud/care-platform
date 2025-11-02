import 'package:get/get.dart';
import '../../routes/app_routes.dart';

class SplashController extends GetxController {
  @override
  void onInit() {
    super.onInit();
    _navigateToWelcome();
  }

  Future<void> _navigateToWelcome() async {
    // انتظر ثانيتين
    await Future.delayed(const Duration(seconds: 2));

    // اذهب للترحيب مباشرة
    Get.offAllNamed(Routes.welcome);
  }
}
