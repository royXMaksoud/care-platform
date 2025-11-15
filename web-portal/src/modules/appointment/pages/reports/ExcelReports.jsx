import React, { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Card,
  Form,
  Button,
  DatePicker,
  Select,
  Row,
  Col,
  Tabs,
  message,
} from 'antd'
import { DownloadOutlined, FilterOutlined, ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { excelReportsApi } from '../../api/dashboardApi'

const { RangePicker } = DatePicker

const REPORT_TYPES = {
  DETAILED: 'detailed',
  STATISTICAL: 'statistical',
  CENTER: 'center',
  ORGANIZATION: 'organization',
  PRIORITY: 'priority',
}

const REPORT_CONFIGS = {
  [REPORT_TYPES.DETAILED]: {
    title: 'تقرير مفصل للإحالات',
    enTitle: 'Detailed Appointments Report',
    description: 'جميع الإحالات مع البيانات الكاملة',
    enDescription: 'All appointments with complete details',
  },
  [REPORT_TYPES.STATISTICAL]: {
    title: 'التقرير الإحصائي',
    enTitle: 'Statistical Report',
    description: 'أعداد تجميعية حسب الحالة والأولوية',
    enDescription: 'Aggregate numbers by status and priority',
  },
  [REPORT_TYPES.CENTER]: {
    title: 'تقرير بيانات المراكز',
    enTitle: 'Centers Performance Report',
    description: 'أداء كل مركز من المراكز',
    enDescription: 'Performance metrics for each center',
  },
  [REPORT_TYPES.ORGANIZATION]: {
    title: 'تقرير بيانات المنظمات',
    enTitle: 'Organizations Performance Report',
    description: 'أداء كل منظمة من المنظمات',
    enDescription: 'Performance metrics for each organization',
  },
  [REPORT_TYPES.PRIORITY]: {
    title: 'توزيع الأولويات',
    enTitle: 'Priority Distribution Report',
    description: 'توزيع الإحالات حسب الأولوية',
    enDescription: 'Distribution of appointments by priority',
  },
}

// الحالات - العربية
const MOCK_STATUSES_AR = [
  { value: 'PENDING', label: 'قيد الانتظار' },
  { value: 'CONFIRMED', label: 'مؤكدة' },
  { value: 'COMPLETED', label: 'مكتملة' },
  { value: 'CANCELLED', label: 'ملغاة' },
  { value: 'NO_SHOW', label: 'لم يحضر' },
]

// الحالات - الإنجليزية
const MOCK_STATUSES_EN = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'NO_SHOW', label: 'No Show' },
]

// الأولويات - العربية
const MOCK_PRIORITIES_AR = [
  { value: 'LOW', label: 'منخفضة' },
  { value: 'MEDIUM', label: 'متوسطة' },
  { value: 'HIGH', label: 'عالية' },
  { value: 'URGENT', label: 'طارئة' },
]

// الأولويات - الإنجليزية
const MOCK_PRIORITIES_EN = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
]

// المراكز - العربية
const MOCK_CENTERS_AR = [
  { value: 'CENTER_001', label: 'مركز رئيسي' },
  { value: 'CENTER_002', label: 'مركز الشمال' },
  { value: 'CENTER_003', label: 'مركز الجنوب' },
]

// المراكز - الإنجليزية
const MOCK_CENTERS_EN = [
  { value: 'CENTER_001', label: 'Main Center' },
  { value: 'CENTER_002', label: 'North Center' },
  { value: 'CENTER_003', label: 'South Center' },
]

// المنظمات - العربية
const MOCK_ORGANIZATIONS_AR = [
  { value: 'ORG_001', label: 'منظمة النور' },
  { value: 'ORG_002', label: 'منظمة الأمل' },
  { value: 'ORG_003', label: 'منظمة الرحمة' },
]

// المنظمات - الإنجليزية
const MOCK_ORGANIZATIONS_EN = [
  { value: 'ORG_001', label: 'Light Organization' },
  { value: 'ORG_002', label: 'Hope Organization' },
  { value: 'ORG_003', label: 'Mercy Organization' },
]

// دوال مساعدة للحصول على البيانات حسب اللغة
const getStatuses = (isArabic) => isArabic ? MOCK_STATUSES_AR : MOCK_STATUSES_EN
const getPriorities = (isArabic) => isArabic ? MOCK_PRIORITIES_AR : MOCK_PRIORITIES_EN
const getCenters = (isArabic) => isArabic ? MOCK_CENTERS_AR : MOCK_CENTERS_EN
const getOrganizations = (isArabic) => isArabic ? MOCK_ORGANIZATIONS_AR : MOCK_ORGANIZATIONS_EN

export default function ExcelReports() {
  const { i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'
  const [form] = Form.useForm()
  const [selectedReportType, setSelectedReportType] = useState(REPORT_TYPES.DETAILED)
  const [loading, setLoading] = useState(false)

  const handleGenerateReport = useCallback(async () => {
    try {
      setLoading(true)
      const values = await form.validateFields()

      // جمع الفلاتر
      const filters = {
        reportType: selectedReportType,
        organizationIds: values.organization ? [values.organization] : [],
        centerIds: values.center ? [values.center] : [],
        statuses: values.status ? [values.status] : [],
        priorities: values.priority ? [values.priority] : [],
        language: isArabic ? 'ar' : 'en',
      }

      if (values.dateRange) {
        filters.dateFrom = values.dateRange[0].format('YYYY-MM-DD')
        filters.dateTo = values.dateRange[1].format('YYYY-MM-DD')
      }

      // استدعاء API المناسبة حسب نوع التقرير
      let fileBlob = null
      switch (selectedReportType) {
        case REPORT_TYPES.DETAILED:
          fileBlob = await excelReportsApi.generateDetailedReport(filters)
          break
        case REPORT_TYPES.STATISTICAL:
          fileBlob = await excelReportsApi.generateStatisticalReport(filters)
          break
        case REPORT_TYPES.CENTER:
          fileBlob = await excelReportsApi.generateCenterReport(filters)
          break
        case REPORT_TYPES.ORGANIZATION:
          fileBlob = await excelReportsApi.generateOrganizationReport(filters)
          break
        case REPORT_TYPES.PRIORITY:
          fileBlob = await excelReportsApi.generatePriorityReport(filters)
          break
        default:
          throw new Error('Unknown report type')
      }

      // تحميل الملف
      downloadFile(fileBlob, selectedReportType, isArabic)
      message.success('تم توليد التقرير بنجاح / Report generated successfully')
    } catch (error) {
      console.error('Error generating report:', error)
      message.error('خطأ في توليد التقرير / Error generating report')
    } finally {
      setLoading(false)
    }
  }, [form, selectedReportType, isArabic])

  const handleReset = () => {
    form.resetFields()
    setReportData(null)
  }

  return (
    <div className={`min-h-full bg-gradient-to-br from-slate-50 to-gray-100 ${isArabic ? 'rtl' : 'ltr'}`}>
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* العنوان */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            {isArabic ? 'تقارير الإحالات' : 'Appointment Reports'}
          </h1>
          <p className="mt-2 text-slate-600">
            {isArabic
              ? 'توليد وتحميل تقارير Excel متقدمة مع فلاتر مخصصة'
              : 'Generate and download advanced Excel reports with custom filters'}
          </p>
        </div>

        {/* الفلاتر والخيارات */}
        <Card className="mb-8 shadow-md">
          <Tabs
            items={Object.entries(REPORT_CONFIGS).map(([type, config]) => ({
              key: type,
              label: (
                <span>
                  <FilterOutlined className="ml-2" />
                  {isArabic ? config.title : config.enTitle}
                </span>
              ),
              children: (
                <div key={type}>
                  <Form
                    form={form}
                    layout="vertical"
                    className="space-y-4"
                    onValuesChange={() => setSelectedReportType(type)}
                  >
                    <Row gutter={[16, 16]}>
                      {/* نطاق التاريخ */}
                      <Col xs={24} sm={12} lg={6}>
                        <Form.Item
                          label={isArabic ? 'نطاق التاريخ' : 'Date Range'}
                          name="dateRange"
                        >
                          <RangePicker
                            style={{ width: '100%' }}
                            placeholder={[
                              isArabic ? 'من' : 'From',
                              isArabic ? 'إلى' : 'To',
                            ]}
                          />
                        </Form.Item>
                      </Col>

                      {/* المنظمة */}
                      <Col xs={24} sm={12} lg={6}>
                        <Form.Item
                          label={isArabic ? 'المنظمة' : 'Organization'}
                          name="organization"
                        >
                          <Select
                            placeholder={isArabic ? 'اختر منظمة' : 'Select organization'}
                            allowClear
                            options={getOrganizations(isArabic)}
                          />
                        </Form.Item>
                      </Col>

                      {/* المركز */}
                      <Col xs={24} sm={12} lg={6}>
                        <Form.Item
                          label={isArabic ? 'المركز' : 'Center'}
                          name="center"
                        >
                          <Select
                            placeholder={isArabic ? 'اختر مركزاً' : 'Select center'}
                            allowClear
                            options={getCenters(isArabic)}
                          />
                        </Form.Item>
                      </Col>

                      {/* حالة الإحالة */}
                      <Col xs={24} sm={12} lg={6}>
                        <Form.Item
                          label={isArabic ? 'حالة الإحالة' : 'Status'}
                          name="status"
                        >
                          <Select
                            placeholder={isArabic ? 'اختر الحالة' : 'Select status'}
                            allowClear
                            options={getStatuses(isArabic)}
                          />
                        </Form.Item>
                      </Col>

                      {/* الأولوية */}
                      <Col xs={24} sm={12} lg={6}>
                        <Form.Item
                          label={isArabic ? 'الأولوية' : 'Priority'}
                          name="priority"
                        >
                          <Select
                            placeholder={isArabic ? 'اختر الأولوية' : 'Select priority'}
                            allowClear
                            options={getPriorities(isArabic)}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    {/* أزرار الإجراءات */}
                    <Row gutter={[8, 8]} className="mt-6">
                      <Col xs={24} sm={12}>
                        <Button
                          type="primary"
                          size="large"
                          block
                          onClick={handleGenerateReport}
                          loading={loading}
                          icon={<DownloadOutlined />}
                        >
                          {isArabic ? 'توليد وتحميل التقرير' : 'Generate & Download Report'}
                        </Button>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Button
                          size="large"
                          block
                          onClick={handleReset}
                          icon={<ReloadOutlined />}
                        >
                          {isArabic ? 'إعادة تعيين' : 'Reset'}
                        </Button>
                      </Col>
                    </Row>
                  </Form>

                  {/* وصف التقرير */}
                  <div className="mt-6 rounded-lg bg-blue-50 p-4 border border-blue-200">
                    <p className="font-semibold text-blue-900">
                      {isArabic ? config.description : config.enDescription}
                    </p>
                  </div>
                </div>
              ),
            }))}
            onChange={setSelectedReportType}
          />
        </Card>

      </div>
    </div>
  )
}

/**
 * تحميل ملف Excel من blob
 */
function downloadFile(fileBlob, reportType, isArabic) {
  try {
    // إنشاء رابط تحميل
    const url = window.URL.createObjectURL(fileBlob)
    const link = document.createElement('a')
    link.href = url

    // اسم الملف
    const timestamp = dayjs().format('YYYY-MM-DD_HH-mm-ss')
    const reportName = isArabic
      ? REPORT_CONFIGS[reportType].title
      : REPORT_CONFIGS[reportType].enTitle

    link.setAttribute('download', `${reportName}_${timestamp}.xlsx`)

    // تحميل الملف
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error downloading file:', error)
    message.error('خطأ في تحميل الملف / Error downloading file')
  }
}

