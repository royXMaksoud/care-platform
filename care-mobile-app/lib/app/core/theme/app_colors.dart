import 'package:flutter/material.dart';

class AppColors {
  // Primary Colors
  static const Color primary = Color(0xFF1976D2); // أزرق جميل
  static const Color primaryDark = Color(0xFF004BA0);
  static const Color primaryLight = Color(0xFF63A4FF);

  // Secondary Colors
  static const Color secondary = Color(0xFF00897B); // أخضر مائي
  static const Color secondaryDark = Color(0xFF005B4F);
  static const Color secondaryLight = Color(0xFF4EBAAA);

  // Status Colors
  static const Color success = Color(0xFF4CAF50);
  static const Color warning = Color(0xFFFFA000);
  static const Color error = Color(0xFFE53935);
  static const Color info = Color(0xFF2196F3);

  // Background Colors
  static const Color background = Color(0xFFF5F5F5);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color card = Color(0xFFFFFFFF);

  // Text Colors
  static const Color textPrimary = Color(0xFF212121);
  static const Color textSecondary = Color(0xFF757575);
  static const Color textHint = Color(0xFF9E9E9E);
  static const Color textDisabled = Color(0xFFBDBDBD);

  // Border & Divider
  static const Color border = Color(0xFFE0E0E0);
  static const Color divider = Color(0xFFBDBDBD);

  // Overlay
  static const Color overlay = Color(0x33000000);
  static const Color shadow = Color(0x1A000000);

  // Gradient Colors
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [primary, primaryLight],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient secondaryGradient = LinearGradient(
    colors: [secondary, secondaryLight],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Social Colors
  static const Color google = Color(0xFFDB4437);
  static const Color facebook = Color(0xFF4267B2);
  static const Color twitter = Color(0xFF1DA1F2);

  // Service Type Colors (للخدمات الطبية)
  static const Color hospital = Color(0xFFE53935);
  static const Color clinic = Color(0xFF1E88E5);
  static const Color pharmacy = Color(0xFF43A047);
  static const Color laboratory = Color(0xFF8E24AA);
  static const Color radiology = Color(0xFFFB8C00);
  static const Color emergency = Color(0xFFD32F2F);
}
