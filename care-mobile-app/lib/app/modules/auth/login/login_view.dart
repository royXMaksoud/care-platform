import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/i18n/translations_loader.dart';
import 'login_controller.dart';

class LoginView extends GetView<LoginController> {
  const LoginView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('تسجيل الدخول'),
        centerTitle: true,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.all(20.w),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              SizedBox(height: 30.h),
              _buildHeader(),
              SizedBox(height: 40.h),
              _buildForm(context),
              SizedBox(height: 30.h),
              _buildLoginButton(),
              SizedBox(height: 20.h),
              _buildErrorMessage(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      children: [
        Icon(
          Icons.person,
          size: 80.sp,
          color: AppColors.primary,
        ),
        SizedBox(height: 16.h),
        Text(
          'أدخل بيانات التحقق',
          style: TextStyle(
            fontSize: 24.sp,
            fontWeight: FontWeight.bold,
            color: Colors.black87,
          ),
          textAlign: TextAlign.center,
        ),
        SizedBox(height: 8.h),
        Text(
          'رقم الهاتف وتاريخ الميلاد',
          style: TextStyle(
            fontSize: 16.sp,
            color: Colors.grey,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildForm(BuildContext context) {
    return Column(
      children: [
        // Mobile Number Field
        TextField(
          controller: controller.mobileController,
          keyboardType: TextInputType.phone,
          maxLength: 10,
          decoration: InputDecoration(
            labelText: 'رقم الهاتف',
            hintText: '07XXXXXXXXX',
            prefixIcon: const Icon(Icons.phone),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12.r),
            ),
            counterText: '',
          ),
          style: TextStyle(fontSize: 18.sp),
        ),
        SizedBox(height: 20.h),

        // Date of Birth Field
        GestureDetector(
          onTap: () => _selectDate(context),
          child: TextField(
            controller: controller.dobController,
            enabled: false,
            decoration: InputDecoration(
              labelText: 'تاريخ الميلاد',
              hintText: 'yyyy-MM-dd',
              prefixIcon: const Icon(Icons.calendar_today),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12.r),
              ),
            ),
            style: TextStyle(fontSize: 18.sp),
          ),
        ),
        SizedBox(height: 20.h),

        // Info box
        Container(
          padding: EdgeInsets.all(12.w),
          decoration: BoxDecoration(
            color: Colors.blue.shade50,
            borderRadius: BorderRadius.circular(8.r),
            border: Border.all(color: Colors.blue.shade200),
          ),
          child: Row(
            children: [
              Icon(Icons.info, color: Colors.blue.shade700),
              SizedBox(width: 12.w),
              Expanded(
                child: Text(
                  'استخدم نفس البيانات المسجلة لديك',
                  style: TextStyle(
                    fontSize: 14.sp,
                    color: Colors.blue.shade700,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildLoginButton() {
    return Obx(() => ElevatedButton(
      onPressed: controller.isLoading.value
          ? null
          : () => controller.verifyBeneficiary(),
      style: ElevatedButton.styleFrom(
        padding: EdgeInsets.symmetric(vertical: 16.h),
        backgroundColor: AppColors.primary,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12.r),
        ),
      ),
      child: controller.isLoading.value
          ? SizedBox(
        height: 24.h,
        width: 24.w,
        child: const CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
          strokeWidth: 2,
        ),
      )
          : Text(
        'دخول',
        style: TextStyle(
          fontSize: 18.sp,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
      ),
    ));
  }

  Widget _buildErrorMessage() {
    return Obx(() => controller.errorMessage.value.isEmpty
        ? const SizedBox.shrink()
        : Container(
      padding: EdgeInsets.all(12.w),
      decoration: BoxDecoration(
        color: Colors.red.shade50,
        borderRadius: BorderRadius.circular(8.r),
        border: Border.all(color: Colors.red.shade200),
      ),
      child: Row(
        children: [
          Icon(Icons.error, color: Colors.red.shade700),
          SizedBox(width: 12.w),
          Expanded(
            child: Text(
              controller.errorMessage.value,
              style: TextStyle(
                fontSize: 14.sp,
                color: Colors.red.shade700,
              ),
            ),
          ),
        ],
      ),
    ));
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime(2000),
      firstDate: DateTime(1930),
      lastDate: DateTime.now(),
    );

    if (picked != null) {
      controller.dobController.text = controller.formatDate(picked);
    }
  }
}

