class AppointmentModel {
  final int? id;
  final int patientId;
  final String? patientName;
  final int doctorId;
  final String? doctorName;
  final String appointmentDateTime;
  final String? reason;
  final String? notes;
  final int duration;
  final String status;
  final String? createdAt;
  final String? updatedAt;

  AppointmentModel({
    this.id,
    required this.patientId,
    this.patientName,
    required this.doctorId,
    this.doctorName,
    required this.appointmentDateTime,
    this.reason,
    this.notes,
    this.duration = 30,
    this.status = 'SCHEDULED',
    this.createdAt,
    this.updatedAt,
  });

  factory AppointmentModel.fromJson(Map<String, dynamic> json) {
    return AppointmentModel(
      id: json['id'],
      patientId: json['patientId'],
      patientName: json['patientName'],
      doctorId: json['doctorId'],
      doctorName: json['doctorName'],
      appointmentDateTime: json['appointmentDateTime'],
      reason: json['reason'],
      notes: json['notes'],
      duration: json['duration'] ?? 30,
      status: json['status'] ?? 'SCHEDULED',
      createdAt: json['createdAt'],
      updatedAt: json['updatedAt'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'patientId': patientId,
      'doctorId': doctorId,
      'appointmentDateTime': appointmentDateTime,
      'reason': reason,
      'notes': notes,
      'duration': duration,
      'status': status,
    };
  }
}
