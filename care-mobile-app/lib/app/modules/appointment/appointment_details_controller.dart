import 'package:get/get.dart';
import '../../data/api/appointment_api.dart';
import '../../data/models/appointment_models.dart';
import '../../core/utils/error_handler.dart';
import '../../core/i18n/translations_loader.dart';

/// Controller for Appointment Details
/// 
/// Features:
/// - Load appointment details
/// - Cancel appointment
/// - Reschedule appointment
/// - Error handling
class AppointmentDetailsController extends GetxController {
  
  // Services
  final appointmentApi = AppointmentApiService(Get.find());
  
  // Observables
  final appointment = Rxn<AppointmentModel>();
  final isLoading = false.obs;
  final cancelLoading = false.obs;
  final rescheduleLoading = false.obs;
  
  // Appointment ID from arguments
  String? appointmentId;

  @override
  void onInit() {
    super.onInit();
    appointmentId = Get.arguments?['appointmentId'];
    if (appointmentId != null) {
      loadAppointmentDetails();
    } else {
      ErrorHandler.showWarning(TranslationsLoader.translate('error_appointment_id_required'));
    }
  }

  /// Load appointment details
  Future<void> loadAppointmentDetails() async {
    if (appointmentId == null) return;

    try {
      isLoading.value = true;
      ErrorHandler.showLoading(TranslationsLoader.translate('loading'));
      
      final details = await appointmentApi.getAppointmentDetails(appointmentId!);
      appointment.value = details;

      ErrorHandler.hideLoading();
    } catch (e) {
      ErrorHandler.hideLoading();
      ErrorHandler.handleError(e);
      // Navigate back if error loading
      Get.back();
    } finally {
      isLoading.value = false;
    }
  }

  /// Cancel appointment with reason
  Future<void> cancelAppointment(String reason) async {
    if (appointmentId == null) return;

    // Confirm with user
    final confirmed = await ErrorHandler.showConfirm(
      title: TranslationsLoader.translate('cancel_appointment'),
      message: TranslationsLoader.translate('cancel_confirmation_message'),
    );
    
    if (!confirmed) return;

    try {
      cancelLoading.value = true;
      ErrorHandler.showLoading(TranslationsLoader.translate('processing_cancellation'));
      
      await appointmentApi.cancelAppointment(appointmentId!, reason);

      ErrorHandler.hideLoading();
      ErrorHandler.showSuccess(TranslationsLoader.translate('appointment_cancelled'));
      
      // Reload details to get updated status
      await loadAppointmentDetails();
      
    } catch (e) {
      ErrorHandler.hideLoading();
      ErrorHandler.handleError(e);
    } finally {
      cancelLoading.value = false;
    }
  }

  /// Reschedule appointment
  Future<void> rescheduleAppointment(DateTime newDate, String newTime) async {
    if (appointmentId == null) return;

    // Confirm with user
    final confirmed = await ErrorHandler.showConfirm(
      title: TranslationsLoader.translate('reschedule_appointment'),
      message: TranslationsLoader.translate('reschedule_confirmation_message'),
    );
    
    if (!confirmed) return;

    try {
      rescheduleLoading.value = true;
      ErrorHandler.showLoading(TranslationsLoader.translate('processing_reschedule'));
      
      final request = {
        'appointmentDate': newDate.toIso8601String().split('T')[0],
        'appointmentTime': newTime,
      };

      await appointmentApi.rescheduleAppointment(appointmentId!, request);

      ErrorHandler.hideLoading();
      ErrorHandler.showSuccess(TranslationsLoader.translate('appointment_rescheduled'));
      
      // Reload details
      await loadAppointmentDetails();
      
    } catch (e) {
      ErrorHandler.hideLoading();
      ErrorHandler.handleError(e);
    } finally {
      rescheduleLoading.value = false;
    }
  }

  /// Check if appointment can be cancelled
  bool canCancel() {
    final status = appointment.value?.status?.toUpperCase();
    return status == 'PENDING' || status == 'CONFIRMED';
  }

  /// Check if appointment can be rescheduled
  bool canReschedule() {
    final status = appointment.value?.status?.toUpperCase();
    return status == 'PENDING' || status == 'CONFIRMED';
  }

  /// Navigate back to list
  void backToList() {
    Get.back();
  }
}

