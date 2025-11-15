import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Tag,
  Tooltip,
  Popconfirm,
  Drawer,
  Card,
  Row,
  Col,
  Tabs,
  message,
  Empty,
  Timeline,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CopyOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { notificationApi } from '../api/notificationApi';
import HelpButton from '../components/HelpButton';

/**
 * Template Management
 * Create, edit, translate, and manage notification templates
 */
const TemplateManagement = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [languages] = useState([
    { value: 'en', label: 'English' },
    { value: 'ar', label: 'العربية' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' },
    { value: 'es', label: 'Español' },
  ]);

  const templateTypes = [
    { value: 'EMAIL', label: 'Email' },
    { value: 'SMS', label: 'SMS' },
    { value: 'PUSH', label: 'Push Notification' },
  ];

  const notificationTypes = [
    { value: 'APPOINTMENT_CREATED', label: 'Appointment Created' },
    { value: 'APPOINTMENT_REMINDER', label: 'Appointment Reminder' },
    { value: 'APPOINTMENT_CANCELLED', label: 'Appointment Cancelled' },
    { value: 'CUSTOM', label: 'Custom' },
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await notificationApi.getTemplates();
      setTemplates(response.data || []);
    } catch (error) {
      message.error(t('common.error.fetchFailed', 'Failed to fetch templates'));
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (values) => {
    try {
      await notificationApi.createTemplate(values);
      message.success(t('notification.template.createdSuccess', 'Template created successfully'));
      setModalVisible(false);
      form.resetFields();
      fetchTemplates();
    } catch (error) {
      message.error(t('notification.template.createFailed', 'Failed to create template'));
      console.error('Error creating template:', error);
    }
  };

  const handleUpdateTemplate = async (templateId, values) => {
    try {
      await notificationApi.updateTemplate(templateId, values);
      message.success(t('notification.template.updatedSuccess', 'Template updated successfully'));
      setDrawerVisible(false);
      fetchTemplates();
    } catch (error) {
      message.error(t('notification.template.updateFailed', 'Failed to update template'));
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    try {
      await notificationApi.deleteTemplate(templateId);
      message.success(t('notification.template.deletedSuccess', 'Template deleted'));
      fetchTemplates();
    } catch (error) {
      message.error(t('notification.template.deleteFailed', 'Failed to delete template'));
    }
  };

  const handleActivateTemplate = async (templateId) => {
    try {
      await notificationApi.activateTemplate(templateId);
      message.success(t('notification.template.activatedSuccess', 'Template activated'));
      fetchTemplates();
    } catch (error) {
      message.error(t('notification.template.activateFailed', 'Failed to activate template'));
    }
  };

  const handlePreviewTemplate = async (template) => {
    setSelectedTemplate(template);
    // Mock preview data - replace with actual variable values
    const mockVariables = {
      beneficiaryName: 'John Doe',
      appointmentDate: '2025-11-20',
      appointmentTime: '10:00 AM',
      appointmentCode: 'APT-2025-001',
      centerName: 'Medical Center',
      serviceType: 'General Checkup',
    };
    setPreviewData(mockVariables);
    setPreviewModalVisible(true);
  };

  const replaceVariables = (text, variables) => {
    let result = text;
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{${key}}}|\\$\\{${key}\\}`, 'g'), value);
    });
    return result;
  };

  const columns = [
    {
      title: t('notification.template.name', 'Name'),
      dataIndex: 'templateName',
      key: 'templateName',
    },
    {
      title: t('notification.template.type', 'Type'),
      dataIndex: 'templateType',
      key: 'templateType',
      render: (type) => (
        <Tag color={type === 'EMAIL' ? 'blue' : type === 'SMS' ? 'green' : 'purple'}>
          {type}
        </Tag>
      ),
    },
    {
      title: t('notification.template.language', 'Language'),
      dataIndex: 'language',
      key: 'language',
    },
    {
      title: t('notification.template.notificationType', 'Notification Type'),
      dataIndex: 'notificationType',
      key: 'notificationType',
    },
    {
      title: t('notification.template.version', 'Version'),
      dataIndex: 'version',
      key: 'version',
    },
    {
      title: t('notification.template.status', 'Status'),
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active) => (
        <Tag color={active ? 'success' : 'default'}>
          {active ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
        </Tag>
      ),
    },
    {
      title: t('common.actions', 'Actions'),
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={t('notification.template.preview', 'Preview')}>
            <Button
              type="primary"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handlePreviewTemplate(record)}
            />
          </Tooltip>
          <Tooltip title={t('common.edit', 'Edit')}>
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedTemplate(record);
                setDrawerVisible(true);
              }}
            />
          </Tooltip>
          {!record.isActive && (
            <Tooltip title={t('notification.template.activate', 'Activate')}>
              <Button
                type="primary"
                size="small"
                onClick={() => handleActivateTemplate(record.id)}
              >
                {t('common.activate', 'Activate')}
              </Button>
            </Tooltip>
          )}
          <Tooltip title={t('common.history', 'History')}>
            <Button
              size="small"
              icon={<HistoryOutlined />}
              onClick={() => {
                // Handle version history
              }}
            />
          </Tooltip>
          <Popconfirm
            title={t('common.deleteConfirm', 'Delete?')}
            onConfirm={() => handleDeleteTemplate(record.id)}
          >
            <Button size="small" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }} align="middle">
        <Col flex="auto">
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
            {t('notification.template.title', 'Template Management')}
          </h1>
        </Col>
        <Col>
          <HelpButton
            title="Template Management Help"
            description="Create and manage notification templates with support for multiple languages and dynamic variables."
            features={[
              'Create multi-language templates',
              'Dynamic variable support',
              'Rich text editor',
              'Preview templates',
              'Version history',
              'Template validation',
            ]}
            tips={[
              'Use clear variable names',
              'Support both English and Arabic',
              'Test with sample data',
              'Save drafts before publishing',
              'Use consistent formatting',
            ]}
          />
        </Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
          >
            {t('notification.template.create', 'Create Template')}
          </Button>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={templates}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {/* Create Template Modal */}
      <Modal
        title={t('notification.template.createNew', 'Create Template')}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateTemplate}
        >
          <Form.Item
            label={t('notification.template.name', 'Template Name')}
            name="templateName"
            rules={[{ required: true, message: t('common.required', 'Required') }]}
          >
            <Input placeholder={t('notification.template.namePlaceholder', 'e.g., appointment_reminder_en')} />
          </Form.Item>

          <Form.Item
            label={t('notification.template.type', 'Template Type')}
            name="templateType"
            rules={[{ required: true, message: t('common.required', 'Required') }]}
          >
            <Select placeholder={t('notification.template.selectType', 'Select type')} options={templateTypes} />
          </Form.Item>

          <Form.Item
            label={t('notification.template.notificationType', 'Notification Type')}
            name="notificationType"
            rules={[{ required: true, message: t('common.required', 'Required') }]}
          >
            <Select
              placeholder={t('notification.template.selectNotificationType', 'Select type')}
              options={notificationTypes}
            />
          </Form.Item>

          <Form.Item
            label={t('notification.template.language', 'Language')}
            name="language"
            rules={[{ required: true, message: t('common.required', 'Required') }]}
          >
            <Select placeholder={t('notification.template.selectLanguage', 'Select language')} options={languages} />
          </Form.Item>

          <Form.Item label={t('notification.template.subject', 'Subject')} name="subject">
            <Input placeholder={t('notification.template.subjectPlaceholder', 'Subject line (for email)')} />
          </Form.Item>

          <Form.Item
            label={t('notification.template.body', 'Body')}
            name="body"
            rules={[{ required: true, message: t('common.required', 'Required') }]}
          >
            <Input.TextArea
              rows={6}
              placeholder={t('notification.template.bodyPlaceholder', 'Template body. Use {{variableName}} for variables')}
            />
          </Form.Item>

          <Form.Item label={t('notification.template.variables', 'Expected Variables')} name="expectedVariables">
            <Input
              placeholder={t('notification.template.variablesPlaceholder', 'Comma-separated: beneficiaryName,appointmentDate')}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {t('notification.template.create', 'Create Template')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Template Drawer */}
      <Drawer
        title={t('notification.template.editTemplate', 'Edit Template')}
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible && selectedTemplate}
        width={600}
      >
        {selectedTemplate && (
          <Form
            layout="vertical"
            initialValues={selectedTemplate}
            onFinish={(values) => handleUpdateTemplate(selectedTemplate.id, values)}
          >
            <Form.Item label={t('notification.template.name', 'Template Name')}>
              <Input value={selectedTemplate.templateName} disabled />
            </Form.Item>

            <Form.Item label={t('notification.template.subject', 'Subject')}>
              <Input.TextArea rows={2} defaultValue={selectedTemplate.subject} />
            </Form.Item>

            <Form.Item label={t('notification.template.body', 'Body')}>
              <Input.TextArea rows={8} defaultValue={selectedTemplate.body} />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                {t('common.save', 'Save')}
              </Button>
            </Form.Item>
          </Form>
        )}
      </Drawer>

      {/* Preview Modal */}
      <Modal
        title={t('notification.template.preview', 'Template Preview')}
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedTemplate && previewData && (
          <Card>
            {selectedTemplate.templateType === 'EMAIL' && (
              <>
                <p>
                  <strong>{t('notification.template.subject', 'Subject')}:</strong>
                </p>
                <Card style={{ background: '#fafafa', marginBottom: '16px' }}>
                  {replaceVariables(selectedTemplate.subject, previewData)}
                </Card>

                <p>
                  <strong>{t('notification.template.body', 'Body')}:</strong>
                </p>
              </>
            )}

            <Card style={{ background: '#fafafa', whiteSpace: 'pre-wrap' }}>
              {replaceVariables(selectedTemplate.body, previewData)}
            </Card>

            <div style={{ marginTop: '16px', fontSize: '12px', color: '#999' }}>
              <p>{t('notification.template.previewNote', 'This is a preview with sample data')}</p>
              <p>
                <strong>{t('notification.template.variables', 'Variables used')}:</strong>
              </p>
              <ul>
                {selectedTemplate.expectedVariables?.split(',').map((v) => (
                  <li key={v}>{v.trim()}</li>
                ))}
              </ul>
            </div>
          </Card>
        )}
      </Modal>
    </div>
  );
};

export default TemplateManagement;
