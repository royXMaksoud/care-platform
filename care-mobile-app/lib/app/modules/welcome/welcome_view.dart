import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:animate_do/animate_do.dart';

import '../../core/theme/app_colors.dart';
import 'welcome_controller.dart';

class WelcomeView extends GetView<WelcomeController> {
  const WelcomeView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: 24.w, vertical: 32.h),
          child: Column(
            children: [
              // Skip button
              Align(
                alignment: Alignment.topLeft,
                child: FadeInDown(
                  child: TextButton(
                    onPressed: controller.skipAndDisable,
                    child: const Text(
                      'تخطي وعدم إظهار مرة أخرى',
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ),
              ),

              SizedBox(height: 20.h),

              // Logo and App Name
              FadeInDown(
                delay: const Duration(milliseconds: 200),
                child: Column(
                  children: [
                    // TODO: استبدل هذه الأيقونة بالشعار الحقيقي
                    Container(
                      width: 120.w,
                      height: 120.w,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [
                            AppColors.primary,
                            AppColors.secondary,
                          ],
                        ),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withOpacity(0.3),
                            blurRadius: 20,
                            spreadRadius: 5,
                          ),
                        ],
                      ),
                      child: Icon(
                        Icons.favorite,
                        size: 60.sp,
                        color: Colors.white,
                      ),
                    ),

                    SizedBox(height: 24.h),

                    // App Name
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'Care',
                          style: TextStyle(
                            fontSize: 42.sp,
                            fontWeight: FontWeight.bold,
                            color: AppColors.primary,
                            letterSpacing: 2,
                          ),
                        ),
                        SizedBox(width: 12.w),
                        // Placeholder for logo image
                        // Image.asset('assets/images/logo.png', height: 40.h),
                      ],
                    ),
                  ],
                ),
              ),

              SizedBox(height: 40.h),

              // Welcome Text
              FadeInUp(
                delay: const Duration(milliseconds: 400),
                child: Text(
                  'مرحباً بك في رعاية',
                  style: TextStyle(
                    fontSize: 28.sp,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),

              SizedBox(height: 16.h),

              // Description
              FadeInUp(
                delay: const Duration(milliseconds: 600),
                child: Text(
                  'منصة تسهّل وصولك إلى الخدمات الصحية، التعليمية، والمالية، وتخبرك بمواعيد المساعدات والمراكز القريبة منك.',
                  style: TextStyle(
                    fontSize: 16.sp,
                    color: AppColors.textSecondary,
                    height: 1.6,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),

              SizedBox(height: 40.h),

              // Service Icons
              FadeInUp(
                delay: const Duration(milliseconds: 800),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _buildServiceIcon(
                      icon: Icons.medical_services,
                      label: 'الخدمات\nالصحية',
                      color: AppColors.primary,
                    ),
                    _buildServiceIcon(
                      icon: Icons.school,
                      label: 'الخدمات\nالتعليمية',
                      color: AppColors.success,
                    ),
                    _buildServiceIcon(
                      icon: Icons.account_balance_wallet,
                      label: 'المساعدات\nالمالية',
                      color: AppColors.warning,
                    ),
                  ],
                ),
              ),

              SizedBox(height: 40.h),

              // Voice Assistant Bird
              FadeInUp(
                delay: const Duration(milliseconds: 1000),
                child: Obx(() => GestureDetector(
                      onTap: controller.speakWelcome,
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        width: 100.w,
                        height: 100.w,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: controller.isBirdAnimating.value
                                ? [
                                    const Color(0xFF4A90E2),
                                    const Color(0xFF50E3C2),
                                    const Color(0xFFFF6B9D),
                                  ]
                                : [
                                    AppColors.primary,
                                    AppColors.secondary,
                                  ],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: controller.isBirdAnimating.value
                                  ? AppColors.secondary.withOpacity(0.6)
                                  : AppColors.primary.withOpacity(0.3),
                              blurRadius:
                                  controller.isBirdAnimating.value ? 30 : 20,
                              spreadRadius:
                                  controller.isBirdAnimating.value ? 8 : 5,
                            ),
                          ],
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              controller.isBirdAnimating.value
                                  ? Icons.record_voice_over
                                  : Icons.smart_toy_outlined,
                              size: controller.isBirdAnimating.value
                                  ? 45.sp
                                  : 40.sp,
                              color: Colors.white,
                            ),
                            if (!controller.isBirdAnimating.value)
                              Text(
                                '🐦',
                                style: TextStyle(fontSize: 24.sp),
                              ),
                          ],
                        ),
                      ),
                    )),
              ),

              SizedBox(height: 12.h),

              // Hint Text
              FadeInUp(
                delay: const Duration(milliseconds: 1100),
                child: Text(
                  'اضغط على العصفور للمساعدة',
                  style: TextStyle(
                    fontSize: 14.sp,
                    color: AppColors.textSecondary,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),

              const Spacer(),

              // Start Button
              FadeInUp(
                delay: const Duration(milliseconds: 1000),
                child: SizedBox(
                  width: double.infinity,
                  height: 56.h,
                  child: ElevatedButton(
                    onPressed: controller.startApp,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16.r),
                      ),
                      elevation: 4,
                      shadowColor: AppColors.primary.withOpacity(0.4),
                    ),
                    child: Text(
                      'ابدأ الآن',
                      style: TextStyle(
                        fontSize: 18.sp,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ),

              SizedBox(height: 16.h),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildServiceIcon({
    required IconData icon,
    required String label,
    required Color color,
  }) {
    return Column(
      children: [
        Container(
          width: 70.w,
          height: 70.w,
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(20.r),
          ),
          child: Icon(
            icon,
            size: 36.sp,
            color: color,
          ),
        ),
        SizedBox(height: 8.h),
        Text(
          label,
          style: TextStyle(
            fontSize: 12.sp,
            color: AppColors.textSecondary,
            height: 1.3,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}
