import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:animate_do/animate_do.dart';

import '../../core/theme/app_colors.dart';
import 'splash_controller.dart';

class SplashView extends GetView<SplashController> {
  const SplashView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Logo with animation
            FadeIn(
              duration: const Duration(milliseconds: 1000),
              child: Container(
                width: 140.w,
                height: 140.w,
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
                      blurRadius: 30,
                      spreadRadius: 10,
                    ),
                  ],
                ),
                child: Icon(
                  Icons.favorite,
                  size: 70.sp,
                  color: Colors.white,
                ),
              ),
            ),

            SizedBox(height: 32.h),

            // App Name with animation
            FadeInUp(
              delay: const Duration(milliseconds: 500),
              child: Text(
                'Care',
                style: TextStyle(
                  fontSize: 48.sp,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                  letterSpacing: 3,
                ),
              ),
            ),

            SizedBox(height: 8.h),

            FadeInUp(
              delay: const Duration(milliseconds: 700),
              child: Text(
                'رعاية',
                style: TextStyle(
                  fontSize: 24.sp,
                  color: AppColors.textSecondary,
                ),
              ),
            ),

            SizedBox(height: 64.h),

            // Loading Indicator
            FadeInUp(
              delay: const Duration(milliseconds: 900),
              child: const CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
