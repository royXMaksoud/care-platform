import 'package:get/get.dart';

import '../modules/splash/splash_binding.dart';
import '../modules/splash/splash_view.dart';
import '../modules/welcome/welcome_binding.dart';
import '../modules/welcome/welcome_view.dart';
import '../modules/auth/login/login_binding.dart';
import '../modules/auth/login/login_view.dart';
import '../modules/home/home_binding.dart';
import '../modules/home/home_view.dart';
import '../modules/appointment/appointment_binding.dart';
import '../modules/appointment/appointment_search_view.dart';
import '../modules/appointment/appointment_list_view.dart';
import '../modules/appointment/appointment_details_view.dart';

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
      name: Routes.login,
      page: () => const LoginView(),
      binding: LoginBinding(),
      transition: Transition.fadeIn,
    ),
    GetPage(
      name: Routes.home,
      page: () => const HomeView(),
      binding: HomeBinding(),
      transition: Transition.fadeIn,
    ),
    GetPage(
      name: Routes.appointmentSearch,
      page: () => const AppointmentSearchView(),
      binding: AppointmentBinding(),
      transition: Transition.rightToLeft,
    ),
    GetPage(
      name: Routes.appointmentList,
      page: () => const AppointmentListView(),
      binding: AppointmentBinding(),
      transition: Transition.rightToLeft,
    ),
    GetPage(
      name: Routes.appointmentDetails,
      page: () => const AppointmentDetailsView(),
      binding: AppointmentBinding(),
      transition: Transition.rightToLeft,
    ),
  ];
}

