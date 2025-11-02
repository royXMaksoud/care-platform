import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:animate_do/animate_do.dart';

import '../../core/theme/app_colors.dart';
import '../../core/utils/voice_helper.dart';
import '../../core/i18n/translations_loader.dart';
import 'appointment_search_controller.dart';

/// Appointment Search View
/// 
/// Simple, clean UI designed for elderly and children
/// - Large buttons
/// - Clear instructions
/// - Voice help available
/// - Error handling with user-friendly messages
class AppointmentSearchView extends GetView<AppointmentSearchController> {
  const AppointmentSearchView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _buildAppBar(context),
      body: SafeArea(
        child: _buildBody(context),
      ),
    );
  }

  PreferredSizeWidget _buildAppBar(BuildContext context) {
    return AppBar(
      title: FadeInDown(
        child: Row(
          children: [
            Icon(Icons.search, color: AppColors.primary),
            SizedBox(width: 8.w),
            Text(TranslationsLoader.translate('appointment_search_title')),
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

  Widget _buildBody(BuildContext context) {
    return Obx(() {
      if (controller.isLoading.value && controller.serviceTypes.isEmpty) {
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

      return SingleChildScrollView(
        padding: EdgeInsets.all(16.w),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHelpBanner(context),
            SizedBox(height: 24.h),
            _buildServiceTypeSelector(context),
            SizedBox(height: 24.h),
            _buildSearchButton(context),
            SizedBox(height: 32.h),
            _buildResults(context),
          ],
        ),
      );
    });
  }

  /// Help banner with instructions
  Widget _buildHelpBanner(BuildContext context) {
    return FadeInDown(
      delay: Duration(milliseconds: 100),
      child: Container(
        padding: EdgeInsets.all(16.w),
        decoration: BoxDecoration(
          color: Colors.blue.shade50,
          borderRadius: BorderRadius.circular(12.r),
          border: Border.all(color: Colors.blue.shade200),
        ),
        child: Row(
          children: [
            Icon(Icons.info_outline, color: Colors.blue.shade700, size: 32.sp),
            SizedBox(width: 12.w),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    TranslationsLoader.translate('appointment_search_help'),
                    style: TextStyle(
                      fontSize: 14.sp,
                      fontWeight: FontWeight.w500,
                      color: Colors.blue.shade900,
                    ),
                  ),
                  SizedBox(height: 4.h),
                  Text(
                    TranslationsLoader.translate('appointment_voice_help'),
                    style: TextStyle(
                      fontSize: 12.sp,
                      color: Colors.blue.shade700,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Service type selector - Large, simple dropdown
  Widget _buildServiceTypeSelector(BuildContext context) {
    return FadeInDown(
      delay: Duration(milliseconds: 200),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.medical_services_outlined, color: AppColors.primary, size: 24.sp),
              SizedBox(width: 8.w),
              Text(
                TranslationsLoader.translate('service_type_selection'),
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
            ],
          ),
          SizedBox(height: 12.h),
          Obx(() {
            // Show retry message if services are empty and not loading
            if (!controller.isLoading.value && controller.serviceTypes.isEmpty) {
              return Container(
                width: double.infinity,
                padding: EdgeInsets.all(16.w),
                decoration: BoxDecoration(
                  color: Colors.orange.shade50,
                  borderRadius: BorderRadius.circular(12.r),
                  border: Border.all(color: Colors.orange.shade200, width: 2),
                ),
                child: Column(
                  children: [
                    Icon(Icons.warning, color: Colors.orange.shade700, size: 32.sp),
                    SizedBox(height: 8.h),
                    Text(
                      TranslationsLoader.translate('no_services_available'),
                      style: TextStyle(
                        fontSize: 14.sp,
                        color: Colors.orange.shade900,
                        fontWeight: FontWeight.w500,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    SizedBox(height: 12.h),
                    ElevatedButton.icon(
                      onPressed: controller.isLoading.value ? null : () => controller.retryLoadServiceTypes(),
                      icon: Icon(Icons.refresh, size: 20.sp),
                      label: Text(TranslationsLoader.translate('retry_loading_services')),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.orange.shade600,
                        foregroundColor: Colors.white,
                        padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 8.h),
                      ),
                    ),
                  ],
                ),
              );
            }

            final selected = controller.selectedServiceType.value;
            return Container(
              width: double.infinity,
              padding: EdgeInsets.symmetric(horizontal: 16.w),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey.shade300, width: 2),
                borderRadius: BorderRadius.circular(12.r),
                color: selected != null ? Colors.green.shade50 : Colors.white,
              ),
              child: DropdownButton<dynamic>(
                value: selected,
                isExpanded: true,
                underline: SizedBox(),
                hint: Text(
                  TranslationsLoader.translate('select_service'),
                  style: TextStyle(color: Colors.grey.shade600),
                ),
                items: controller.serviceTypes.map((type) {
                  return DropdownMenuItem(
                    value: type,
                    child: Text(
                      Get.locale?.languageCode == 'ar' ? type.nameAr ?? type.name ?? '' : type.name ?? '',
                      style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w500),
                    ),
                  );
                }).toList(),
                onChanged: (value) {
                  controller.selectedServiceType.value = value;
                },
              ),
            );
          }),
        ],
      ),
    );
  }

  /// Search button - Large, clear, with icon
  Widget _buildSearchButton(BuildContext context) {
    return Obx(() {
      final canSearch = controller.selectedServiceType.value != null &&
                       controller.userLatitude.value != null &&
                       controller.userLongitude.value != null;
      
      return FadeInUp(
        delay: Duration(milliseconds: 300),
        child: SizedBox(
          width: double.infinity,
          height: 56.h,
          child: ElevatedButton.icon(
            onPressed: canSearch && !controller.isLoading.value
                ? () => controller.searchAppointments()
                : null,
            icon: controller.isLoading.value
                ? SizedBox(
                    width: 20.w,
                    height: 20.w,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : Icon(Icons.search, size: 28.sp),
            label: Text(
              TranslationsLoader.translate('search_appointments'),
              style: TextStyle(fontSize: 18.sp, fontWeight: FontWeight.bold),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              elevation: 4,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12.r),
              ),
            ),
          ),
        ),
      );
    });
  }

  /// Search results
  Widget _buildResults(BuildContext context) {
    return Obx(() {
      if (controller.searchResults.isEmpty) {
        return SizedBox.shrink();
      }

      return FadeInUp(
        delay: Duration(milliseconds: 400),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${controller.searchResults.length} ${TranslationsLoader.translate("centers_loaded")}',
              style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 16.h),
            ...controller.searchResults.map((suggestion) => 
              _buildCenterCard(context, suggestion)
            ),
          ],
        ),
      );
    });
  }

  /// Center card - Large, simple design
  Widget _buildCenterCard(BuildContext context, dynamic suggestion) {
    final center = suggestion.center;
    return Container(
      margin: EdgeInsets.only(bottom: 12.h),
      padding: EdgeInsets.all(16.w),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Center name
          Row(
            children: [
              Icon(Icons.location_on, color: AppColors.primary, size: 24.sp),
              SizedBox(width: 8.w),
              Expanded(
                child: Text(
                  Get.locale?.languageCode == 'ar' ? center?.nameAr ?? center?.name ?? '' : center?.name ?? '',
                  style: TextStyle(
                    fontSize: 18.sp,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: 12.h),
          // Distance
          if (suggestion.distance != null)
            Row(
              children: [
                Icon(Icons.straighten, size: 16.sp, color: Colors.grey),
                SizedBox(width: 4.w),
                Text(
                  '${suggestion.distance!.toStringAsFixed(1)} km',
                  style: TextStyle(fontSize: 14.sp),
                ),
              ],
            ),
          SizedBox(height: 16.h),
          // Book button
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () => controller.selectCenter(center),
              icon: Icon(Icons.calendar_today, size: 20.sp),
              label: Text(
                TranslationsLoader.translate('select_center'),
                style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.bold),
              ),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.primary,
                side: BorderSide(color: AppColors.primary, width: 2),
                padding: EdgeInsets.symmetric(vertical: 12.h),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8.r),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Show help dialog
  void _showHelp(BuildContext context) {
    VoiceHelper.showHelpDialog(
      titleKey: 'appointment_search_title',
      messageKey: 'appointment_search_help',
      voiceKey: 'appointment_voice_help',
    );
  }
}

