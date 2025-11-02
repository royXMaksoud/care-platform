import 'dart:async';
import 'package:get/get.dart';
import 'package:geolocator/geolocator.dart';
import '../../data/api/appointment_api.dart';
import '../../data/models/appointment_models.dart';
import '../../data/default_services.dart';
import '../../core/utils/error_handler.dart';
import '../../core/i18n/translations_loader.dart';

/// Controller for appointment search flow
/// 
/// Handles:
/// - Service selection
/// - Location input
/// - Search execution
/// - Results management
/// 
/// Includes comprehensive error handling for all user actions
class AppointmentSearchController extends GetxController {
  
  // Observables
  final isLoading = false.obs;
  final selectedCategory = Rxn<ServiceTypeModel>();
  final selectedServiceType = Rxn<ServiceTypeModel>();
  final preferenceType = 'NEAREST_CENTER'.obs;
  final searchResults = <AppointmentSuggestionModel>[].obs;
  final selectedCenter = Rxn<CenterModel>();
  final selectedSlot = Rxn<DateTime>();
  final serviceTypes = <ServiceTypeModel>[].obs;
  
  // Location
  final userLatitude = Rxn<double>();
  final userLongitude = Rxn<double>();
  
  // Services
  final appointmentApi = AppointmentApiService(Get.find());
  
  @override
  void onInit() {
    super.onInit();
    _initialize();
  }

  /// Initialize controller with data
  Future<void> _initialize() async {
    try {
      // Load default services immediately (no waiting for backend)
      serviceTypes.value = DefaultServices.getDefaultServiceTypes();
      
      isLoading.value = true;
      await Future.wait([
        getCurrentLocation(),
        loadServiceTypes(), // Try to load from backend and update
      ]);
    } catch (e) {
      ErrorHandler.handleError(e);
    } finally {
      isLoading.value = false;
    }
  }

  /// Load service types from backend
  /// If backend fails, keeps default services that were loaded in _initialize
  Future<void> loadServiceTypes() async {
    try {
      final types = await appointmentApi.getServiceTypes();
      
      // Only update if we got services from backend
      if (types.isNotEmpty) {
        serviceTypes.value = types;
      } else {
        // Backend returned empty, but we have defaults, so just log
        print('Backend returned empty service types, using defaults');
      }
    } catch (e) {
      // Backend failed, but we already have default services loaded
      // So we don't clear the list or show error - defaults are available
      print('Failed to load services from backend, using defaults: $e');
      // Keep default services that were already loaded
    }
  }

  /// Retry loading service types
  Future<void> retryLoadServiceTypes() async {
    await loadServiceTypes();
  }

  /// Get user's current location with error handling
  Future<void> getCurrentLocation() async {
    try {
      // Check if location service is enabled
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        ErrorHandler.showWarning(TranslationsLoader.translate('error_location_disabled'));
        return;
      }

      // Check permissions
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          ErrorHandler.showWarning(TranslationsLoader.translate('error_location_permission_denied'));
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        ErrorHandler.showWarning(TranslationsLoader.translate('error_location_permission_permanent'));
        return;
      }

      // Get position
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 10),
      );
      
      userLatitude.value = position.latitude;
      userLongitude.value = position.longitude;
    } on TimeoutException {
      ErrorHandler.handleError(null, customMessage: TranslationsLoader.translate('error_location_timeout'));
    } catch (e) {
      ErrorHandler.handleError(e);
    }
  }

  /// Search for available appointments with comprehensive error handling
  Future<void> searchAppointments() async {
    try {
      // Validation
      if (selectedServiceType.value == null) {
        ErrorHandler.showWarning(TranslationsLoader.translate('select_service'));
        return;
      }
      
      if (userLatitude.value == null || userLongitude.value == null) {
        ErrorHandler.showWarning(TranslationsLoader.translate('error_location_required'));
        return;
      }
      
      isLoading.value = true;
      ErrorHandler.showLoading(TranslationsLoader.translate('loading_centers'));
      
      final criteria = {
        'latitude': userLatitude.value,
        'longitude': userLongitude.value,
        'serviceTypeId': selectedServiceType.value?.id,
        'preferenceType': preferenceType.value,
        'fromDate': DateTime.now().toString().split(' ')[0],
        'toDate': DateTime.now().add(const Duration(days: 30)).toString().split(' ')[0],
        'maxResults': 5,
      };
      
      final results = await appointmentApi.searchAppointments(criteria);
      searchResults.value = results;
      
      if (results.isEmpty) {
        ErrorHandler.showInfo(TranslationsLoader.translate('no_centers_found'));
      } else {
        ErrorHandler.hideLoading();
        ErrorHandler.showSuccess(TranslationsLoader.translate('centers_loaded'));
      }
    } catch (e) {
      ErrorHandler.handleError(e);
    } finally {
      isLoading.value = false;
      ErrorHandler.hideLoading();
    }
  }

  /// Select a center from search results
  void selectCenter(CenterModel center) {
    selectedCenter.value = center;
    ErrorHandler.showSuccess(TranslationsLoader.translate('center_selected'));
  }

  /// Select a time slot
  void selectTimeSlot(DateTime slot) {
    selectedSlot.value = slot;
    ErrorHandler.showSuccess(TranslationsLoader.translate('time_selected'));
  }

  /// Confirm booking with comprehensive error handling
  Future<void> confirmBooking() async {
    try {
      // Validation
      if (selectedCenter.value == null || selectedSlot.value == null) {
        ErrorHandler.showWarning(TranslationsLoader.translate('select_center_and_time'));
        return;
      }
      
      // Confirm with user
      final confirmed = await ErrorHandler.showConfirm(
        title: TranslationsLoader.translate('confirm_booking'),
        message: TranslationsLoader.translate('booking_confirmation_message'),
      );
      
      if (!confirmed) return;
      
      isLoading.value = true;
      ErrorHandler.showLoading(TranslationsLoader.translate('processing_booking'));
      
      final request = {
        'beneficiaryId': Get.find<String>(tag: 'beneficiary_id'),
        'organizationBranchId': selectedCenter.value?.id,
        'serviceTypeId': selectedServiceType.value?.id,
        'appointmentDate': selectedSlot.value?.toIso8601String().split('T')[0],
        'appointmentTime': selectedSlot.value?.toIso8601String().split('T')[1].split('.')[0],
      };
      
      await appointmentApi.createAppointment(request);
      
      ErrorHandler.hideLoading();
      ErrorHandler.showSuccess(TranslationsLoader.translate('booking_success'));
      
      // Navigate to appointments list
      Get.offAndToNamed('/appointment/list');
      
    } catch (e) {
      ErrorHandler.handleError(e);
    } finally {
      isLoading.value = false;
      ErrorHandler.hideLoading();
    }
  }
}

