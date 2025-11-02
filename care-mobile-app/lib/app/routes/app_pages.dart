import 'package:get/get.dart';

import '../modules/splash/splash_binding.dart';
import '../modules/splash/splash_view.dart';
import '../modules/welcome/welcome_binding.dart';
import '../modules/welcome/welcome_view.dart';
import '../modules/home/home_binding.dart';
import '../modules/home/home_view.dart';

import 'app_routes.dart';

class AppPages {
  AppPages._();

  static const initial = Routes.welcome; // البداية من Welcome مباشرة!

  static final routes = [
    GetPage(
      name: Routes.splash,
      page: () => const SplashView(),
      binding: SplashBinding(),
    ),
    GetPage(
      name: Routes.welcome,
      page: () => const WelcomeView(),
      binding: WelcomeBinding(),
      transition: Transition.fadeIn,
    ),
    GetPage(
      name: Routes.home,
      page: () => const HomeView(),
      binding: HomeBinding(),
      transition: Transition.fadeIn,
    ),
    // TODO: إضافة صفحات أخرى لاحقاً
    // GetPage(
    //   name: Routes.login,
    //   page: () => const LoginView(),
    //   binding: LoginBinding(),
    // ),
    // GetPage(
    //   name: Routes.appointments,
    //   page: () => const AppointmentsView(),
    //   binding: AppointmentsBinding(),
    // ),
  ];
}
