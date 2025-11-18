import React, { useState, useCallback, useEffect, useMemo } from 'react'
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
import { api } from '@/lib/axios'
import { SYSTEM_SECTIONS } from '@/config/systemSectionConstants'
import { useSystemSectionScopes } from '../../hooks/useSystemSectionScopes'
import SearchableSelect from '@/components/SearchableSelect'

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


export default function ExcelReports() {
  const { i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'
  const uiLang = isArabic ? 'ar' : 'en'
  const [form] = Form.useForm()
  const [selectedReportType, setSelectedReportType] = useState(REPORT_TYPES.DETAILED)
  const [loading, setLoading] = useState(false)
  
  // Get scopeValueIds for filtering branches
  const { scopeValueIds, isLoading: isLoadingScopes } = useSystemSectionScopes(SYSTEM_SECTIONS.APPOINTMENT_SCHEDULING)
  const [authorizedBranchIds, setAuthorizedBranchIds] = useState([])
  
  // Data states
  const [allOrganizations, setAllOrganizations] = useState([])
  const [allOrganizationBranches, setAllOrganizationBranches] = useState([])
  const [organizationOptions, setOrganizationOptions] = useState([])
  const [branchOptions, setBranchOptions] = useState([])
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(null)
  const [loadingLookups, setLoadingLookups] = useState(false)
  const [statusOptions, setStatusOptions] = useState([])
  const [priorityOptions, setPriorityOptions] = useState([])

  // Load organizations and branches
  useEffect(() => {
    let isActive = true
    const loadLookups = async () => {
      setLoadingLookups(true)
      try {
        const results = await Promise.allSettled([
          api.post(
            '/access/api/organizations/filter',
            { criteria: [] },
            { params: { page: 0, size: 10000, lang: uiLang } }
          ),
          api.post(
            '/access/api/organization-branches/filter',
            { criteria: [] },
            { params: { page: 0, size: 10000, lang: uiLang } }
          ),
          api.get('/appointment-service/api/admin/appointment-statuses/lookup', {
            params: { lang: uiLang },
          }),
        ])

        if (!isActive) return

        const organizationsRes = results[0]?.status === 'fulfilled' ? results[0].value : null
        const branchesRes = results[1]?.status === 'fulfilled' ? results[1].value : null
        const statusesRes = results[2]?.status === 'fulfilled' ? results[2].value : null

        const organizationsData = organizationsRes?.data
        const organizationItems = Array.isArray(organizationsData)
          ? organizationsData
          : Array.isArray(organizationsData?.content)
          ? organizationsData.content
          : []
        setAllOrganizations(organizationItems)

        const branchesData = branchesRes?.data
        const branchItems = Array.isArray(branchesData)
          ? branchesData
          : Array.isArray(branchesData?.content)
          ? branchesData.content
          : []
        setAllOrganizationBranches(branchItems)

        // Load status options
        const statusItems = Array.isArray(statusesRes?.data)
          ? statusesRes.data
          : []
        setStatusOptions(
          statusItems.map((status) => ({
            value: status.code || status.value,
            label: status.label || status.name || status.code || 'Status',
            code: status.code,
            name: status.name,
          }))
        )

        // Priority options (static)
        setPriorityOptions([
          { value: 'NORMAL', label: isArabic ? 'عادية' : 'Normal' },
          { value: 'URGENT', label: isArabic ? 'طارئة' : 'Urgent' },
        ])
      } catch (err) {
        console.error('Failed to load lookups:', err)
      } finally {
        if (isActive) {
          setLoadingLookups(false)
        }
      }
    }

    loadLookups()
    return () => {
      isActive = false
    }
  }, [uiLang])

  // Update authorized branch IDs from scopes
  useEffect(() => {
    if (scopeValueIds && scopeValueIds.length > 0) {
      setAuthorizedBranchIds(scopeValueIds)
    } else {
      setAuthorizedBranchIds([])
    }
  }, [scopeValueIds])

  // Filter organizations based on scopeValueId (like AppointmentList.jsx)
  const organizationOptionsFiltered = useMemo(() => {
    const orgMap = {}
    const options = []
    const authorizedSet = new Set(authorizedBranchIds || [])
    const hasScopeFilter = authorizedSet.size > 0
    const allowedOrgIds = new Set()

    if (hasScopeFilter) {
      allOrganizationBranches.forEach((branch) => {
        if (authorizedSet.has(branch.organizationBranchId) && branch.organizationId) {
          allowedOrgIds.add(branch.organizationId)
        }
      })
    }

    const canUseOrg = (orgId) => {
      if (!orgId) return false
      if (!hasScopeFilter) return true
      return allowedOrgIds.has(orgId)
    }

    const ensureOrgOption = (orgId, labelCandidate) => {
      if (!orgId || orgMap[orgId] || !canUseOrg(orgId)) return
      const label = labelCandidate || orgId || 'Organization'
      orgMap[orgId] = label
      options.push({ value: orgId, label })
    }

    allOrganizations.forEach((org) => {
      const orgId = org.organizationId || org.id
      const label = org.organizationName || org.name || org.code || orgId
      ensureOrgOption(orgId, label)
    })

    allOrganizationBranches.forEach((branch) => {
      const orgId = branch.organizationId
      const label =
        branch.organizationName ||
        branch.organization?.name ||
        branch.organizationCode ||
        branch.name ||
        orgId
      ensureOrgOption(orgId, label)
    })

    return options
  }, [allOrganizations, allOrganizationBranches, authorizedBranchIds])

  // Update organization options
  useEffect(() => {
    setOrganizationOptions(organizationOptionsFiltered)
  }, [organizationOptionsFiltered])

  // Filter branches based on selected organizations and authorized branch IDs
  const filteredBranchOptions = useMemo(() => {
    const selectedOrgIds = Array.isArray(selectedOrganizationId) 
      ? selectedOrganizationId 
      : selectedOrganizationId ? [selectedOrganizationId] : []
    
    return allOrganizationBranches
      .filter((branch) => {
        if (!branch?.organizationBranchId) return false
        if (authorizedBranchIds.length && !authorizedBranchIds.includes(branch.organizationBranchId)) {
          return false
        }
        if (selectedOrgIds.length > 0 && !selectedOrgIds.includes(branch.organizationId)) {
          return false
        }
        return true
      })
      .map((branch) => ({
        value: branch.organizationBranchId,
        label: branch.name || branch.organizationBranchName || 'Unknown branch',
      }))
  }, [allOrganizationBranches, authorizedBranchIds, selectedOrganizationId])

  // Update branch options when filtered branches change
  useEffect(() => {
    setBranchOptions(filteredBranchOptions)
  }, [filteredBranchOptions])

  const handleGenerateReport = useCallback(async () => {
    try {
      setLoading(true)
      const values = await form.validateFields()

      // Map report type
      const reportTypeMap = {
        [REPORT_TYPES.DETAILED]: 'DETAILED',
        [REPORT_TYPES.STATISTICAL]: 'STATISTICAL',
        [REPORT_TYPES.CENTER]: 'CENTER',
        [REPORT_TYPES.ORGANIZATION]: 'ORGANIZATION',
        [REPORT_TYPES.PRIORITY]: 'PRIORITY',
      }

      // Build filters
      const filters = {
        reportType: reportTypeMap[selectedReportType] || 'DETAILED',
        organizationIds: Array.isArray(values.organization) 
          ? values.organization 
          : values.organization 
          ? [values.organization] 
          : [],
        centerIds: Array.isArray(values.organizationBranchId)
          ? values.organizationBranchId
          : values.organizationBranchId
          ? [values.organizationBranchId]
          : [],
        statuses: Array.isArray(values.status) 
          ? values.status 
          : values.status 
          ? [values.status] 
          : [],
        priorities: Array.isArray(values.priority)
          ? values.priority
          : values.priority
          ? [values.priority]
          : [],
        language: uiLang,
      }

      if (values.dateRange && values.dateRange[0] && values.dateRange[1]) {
        filters.dateFrom = values.dateRange[0].format('YYYY-MM-DD')
        filters.dateTo = values.dateRange[1].format('YYYY-MM-DD')
      }

      // Call appropriate API based on report type
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

      // Download file
      downloadFile(fileBlob, selectedReportType, isArabic)
      message.success('تم توليد التقرير بنجاح / Report generated successfully')
    } catch (error) {
      console.error('Error generating report:', error)
      const errorMsg = error?.response?.data?.message || 'خطأ في توليد التقرير / Error generating report'
      message.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }, [form, selectedReportType, isArabic, uiLang])

  const handleReset = () => {
    form.resetFields()
    setSelectedOrganizationId(null)
  }

  const handleOrganizationChange = (value) => {
    setSelectedOrganizationId(value)
    // Clear branch selection when organization changes
    form.setFieldsValue({ organizationBranchId: null })
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
                            mode="multiple"
                            placeholder={isArabic ? 'اختر منظمة (اختياري)' : 'Select organization(s) (optional)'}
                            allowClear
                            options={organizationOptions}
                            loading={loadingLookups}
                            onChange={handleOrganizationChange}
                            showSearch
                            filterOption={(input, option) =>
                              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                          />
                        </Form.Item>
                      </Col>

                      {/* المركز / الفرع */}
                      <Col xs={24} sm={12} lg={6}>
                        <Form.Item
                          label={isArabic ? 'المركز / الفرع' : 'Center / Branch'}
                          name="organizationBranchId"
                        >
                          <Select
                            mode="multiple"
                            placeholder={
                              selectedOrganizationId && (Array.isArray(selectedOrganizationId) ? selectedOrganizationId.length > 0 : true)
                                ? isArabic
                                  ? 'اختر فرعاً (اختياري)'
                                  : 'Select branch(es) (optional)'
                                : isArabic
                                ? 'اختر منظمة أولاً'
                                : 'Select organization first'
                            }
                            allowClear
                            options={branchOptions}
                            loading={loadingLookups}
                            disabled={!selectedOrganizationId || (Array.isArray(selectedOrganizationId) ? selectedOrganizationId.length === 0 : false)}
                            showSearch
                            filterOption={(input, option) =>
                              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
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
                            mode="multiple"
                            placeholder={isArabic ? 'اختر الحالة (اختياري)' : 'Select status(es) (optional)'}
                            allowClear
                            options={statusOptions}
                            loading={loadingLookups}
                            showSearch
                            filterOption={(input, option) =>
                              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
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
                            mode="multiple"
                            placeholder={isArabic ? 'اختر الأولوية (اختياري)' : 'Select priority(ies) (optional)'}
                            allowClear
                            options={priorityOptions}
                            showSearch
                            filterOption={(input, option) =>
                              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
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

