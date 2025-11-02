import '../data/models/appointment_models.dart';

/// Default service types to use when backend is unavailable
/// These services are hardcoded and available immediately
class DefaultServices {
  /// Get default service types
  static List<ServiceTypeModel> getDefaultServiceTypes() {
    return [
      ServiceTypeModel(
        id: 'default-health',
        code: 'HEALTH',
        name: 'Health Services',
        nameAr: 'الخدمات الصحية',
        nameTr: 'Sağlık Hizmetleri',
        categoryId: 'health',
        categoryName: 'Health',
      ),
      ServiceTypeModel(
        id: 'default-education',
        code: 'EDUCATION',
        name: 'Education Services',
        nameAr: 'الخدمات التعليمية',
        nameTr: 'Eğitim Hizmetleri',
        categoryId: 'education',
        categoryName: 'Education',
      ),
      ServiceTypeModel(
        id: 'default-financial',
        code: 'FINANCIAL',
        name: 'Financial Services',
        nameAr: 'الخدمات المالية',
        nameTr: 'Mali Hizmetler',
        categoryId: 'financial',
        categoryName: 'Financial',
      ),
      ServiceTypeModel(
        id: 'default-social',
        code: 'SOCIAL',
        name: 'Social Services',
        nameAr: 'الخدمات الاجتماعية',
        nameTr: 'Sosyal Hizmetler',
        categoryId: 'social',
        categoryName: 'Social',
      ),
      ServiceTypeModel(
        id: 'default-legal',
        code: 'LEGAL',
        name: 'Legal Services',
        nameAr: 'الخدمات القانونية',
        nameTr: 'Yasal Hizmetler',
        categoryId: 'legal',
        categoryName: 'Legal',
      ),
    ];
  }
}

