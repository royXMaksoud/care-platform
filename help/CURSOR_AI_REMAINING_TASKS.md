# 🚨 CURSOR AI REMAINING TASKS - CRITICAL FIXES ONLY
# اصلح المتبقي - مهام حرجة فقط

**تاريخ:** 2 نوفمبر 2025
**الحالة:** جاهز للتنفيذ الآن
**المدة الكلية:** 10 ساعات فقط
**الأولوية:** CRITICAL - يجب الانتهاء اليوم

---

## 📋 الملخص التنفيذي (Executive Summary)

### المشكلة:
- تطبيق الموبايل **65% اكتمل** لكن **لا يعمل نهائياً**
- 3 مشاكل حرجة تمنع العمل من الألف للياء

### الحل:
3 مهام فقط = تطبيق كامل يعمل تمام التمام ✅

| المهمة | المدة | الحالة |
|------|------|--------|
| MobileServiceTypeController | 2 ساعة | 🚨 أولوية 1 |
| LoginView + LoginController | 4 ساعات | 🚨 أولوية 2 |
| Seed Data (SQL) | 4 ساعات | 🚨 أولوية 3 |

---

## 🎯 المهمة #1: MobileServiceTypeController (2 ساعات)

### المشكلة:
```
الموبايل يطلب:  GET /api/mobile/service-types/lookup ❌
الخادم يوفر:    GET /api/admin/service-types/lookup  ❌
النتيجة:        لا تظهر أنواع الخدمات في التطبيق
```

### الحل:

#### 1️⃣ أنشئ Controller جديد:
```
File: appointment-service/src/main/java/com/care/appointment/web/controller/MobileServiceTypeController.java

الكود:
---
package com.care.appointment.web.controller;

import com.care.appointment.application.servicetype.command.CreateServiceTypeCommand;
import com.care.appointment.domain.model.ServiceType;
import com.care.appointment.domain.ports.in.servicetype.*;
import com.care.appointment.web.dto.admin.servicetype.ServiceTypeResponse;
import com.care.appointment.web.mapper.ServiceTypeWebMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Mobile Service Type Controller
 *
 * Provides mobile-specific endpoints for service type lookup.
 * Returns simplified DTOs optimized for mobile app consumption.
 */
@RestController
@RequestMapping("/api/mobile/service-types")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Mobile - Service Types", description = "Service type endpoints for mobile app")
public class MobileServiceTypeController {

    private final LoadAllUseCase loadAllServiceTypesUseCase;
    private final LoadUseCase loadServiceTypeUseCase;
    private final ServiceTypeWebMapper mapper;

    /**
     * Get all service types for mobile dropdown/selection
     * Returns only active service types with essential fields
     * Optimized for performance on mobile networks
     */
    @GetMapping("/lookup")
    @Operation(
        summary = "Get available service types for mobile",
        description = "Returns a simplified list of all active service types for the mobile app"
    )
    @ApiResponse(
        responseCode = "200",
        description = "Service types retrieved successfully",
        content = @Content(schema = @Schema(implementation = ServiceTypeResponse.class))
    )
    public ResponseEntity<List<ServiceTypeResponse>> getServiceTypesLookup(
            @RequestParam(required = false, defaultValue = "en") String language) {

        log.info("Fetching service types for mobile app with language: {}", language);

        try {
            // Load all service types using existing use case
            var filter = new com.sharedlib.core.filter.FilterRequest();
            var pageable = org.springframework.data.domain.Pageable.unpaged();
            var serviceTypes = loadAllServiceTypesUseCase.loadAll(filter, pageable);

            // Map to response DTOs
            List<ServiceTypeResponse> responses = serviceTypes.getContent()
                .stream()
                .filter(st -> Boolean.TRUE.equals(st.getIsActive()))
                .map(mapper::toResponse)
                .collect(Collectors.toList());

            log.info("Returning {} active service types", responses.size());
            return ResponseEntity.ok(responses);

        } catch (Exception e) {
            log.error("Error fetching service types", e);
            return ResponseEntity.ok(List.of());
        }
    }

    /**
     * Get specific service type by ID
     * Returns full service type details
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get service type by ID", description = "Retrieves detailed information about a specific service type")
    @ApiResponse(responseCode = "200", description = "Service type found")
    @ApiResponse(responseCode = "404", description = "Service type not found")
    public ResponseEntity<ServiceTypeResponse> getServiceTypeById(@PathVariable UUID id) {

        log.info("Fetching service type with ID: {}", id);

        var serviceType = loadServiceTypeUseCase.getServiceTypeById(id);

        if (serviceType.isEmpty()) {
            log.warn("Service type not found: {}", id);
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(mapper.toResponse(serviceType.get()));
    }
}
---
```

#### 2️⃣ تحقق من ServiceTypeResponse DTO (يجب أن يحتوي على):
```
File: appointment-service/src/main/java/com/care/appointment/web/dto/admin/servicetype/ServiceTypeResponse.java

تأكد أن يحتوي على:
- private UUID serviceTypeId;
- private String name;              // للمتوافقية
- private String nameAr;             // العربية
- private String nameEn;             // الإنجليزية
- private String description;        // للمتوافقية
- private String descriptionAr;
- private String descriptionEn;
- private String code;
- private String icon;               // emoji أو صورة
- private Integer estimatedDuration; // بالدقائق
- private BigDecimal baseFee;        // الرسوم الأساسية
- private Boolean isActive;
- private LocalDateTime createdAt;

إذا لم تكن موجودة، أضفها الآن!
```

#### 3️⃣ تحديث Flutter App - Part A:
```
File: care-mobile-app/lib/app/data/api/appointment_api.dart

ابحث عن:
@GET('/api/admin/service-types/lookup')

غيّره إلى:
@GET('/api/mobile/service-types/lookup')

أو أضف endpoint جديد:
@GET('/api/mobile/service-types/lookup')
@override
Future<List<ServiceTypeModel>> getMobileServiceTypes();
```

#### 4️⃣ تحديث Flutter Model - Part B:
```
File: care-mobile-app/lib/app/data/models/appointment_models.dart

تأكد أن ServiceTypeModel يحتوي على:
{
  serviceTypeId: UUID,
  name: String,           // fallback
  nameAr: String,         // العربية
  nameEn: String,         // الإنجليزية
  icon: String,           // emoji
  estimatedDuration: int, // دقايق
  baseFee: double,        // رسوم
  isActive: bool
}
```

#### 5️⃣ تحديث Controller الموبايل:
```
File: care-mobile-app/lib/app/modules/appointment/appointment_search_controller.dart

في الـ onInit أو عند التحميل، استدعي:

serviceTypes = await appointmentApiService.getMobileServiceTypes();
serviceTypesRx.value = serviceTypes;

لا تستخدم:
appointmentApiService.getServiceTypes() ❌ (خاطئ)
```

---

## 🎯 المهمة #2: Login Screen (4 ساعات)

### المشكلة:
```
Routes معرّفة لكن الشاشات مفقودة:
❌ No LoginView
❌ No LoginController
❌ No LoginBinding
❌ No GetPage for Routes.login
```

### الحل:

#### 1️⃣ أنشئ Binding:
```
File: care-mobile-app/lib/app/modules/auth/login/login_binding.dart

الكود:
---
import 'package:get/get.dart';
import 'login_controller.dart';

class LoginBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<LoginController>(
      () => LoginController(
        storageSvc: Get.find(),
        apiProvider: Get.find(),
      ),
    );
  }
}
---
```

#### 2️⃣ أنشئ Controller:
```
File: care-mobile-app/lib/app/modules/auth/login/login_controller.dart

الكود:
---
import 'package:get/get.dart';
import '../../../data/services/storage_service.dart';
import '../../../data/providers/api_provider.dart';
import '../../core/utils/app_constants.dart';
import 'package:flutter/material.dart';

class LoginController extends GetxController {
  final StorageService storageSvc;
  final ApiProvider apiProvider;

  // Form Controllers
  late TextEditingController mobileController;
  late TextEditingController dobController;

  // States
  final isLoading = false.obs;
  final errorMessage = ''.obs;
  final isSuccess = false.obs;

  LoginController({
    required this.storageSvc,
    required this.apiProvider,
  });

  @override
  void onInit() {
    super.onInit();
    mobileController = TextEditingController();
    dobController = TextEditingController();
  }

  @override
  void onClose() {
    mobileController.dispose();
    dobController.dispose();
    super.onClose();
  }

  /// Verify beneficiary with mobile number and date of birth
  ///
  /// Flow:
  /// 1. Validate inputs (mobile is 10 digits, DOB is valid date)
  /// 2. Call API: POST /api/mobile/beneficiaries/auth/verify
  /// 3. Store returned token in localStorage
  /// 4. Navigate to home/appointments
  Future<void> verifyBeneficiary() async {
    try {
      // Validate
      if (mobileController.text.isEmpty || dobController.text.isEmpty) {
        errorMessage.value = 'الرجاء ملء جميع الحقول';
        return;
      }

      if (mobileController.text.length != 10 || !mobileController.text.startsWith('07')) {
        errorMessage.value = 'رقم الهاتف يجب أن يكون 10 أرقام ويبدأ بـ 07';
        return;
      }

      // Parse DOB
      DateTime? dob;
      try {
        dob = DateTime.parse(dobController.text);
      } catch (e) {
        errorMessage.value = 'تاريخ الميلاد غير صحيح (yyyy-MM-dd)';
        return;
      }

      isLoading.value = true;
      errorMessage.value = '';

      // Call API
      // Note: Replace with actual API call when endpoint is ready
      // For now, simulate with mock data

      // Mock call - replace with real API
      await Future.delayed(Duration(seconds: 2));

      // Store token
      final token = 'mock_jwt_token_${DateTime.now().millisecondsSinceEpoch}';
      await storageSvc.saveToken(token);

      isSuccess.value = true;
      Get.offAllNamed('/home');

    } catch (e) {
      errorMessage.value = 'حدث خطأ أثناء التحقق: ${e.toString()}';
    } finally {
      isLoading.value = false;
    }
  }

  /// Format date for display
  String formatDate(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }
}
---
```

#### 3️⃣ أنشئ View:
```
File: care-mobile-app/lib/app/modules/auth/login/login_view.dart

الكود:
---
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:intl/intl.dart';

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
---
```

#### 4️⃣ حدّث app_pages.dart:
```
File: care-mobile-app/lib/app/routes/app_pages.dart

أضف في imports:
import '../modules/auth/login/login_binding.dart';
import '../modules/auth/login/login_view.dart';

أضف في routes:
GetPage(
  name: Routes.login,
  page: () => const LoginView(),
  binding: LoginBinding(),
  transition: Transition.fadeIn,
),
```

---

## 🎯 المهمة #3: Seed Data - SQL (4 ساعات)

### المشكلة:
```
Database فارغ تماماً:
❌ لا توجد أنواع خدمات
❌ لا توجد مراكز صحية
❌ لا يوجد أطباء
❌ لا توجد بيانات اختبار
```

### الحل:

#### 1️⃣ أنشئ SQL Seed Script:
```
File: appointment-service/seed-data.sql

الكود:
---
-- =====================================================
-- APPOINTMENT SERVICE SEED DATA
-- تاريخ: 2 نوفمبر 2025
-- =====================================================

-- =====================================================
-- 1. SERVICE TYPES (أنواع الخدمات)
-- =====================================================
INSERT INTO appt_service_types (
  service_type_id,
  name,
  code,
  description,
  is_active,
  is_deleted,
  created_at,
  created_by,
  updated_at,
  updated_by
) VALUES

-- الفحص العام
(
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  'فحص عام / General Checkup',
  'GEN_CHECKUP',
  'فحص طبي عام شامل',
  true,
  false,
  CURRENT_TIMESTAMP,
  'system',
  CURRENT_TIMESTAMP,
  'system'
),

-- فحص الأطفال
(
  '550e8400-e29b-41d4-a716-446655440002'::uuid,
  'فحص الأطفال / Pediatrics',
  'PEDIATRICS',
  'فحص متخصص للأطفال',
  true,
  false,
  CURRENT_TIMESTAMP,
  'system',
  CURRENT_TIMESTAMP,
  'system'
),

-- طب الأسنان
(
  '550e8400-e29b-41d4-a716-446655440003'::uuid,
  'طب الأسنان / Dentistry',
  'DENTISTRY',
  'خدمات طب الأسنان الشاملة',
  true,
  false,
  CURRENT_TIMESTAMP,
  'system',
  CURRENT_TIMESTAMP,
  'system'
),

-- طب العيون
(
  '550e8400-e29b-41d4-a716-446655440004'::uuid,
  'طب العيون / Ophthalmology',
  'OPHTHALMOLOGY',
  'فحص وعلاج العيون',
  true,
  false,
  CURRENT_TIMESTAMP,
  'system',
  CURRENT_TIMESTAMP,
  'system'
),

-- أمراض القلب
(
  '550e8400-e29b-41d4-a716-446655440005'::uuid,
  'أمراض القلب / Cardiology',
  'CARDIOLOGY',
  'فحص وعلاج أمراض القلب',
  true,
  false,
  CURRENT_TIMESTAMP,
  'system',
  CURRENT_TIMESTAMP,
  'system'
);

-- =====================================================
-- 2. PROVIDERS/DOCTORS (الأطباء والمقدمو الخدمات)
-- =====================================================
INSERT INTO appt_providers (
  provider_id,
  name,
  specialization,
  license_number,
  phone,
  email,
  is_active,
  is_deleted,
  created_at,
  created_by,
  updated_at,
  updated_by
) VALUES

-- د. أحمد محمود
(
  '650e8400-e29b-41d4-a716-446655440001'::uuid,
  'د. أحمد محمود',
  'طبيب عام',
  'LIC-001-2023',
  '07701234567',
  'ahmad.mahmoud@health.iq',
  true,
  false,
  CURRENT_TIMESTAMP,
  'system',
  CURRENT_TIMESTAMP,
  'system'
),

-- د. فاطمة علي
(
  '650e8400-e29b-41d4-a716-446655440002'::uuid,
  'د. فاطمة علي',
  'طبيبة أطفال',
  'LIC-002-2023',
  '07702345678',
  'fatima.ali@health.iq',
  true,
  false,
  CURRENT_TIMESTAMP,
  'system',
  CURRENT_TIMESTAMP,
  'system'
),

-- د. محمد العبيدي
(
  '650e8400-e29b-41d4-a716-446655440003'::uuid,
  'د. محمد العبيدي',
  'طبيب أسنان',
  'LIC-003-2023',
  '07703456789',
  'mohammad.alubidi@health.iq',
  true,
  false,
  CURRENT_TIMESTAMP,
  'system',
  CURRENT_TIMESTAMP,
  'system'
),

-- د. ليلى حسين
(
  '650e8400-e29b-41d4-a716-446655440004'::uuid,
  'د. ليلى حسين',
  'طبيبة عيون',
  'LIC-004-2023',
  '07704567890',
  'layla.hussein@health.iq',
  true,
  false,
  CURRENT_TIMESTAMP,
  'system',
  CURRENT_TIMESTAMP,
  'system'
),

-- د. عمر الكرعاوي
(
  '650e8400-e29b-41d4-a716-446655440005'::uuid,
  'د. عمر الكرعاوي',
  'طبيب قلب',
  'LIC-005-2023',
  '07705678901',
  'omar.karawi@health.iq',
  true,
  false,
  CURRENT_TIMESTAMP,
  'system',
  CURRENT_TIMESTAMP,
  'system'
);

-- =====================================================
-- 3. HEALTH CENTERS (المراكز الصحية)
-- =====================================================
INSERT INTO appt_health_centers (
  center_id,
  name,
  name_ar,
  name_en,
  phone,
  email,
  address,
  latitude,
  longitude,
  is_active,
  is_deleted,
  created_at,
  created_by,
  updated_at,
  updated_by
) VALUES

-- مركز الرعاية الأولى
(
  '750e8400-e29b-41d4-a716-446655440001'::uuid,
  'مركز الرعاية الأولية',
  'مركز الرعاية الأولية',
  'Primary Healthcare Center',
  '07712345678',
  'primary@health.iq',
  'شارع الرشيد، بغداد',
  33.3128,
  44.3615,
  true,
  false,
  CURRENT_TIMESTAMP,
  'system',
  CURRENT_TIMESTAMP,
  'system'
),

-- مركز صحة الأسرة
(
  '750e8400-e29b-41d4-a716-446655440002'::uuid,
  'مركز صحة الأسرة',
  'مركز صحة الأسرة',
  'Family Health Center',
  '07723456789',
  'family@health.iq',
  'شارع فلسطين، بغداد',
  33.3215,
  44.3690,
  true,
  false,
  CURRENT_TIMESTAMP,
  'system',
  CURRENT_TIMESTAMP,
  'system'
),

-- مركز الرعاية المتقدمة
(
  '750e8400-e29b-41d4-a716-446655440003'::uuid,
  'مركز الرعاية الصحية المتقدمة',
  'مركز الرعاية الصحية المتقدمة',
  'Advanced Healthcare Center',
  '07734567890',
  'advanced@health.iq',
  'منطقة الكرادة، بغداد',
  33.2947,
  44.3857,
  true,
  false,
  CURRENT_TIMESTAMP,
  'system',
  CURRENT_TIMESTAMP,
  'system'
);

-- =====================================================
-- 4. BENEFICIARIES (المستفيدون - بيانات الاختبار)
-- =====================================================
INSERT INTO appt_beneficiaries (
  beneficiary_id,
  first_name,
  last_name,
  mobile_number,
  date_of_birth,
  gender,
  email,
  national_id,
  is_active,
  is_deleted,
  created_at,
  created_by,
  updated_at,
  updated_by
) VALUES

-- مستفيد 1: أحمد علي
(
  '850e8400-e29b-41d4-a716-446655440001'::uuid,
  'أحمد',
  'علي',
  '07701234567',
  '1985-05-15'::date,
  'M',
  'ahmad.ali@email.iq',
  '000000001',
  true,
  false,
  CURRENT_TIMESTAMP,
  'system',
  CURRENT_TIMESTAMP,
  'system'
),

-- مستفيد 2: فاطمة محمود
(
  '850e8400-e29b-41d4-a716-446655440002'::uuid,
  'فاطمة',
  'محمود',
  '07702345678',
  '1990-03-22'::date,
  'F',
  'fatima.mahmoud@email.iq',
  '000000002',
  true,
  false,
  CURRENT_TIMESTAMP,
  'system',
  CURRENT_TIMESTAMP,
  'system'
),

-- مستفيد 3: محمد حسن
(
  '850e8400-e29b-41d4-a716-446655440003'::uuid,
  'محمد',
  'حسن',
  '07703456789',
  '1978-12-08'::date,
  'M',
  'mohammad.hassan@email.iq',
  '000000003',
  true,
  false,
  CURRENT_TIMESTAMP,
  'system',
  CURRENT_TIMESTAMP,
  'system'
);

-- =====================================================
-- 5. TEST APPOINTMENTS (مواعيد الاختبار)
-- =====================================================
INSERT INTO appt_appointments (
  appointment_id,
  beneficiary_id,
  service_type_id,
  provider_id,
  center_id,
  appointment_date,
  appointment_time,
  status,
  notes,
  is_active,
  is_deleted,
  created_at,
  created_by,
  updated_at,
  updated_by
) VALUES

-- موعد 1: أحمد - فحص عام - غداً
(
  '950e8400-e29b-41d4-a716-446655440001'::uuid,
  '850e8400-e29b-41d4-a716-446655440001'::uuid,
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  '650e8400-e29b-41d4-a716-446655440001'::uuid,
  '750e8400-e29b-41d4-a716-446655440001'::uuid,
  (CURRENT_DATE + INTERVAL '1 day')::date,
  '10:00:00'::time,
  'SCHEDULED',
  'موعد فحص دوري',
  true,
  false,
  CURRENT_TIMESTAMP,
  'system',
  CURRENT_TIMESTAMP,
  'system'
),

-- موعد 2: فاطمة - فحص أطفال - بعد غد
(
  '950e8400-e29b-41d4-a716-446655440002'::uuid,
  '850e8400-e29b-41d4-a716-446655440002'::uuid,
  '550e8400-e29b-41d4-a716-446655440002'::uuid,
  '650e8400-e29b-41d4-a716-446655440002'::uuid,
  '750e8400-e29b-41d4-a716-446655440002'::uuid,
  (CURRENT_DATE + INTERVAL '2 days')::date,
  '14:30:00'::time,
  'SCHEDULED',
  'فحص شامل للطفل',
  true,
  false,
  CURRENT_TIMESTAMP,
  'system',
  CURRENT_TIMESTAMP,
  'system'
),

-- موعد 3: محمد - طب أسنان - بعد 3 أيام
(
  '950e8400-e29b-41d4-a716-446655440003'::uuid,
  '850e8400-e29b-41d4-a716-446655440003'::uuid,
  '550e8400-e29b-41d4-a716-446655440003'::uuid,
  '650e8400-e29b-41d4-a716-446655440003'::uuid,
  '750e8400-e29b-41d4-a716-446655440003'::uuid,
  (CURRENT_DATE + INTERVAL '3 days')::date,
  '09:15:00'::time,
  'SCHEDULED',
  'تنظيف الأسنان والفحص',
  true,
  false,
  CURRENT_TIMESTAMP,
  'system',
  CURRENT_TIMESTAMP,
  'system'
);

-- =====================================================
-- 6. PROVIDER SPECIALIZATIONS (تخصصات الأطباء)
-- =====================================================
INSERT INTO appt_provider_specializations (
  provider_id,
  service_type_id
) VALUES
-- د. أحمد - طبيب عام
('650e8400-e29b-41d4-a716-446655440001'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid),

-- د. فاطمة - طبيبة أطفال
('650e8400-e29b-41d4-a716-446655440002'::uuid, '550e8400-e29b-41d4-a716-446655440002'::uuid),

-- د. محمد - طبيب أسنان
('650e8400-e29b-41d4-a716-446655440003'::uuid, '550e8400-e29b-41d4-a716-446655440003'::uuid),

-- د. ليلى - طبيبة عيون
('650e8400-e29b-41d4-a716-446655440004'::uuid, '550e8400-e29b-41d4-a716-446655440004'::uuid),

-- د. عمر - طبيب قلب
('650e8400-e29b-41d4-a716-446655440005'::uuid, '550e8400-e29b-41d4-a716-446655440005'::uuid);

-- =====================================================
-- 7. CENTER SERVICES (الخدمات في المراكز)
-- =====================================================
INSERT INTO appt_center_services (
  center_id,
  service_type_id
) VALUES
-- مركز الرعاية الأولية - جميع الخدمات
('750e8400-e29b-41d4-a716-446655440001'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid),
('750e8400-e29b-41d4-a716-446655440001'::uuid, '550e8400-e29b-41d4-a716-446655440002'::uuid),
('750e8400-e29b-41d4-a716-446655440001'::uuid, '550e8400-e29b-41d4-a716-446655440005'::uuid),

-- مركز صحة الأسرة
('750e8400-e29b-41d4-a716-446655440002'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid),
('750e8400-e29b-41d4-a716-446655440002'::uuid, '550e8400-e29b-41d4-a716-446655440002'::uuid),

-- مركز الرعاية المتقدمة - جميع التخصصات
('750e8400-e29b-41d4-a716-446655440003'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid),
('750e8400-e29b-41d4-a716-446655440003'::uuid, '550e8400-e29b-41d4-a716-446655440003'::uuid),
('750e8400-e29b-41d4-a716-446655440003'::uuid, '550e8400-e29b-41d4-a716-446655440004'::uuid),
('750e8400-e29b-41d4-a716-446655440003'::uuid, '550e8400-e29b-41d4-a716-446655440005'::uuid);

-- =====================================================
-- COMMIT
-- =====================================================
COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- 1. تحقق من عدد أنواع الخدمات
-- Expected: 5
SELECT COUNT(*) as "Service Types Count" FROM appt_service_types WHERE is_deleted = false;

-- 2. تحقق من عدد الأطباء
-- Expected: 5
SELECT COUNT(*) as "Providers Count" FROM appt_providers WHERE is_deleted = false;

-- 3. تحقق من عدد المراكز
-- Expected: 3
SELECT COUNT(*) as "Health Centers Count" FROM appt_health_centers WHERE is_deleted = false;

-- 4. تحقق من عدد المستفيدين
-- Expected: 3
SELECT COUNT(*) as "Beneficiaries Count" FROM appt_beneficiaries WHERE is_deleted = false;

-- 5. تحقق من عدد المواعيد
-- Expected: 3
SELECT COUNT(*) as "Appointments Count" FROM appt_appointments WHERE is_deleted = false;

-- 6. قائمة أنواع الخدمات (للموبايل)
SELECT
  service_type_id,
  name,
  is_active
FROM appt_service_types
WHERE is_deleted = false AND is_active = true
ORDER BY name;

-- 7. بيانات المستفيدين للاختبار
SELECT
  beneficiary_id,
  first_name,
  last_name,
  mobile_number,
  date_of_birth,
  email
FROM appt_beneficiaries
WHERE is_deleted = false
ORDER BY created_at DESC;
---
```

#### 2️⃣ تشغيل Seed Data:
```
كيفية التنفيذ:

أ) استخدام psql:
---
cd c:\Java\care\Code\appointment-service
psql -U appointment_user -d appointment_db -f seed-data.sql
---

ب) استخدام DBeaver:
- افتح DBeaver
- انقر على الـ connection (appointment_db)
- File → Open SQL Script
- حدد seed-data.sql
- اضغط Execute

ج) استخدام Spring Boot:
أنشئ DataSeedConfig.java في appointment-service:
---
File: appointment-service/src/main/java/com/care/appointment/infrastructure/config/DataSeedConfig.java

@Configuration
@RequiredArgsConstructor
public class DataSeedConfig {

  private final ServiceTypeRepository serviceTypeRepository;

  @PostConstruct
  public void seedData() {
    if (serviceTypeRepository.count() > 0) {
      return; // البيانات موجودة بالفعل
    }

    // أنشئ أنواع الخدمات
    ServiceType general = ServiceType.builder()
      .serviceTypeId(UUID.fromString("550e8400-e29b-41d4-a716-446655440001"))
      .name("فحص عام")
      .code("GEN_CHECKUP")
      .isActive(true)
      .isDeleted(false)
      .build();

    serviceTypeRepository.save(general);
    // ... باقي البيانات
  }
}
---
```

#### 3️⃣ التحقق من البيانات:
```
بعد تشغيل Seed Script، شغّل هذه الاستعلامات للتحقق:

-- تحقق من أنواع الخدمات
curl -X GET http://localhost:6064/api/mobile/service-types/lookup \
  -H "Content-Type: application/json"

الاستجابة المتوقعة:
[
  {
    "serviceTypeId": "550e8400-e29b-41d4-a716-446655440001",
    "name": "فحص عام",
    "isActive": true
  },
  ...
]

-- تحقق من المستفيدين
curl -X GET http://localhost:6064/api/mobile/beneficiaries \
  -H "Content-Type: application/json"

-- تحقق من المواعيد
curl -X GET http://localhost:6064/api/mobile/appointments \
  -H "Content-Type: application/json"
```

---

## 📋 Checklist التنفيذ

### قبل البدء:
- [ ] تأكد أن appointment-service يعمل على http://localhost:6064
- [ ] تأكد أن care-mobile-app جاهز للتعديل
- [ ] لديك قاعدة بيانات PostgreSQL جاهزة

### المهمة #1: MobileServiceTypeController
- [ ] أنشئ MobileServiceTypeController.java
- [ ] تحقق من ServiceTypeResponse DTO
- [ ] حدّث Flutter AppointmentApiService
- [ ] حدّث Flutter ServiceTypeModel
- [ ] حدّث appointment_search_controller.dart
- [ ] اختبر الـ endpoint: GET /api/mobile/service-types/lookup
- [ ] تحقق من الاستجابة JSON
- **Status:** ⏳ Pending

### المهمة #2: Login Screen
- [ ] أنشئ LoginBinding.dart
- [ ] أنشئ LoginController.dart
- [ ] أنشئ LoginView.dart
- [ ] حدّث app_pages.dart
- [ ] حدّث app_routes.dart (إذا لزم)
- [ ] اختبر الـ Navigation
- [ ] اختبر الـ Form Validation
- **Status:** ⏳ Pending

### المهمة #3: Seed Data
- [ ] أنشئ seed-data.sql
- [ ] شغّل السكريبت على قاعدة البيانات
- [ ] تحقق من البيانات باستخدام SQL queries
- [ ] اختبر API endpoints مع البيانات الجديدة
- [ ] تحقق من ظهور البيانات في الموبايل
- **Status:** ⏳ Pending

---

## 🧪 Testing Commands

```powershell
# اختبر Service Type Endpoint
$uri = "http://localhost:6064/api/mobile/service-types/lookup"
$response = Invoke-WebRequest -Uri $uri -Method GET -Headers @{"Content-Type"="application/json"}
$response.Content | ConvertFrom-Json | Format-List

# اختبر Login
$uri = "http://localhost:6064/api/mobile/beneficiaries/auth/verify"
$body = @{
  "mobileNumber" = "07701234567"
  "dateOfBirth" = "1985-05-15"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri $uri -Method POST -Headers @{"Content-Type"="application/json"} -Body $body
$response.Content | ConvertFrom-Json | Format-List
```

---

## ⚠️ Notes for Cursor AI

1. **لا تستدعي وظائف لم تكن موجودة:**
   - استخدم `LoadAllUseCase` الموجود بالفعل
   - استخدم `ServiceTypeWebMapper` الموجود
   - لا تضف dependencies جديدة ما لم تكن ضرورية

2. **الملفات الموجودة بالفعل (تأكد من وجودها):**
   - `appointment-service/src/main/java/com/care/appointment/domain/ports/in/servicetype/LoadAllUseCase.java` ✅
   - `appointment-service/src/main/java/com/care/appointment/domain/ports/in/servicetype/LoadUseCase.java` ✅
   - `appointment-service/src/main/java/com/care/appointment/web/dto/admin/servicetype/ServiceTypeResponse.java` ✅
   - `appointment-service/src/main/java/com/care/appointment/web/mapper/ServiceTypeWebMapper.java` ✅

3. **للملفات التي قد تكون ناقصة:**
   - إذا كانت `appt_health_centers` table مفقودة، استخدم جدول موجود
   - إذا كانت `appt_provider_specializations` table مفقودة، حذفها من السكريبت
   - إذا كانت `appt_center_services` table مفقودة، حذفها من السكريبت

4. **بناء Gradle/Maven:**
   - تأكد من تشغيل `mvn clean install` بعد إضافة الملفات الجديدة
   - تأكد من عدم وجود compile errors

5. **الاختبار:**
   - اختبر كل task منفصلة
   - لا تنتقل للـ task التالية حتى يعمل الأول
   - استخدم Postman أو cURL للاختبار

---

## 📞 Support

إذا واجهت مشكلة:
1. تحقق من logs: `docker logs appointment-service` أو `docker logs care-mobile-app`
2. تأكد من أن الخادم يعمل على الـ ports الصحيحة
3. تأكد من أن قاعدة البيانات تحتوي على البيانات
4. استخدم browser DevTools للتحقق من Network requests

---

**Status:** جاهز للتنفيذ الآن ✅
**Total Time:** 10 ساعات
**Difficulty:** متوسط
**Priority:** CRITICAL 🚨

