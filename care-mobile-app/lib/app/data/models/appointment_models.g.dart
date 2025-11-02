// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'appointment_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

AppointmentModel _$AppointmentModelFromJson(Map<String, dynamic> json) =>
    AppointmentModel(
      appointmentId: json['appointmentId'] as String?,
      beneficiaryId: json['beneficiaryId'] as String?,
      centerId: json['centerId'] as String?,
      centerName: json['centerName'] as String?,
      centerAddress: json['centerAddress'] as String?,
      serviceTypeId: json['serviceTypeId'] as String?,
      serviceTypeName: json['serviceTypeName'] as String?,
      appointmentDate: json['appointmentDate'] as String?,
      appointmentTime: json['appointmentTime'] as String?,
      status: json['status'] as String?,
      statusColor: json['statusColor'] as String?,
      createdAt: json['createdAt'] as String?,
      notes: json['notes'] as String?,
      cancelReason: json['cancelReason'] as String?,
      centerLatitude: (json['centerLatitude'] as num?)?.toDouble(),
      centerLongitude: (json['centerLongitude'] as num?)?.toDouble(),
    );

Map<String, dynamic> _$AppointmentModelToJson(AppointmentModel instance) =>
    <String, dynamic>{
      'appointmentId': instance.appointmentId,
      'beneficiaryId': instance.beneficiaryId,
      'centerId': instance.centerId,
      'centerName': instance.centerName,
      'centerAddress': instance.centerAddress,
      'serviceTypeId': instance.serviceTypeId,
      'serviceTypeName': instance.serviceTypeName,
      'appointmentDate': instance.appointmentDate,
      'appointmentTime': instance.appointmentTime,
      'status': instance.status,
      'statusColor': instance.statusColor,
      'createdAt': instance.createdAt,
      'notes': instance.notes,
      'cancelReason': instance.cancelReason,
      'centerLatitude': instance.centerLatitude,
      'centerLongitude': instance.centerLongitude,
    };

CenterModel _$CenterModelFromJson(Map<String, dynamic> json) => CenterModel(
      id: json['id'] as String?,
      name: json['name'] as String?,
      nameAr: json['nameAr'] as String?,
      nameTr: json['nameTr'] as String?,
      address: json['address'] as String?,
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      distance: (json['distance'] as num?)?.toDouble(),
      phone: json['phone'] as String?,
      workingHours: json['workingHours'] as String?,
      availableServices: (json['availableServices'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
    );

Map<String, dynamic> _$CenterModelToJson(CenterModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'nameAr': instance.nameAr,
      'nameTr': instance.nameTr,
      'address': instance.address,
      'latitude': instance.latitude,
      'longitude': instance.longitude,
      'distance': instance.distance,
      'phone': instance.phone,
      'workingHours': instance.workingHours,
      'availableServices': instance.availableServices,
    };

ServiceTypeModel _$ServiceTypeModelFromJson(Map<String, dynamic> json) =>
    ServiceTypeModel(
      id: json['id'] as String?,
      code: json['code'] as String?,
      name: json['name'] as String?,
      nameAr: json['nameAr'] as String?,
      nameTr: json['nameTr'] as String?,
      categoryId: json['categoryId'] as String?,
      categoryName: json['categoryName'] as String?,
    );

Map<String, dynamic> _$ServiceTypeModelToJson(ServiceTypeModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'code': instance.code,
      'name': instance.name,
      'nameAr': instance.nameAr,
      'nameTr': instance.nameTr,
      'categoryId': instance.categoryId,
      'categoryName': instance.categoryName,
    };

AppointmentSuggestionModel _$AppointmentSuggestionModelFromJson(
        Map<String, dynamic> json) =>
    AppointmentSuggestionModel(
      center: json['center'] == null
          ? null
          : CenterModel.fromJson(json['center'] as Map<String, dynamic>),
      availableSlots: (json['availableSlots'] as List<dynamic>?)
          ?.map((e) => DateTime.parse(e as String))
          .toList(),
      earliestSlot: json['earliestSlot'] == null
          ? null
          : DateTime.parse(json['earliestSlot'] as String),
      distance: (json['distance'] as num?)?.toDouble(),
      score: (json['score'] as num?)?.toDouble(),
    );

Map<String, dynamic> _$AppointmentSuggestionModelToJson(
        AppointmentSuggestionModel instance) =>
    <String, dynamic>{
      'center': instance.center,
      'availableSlots':
          instance.availableSlots?.map((e) => e.toIso8601String()).toList(),
      'earliestSlot': instance.earliestSlot?.toIso8601String(),
      'distance': instance.distance,
      'score': instance.score,
    };

BeneficiaryModel _$BeneficiaryModelFromJson(Map<String, dynamic> json) =>
    BeneficiaryModel(
      beneficiaryId: json['beneficiaryId'] as String?,
      nationalId: json['nationalId'] as String?,
      fullName: json['fullName'] as String?,
      motherName: json['motherName'] as String?,
      mobileNumber: json['mobileNumber'] as String?,
      email: json['email'] as String?,
      address: json['address'] as String?,
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      dateOfBirth: json['dateOfBirth'] as String?,
      genderCodeValueId: json['genderCodeValueId'] as String?,
      profilePhotoUrl: json['profilePhotoUrl'] as String?,
      registrationStatusCodeValueId:
          json['registrationStatusCodeValueId'] as String?,
      registrationCompletedAt: json['registrationCompletedAt'] as String?,
      preferredLanguageCodeValueId:
          json['preferredLanguageCodeValueId'] as String?,
      isActive: json['isActive'] as bool?,
      createdAt: json['createdAt'] as String?,
      updatedAt: json['updatedAt'] as String?,
    );

Map<String, dynamic> _$BeneficiaryModelToJson(BeneficiaryModel instance) =>
    <String, dynamic>{
      'beneficiaryId': instance.beneficiaryId,
      'nationalId': instance.nationalId,
      'fullName': instance.fullName,
      'motherName': instance.motherName,
      'mobileNumber': instance.mobileNumber,
      'email': instance.email,
      'address': instance.address,
      'latitude': instance.latitude,
      'longitude': instance.longitude,
      'dateOfBirth': instance.dateOfBirth,
      'genderCodeValueId': instance.genderCodeValueId,
      'profilePhotoUrl': instance.profilePhotoUrl,
      'registrationStatusCodeValueId': instance.registrationStatusCodeValueId,
      'registrationCompletedAt': instance.registrationCompletedAt,
      'preferredLanguageCodeValueId': instance.preferredLanguageCodeValueId,
      'isActive': instance.isActive,
      'createdAt': instance.createdAt,
      'updatedAt': instance.updatedAt,
    };

BaseResponse<T> _$BaseResponseFromJson<T>(
  Map<String, dynamic> json,
  T Function(Object? json) fromJsonT,
) =>
    BaseResponse<T>(
      success: json['success'] as bool,
      data: _$nullableGenericFromJson(json['data'], fromJsonT),
      message: json['message'] as String?,
      error: json['error'] as String?,
    );

Map<String, dynamic> _$BaseResponseToJson<T>(
  BaseResponse<T> instance,
  Object? Function(T value) toJsonT,
) =>
    <String, dynamic>{
      'success': instance.success,
      'data': _$nullableGenericToJson(instance.data, toJsonT),
      'message': instance.message,
      'error': instance.error,
    };

T? _$nullableGenericFromJson<T>(
  Object? input,
  T Function(Object? json) fromJson,
) =>
    input == null ? null : fromJson(input);

Object? _$nullableGenericToJson<T>(
  T? input,
  Object? Function(T value) toJson,
) =>
    input == null ? null : toJson(input);

ListResponse<T> _$ListResponseFromJson<T>(
  Map<String, dynamic> json,
  T Function(Object? json) fromJsonT,
) =>
    ListResponse<T>(
      data: (json['data'] as List<dynamic>).map(fromJsonT).toList(),
      total: (json['total'] as num).toInt(),
      page: (json['page'] as num).toInt(),
      size: (json['size'] as num).toInt(),
    );

Map<String, dynamic> _$ListResponseToJson<T>(
  ListResponse<T> instance,
  Object? Function(T value) toJsonT,
) =>
    <String, dynamic>{
      'data': instance.data.map(toJsonT).toList(),
      'total': instance.total,
      'page': instance.page,
      'size': instance.size,
    };
