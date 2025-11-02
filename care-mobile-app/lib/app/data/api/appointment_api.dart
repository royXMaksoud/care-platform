import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';

import '../../../app/data/models/appointment_models.dart';
import '../../core/utils/app_constants.dart';

part 'appointment_api.g.dart';

/// Appointment API Service
/// 
/// Type-safe REST client using Retrofit
@RestApi(baseUrl: AppConstants.appointmentBaseUrl)
abstract class AppointmentApiService {
  factory AppointmentApiService(Dio dio) = _AppointmentApiService;

  /// Search for available appointment slots
  /// 
  /// Body: AppointmentSearchCriteria
  /// Returns: List of AppointmentSuggestion
  @POST('/api/mobile/appointments/search')
  Future<List<AppointmentSuggestionModel>> searchAppointments(
    @Body() Map<String, dynamic> criteria,
  );

  /// Get my appointments
  /// 
  /// Query params: status, page, size
  /// Returns: Paginated list
  @GET('/api/mobile/appointments/beneficiaries/{beneficiaryId}/appointments')
  Future<Map<String, dynamic>> getMyAppointments(
    @Path('beneficiaryId') String beneficiaryId,
    @Query('status') String? status,
    @Query('page') int page,
    @Query('size') int size,
  );

  /// Create new appointment
  @POST('/api/mobile/appointments/book')
  Future<AppointmentModel> createAppointment(
    @Body() Map<String, dynamic> request,
  );

  /// Get appointment details by ID
  @GET('/api/mobile/appointments/{id}')
  Future<AppointmentModel> getAppointmentDetails(
    @Path('id') String appointmentId,
  );

  /// Cancel appointment
  @POST('/api/mobile/appointments/{id}/cancel')
  Future<AppointmentModel> cancelAppointment(
    @Path('id') String appointmentId,
    @Query('reason') String reason,
  );

  /// Reschedule appointment
  @PUT('/api/mobile/appointments/{id}/reschedule')
  Future<AppointmentModel> rescheduleAppointment(
    @Path('id') String appointmentId,
    @Body() Map<String, dynamic> request,
  );

  /// Get service categories
  @GET('/api/admin/service-types')
  Future<List<Map<String, dynamic>>> getServiceCategories();

  /// Get service types
  /// 
  /// Query: categoryId (optional)
  @GET('/api/mobile/service-types/lookup')
  Future<List<ServiceTypeModel>> getServiceTypes();
}

/// Mobile Beneficiary API
@RestApi(baseUrl: AppConstants.appointmentBaseUrl)
abstract class BeneficiaryApiService {
  factory BeneficiaryApiService(Dio dio) = _BeneficiaryApiService;

  /// Verify beneficiary credentials
  /// 
  /// Used for mobile app authentication
  @POST('/api/mobile/beneficiaries/auth/verify')
  Future<BeneficiaryModel> verifyCredentials(
    @Body() Map<String, dynamic> request,
  );
}

