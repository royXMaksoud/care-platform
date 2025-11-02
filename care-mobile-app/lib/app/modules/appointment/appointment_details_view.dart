import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:animate_do/animate_do.dart';

import '../../core/theme/app_colors.dart';
import '../../core/utils/error_handler.dart';
import '../../core/utils/voice_helper.dart';
import '../../core/i18n/translations_loader.dart';
import 'appointment_details_controller.dart';

/// Appointment Details View
/// 
/// Shows complete appointment information with actions
class AppointmentDetailsView extends GetView<AppointmentDetailsController> {
  const AppointmentDetailsView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _buildAppBar(context),
      body: Obx(() {
        if (controller.isLoading.value && controller.appointment.value == null) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                CircularProgressIndicator(),
                SizedBox(height: 16.h),
                Text(TranslationsLoader.translate('loading')),
              ],
            ),
          );
        }

        if (controller.appointment.value == null) {
          return Center(
            child: Text(TranslationsLoader.translate('error_appointment_not_found')),
          );
        }

        return SingleChildScrollView(
          padding: EdgeInsets.all(16.w),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildStatusCard(context),
              SizedBox(height: 16.h),
              _buildInfoCard(context),
              SizedBox(height: 16.h),
              _buildActionsCard(context),
            ],
          ),
        );
      }),
    );
  }

  PreferredSizeWidget _buildAppBar(BuildContext context) {
    return AppBar(
      title: Text(TranslationsLoader.translate('appointment_details')),
      actions: [
        IconButton(
          icon: Icon(Icons.help_outline),
          onPressed: () => VoiceHelper.showHelpDialog(
            titleKey: 'appointment_details',
            messageKey: 'appointment_details_help',
            voiceKey: 'appointment_details_voice_help',
          ),
        ),
      ],
    );
  }

  Widget _buildStatusCard(BuildContext context) {
    final appt = controller.appointment.value!;
    return FadeInDown(
      child: Container(
        padding: EdgeInsets.all(16.w),
        decoration: BoxDecoration(
          color: _getStatusColor(appt.status).withOpacity(0.1),
          borderRadius: BorderRadius.circular(12.r),
          border: Border.all(color: _getStatusColor(appt.status), width: 2),
        ),
        child: Row(
          children: [
            Icon(Icons.info_outline, color: _getStatusColor(appt.status), size: 32.sp),
            SizedBox(width: 12.w),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('حالة الموعد', style: TextStyle(fontSize: 12.sp, color: Colors.grey.shade600)),
                  SizedBox(height: 4.h),
                  Text(_getStatusLabel(appt.status), style: TextStyle(fontSize: 20.sp, fontWeight: FontWeight.bold, color: _getStatusColor(appt.status))),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoCard(BuildContext context) {
    final appt = controller.appointment.value!;
    return FadeInDown(
      delay: Duration(milliseconds: 100),
      child: Container(
        padding: EdgeInsets.all(16.w),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12.r),
          border: Border.all(color: Colors.grey.shade200),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8, offset: Offset(0, 2))],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildInfoRow(Icons.location_on, 'المركز', appt.centerName ?? '-'),
            SizedBox(height: 12.h),
            _buildInfoRow(Icons.medical_services, 'نوع الخدمة', appt.serviceTypeName ?? '-'),
            SizedBox(height: 12.h),
            _buildInfoRow(Icons.calendar_today, 'التاريخ', _formatDate(appt.appointmentDate)),
            SizedBox(height: 12.h),
            _buildInfoRow(Icons.access_time, 'الوقت', appt.appointmentTime ?? '-'),
            if (appt.notes != null && appt.notes!.isNotEmpty) ...[
              SizedBox(height: 12.h),
              Divider(),
              SizedBox(height: 12.h),
              _buildInfoRow(Icons.note, 'ملاحظات', appt.notes!),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 20.sp, color: Colors.grey.shade600),
        SizedBox(width: 8.w),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: TextStyle(fontSize: 12.sp, color: Colors.grey.shade600)),
              SizedBox(height: 4.h),
              Text(value, style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w500)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildActionsCard(BuildContext context) {
    return FadeInDown(
      delay: Duration(milliseconds: 200),
      child: Container(
        padding: EdgeInsets.all(16.w),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12.r),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('الإجراءات', style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.bold)),
            SizedBox(height: 16.h),
            Obx(() {
              if (!controller.canCancel() && !controller.canReschedule()) {
                return Text('لا توجد إجراءات متاحة', style: TextStyle(color: Colors.grey));
              }
              return Column(
                children: [
                  if (controller.canCancel())
                    _buildActionButton('إلغاء الموعد', Icons.cancel, Colors.red, () => _showCancelDialog(context), controller.cancelLoading.value),
                  if (controller.canCancel() && controller.canReschedule()) SizedBox(height: 12.h),
                  if (controller.canReschedule())
                    _buildActionButton('تأجيل الموعد', Icons.schedule, AppColors.warning, () => _showRescheduleDialog(context), controller.rescheduleLoading.value),
                ],
              );
            }),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButton(String label, IconData icon, Color color, VoidCallback onPressed, bool isLoading) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        onPressed: isLoading ? null : onPressed,
        icon: isLoading ? SizedBox(width: 20.w, height: 20.w, child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation<Color>(Colors.white))) : Icon(icon),
        label: Text(label),
        style: ElevatedButton.styleFrom(
          backgroundColor: color,
          foregroundColor: Colors.white,
          padding: EdgeInsets.symmetric(vertical: 14.h),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8.r)),
        ),
      ),
    );
  }

  void _showCancelDialog(BuildContext context) {
    final reasonController = TextEditingController();
    Get.dialog(
      AlertDialog(
        title: Text(TranslationsLoader.translate('cancel_appointment')),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(TranslationsLoader.translate('cancel_reason_required')),
            SizedBox(height: 12.h),
            TextField(
              controller: reasonController,
              decoration: InputDecoration(hintText: TranslationsLoader.translate('enter_reason'), border: OutlineInputBorder()),
              maxLines: 3,
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Get.back(), child: Text(TranslationsLoader.translate('cancel'))),
          ElevatedButton(
            onPressed: () {
              if (reasonController.text.isEmpty) {
                ErrorHandler.showWarning(TranslationsLoader.translate('reason_required'));
                return;
              }
              Get.back();
              controller.cancelAppointment(reasonController.text);
            },
            child: Text(TranslationsLoader.translate('confirm')),
          ),
        ],
      ),
    );
  }

  void _showRescheduleDialog(BuildContext context) {
    ErrorHandler.showInfo(TranslationsLoader.translate('reschedule_coming_soon'));
  }

  Color _getStatusColor(String? status) {
    switch (status?.toUpperCase()) {
      case 'PENDING': return Colors.orange;
      case 'CONFIRMED': return Colors.green;
      case 'COMPLETED': return Colors.blue;
      case 'CANCELLED': return Colors.red;
      default: return Colors.grey;
    }
  }

  String _getStatusLabel(String? status) {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'قيد الانتظار';
      case 'CONFIRMED': return 'مؤكد';
      case 'COMPLETED': return 'مكتمل';
      case 'CANCELLED': return 'ملغي';
      default: return status ?? '-';
    }
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '-';
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day}/${date.month}/${date.year}';
    } catch (e) {
      return dateStr;
    }
  }
}

