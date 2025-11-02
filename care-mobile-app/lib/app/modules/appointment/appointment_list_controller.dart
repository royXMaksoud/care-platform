import 'package:get/get.dart';
import 'package:pull_to_refresh/pull_to_refresh.dart';
import '../../data/api/appointment_api.dart';
import '../../data/models/appointment_models.dart';
import '../../core/utils/error_handler.dart';
import '../../core/i18n/translations_loader.dart';

/// Controller for My Appointments List
/// 
/// Features:
/// - Tab bar (Upcoming, Past, Cancelled)
/// - Pull to refresh
/// - Pagination
/// - Filter by status
/// - Comprehensive error handling
class AppointmentListController extends GetxController {
  
  // Services
  final appointmentApi = AppointmentApiService(Get.find());
  
  // Observables
  final selectedTab = 0.obs; // 0=Upcoming, 1=Past, 2=Cancelled
  final upcomingAppointments = <AppointmentModel>[].obs;
  final pastAppointments = <AppointmentModel>[].obs;
  final cancelledAppointments = <AppointmentModel>[].obs;
  final isLoading = false.obs;
  
  // Pagination
  final RefreshController refreshController = RefreshController(initialRefresh: false);
  int currentPage = 0;
  bool hasMore = true;
  
  // Beneficiary ID
  final beneficiaryId = ''.obs;
  
  @override
  void onInit() {
    super.onInit();
    _getBeneficiaryId();
    loadAppointments();
  }

  /// Get beneficiary ID from storage or navigation
  void _getBeneficiaryId() {
    try {
      if (Get.isRegistered<String>(tag: 'beneficiary_id')) {
        beneficiaryId.value = Get.find<String>(tag: 'beneficiary_id');
      }
    } catch (e) {
      ErrorHandler.handleError(e, customMessage: TranslationsLoader.translate('error_beneficiary_id'));
    }
  }

  /// Load appointments based on selected tab
  Future<void> loadAppointments() async {
    if (beneficiaryId.value.isEmpty) {
      ErrorHandler.showWarning(TranslationsLoader.translate('error_beneficiary_id_required'));
      return;
    }

    try {
      isLoading.value = true;
      
      // Determine status based on tab
      String? status;
      if (selectedTab.value == 0) {
        status = 'UPCOMING';
      } else if (selectedTab.value == 1) {
        status = 'COMPLETED';
      } else if (selectedTab.value == 2) {
        status = 'CANCELLED';
      }

      final response = await appointmentApi.getMyAppointments(
        beneficiaryId.value,
        status,
        0, // page
        50, // size
      );

      // Parse response and update lists
      final appointments = (response['content'] as List?)
          ?.map((json) => AppointmentModel.fromJson(json as Map<String, dynamic>))
          .toList() ?? <AppointmentModel>[];

      _updateLists(appointments, status);
      
      hasMore = (appointments.length >= 50);
      currentPage = 0;

    } catch (e) {
      ErrorHandler.handleError(e);
    } finally {
      isLoading.value = false;
      refreshController.refreshCompleted();
    }
  }

  /// Update the appropriate list based on status
  void _updateLists(List<AppointmentModel> appointments, String? status) {
    if (status == 'UPCOMING') {
      upcomingAppointments.value = appointments;
    } else if (status == 'COMPLETED') {
      pastAppointments.value = appointments;
    } else if (status == 'CANCELLED') {
      cancelledAppointments.value = appointments;
    }
  }

  /// Switch tabs
  void switchTab(int index) {
    selectedTab.value = index;
    loadAppointments();
  }

  /// Pull to refresh
  Future<void> onRefresh() async {
    await loadAppointments();
  }

  /// Load more (pagination)
  Future<void> onLoadMore() async {
    if (!hasMore) {
      refreshController.loadNoData();
      return;
    }

    try {
      String? status;
      if (selectedTab.value == 0) {
        status = 'UPCOMING';
      } else if (selectedTab.value == 1) {
        status = 'COMPLETED';
      } else if (selectedTab.value == 2) {
        status = 'CANCELLED';
      }

      final response = await appointmentApi.getMyAppointments(
        beneficiaryId.value,
        status,
        currentPage + 1,
        50,
      );

      final appointments = (response['content'] as List?)
          ?.map((json) => AppointmentModel.fromJson(json as Map<String, dynamic>))
          .toList() ?? <AppointmentModel>[];

      _appendToLists(appointments, status);
      
      hasMore = appointments.length >= 50;
      currentPage++;

      if (appointments.isEmpty) {
        refreshController.loadNoData();
      } else {
        refreshController.loadComplete();
      }

    } catch (e) {
      ErrorHandler.handleError(e);
      refreshController.loadFailed();
    }
  }

  /// Append to lists
  void _appendToLists(List<AppointmentModel> appointments, String? status) {
    if (status == 'UPCOMING') {
      upcomingAppointments.addAll(appointments);
    } else if (status == 'COMPLETED') {
      pastAppointments.addAll(appointments);
    } else if (status == 'CANCELLED') {
      cancelledAppointments.addAll(appointments);
    }
  }

  /// Get current list based on selected tab
  List<AppointmentModel> get currentList {
    if (selectedTab.value == 0) return upcomingAppointments;
    if (selectedTab.value == 1) return pastAppointments;
    return cancelledAppointments;
  }

  /// Navigate to details
  void viewDetails(AppointmentModel appointment) {
    Get.toNamed('/appointment/details', arguments: {'appointmentId': appointment.appointmentId});
  }

  /// Navigate to search for new appointment
  void bookNewAppointment() {
    Get.toNamed('/appointment/search');
  }

  @override
  void onClose() {
    refreshController.dispose();
    super.onClose();
  }
}

