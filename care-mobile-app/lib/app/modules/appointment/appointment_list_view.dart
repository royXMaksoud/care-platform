import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:pull_to_refresh/pull_to_refresh.dart';
import 'package:animate_do/animate_do.dart';

import '../../core/theme/app_colors.dart';
import '../../core/utils/voice_helper.dart';
import '../../core/i18n/translations_loader.dart';
import '../../data/models/appointment_models.dart';
import 'appointment_list_controller.dart';

/// My Appointments List View
/// 
/// Simple, clean UI for elderly and children
/// - Tabs (Upcoming, Past, Cancelled)
/// - Pull to refresh
/// - Empty states
/// - Help instructions
/// - Voice assistant
class AppointmentListView extends GetView<AppointmentListController> {
  const AppointmentListView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _buildAppBar(context),
      body: SafeArea(
        child: Column(
          children: [
            _buildTabBar(context),
            Expanded(
              child: Obx(() => _buildContent(context)),
            ),
          ],
        ),
      ),
      floatingActionButton: _buildFAB(context),
    );
  }

  PreferredSizeWidget _buildAppBar(BuildContext context) {
    return AppBar(
      title: FadeInDown(
        child: Row(
          children: [
            Icon(Icons.calendar_today, color: AppColors.primary),
            SizedBox(width: 8.w),
            Text('مواعيدي'),
          ],
        ),
      ),
      centerTitle: false,
      actions: [
        // Help button
        IconButton(
          icon: Icon(Icons.help_outline),
          onPressed: () => _showHelp(context),
        ),
      ],
    );
  }

  /// Tab bar
  Widget _buildTabBar(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          bottom: BorderSide(color: Colors.grey.shade200, width: 1),
        ),
      ),
      child: Obx(() => Row(
        children: [
          Expanded(
            child: _buildTabItem(context, 0, 'قادمة', Icons.upcoming),
          ),
          Expanded(
            child: _buildTabItem(context, 1, 'سابقة', Icons.history),
          ),
          Expanded(
            child: _buildTabItem(context, 2, 'ملغاة', Icons.cancel),
          ),
        ],
      )),
    );
  }

  Widget _buildTabItem(BuildContext context, int index, String label, IconData icon) {
    final isSelected = controller.selectedTab.value == index;
    return InkWell(
      onTap: () => controller.switchTab(index),
      child: Container(
        padding: EdgeInsets.symmetric(vertical: 12.h),
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(
              color: isSelected ? AppColors.primary : Colors.transparent,
              width: 2,
            ),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              color: isSelected ? AppColors.primary : Colors.grey,
              size: 24.sp,
            ),
            SizedBox(height: 4.h),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? AppColors.primary : Colors.grey,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                fontSize: 14.sp,
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Content area
  Widget _buildContent(BuildContext context) {
    if (controller.isLoading.value && controller.currentList.isEmpty) {
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

    if (controller.currentList.isEmpty) {
      return _buildEmptyState(context);
    }

    return _buildList(context);
  }

  /// Empty state
  Widget _buildEmptyState(BuildContext context) {
    final label = controller.selectedTab.value == 0 
        ? 'لا توجد مواعيد قادمة'
        : controller.selectedTab.value == 1
            ? 'لا توجد مواعيد سابقة'
            : 'لا توجد مواعيد ملغاة';

    return FadeIn(
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.event_busy,
              size: 80.sp,
              color: Colors.grey.shade400,
            ),
            SizedBox(height: 16.h),
            Text(
              label,
              style: TextStyle(
                fontSize: 18.sp,
                fontWeight: FontWeight.w500,
                color: Colors.grey.shade600,
              ),
            ),
            SizedBox(height: 8.h),
            Text(
              'اضغط الزر أسفل لإضافة موعد جديد',
              style: TextStyle(
                fontSize: 14.sp,
                color: Colors.grey.shade500,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  /// Appointments list
  Widget _buildList(BuildContext context) {
    return SmartRefresher(
      controller: controller.refreshController,
      enablePullDown: true,
      enablePullUp: true,
      onRefresh: controller.onRefresh,
      onLoading: controller.onLoadMore,
      header: WaterDropHeader(),
      footer: ClassicFooter(
        loadingText: TranslationsLoader.translate('loading'),
        noDataText: TranslationsLoader.translate('no_data'),
      ),
      child: ListView.builder(
        padding: EdgeInsets.all(16.w),
        itemCount: controller.currentList.length,
        itemBuilder: (context, index) {
          final appointment = controller.currentList[index];
          return FadeInUp(
            delay: Duration(milliseconds: 50 * index),
            child: _buildAppointmentCard(context, appointment),
          );
        },
      ),
    );
  }

  /// Appointment card
  Widget _buildAppointmentCard(BuildContext context, AppointmentModel appointment) {
    return Container(
      margin: EdgeInsets.only(bottom: 12.h),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: InkWell(
        onTap: () => controller.viewDetails(appointment),
        borderRadius: BorderRadius.circular(12.r),
        child: Padding(
          padding: EdgeInsets.all(16.w),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header: Service type + status
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      appointment.serviceTypeName ?? 'خدمة غير محدد',
                      style: TextStyle(
                        fontSize: 18.sp,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                  _buildStatusBadge(appointment.status),
                ],
              ),
              SizedBox(height: 12.h),
              // Center name
              Row(
                children: [
                  Icon(Icons.location_on, size: 18.sp, color: Colors.grey),
                  SizedBox(width: 4.w),
                  Expanded(
                    child: Text(
                      appointment.centerName ?? 'مركز غير محدد',
                      style: TextStyle(fontSize: 16.sp),
                    ),
                  ),
                ],
              ),
              SizedBox(height: 8.h),
              // Date
              Row(
                children: [
                  Icon(Icons.calendar_today, size: 18.sp, color: Colors.grey),
                  SizedBox(width: 4.w),
                  Text(
                    _formatDate(appointment.appointmentDate),
                    style: TextStyle(fontSize: 14.sp),
                  ),
                  SizedBox(width: 16.w),
                  // Time
                  Icon(Icons.access_time, size: 18.sp, color: Colors.grey),
                  SizedBox(width: 4.w),
                  Text(
                    appointment.appointmentTime ?? '',
                    style: TextStyle(fontSize: 14.sp),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Status badge
  Widget _buildStatusBadge(String? status) {
    Color color;
    String label;
    
    switch (status?.toUpperCase()) {
      case 'PENDING':
        color = Colors.orange;
        label = 'قيد الانتظار';
        break;
      case 'CONFIRMED':
        color = Colors.green;
        label = 'مؤكد';
        break;
      case 'COMPLETED':
        color = Colors.blue;
        label = 'مكتمل';
        break;
      case 'CANCELLED':
        color = Colors.red;
        label = 'ملغي';
        break;
      default:
        color = Colors.grey;
        label = status ?? '';
    }

    return Container(
      padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 4.h),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8.r),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 12.sp,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  /// Floating action button
  Widget _buildFAB(BuildContext context) {
    return FadeInUp(
      child: FloatingActionButton.extended(
        onPressed: () => controller.bookNewAppointment(),
        icon: Icon(Icons.add),
        label: Text('حجز جديد'),
        backgroundColor: AppColors.primary,
      ),
    );
  }

  /// Show help
  void _showHelp(BuildContext context) {
    VoiceHelper.showHelpDialog(
      titleKey: 'my_appointments',
      messageKey: 'appointments_list_help',
      voiceKey: 'appointments_list_voice_help',
    );
  }

  /// Format date
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

