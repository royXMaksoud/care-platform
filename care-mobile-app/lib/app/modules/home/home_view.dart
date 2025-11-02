import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:badges/badges.dart' as badges;
import 'package:animate_do/animate_do.dart';

import '../../core/theme/app_colors.dart';
import '../../widgets/voice_assistant_widget.dart';
import 'home_controller.dart';

class HomeView extends GetView<HomeController> {
  const HomeView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _buildAppBar(context),
      body: Stack(
        children: [
          _buildBody(context),

          // المساعد الصوتي (العصفور)
          Obx(() => controller.showAssistant.value
              ? const VoiceAssistantWidget()
              : const SizedBox.shrink()),
        ],
      ),
    );
  }

  PreferredSizeWidget _buildAppBar(BuildContext context) {
    return AppBar(
      title: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          // TODO: استبدل بالشعار الحقيقي
          Icon(
            Icons.favorite,
            color: AppColors.primary,
            size: 24.sp,
          ),
          SizedBox(width: 8.w),
          const Text('Care'),
        ],
      ),
      centerTitle: true,
      actions: [
        // تبديل اللغة
        FadeInDown(
          child: IconButton(
            icon: const Icon(Icons.language),
            onPressed: () => _showLanguageDialog(context),
          ),
        ),

        // الإشعارات مع Badge
        FadeInDown(
          delay: const Duration(milliseconds: 100),
          child: Obx(() {
            final notificationCount = controller.notificationCount.value;
            return badges.Badge(
              showBadge: notificationCount > 0,
              badgeContent: Text(
                notificationCount > 99 ? '99+' : notificationCount.toString(),
                style: const TextStyle(color: Colors.white, fontSize: 10),
              ),
              badgeStyle: const badges.BadgeStyle(
                badgeColor: Colors.red,
                padding: EdgeInsets.all(4),
              ),
              child: IconButton(
                icon: const Icon(Icons.notifications),
                onPressed: () => Get.toNamed('/notifications'),
              ),
            );
          }),
        ),

        // تسجيل الدخول / الملف الشخصي
        FadeInDown(
          delay: const Duration(milliseconds: 200),
          child: Obx(() {
            final isLoggedIn = controller.isLoggedIn.value;
            return PopupMenuButton<String>(
              icon: Icon(isLoggedIn ? Icons.account_circle : Icons.login),
              onSelected: (value) {
                if (value == 'login') {
                  Get.toNamed('/login');
                } else if (value == 'register') {
                  Get.toNamed('/register');
                } else if (value == 'profile') {
                  Get.toNamed('/profile');
                } else if (value == 'logout') {
                  controller.logout();
                }
              },
              itemBuilder: (context) {
                if (isLoggedIn) {
                  return [
                    const PopupMenuItem(
                      value: 'profile',
                      child: Row(
                        children: [
                          Icon(Icons.person),
                          SizedBox(width: 8),
                          Text('الملف الشخصي'),
                        ],
                      ),
                    ),
                    const PopupMenuItem(
                      value: 'logout',
                      child: Row(
                        children: [
                          Icon(Icons.logout),
                          SizedBox(width: 8),
                          Text('تسجيل الخروج'),
                        ],
                      ),
                    ),
                  ];
                } else {
                  return [
                    const PopupMenuItem(
                      value: 'login',
                      child: Row(
                        children: [
                          Icon(Icons.login),
                          SizedBox(width: 8),
                          Text('تسجيل الدخول'),
                        ],
                      ),
                    ),
                    const PopupMenuItem(
                      value: 'register',
                      child: Row(
                        children: [
                          Icon(Icons.person_add),
                          SizedBox(width: 8),
                          Text('إنشاء حساب'),
                        ],
                      ),
                    ),
                  ];
                }
              },
            );
          }),
        ),
      ],
    );
  }

  Widget _buildBody(BuildContext context) {
    return SingleChildScrollView(
      padding: EdgeInsets.all(16.w),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ترحيب
          FadeInDown(
            child: Text(
              'مرحباً بك',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
          ),

          SizedBox(height: 8.h),

          FadeInDown(
            delay: const Duration(milliseconds: 100),
            child: Text(
              'كيف يمكنني مساعدتك؟',
              style: Theme.of(context).textTheme.bodyLarge,
            ),
          ),

          SizedBox(height: 24.h),

          // الخدمات
          Text(
            'الخدمات',
            style: Theme.of(context).textTheme.titleLarge,
          ),

          SizedBox(height: 16.h),

          _buildServicesGrid(context),
        ],
      ),
    );
  }

  Widget _buildServicesGrid(BuildContext context) {
    final services = [
      ServiceItem(
        title: 'المواعيد',
        icon: Icons.calendar_today,
        color: AppColors.primary,
        onTap: () => Get.snackbar('قريباً', 'هذه الخدمة قيد التطوير'),
      ),
      ServiceItem(
        title: 'الخدمات المالية',
        icon: Icons.account_balance_wallet,
        color: AppColors.success,
        onTap: () => Get.snackbar('قريباً', 'هذه الخدمة قيد التطوير'),
      ),
      ServiceItem(
        title: 'المحادثة الصوتية',
        icon: Icons.phone_in_talk,
        color: AppColors.info,
        onTap: () => Get.snackbar('قريباً', 'هذه الخدمة قيد التطوير'),
      ),
      ServiceItem(
        title: 'استعلام',
        icon: Icons.search,
        color: AppColors.warning,
        onTap: () => Get.snackbar('قريباً', 'هذه الخدمة قيد التطوير'),
      ),
      ServiceItem(
        title: 'الشكاوي',
        icon: Icons.report_problem,
        color: AppColors.error,
        onTap: () => Get.snackbar('قريباً', 'هذه الخدمة قيد التطوير'),
      ),
      ServiceItem(
        title: 'الرسائل',
        icon: Icons.message,
        color: AppColors.secondary,
        onTap: () => Get.snackbar('قريباً', 'هذه الخدمة قيد التطوير'),
      ),
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 16.w,
        mainAxisSpacing: 16.h,
        childAspectRatio: 1.1,
      ),
      itemCount: services.length,
      itemBuilder: (context, index) {
        return FadeInUp(
          delay: Duration(milliseconds: 100 * index),
          child: _buildServiceCard(context, services[index]),
        );
      },
    );
  }

  Widget _buildServiceCard(BuildContext context, ServiceItem service) {
    return Card(
      elevation: 3,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16.r),
      ),
      child: InkWell(
        onTap: service.onTap,
        borderRadius: BorderRadius.circular(16.r),
        child: Container(
          padding: EdgeInsets.all(16.w),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16.r),
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                service.color.withOpacity(0.1),
                service.color.withOpacity(0.05),
              ],
            ),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: EdgeInsets.all(16.w),
                decoration: BoxDecoration(
                  color: service.color.withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  service.icon,
                  size: 40.sp,
                  color: service.color,
                ),
              ),
              SizedBox(height: 12.h),
              Text(
                service.title,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showLanguageDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('تغيير اللغة'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.language),
              title: const Text('العربية'),
              onTap: () {
                Get.updateLocale(const Locale('ar', 'SA'));
                Get.back();
              },
            ),
            ListTile(
              leading: const Icon(Icons.language),
              title: const Text('English'),
              onTap: () {
                Get.updateLocale(const Locale('en', 'US'));
                Get.back();
              },
            ),
          ],
        ),
      ),
    );
  }
}

class ServiceItem {
  final String title;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  ServiceItem({
    required this.title,
    required this.icon,
    required this.color,
    required this.onTap,
  });
}
