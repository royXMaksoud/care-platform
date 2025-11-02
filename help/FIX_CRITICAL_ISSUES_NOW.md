# اصلح المشاكل الحرجة الآن
# Fix Critical Issues NOW - Action Plan

**تاريخ:** 1 نوفمبر 2025
**الأولوية:** حرجة جداً (CRITICAL)
**المدة الكلية:** 10 ساعات فقط

---

## 🚨 المشاكل الحرجة الثلاث (Top 3 Blockers)

### المشكلة #1: Service Type Endpoint الخاطئ (CRITICAL - 2 ساعات)

**المشكلة:**
- التطبيق يطلب: `GET /api/mobile/service-types/lookup`
- الخادم يرد: `GET /api/admin/service-types/lookup` (wrong!)
- النتيجة: التطبيق لا يستطيع عرض أنواع الخدمات

**الحل (appointment-service):**

**ملف:** `src/main/java/com/care/appointment/web/controller/admin/ServiceTypeController.java`

```java
// ❌ حالياً (wrong)
@GetMapping("/lookup")
public ResponseEntity<List<Map<String, Object>>> lookup() { ... }

// ✅ يجب أن يكون
@GetMapping("/lookup")
public ResponseEntity<List<ServiceTypeDTO>> lookup() { ... }
```

**الخطوات:**

1. **أضف endpoint جديد للموبايل:**

```java
// أضف هذا الـ Controller:
@RestController
@RequestMapping("/api/mobile/service-types")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Mobile - Service Types")
public class MobileServiceTypeController {

    private final ServiceTypeService serviceTypeService;
    private final ServiceTypeWebMapper serviceTypeWebMapper;

    @GetMapping("/lookup")
    @Operation(summary = "Get available service types for mobile app")
    public ResponseEntity<List<ServiceTypeDTO>> getServiceTypesLookup(
            @RequestParam(required = false) String preferredLanguage) {

        log.info("Getting service types for mobile app");

        List<ServiceType> serviceTypes = serviceTypeService.getAllActiveServiceTypes();

        List<ServiceTypeDTO> dtos = serviceTypes.stream()
            .map(serviceTypeWebMapper::toDTO)
            .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get service type details")
    public ResponseEntity<ServiceTypeDTO> getServiceType(@PathVariable UUID id) {
        ServiceType serviceType = serviceTypeService.getServiceTypeById(id)
            .orElseThrow(() -> new NotFoundException("Service type not found"));

        return ResponseEntity.ok(serviceTypeWebMapper.toDTO(serviceType));
    }
}
```

2. **تأكد من ServiceTypeDTO يحتوي على:**

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceTypeDTO {
    private UUID serviceTypeId;
    private String nameAr;           // العربية
    private String nameEn;           // الإنجليزية
    private String descriptionAr;
    private String descriptionEn;
    private String icon;             // رمز للخدمة
    private Integer estimatedDuration; // مدة الزيارة
    private BigDecimal baseFee;      // الرسوم الأساسية
    private Boolean isActive;
}
```

3. **أضف هذا الـ Mapper:**

```java
@Mapper(componentModel = "spring")
public interface ServiceTypeWebMapper {
    ServiceTypeDTO toDTO(ServiceType serviceType);

    @Mapping(target = "serviceTypeId", source = "id")
    ServiceTypeDTO toDTOFromDomain(ServiceType serviceType);
}
```

4. **اختبر الـ Endpoint:**

```bash
# في PowerShell:
$uri = "http://localhost:6064/api/mobile/service-types/lookup"
$headers = @{ "Content-Type" = "application/json" }

$response = Invoke-WebRequest -Uri $uri -Headers $headers -Method GET
$response.Content | ConvertFrom-Json | Format-List

# يجب أن يرجع:
[
  {
    "serviceTypeId": "550e8400-e29b-41d4-a716-446655440000",
    "nameAr": "فحص عام",
    "nameEn": "General Checkup",
    "icon": "⚕️",
    "estimatedDuration": 30,
    "baseFee": 75
  },
  ...
]
```

5. **تحديث Flutter App:**

**ملف:** `lib/app/data/api/appointment_api.dart`

```dart
// ❌ حالياً (wrong)
@GET('/api/admin/service-types/lookup')
Future<List<ServiceTypeModel>> getServiceTypes();

// ✅ يجب أن يكون
@GET('/api/mobile/service-types/lookup')
Future<List<ServiceTypeModel>> getServiceTypes();
```

6. **تحديث Model الـ Flutter:**

```dart
@freezed
class ServiceTypeModel with _$ServiceTypeModel {
  const factory ServiceTypeModel({
    required String serviceTypeId,
    required String nameAr,          // ✅ ADD
    required String nameEn,          // ✅ ADD
    required String descriptionAr,
    required String descriptionEn,
    String? icon,
    int? estimatedDuration,
    double? baseFee,
    @Default(true) bool isActive,
  }) = _ServiceTypeModel;

  factory ServiceTypeModel.fromJson(Map<String, dynamic> json) =>
      _$ServiceTypeModelFromJson(json);
}
```

---

### المشكلة #2: Beneficiary Verification Missing (CRITICAL - 4 ساعات)

**المشكلة:**
- التطبيق يحتاج لتسجيل الدخول بـ "رقم الهاتف + تاريخ الميلاد"
- الخادم لا يوجد لديه هذا الـ Endpoint

**الحل:**

يوجد بالفعل! ✅

**ملف:** `src/main/java/com/care/appointment/web/controller/MobileBeneficiaryController.java`

```java
@PostMapping("/auth/verify")
@RateLimiter(name = "mobileBeneficiaryAuth")
public ResponseEntity<BeneficiaryDTO> verifyCredentials(
        @Valid @RequestBody VerifyCredentialsRequest request) {
    // ✅ Already implemented!
}
```

**لكن يجب إضافة:**

1. **أضف هذا الـ Field في BeneficiaryDTO:**

```java
@Data
@Builder
public class BeneficiaryDTO {
    private UUID beneficiaryId;
    private String nationalId;
    private String fullName;
    private String motherName;
    private String mobileNumber;
    private LocalDate dateOfBirth;
    private String genderCode;
    private String preferredLanguageCodeValueId;  // ✅ للغة المفضلة
    private String registrationStatusCodeValueId;  // QUICK or COMPLETE
    // ... other fields
}
```

2. **تحديث Flutter App:**

**ملف:** `lib/app/data/providers/beneficiary_provider.dart`

```dart
class BeneficiaryProvider {
  final AppointmentApiService apiService;

  BeneficiaryProvider(this.apiService);

  /// Verify beneficiary using mobile number and date of birth
  Future<BeneficiaryModel> verifyBeneficiary({
    required String mobileNumber,
    required DateTime dateOfBirth,
  }) async {
    try {
      final response = await apiService.verifyBeneficiary(
        mobileNumber: mobileNumber,
        dateOfBirth: dateOfBirth,
      );

      // Save to local storage
      await StorageService.setBeneficiary(response);

      return response;
    } catch (e) {
      throw BeneficiaryVerificationException(e.toString());
    }
  }
}
```

**ملف:** `lib/app/data/api/appointment_api.dart`

```dart
@POST('/api/mobile/beneficiaries/auth/verify')
Future<BeneficiaryModel> verifyBeneficiary(
  @Body() Map<String, dynamic> body,
);

// أو بطريقة أفضل:
Future<BeneficiaryModel> verifyBeneficiary({
  @Field('mobileNumber') required String mobileNumber,
  @Field('dateOfBirth') required DateTime dateOfBirth,
});
```

3. **أضف Login Screen:**

**ملف:** `lib/app/modules/auth/login/login_view.dart`

```dart
class LoginView extends GetView<LoginController> {
  const LoginView({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('تسجيل الدخول')),
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Form(
          key: controller.formKey,
          child: ListView(
            children: [
              // العنوان
              Text(
                'تسجيل الدخول',
                style: Theme.of(context).textTheme.displaySmall,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),

              // رقم الهاتف
              TextFormField(
                controller: controller.mobileController,
                decoration: InputDecoration(
                  labelText: 'رقم الهاتف',
                  hintText: '+974XXXXXXXX',
                  prefixIcon: const Icon(Icons.phone),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                validator: (value) {
                  if (value?.isEmpty ?? true) return 'مطلوب';
                  if (!RegExp(r'^\+[1-9]\d{1,14}$').hasMatch(value!)) {
                    return 'صيغة غير صحيحة';
                  }
                  return null;
                },
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 20),

              // تاريخ الميلاد
              TextFormField(
                controller: controller.dateOfBirthController,
                decoration: InputDecoration(
                  labelText: 'تاريخ الميلاد',
                  hintText: 'YYYY-MM-DD',
                  prefixIcon: const Icon(Icons.date_range),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                validator: (value) {
                  if (value?.isEmpty ?? true) return 'مطلوب';
                  try {
                    DateTime.parse(value!);
                    return null;
                  } catch (e) {
                    return 'صيغة غير صحيحة';
                  }
                },
                onTap: () => controller.selectDate(context),
                readOnly: true,
              ),
              const SizedBox(height: 32),

              // زر الدخول
              Obx(() => ElevatedButton(
                    onPressed: controller.isLoading.value
                        ? null
                        : controller.login,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: controller.isLoading.value
                        ? const CircularProgressIndicator()
                        : const Text(
                            'دخول',
                            style: TextStyle(fontSize: 18),
                          ),
                  )),

              const SizedBox(height: 16),

              // زر التسجيل الجديد
              TextButton(
                onPressed: controller.goToRegister,
                child: const Text('ليس لديك حساب؟ إنشاء حساب'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

**ملف:** `lib/app/modules/auth/login/login_controller.dart`

```dart
class LoginController extends GetxController {
  final BeneficiaryProvider beneficiaryProvider;
  final StorageService storageService;

  final mobileController = TextEditingController();
  final dateOfBirthController = TextEditingController();
  final formKey = GlobalKey<FormState>();

  final isLoading = false.obs;

  @override
  void onClose() {
    mobileController.dispose();
    dateOfBirthController.dispose();
    super.onClose();
  }

  void selectDate(BuildContext context) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime(2000),
      firstDate: DateTime(1920),
      lastDate: DateTime.now(),
    );

    if (picked != null) {
      dateOfBirthController.text = picked.toString().split(' ')[0];
    }
  }

  Future<void> login() async {
    if (!formKey.currentState!.validate()) return;

    isLoading.value = true;
    try {
      final beneficiary = await beneficiaryProvider.verifyBeneficiary(
        mobileNumber: mobileController.text,
        dateOfBirth: DateTime.parse(dateOfBirthController.text),
      );

      Get.offAllNamed(AppRoutes.HOME);

      Get.snackbar(
        'نجح',
        'أهلاً بك ${beneficiary.fullName}',
        backgroundColor: Colors.green,
      );
    } on BeneficiaryVerificationException catch (e) {
      Get.snackbar(
        'خطأ',
        e.message,
        backgroundColor: Colors.red,
      );
    } finally {
      isLoading.value = false;
    }
  }

  void goToRegister() {
    Get.toNamed(AppRoutes.REGISTER);
  }
}
```

---

### المشكلة #3: Database Seed Data (CRITICAL - 4 ساعات)

**المشكلة:**
- لا توجد بيانات في قاعدة البيانات
- التطبيق لا يستطيع عرض أي شيء (lists فارغة)

**الحل:**

**ملف:** `src/main/resources/data-seed.sql`

```sql
-- Service Types
INSERT INTO service_types (id, name_ar, name_en, description_ar, description_en, is_active)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'فحص عام', 'General Check-up', 'فحص صحي شامل', 'Comprehensive health check', true),
  ('550e8400-e29b-41d4-a716-446655440002', 'فحص الأطفال', 'Pediatric Care', 'رعاية صحية للأطفال', 'Healthcare for children', true),
  ('550e8400-e29b-41d4-a716-446655440003', 'طب الأسنان', 'Dental Care', 'علاج وتنظيف الأسنان', 'Teeth treatment', true),
  ('550e8400-e29b-41d4-a716-446655440004', 'طب العيون', 'Eye Care', 'فحص وعلاج العيون', 'Eye examination', true),
  ('550e8400-e29b-41d4-a716-446655440005', 'القلب', 'Cardiology', 'أمراض القلب والأوعية الدموية', 'Heart and vessels', true);

-- Centers/Branches
INSERT INTO centers (id, name_ar, name_en, address, phone, latitude, longitude, is_active)
VALUES
  ('550e8400-e29b-41d4-a716-446655440011', 'مركز الرعاية الأولى', 'Primary Care Center', 'الدوحة، شارع السد', '+974 4xxx xxx1', 25.2854, 51.5265, true),
  ('550e8400-e29b-41d4-a716-446655440012', 'مركز صحة الأسرة', 'Family Health Center', 'الشميسية', '+974 4xxx xxx2', 25.2620, 51.5305, true),
  ('550e8400-e29b-41d4-a716-446655440013', 'مركز الرعاية المتقدمة', 'Advanced Care Center', 'الدوحة الجديدة', '+974 4xxx xxx3', 25.2730, 51.5340, true);

-- Providers/Doctors
INSERT INTO providers (id, name_ar, name_en, specialization, center_id, photo_url, rating, is_active)
VALUES
  ('550e8400-e29b-41d4-a716-446655440021', 'د. أحمد محمود', 'Dr. Ahmed Mahmoud', 'عام', '550e8400-e29b-41d4-a716-446655440011', 'https://...', 4.8, true),
  ('550e8400-e29b-41d4-a716-446655440022', 'د. سارة علي', 'Dr. Sarah Ali', 'أطفال', '550e8400-e29b-41d4-a716-446655440011', 'https://...', 4.6, true),
  ('550e8400-e29b-41d4-a716-446655440023', 'د. علي حسن', 'Dr. Ali Hassan', 'أسنان', '550e8400-e29b-41d4-a716-446655440012', 'https://...', 4.7, true);

-- Test Beneficiaries
INSERT INTO beneficiaries (beneficiary_id, national_id, full_name, mother_name, mobile_number, email, date_of_birth, is_active, is_deleted)
VALUES
  ('550e8400-e29b-41d4-a716-446655440031', '123456789', 'محمد علي', 'فاطمة', '+97491234567', 'user1@example.com', '1985-05-15', true, false),
  ('550e8400-e29b-41d4-a716-446655440032', '987654321', 'أحمد عبدالله', 'خديجة', '+97491234568', 'user2@example.com', '1990-03-20', true, false),
  ('550e8400-e29b-41d4-a716-446655440033', '555666777', 'فاطمة محمود', 'سارة', '+97491234569', 'user3@example.com', '1992-07-10', true, false);

-- Sample Appointments
INSERT INTO appointments (id, beneficiary_id, service_type_id, provider_id, center_id, scheduled_at, status, is_active)
VALUES
  ('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440011', '2025-11-03 10:00:00', 'confirmed', true),
  ('550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440011', '2025-11-05 14:30:00', 'confirmed', true);
```

**أو عبر Java Spring:**

**ملف:** `src/main/java/com/care/appointment/config/DataSeedConfig.java`

```java
@Configuration
public class DataSeedConfig {

    @Bean
    public CommandLineRunner seedData(
            ServiceTypeRepository serviceTypeRepository,
            CenterRepository centerRepository,
            ProviderRepository providerRepository,
            BeneficiaryRepository beneficiaryRepository) {

        return args -> {
            // 1. Service Types
            if (serviceTypeRepository.count() == 0) {
                serviceTypeRepository.saveAll(List.of(
                    ServiceType.builder()
                        .nameAr("فحص عام")
                        .nameEn("General Check-up")
                        .descriptionAr("فحص صحي شامل")
                        .descriptionEn("Comprehensive health check")
                        .isActive(true)
                        .build(),
                    // ... more types
                ));
                System.out.println("✓ Service types seeded");
            }

            // 2. Centers
            if (centerRepository.count() == 0) {
                centerRepository.saveAll(List.of(
                    Center.builder()
                        .nameAr("مركز الرعاية الأولى")
                        .nameEn("Primary Care Center")
                        .address("الدوحة، شارع السد")
                        .phone("+974 4xxx xxxx")
                        .latitude(25.2854)
                        .longitude(51.5265)
                        .isActive(true)
                        .build(),
                    // ... more centers
                ));
                System.out.println("✓ Centers seeded");
            }

            // 3. Providers
            if (providerRepository.count() == 0) {
                List<Center> centers = centerRepository.findAll();
                if (!centers.isEmpty()) {
                    providerRepository.saveAll(List.of(
                        Provider.builder()
                            .nameAr("د. أحمد محمود")
                            .nameEn("Dr. Ahmed Mahmoud")
                            .specialization("عام")
                            .center(centers.get(0))
                            .rating(4.8)
                            .isActive(true)
                            .build(),
                        // ... more providers
                    ));
                    System.out.println("✓ Providers seeded");
                }
            }

            // 4. Test Beneficiaries
            if (beneficiaryRepository.count() == 0) {
                beneficiaryRepository.saveAll(List.of(
                    Beneficiary.builder()
                        .nationalId("123456789")
                        .fullName("محمد علي")
                        .motherName("فاطمة")
                        .mobileNumber("+97491234567")
                        .dateOfBirth(LocalDate.of(1985, 5, 15))
                        .email("user1@example.com")
                        .isActive(true)
                        .isDeleted(false)
                        .build(),
                    // ... more beneficiaries
                ));
                System.out.println("✓ Test beneficiaries seeded");
            }
        };
    }
}
```

**اختبر:**

```bash
# تأكد من وجود البيانات:
psql -U postgres -d appointment_db -h localhost
SELECT COUNT(*) FROM service_types;
SELECT COUNT(*) FROM centers;
SELECT COUNT(*) FROM providers;
SELECT COUNT(*) FROM beneficiaries;
```

---

## ⏱️ جدول زمني للإصلاح (Timeline)

### اليوم 1: إصلاح المشاكل الثلاث (6 ساعات)

| الوقت | المهمة | الحالة |
|------|--------|--------|
| 09:00-11:00 | إصلاح Service Type Endpoint | ⏳ |
| 11:00-12:00 | اختبار Endpoint | ⏳ |
| 12:00-13:00 | تحديث Flutter App API | ⏳ |
| 14:00-17:00 | إضافة Seed Data | ⏳ |
| 17:00-18:00 | اختبار شامل | ⏳ |

### اليوم 2: إضافة Login (4 ساعات)

| الوقت | المهمة | الحالة |
|------|--------|--------|
| 09:00-10:00 | إنشاء Login Screen | ⏳ |
| 10:00-11:00 | إنشاء Login Controller | ⏳ |
| 11:00-12:00 | تحديث الـ Routes | ⏳ |
| 13:00-14:00 | اختبار بيانات حقيقية | ⏳ |

---

## ✅ قائمة التحقق (Verification Checklist)

- [ ] أنشأت `/api/mobile/service-types/lookup` endpoint
- [ ] اختبرت الـ endpoint مع Postman/cURL
- [ ] تحديث Flutter API client
- [ ] تحديث Flutter Model
- [ ] إضافة Seed Data للـ Database
- [ ] التحقق من البيانات في Database
- [ ] إنشاء Login Screen
- [ ] إنشاء Login Controller
- [ ] تحديث app_pages.dart Routes
- [ ] اختبار Login كامل مع بيانات حقيقية
- [ ] اختبار التطبيق على جهاز فعلي
- [ ] اختبار على جهاز محاكى

---

## 🚀 الخطوة التالية

بعد إصلاح هذه المشاكل الثلاث:

1. **ستتمكن من:**
   - رؤية أنواع الخدمات في التطبيق ✅
   - تسجيل الدخول بـ رقم هاتف + تاريخ ميلاد ✅
   - رؤية بيانات حقيقية ✅

2. **ثم ركز على:**
   - تصميم صفحة حجز الموعد (انظر: APPOINTMENT_PAGE_DESIGN_PLAN.md)
   - عرض المراكز والأطباء المتاحين
   - حجز الموعد بنجاح

---

**أهم شيء: ركز على هذه الثلاث مشاكل أولاً!** 🎯
بعد إصلاحها، كل شيء آخر سيكون سهل.

**ابدأ الآن!** 🚀
