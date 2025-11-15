import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Space,
  Tag,
  Tooltip,
  Popconfirm,
  Drawer,
  Progress,
  Statistic,
  Row,
  Col,
  Card,
  Empty,
  Spin,
  message,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  EyeOutlined,
  DownloadOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { notificationApi } from '../api/notificationApi';
import HelpButton from '../components/HelpButton';

/**
 * Campaigns Management
 * Create, edit, pause, resume campaigns and track progress
 */
const CampaignsManagement = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [notificationTypes, setNotificationTypes] = useState([
    { value: 'APPOINTMENT_CREATED', label: 'Appointment Created' },
    { value: 'APPOINTMENT_REMINDER', label: 'Appointment Reminder' },
    { value: 'APPOINTMENT_CANCELLED', label: 'Appointment Cancelled' },
    { value: 'BULK_MESSAGE', label: 'Bulk Message' },
  ]);

  useEffect(() => {
    fetchCampaigns();
    fetchTemplates();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const response = await notificationApi.getCampaigns();
      setCampaigns(response.data || []);
    } catch (error) {
      message.error(t('common.error.fetchFailed', 'Failed to fetch campaigns'));
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await notificationApi.getTemplates();
      setTemplates(response.data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleCreateCampaign = async (values) => {
    try {
      const payload = {
        ...values,
        scheduledFor: values.scheduledFor ? values.scheduledFor.toISOString() : null,
      };
      await notificationApi.createCampaign(payload);
      message.success(t('notification.campaign.createdSuccess', 'Campaign created successfully'));
      setModalVisible(false);
      form.resetFields();
      fetchCampaigns();
    } catch (error) {
      message.error(t('notification.campaign.createFailed', 'Failed to create campaign'));
      console.error('Error creating campaign:', error);
    }
  };

  const handleSendCampaign = async (campaignId) => {
    try {
      await notificationApi.sendCampaign(campaignId);
      message.success(t('notification.campaign.sentSuccess', 'Campaign started'));
      fetchCampaigns();
    } catch (error) {
      message.error(t('notification.campaign.sendFailed', 'Failed to send campaign'));
    }
  };

  const handlePauseCampaign = async (campaignId) => {
    try {
      await notificationApi.pauseCampaign(campaignId);
      message.success(t('notification.campaign.pausedSuccess', 'Campaign paused'));
      fetchCampaigns();
    } catch (error) {
      message.error(t('notification.campaign.pauseFailed', 'Failed to pause campaign'));
    }
  };

  const handleResumeCampaign = async (campaignId) => {
    try {
      await notificationApi.resumeCampaign(campaignId);
      message.success(t('notification.campaign.resumedSuccess', 'Campaign resumed'));
      fetchCampaigns();
    } catch (error) {
      message.error(t('notification.campaign.resumeFailed', 'Failed to resume campaign'));
    }
  };

  const handleViewProgress = async (campaign) => {
    setSelectedCampaign(campaign);
    setDrawerVisible(true);
  };

  const handleDeleteCampaign = async (campaignId) => {
    try {
      await notificationApi.deleteCampaign(campaignId);
      message.success(t('notification.campaign.deletedSuccess', 'Campaign deleted'));
      fetchCampaigns();
    } catch (error) {
      message.error(t('notification.campaign.deleteFailed', 'Failed to delete campaign'));
    }
  };

  const handleExportResults = async (campaignId) => {
    try {
      await notificationApi.exportCampaignResults(campaignId);
      message.success(t('notification.campaign.exportedSuccess', 'Results exported'));
    } catch (error) {
      message.error(t('notification.campaign.exportFailed', 'Failed to export results'));
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: 'default',
      SCHEDULED: 'processing',
      ACTIVE: 'success',
      PAUSED: 'warning',
      COMPLETED: 'success',
      FAILED: 'error',
    };
    return colors[status] || 'default';
  };

  const columns = [
    {
      title: t('notification.common.name', 'Name'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('notification.common.type', 'Type'),
      dataIndex: 'notificationType',
      key: 'notificationType',
    },
    {
      title: t('notification.campaign.targetCount', 'Target Count'),
      dataIndex: 'targetBeneficiaryCount',
      key: 'targetBeneficiaryCount',
    },
    {
      title: t('notification.common.status', 'Status'),
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
    {
      title: t('notification.campaign.progress', 'Progress'),
      dataIndex: 'progressPercentage',
      key: 'progressPercentage',
      render: (progress) => (
        <Progress
          type="circle"
          percent={parseFloat(progress) || 0}
          width={50}
          format={(percent) => `${percent}%`}
        />
      ),
    },
    {
      title: t('notification.campaign.scheduledFor', 'Scheduled For'),
      dataIndex: 'scheduledFor',
      key: 'scheduledFor',
      render: (date) => (date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: t('common.actions', 'Actions'),
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={t('notification.campaign.viewProgress', 'View Progress')}>
            <Button
              type="primary"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewProgress(record)}
            />
          </Tooltip>
          {record.status === 'DRAFT' && (
            <Tooltip title={t('notification.campaign.send', 'Send Campaign')}>
              <Button
                type="primary"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => handleSendCampaign(record.id)}
              />
            </Tooltip>
          )}
          {record.status === 'ACTIVE' && (
            <Tooltip title={t('notification.campaign.pause', 'Pause')}>
              <Button
                size="small"
                icon={<PauseCircleOutlined />}
                onClick={() => handlePauseCampaign(record.id)}
              />
            </Tooltip>
          )}
          {record.status === 'PAUSED' && (
            <Tooltip title={t('notification.campaign.resume', 'Resume')}>
              <Button
                type="primary"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => handleResumeCampaign(record.id)}
              />
            </Tooltip>
          )}
          <Tooltip title={t('notification.campaign.export', 'Export')}>
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => handleExportResults(record.id)}
            />
          </Tooltip>
          <Popconfirm
            title={t('common.deleteConfirm', 'Delete?')}
            onConfirm={() => handleDeleteCampaign(record.id)}
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
            {t('notification.campaign.title', 'Campaigns Management')}
          </h1>
        </Col>
        <Col>
          <HelpButton
            title="Campaigns Management Help"
            description="Create, manage, and schedule bulk notification campaigns. Monitor progress and delivery status."
            features={[
              'Create bulk campaigns',
              'Schedule for future dates',
              'Monitor progress%',
              'Filter by status',
              'Export results',
              'Pause/Resume campaigns',
            ]}
            tips={[
              'Name campaigns descriptively',
              'Schedule off-peak hours',
              'Always preview template first',
              'Monitor progress in logs',
              'Use filters to find campaigns',
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
            {t('notification.campaign.create', 'Create Campaign')}
          </Button>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('notification.campaign.totalCampaigns', 'Total')}
              value={campaigns.length}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('notification.campaign.activeCampaigns', 'Active')}
              value={campaigns.filter((c) => c.status === 'ACTIVE').length}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('notification.campaign.completedCampaigns', 'Completed')}
              value={campaigns.filter((c) => c.status === 'COMPLETED').length}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('notification.campaign.failedCampaigns', 'Failed')}
              value={campaigns.filter((c) => c.status === 'FAILED').length}
            />
          </Card>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={campaigns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {/* Create Campaign Modal */}
      <Modal
        title={t('notification.campaign.createNew', 'Create Campaign')}
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
          onFinish={handleCreateCampaign}
        >
          <Form.Item
            label={t('notification.common.name', 'Name')}
            name="name"
            rules={[{ required: true, message: t('common.required', 'Required') }]}
          >
            <Input placeholder={t('notification.campaign.namePlaceholder', 'Campaign name')} />
          </Form.Item>

          <Form.Item
            label={t('notification.common.description', 'Description')}
            name="description"
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item
            label={t('notification.common.type', 'Notification Type')}
            name="notificationType"
            rules={[{ required: true, message: t('common.required', 'Required') }]}
          >
            <Select
              placeholder={t('notification.campaign.selectType', 'Select type')}
              options={notificationTypes}
            />
          </Form.Item>

          <Form.Item
            label={t('notification.common.template', 'Template')}
            name="templateId"
            rules={[{ required: true, message: t('common.required', 'Required') }]}
          >
            <Select
              placeholder={t('notification.campaign.selectTemplate', 'Select template')}
              options={templates.map((t) => ({
                value: t.id,
                label: `${t.templateName} (${t.language})`,
              }))}
            />
          </Form.Item>

          <Form.Item
            label={t('notification.campaign.targetCount', 'Target Beneficiary Count')}
            name="targetBeneficiaryCount"
            rules={[{ required: true, message: t('common.required', 'Required') }]}
          >
            <Input type="number" min="1" />
          </Form.Item>

          <Form.Item
            label={t('notification.campaign.preferredChannel', 'Preferred Channel')}
            name="preferredChannel"
            rules={[{ required: true, message: t('common.required', 'Required') }]}
          >
            <Select
              options={[
                { value: 'EMAIL', label: 'Email' },
                { value: 'SMS', label: 'SMS' },
                { value: 'PUSH', label: 'Push Notification' },
              ]}
            />
          </Form.Item>

          <Form.Item
            label={t('notification.campaign.scheduledFor', 'Scheduled For')}
            name="scheduledFor"
          >
            <DatePicker showTime />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {t('notification.campaign.create', 'Create Campaign')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Progress Drawer */}
      <Drawer
        title={t('notification.campaign.progress', 'Campaign Progress')}
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={500}
      >
        {selectedCampaign && (
          <div>
            <Card style={{ marginBottom: '16px' }}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title={t('notification.campaign.targetCount', 'Target')}
                    value={selectedCampaign.targetBeneficiaryCount}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title={t('notification.common.sent', 'Sent')}
                    value={selectedCampaign.successCount}
                  />
                </Col>
              </Row>
            </Card>

            <Card style={{ marginBottom: '16px' }}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title={t('notification.common.failed', 'Failed')}
                    value={selectedCampaign.failureCount}
                    valueStyle={{ color: '#f5222d' }}
                  />
                </Col>
                <Col span={12}>
                  <Progress
                    type="circle"
                    percent={parseFloat(selectedCampaign.progressPercentage) || 0}
                    format={(percent) => `${percent}%`}
                  />
                </Col>
              </Row>
            </Card>

            <Card title={t('notification.campaign.details', 'Details')}>
              <p>
                <strong>{t('notification.common.name', 'Name')}:</strong> {selectedCampaign.name}
              </p>
              <p>
                <strong>{t('notification.common.status', 'Status')}:</strong>{' '}
                <Tag color={getStatusColor(selectedCampaign.status)}>{selectedCampaign.status}</Tag>
              </p>
              <p>
                <strong>{t('notification.campaign.scheduledFor', 'Scheduled For')}:</strong>{' '}
                {dayjs(selectedCampaign.scheduledFor).format('YYYY-MM-DD HH:mm')}
              </p>
              <p>
                <strong>{t('notification.campaign.startedAt', 'Started At')}:</strong>{' '}
                {selectedCampaign.startedAt ? dayjs(selectedCampaign.startedAt).format('YYYY-MM-DD HH:mm') : '-'}
              </p>
              <p>
                <strong>{t('notification.campaign.completedAt', 'Completed At')}:</strong>{' '}
                {selectedCampaign.completedAt ? dayjs(selectedCampaign.completedAt).format('YYYY-MM-DD HH:mm') : '-'}
              </p>
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default CampaignsManagement;
