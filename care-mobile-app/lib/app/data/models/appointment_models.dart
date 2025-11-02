import 'package:json_annotation/json_annotation.dart';

part 'appointment_models.g.dart';

/// Appointment Model
/// Represents an appointment booking
@JsonSerializable()
class AppointmentModel {
  final String? appointmentId;
  final String? beneficiaryId;
  final String? centerId;
  final String? centerName;
  final String? centerAddress;
  final String? serviceTypeId;
  final String? serviceTypeName;
  final String? appointmentDate;
  final String? appointmentTime;
  final String? status;
  final String? statusColor;
  final String? createdAt;
  final String? notes;
  final String? cancelReason;
  final double? centerLatitude;
  final double? centerLongitude;

  AppointmentModel({
    this.appointmentId,
    this.beneficiaryId,
    this.centerId,
    this.centerName,
    this.centerAddress,
    this.serviceTypeId,
    this.serviceTypeName,
    this.appointmentDate,
    this.appointmentTime,
    this.status,
    this.statusColor,
    this.createdAt,
    this.notes,
    this.cancelReason,
    this.centerLatitude,
    this.centerLongitude,
  });

  factory AppointmentModel.fromJson(Map<String, dynamic> json) =>
      _$AppointmentModelFromJson(json);

  Map<String, dynamic> toJson() => _$AppointmentModelToJson(this);
}

/// Center Model
/// Represents a medical center/clinic
@JsonSerializable()
class CenterModel {
  final String? id;
  final String? name;
  final String? nameAr;
  final String? nameTr;
  final String? address;
  final double? latitude;
  final double? longitude;
  final double? distance;
  final String? phone;
  final String? workingHours;
  final List<String>? availableServices;

  CenterModel({
    this.id,
    this.name,
    this.nameAr,
    this.nameTr,
    this.address,
    this.latitude,
    this.longitude,
    this.distance,
    this.phone,
    this.workingHours,
    this.availableServices,
  });

  factory CenterModel.fromJson(Map<String, dynamic> json) =>
      _$CenterModelFromJson(json);

  Map<String, dynamic> toJson() => _$CenterModelToJson(this);
}

/// Service Type Model
@JsonSerializable()
class ServiceTypeModel {
  final String? id;
  final String? code;
  final String? name;
  final String? nameAr;
  final String? nameTr;
  final String? categoryId;
  final String? categoryName;

  ServiceTypeModel({
    this.id,
    this.code,
    this.name,
    this.nameAr,
    this.nameTr,
    this.categoryId,
    this.categoryName,
  });

  factory ServiceTypeModel.fromJson(Map<String, dynamic> json) =>
      _$ServiceTypeModelFromJson(json);

  Map<String, dynamic> toJson() => _$ServiceTypeModelToJson(this);
}

/// Appointment Suggestion Model
/// Returned from search API
@JsonSerializable()
class AppointmentSuggestionModel {
  final CenterModel? center;
  final List<DateTime>? availableSlots;
  final DateTime? earliestSlot;
  final double? distance;
  final double? score;

  AppointmentSuggestionModel({
    this.center,
    this.availableSlots,
    this.earliestSlot,
    this.distance,
    this.score,
  });

  factory AppointmentSuggestionModel.fromJson(Map<String, dynamic> json) =>
      _$AppointmentSuggestionModelFromJson(json);

  Map<String, dynamic> toJson() => _$AppointmentSuggestionModelToJson(this);
}

/// Beneficiary Model
@JsonSerializable()
class BeneficiaryModel {
  final String? beneficiaryId;
  final String? nationalId;
  final String? fullName;
  final String? motherName;
  final String? mobileNumber;
  final String? email;
  final String? address;
  final double? latitude;
  final double? longitude;
  final String? dateOfBirth;
  final String? genderCodeValueId;
  final String? profilePhotoUrl;
  final String? registrationStatusCodeValueId;
  final String? registrationCompletedAt;
  final String? preferredLanguageCodeValueId;
  final bool? isActive;
  final String? createdAt;
  final String? updatedAt;

  BeneficiaryModel({
    this.beneficiaryId,
    this.nationalId,
    this.fullName,
    this.motherName,
    this.mobileNumber,
    this.email,
    this.address,
    this.latitude,
    this.longitude,
    this.dateOfBirth,
    this.genderCodeValueId,
    this.profilePhotoUrl,
    this.registrationStatusCodeValueId,
    this.registrationCompletedAt,
    this.preferredLanguageCodeValueId,
    this.isActive,
    this.createdAt,
    this.updatedAt,
  });

  factory BeneficiaryModel.fromJson(Map<String, dynamic> json) =>
      _$BeneficiaryModelFromJson(json);

  Map<String, dynamic> toJson() => _$BeneficiaryModelToJson(this);
}

/// Response Models
@JsonSerializable(genericArgumentFactories: true)
class BaseResponse<T> {
  final bool success;
  final T? data;
  final String? message;
  final String? error;

  BaseResponse({
    required this.success,
    this.data,
    this.message,
    this.error,
  });

  factory BaseResponse.fromJson(Map<String, dynamic> json, T Function(Object?) fromJsonT) =>
      _$BaseResponseFromJson(json, fromJsonT);

  Map<String, dynamic> toJson(Object? Function(T?) toJsonT) =>
      _$BaseResponseToJson(this, toJsonT);
}

@JsonSerializable(genericArgumentFactories: true)
class ListResponse<T> {
  final List<T> data;
  final int total;
  final int page;
  final int size;

  ListResponse({
    required this.data,
    required this.total,
    required this.page,
    required this.size,
  });

  factory ListResponse.fromJson(Map<String, dynamic> json, T Function(Object?) fromJsonT) =>
      _$ListResponseFromJson(json, fromJsonT);

  Map<String, dynamic> toJson(Object? Function(T) toJsonT) =>
      _$ListResponseToJson(this, toJsonT);
}

