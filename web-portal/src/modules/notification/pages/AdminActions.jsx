import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Button,
  Input,
  Select,
  message,
  Modal,
  Upload,
  Table,
  Tabs,
  Space,
  Divider,
  DatePicker,
  TimePicker,
  Row,
  Col,
  Tag,
  Spin,
  Alert,
  Progress,
  List,
} from 'antd';
import {
  SendOutlined,
  UploadOutlined,
  PlayCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  TeamOutlined,
  SettingOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { notificationApi } from '../api/notificationApi';
import { useAuth } from '../../../auth/useAuth';
import { useTranslation } from 'react-i18next';
import HelpButton from '../components/HelpButton';

const AdminActions = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [bulkForm] = Form.useForm();
  const [campaignForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('manual');
  const [bulkRecipients, setBulkRecipients] = useState([]);
  const [bulkUploadedFile, setBulkUploadedFile] = useState(null);
  const [bulkPreviewVisible, setBulkPreviewVisible] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [recentActions, setRecentActions] = useState([]);

  useEffect(() => {
    loadRecentActions();
    loadScheduledCampaigns();
  }, []);

  const loadRecentActions = async () => {
    try {
      const data = await notificationApi.getRecentAdminActions();
      setRecentActions(data || []);
    } catch (error) {
      console.error('Failed to load recent actions', error);
    }
  };

  const loadScheduledCampaigns = async () => {
    try {
      const data = await notificationApi.getScheduledCampaigns();
      setCampaigns(data || []);
    } catch (error) {
      console.error('Failed to load campaigns', error);
    }
  };

  /* ===== MANUAL NOTIFICATION ===== */
  const handleSendManualNotification = async (values) => {
    try {
      setLoading(true);
      await notificationApi.sendManualNotification({
        beneficiaryId: values.beneficiaryId,
        notificationType: values.notificationType || 'BULK_MESSAGE',
        title: values.title,
        message: values.message,
        preferredChannel: values.channel,
      });
      message.success('Notification sent successfully');
      form.resetFields();
      loadRecentActions();
    } catch (error) {
      message.error(t('common.error') || 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  /* ===== BULK NOTIFICATION ===== */
  const handleParseBulkRecipients = (text) => {
    if (!text) return [];

    // Parse different formats: email@example.com or +1234567890
    const lines = text.split('\n').filter(line => line.trim());
    const recipients = lines.map((line) => {
      const trimmed = line.trim();
      const isEmail = trimmed.includes('@');
      return {
        id: Math.random(),
        value: trimmed,
        type: isEmail ? 'EMAIL' : 'PHONE',
        isValid: isEmail ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) : /^\+?[1-9]\d{1,14}$/.test(trimmed),
      };
    });
    return recipients;
  };

  const handleBulkRecipientsChange = (e) => {
    const text = e.target.value;
    const parsed = handleParseBulkRecipients(text);
    setBulkRecipients(parsed);
  };

  const handleBulkUpload = (file) => {
    setBulkUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const parsed = handleParseBulkRecipients(text);
      setBulkRecipients(parsed);
      bulkForm.setFieldValue('recipientsList', text);
    };
    reader.readAsText(file);
    return false;
  };

  const handleSendBulkNotification = async (values) => {
    if (bulkRecipients.length === 0) {
      message.error('Please add at least one recipient');
      return;
    }

    const invalidCount = bulkRecipients.filter((r) => !r.isValid).length;
    if (invalidCount > 0) {
      Modal.confirm({
        title: 'Invalid Recipients',
        content: `${invalidCount} invalid email/phone numbers found. Continue anyway?`,
        onOk: () => sendBulkNotification(values),
      });
    } else {
      sendBulkNotification(values);
    }
  };

  const sendBulkNotification = async (values) => {
    try {
      setLoading(true);
      const validRecipients = bulkRecipients.filter((r) => r.isValid);
      await notificationApi.sendBulkNotification({
        recipients: validRecipients.map((r) => r.value),
        notificationType: values.notificationType || 'BULK_MESSAGE',
        title: values.title,
        message: values.message,
        preferredChannel: values.channel,
      });
      message.success(`Bulk notification queued for ${validRecipients.length} recipients`);
      bulkForm.resetFields();
      setBulkRecipients([]);
      loadRecentActions();
    } catch (error) {
      message.error(t('common.error') || 'Failed to send bulk notification');
    } finally {
      setLoading(false);
    }
  };

  /* ===== CAMPAIGN SCHEDULING ===== */
  const handleScheduleCampaign = async (values) => {
    try {
      setLoading(true);
      await notificationApi.scheduleCampaign({
        campaignId: values.campaignId,
        scheduledFor: values.scheduledDateTime.format('YYYY-MM-DD HH:mm:ss'),
      });
      message.success('Campaign scheduled successfully');
      campaignForm.resetFields();
      loadScheduledCampaigns();
      loadRecentActions();
    } catch (error) {
      message.error(t('common.error') || 'Failed to schedule campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelScheduledCampaign = async (campaignId) => {
    Modal.confirm({
      title: 'Cancel Scheduled Campaign?',
      content: 'This action cannot be undone',
      okText: 'Cancel Campaign',
      okType: 'danger',
      onOk: async () => {
        try {
          setLoading(true);
          await notificationApi.cancelScheduledCampaign(campaignId);
          message.success('Campaign cancelled');
          loadScheduledCampaigns();
        } catch (error) {
          message.error(t('common.error') || 'Failed to cancel campaign');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  /* ===== TAB CONTENTS ===== */
  const manualTab = (
    <Form form={form} layout="vertical" onFinish={handleSendManualNotification}>
      <Card title="Send Manual Notification" className="mb-6">
        <Form.Item
          name="beneficiaryId"
          label="Beneficiary ID or Email"
          rules={[{ required: true, message: 'Please select a beneficiary' }]}
        >
          <Input placeholder="Search beneficiary by ID or email" />
        </Form.Item>

        <Form.Item
          name="notificationType"
          label="Notification Type"
          initialValue="BULK_MESSAGE"
        >
          <Select
            options={[
              { label: 'Bulk Message', value: 'BULK_MESSAGE' },
              { label: 'System Alert', value: 'SYSTEM_ALERT' },
              { label: 'Appointment Update', value: 'APPOINTMENT_UPDATE' },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="title"
          label="Title"
          rules={[{ required: true, message: 'Please enter title' }]}
        >
          <Input maxLength={100} placeholder="Notification title" />
        </Form.Item>

        <Form.Item
          name="message"
          label="Message"
          rules={[{ required: true, message: 'Please enter message' }]}
        >
          <Input.TextArea
            rows={4}
            maxLength={500}
            placeholder="Notification message"
            showCount
          />
        </Form.Item>

        <Form.Item
          name="channel"
          label="Channel (optional - uses user preference if not selected)"
          initialValue={null}
        >
          <Select
            allowClear
            placeholder="Leave empty to use user preference"
            options={[
              { label: 'Email', value: 'EMAIL' },
              { label: 'SMS', value: 'SMS' },
              { label: 'Push', value: 'PUSH' },
              { label: 'Auto (Best Available)', value: 'AUTO' },
            ]}
          />
        </Form.Item>

        <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={loading} size="large" block>
          Send Notification
        </Button>
      </Card>
    </Form>
  );

  const bulkTab = (
    <Form form={bulkForm} layout="vertical" onFinish={handleSendBulkNotification}>
      <Card title="Bulk Notification" className="mb-6">
        <Alert
          message="Paste email addresses or phone numbers (one per line)"
          description="Supported formats: email@example.com or +1234567890"
          type="info"
          showIcon
          className="mb-4"
        />

        <Form.Item label="Recipients">
          <div className="mb-3">
            <Button icon={<UploadOutlined />} onClick={() => document.getElementById('bulk-file-input')?.click()}>
              Upload File
            </Button>
            <input
              id="bulk-file-input"
              type="file"
              accept=".txt,.csv"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files?.[0] && handleBulkUpload(e.target.files[0])}
            />
          </div>

          <Form.Item
            name="recipientsList"
            rules={[{ required: true, message: 'Please add recipients' }]}
          >
            <Input.TextArea
              rows={8}
              placeholder="Paste recipients here&#10;email@example.com&#10;another@example.com&#10;+1234567890"
              onChange={handleBulkRecipientsChange}
            />
          </Form.Item>

          {bulkRecipients.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 rounded">
              <div className="flex justify-between items-center">
                <span>
                  <strong>Total:</strong> {bulkRecipients.length} |
                  <strong className="ml-3" style={{ color: '#52c41a' }}>Valid:</strong> {bulkRecipients.filter((r) => r.isValid).length} |
                  <strong className="ml-3" style={{ color: '#ff4d4f' }}>Invalid:</strong> {bulkRecipients.filter((r) => !r.isValid).length}
                </span>
                <Button size="small" onClick={() => setBulkPreviewVisible(true)}>
                  Preview
                </Button>
              </div>
            </div>
          )}
        </Form.Item>

        <Form.Item
          name="notificationType"
          label="Notification Type"
          initialValue="BULK_MESSAGE"
        >
          <Select
            options={[
              { label: 'Bulk Message', value: 'BULK_MESSAGE' },
              { label: 'Campaign', value: 'CAMPAIGN' },
              { label: 'Announcement', value: 'ANNOUNCEMENT' },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="title"
          label="Title"
          rules={[{ required: true, message: 'Please enter title' }]}
        >
          <Input maxLength={100} placeholder="Notification title" />
        </Form.Item>

        <Form.Item
          name="message"
          label="Message"
          rules={[{ required: true, message: 'Please enter message' }]}
        >
          <Input.TextArea
            rows={4}
            maxLength={500}
            placeholder="Notification message"
            showCount
          />
        </Form.Item>

        <Form.Item
          name="channel"
          label="Channel"
          initialValue="AUTO"
        >
          <Select
            options={[
              { label: 'Email', value: 'EMAIL' },
              { label: 'SMS', value: 'SMS' },
              { label: 'Push', value: 'PUSH' },
              { label: 'Auto (Best Available)', value: 'AUTO' },
            ]}
          />
        </Form.Item>

        <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={loading} size="large" block>
          Send to {bulkRecipients.filter((r) => r.isValid).length} Recipients
        </Button>
      </Card>
    </Form>
  );

  const campaignTab = (
    <Form form={campaignForm} layout="vertical" onFinish={handleScheduleCampaign}>
      <Card title="Schedule Campaign" className="mb-6">
        <Form.Item
          name="campaignId"
          label="Campaign"
          rules={[{ required: true, message: 'Please select a campaign' }]}
        >
          <Select
            placeholder="Select campaign to schedule"
            options={campaigns.map((c) => ({
              label: `${c.name} (${c.targetCount} recipients)`,
              value: c.id,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="scheduledDateTime"
          label="Schedule For"
          rules={[{ required: true, message: 'Please select date and time' }]}
        >
          <DatePicker.RangePicker
            showTime
            placeholder={['Start Date', 'End Date']}
          />
        </Form.Item>

        <Button type="primary" htmlType="submit" icon={<PlayCircleOutlined />} loading={loading} size="large" block>
          Schedule Campaign
        </Button>
      </Card>

      {/* Scheduled Campaigns List */}
      <Card title="Scheduled Campaigns">
        {campaigns.length === 0 ? (
          <p className="text-gray-500">No scheduled campaigns</p>
        ) : (
          <Table
            columns={[
              {
                title: 'Name',
                dataIndex: 'name',
                key: 'name',
              },
              {
                title: 'Recipients',
                dataIndex: 'targetCount',
                key: 'targetCount',
                render: (count) => <span>{count} recipients</span>,
              },
              {
                title: 'Scheduled For',
                dataIndex: 'scheduledFor',
                key: 'scheduledFor',
                render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
              },
              {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                render: (status) => {
                  const colors = {
                    DRAFT: 'default',
                    SCHEDULED: 'processing',
                    ACTIVE: 'success',
                    PAUSED: 'warning',
                  };
                  return <Tag color={colors[status]}>{status}</Tag>;
                },
              },
              {
                title: 'Action',
                key: 'action',
                render: (_, record) => (
                  <Button
                    size="small"
                    danger
                    onClick={() => handleCancelScheduledCampaign(record.id)}
                  >
                    Cancel
                  </Button>
                ),
              },
            ]}
            dataSource={campaigns}
            rowKey="id"
            pagination={false}
          />
        )}
      </Card>
    </Form>
  );

  const settingsTab = (
    <Card title="Notification Settings">
      <Alert
        message="Global notification settings"
        description="These settings apply to all notifications sent through the system"
        type="info"
        showIcon
        className="mb-4"
      />

      <Row gutter={16}>
        <Col span={24}>
          <h3 className="font-semibold mb-3">Default Channel Preferences</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span>Default Preferred Channel</span>
              <Select
                style={{ width: '200px' }}
                defaultValue="EMAIL"
                options={[
                  { label: 'Email', value: 'EMAIL' },
                  { label: 'SMS', value: 'SMS' },
                  { label: 'Push', value: 'PUSH' },
                ]}
              />
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span>Enable Multi-Channel Fallback</span>
              <Select
                style={{ width: '200px' }}
                defaultValue="true"
                options={[
                  { label: 'Yes', value: 'true' },
                  { label: 'No', value: 'false' },
                ]}
              />
            </div>
          </div>
        </Col>
      </Row>

      <Divider />

      <Row gutter={16}>
        <Col span={24}>
          <h3 className="font-semibold mb-3">Rate Limiting</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span>Notifications per Second</span>
              <Input type="number" defaultValue={100} style={{ width: '200px' }} />
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span>Burst Capacity</span>
              <Input type="number" defaultValue={200} style={{ width: '200px' }} />
            </div>
          </div>
        </Col>
      </Row>

      <Divider />

      <Space>
        <Button type="primary" onClick={() => message.success('Settings saved')}>
          Save Settings
        </Button>
        <Button>Reset to Default</Button>
      </Space>
    </Card>
  );

  const tabItems = [
    {
      key: 'manual',
      label: <>Manual Notification</>,
      children: manualTab,
    },
    {
      key: 'bulk',
      label: <>Bulk Notification</>,
      children: bulkTab,
    },
    {
      key: 'campaign',
      label: <>Schedule Campaign</>,
      children: campaignTab,
    },
    {
      key: 'settings',
      label: <>Settings</>,
      children: settingsTab,
    },
  ];

  return (
    <Spin spinning={loading}>
      <div className="p-6">
        <Space style={{ width: '100%', marginBottom: '24px', justifyContent: 'space-between' }}>
          <h1 className="text-3xl font-bold">Admin Actions</h1>
          <HelpButton
            title="Admin Actions Help"
            description="Send manual notifications, bulk messages, and manage notification campaigns with full control over recipients and channels."
            features={[
              'Send individual notifications to specific beneficiaries',
              'Bulk send to multiple recipients via email, SMS, or phone',
              'Create and schedule notification campaigns',
              'Track notification status and delivery',
              'Support for multiple notification types (manual, bulk, campaign)',
            ]}
            tips={[
              'Use bulk recipient import for large lists - paste emails or phone numbers, one per line',
              'Emails must be in format: example@domain.com',
              'Phone numbers should include country code: +1234567890',
              'Preview bulk recipients before sending to verify data validity',
              'Scheduled campaigns run in background - check logs for progress',
            ]}
            examples={[
              'Send a one-off notification to a single user about an appointment reminder',
              'Import 500 email addresses and send a bulk campaign notification',
              'Schedule an automated campaign for tomorrow at 8:00 AM',
              'Send an SMS to all users with pending appointments',
            ]}
          />
        </Space>

        {/* Recent Actions */}
        <Card title="Recent Actions" className="mb-6">
          {recentActions.length === 0 ? (
            <p className="text-gray-500">No recent actions</p>
          ) : (
            <List
              dataSource={recentActions}
              renderItem={(action) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      action.type === 'MANUAL' ? (
                        <SendOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                      ) : action.type === 'BULK' ? (
                        <TeamOutlined style={{ fontSize: '20px', color: '#52c41a' }} />
                      ) : (
                        <PlayCircleOutlined style={{ fontSize: '20px', color: '#faad14' }} />
                      )
                    }
                    title={`${action.type} - ${action.title}`}
                    description={`${action.status} · ${dayjs(action.createdAt).fromNow()}`}
                  />
                  <div>
                    {action.type === 'MANUAL' && <span>{action.recipientCount} recipient</span>}
                    {action.type === 'BULK' && <span>{action.recipientCount} recipients</span>}
                    {action.type === 'CAMPAIGN' && <span>{action.recipientCount} recipients</span>}
                  </div>
                </List.Item>
              )}
            />
          )}
        </Card>

        {/* Tabs */}
        <Card>
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
        </Card>
      </div>

      {/* Bulk Recipients Preview Modal */}
      <Modal
        title="Recipients Preview"
        open={bulkPreviewVisible}
        onCancel={() => setBulkPreviewVisible(false)}
        footer={null}
        width={700}
      >
        <Table
          columns={[
            {
              title: 'Value',
              dataIndex: 'value',
              key: 'value',
            },
            {
              title: 'Type',
              dataIndex: 'type',
              key: 'type',
              render: (type) => <Tag color={type === 'EMAIL' ? 'blue' : 'green'}>{type}</Tag>,
            },
            {
              title: 'Valid',
              dataIndex: 'isValid',
              key: 'isValid',
              render: (valid) => (
                valid ? (
                  <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
                ) : (
                  <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: '16px' }} />
                )
              ),
            },
          ]}
          dataSource={bulkRecipients}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Modal>
    </Spin>
  );
};

export default AdminActions;
