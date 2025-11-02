import 'package:get/get.dart';
import 'package:dio/dio.dart';
import '../../core/network/dio_client.dart';
import '../../data/api/appointment_api.dart';
import 'appointment_search_controller.dart';
import 'appointment_list_controller.dart';
import 'appointment_details_controller.dart';

/// Bindings for appointment module
/// 
/// Dependency injection for appointment controllers
class AppointmentBinding extends Bindings {
  @override
  void dependencies() {
    // Dio instance
    Get.lazyPut<Dio>(() => DioClient.getInstance(), fenix: true);
    
    // API Services
    Get.lazyPut<AppointmentApiService>(
      () => AppointmentApiService(Get.find<Dio>()),
      fenix: true,
    );
    
    Get.lazyPut<BeneficiaryApiService>(
      () => BeneficiaryApiService(Get.find<Dio>()),
      fenix: true,
    );
    
    // Controllers
    Get.lazyPut(() => AppointmentSearchController());
    Get.lazyPut(() => AppointmentListController());
    Get.lazyPut(() => AppointmentDetailsController());
  }
}

