import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Drawer,
  Spin,
  message,
  Input,
  Select,
  DatePicker,
  Tag,
  Row,
  Col,
  Statistic,
  Timeline,
  Badge,
  Tooltip,
} from 'antd';
import {
  DownloadOutlined,
  EyeOutlined,
  FilterOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  MailOutlined,
  PhoneOutlined,
  BellOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { notificationApi } from '../api/notificationApi';
import { useTranslation } from 'react-i18next';
import HelpButton from '../components/HelpButton';

const LogsTracking = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [filters, setFilters] = useState({
    status: 'ALL',
    channel: 'ALL',
    dateRange: [null, null],
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [stats, setStats] = useState({
    totalSent: 0,
    totalSuccessful: 0,
    totalFailed: 0,
    totalRetrying: 0,
    successRate: 0,
  });

  useEffect(() => {
    loadNotifications();
    loadStats();
  }, [pagination.current, filters]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationApi.getNotificationLogs({
        page: pagination.current - 1,
        size: pagination.pageSize,
        status: filters.status === 'ALL' ? undefined : filters.status,
        channel: filters.channel === 'ALL' ? undefined : filters.channel,
        startDate: filters.dateRange[0]?.format('YYYY-MM-DD'),
        endDate: filters.dateRange[1]?.format('YYYY-MM-DD'),
      });
      setNotifications(response.content || []);
      setPagination((prev) => ({
        ...prev,
        total: response.totalElements || 0,
      }));
    } catch (error) {
      message.error(t('common.error') || 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await notificationApi.getAnalyticsSummary();
      setStats({
        totalSent: data.totalNotificationsSent || 0,
        totalSuccessful: data.totalSuccessfulNotifications || 0,
        totalFailed: data.totalFailedNotifications || 0,
        totalRetrying: data.totalRetryingNotifications || 0,
        successRate: data.successRate || 0,
      });
    } catch (error) {
      console.error('Failed to load stats', error);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      await notificationApi.exportNotificationLogs({
        status: filters.status === 'ALL' ? undefined : filters.status,
        channel: filters.channel === 'ALL' ? undefined : filters.channel,
        startDate: filters.dateRange[0]?.format('YYYY-MM-DD'),
        endDate: filters.dateRange[1]?.format('YYYY-MM-DD'),
      });
      message.success('Export started. File will be downloaded shortly');
    } catch (error) {
      message.error(t('common.error') || 'Failed to export logs');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'SENT':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'FAILED':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'RETRYING':
        return <ClockCircleOutlined style={{ color: '#faad14' }} />;
      case 'PENDING':
        return <ClockCircleOutlined style={{ color: '#1890ff' }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'SENT':
        return 'success';
      case 'FAILED':
        return 'error';
      case 'RETRYING':
        return 'warning';
      case 'PENDING':
        return 'processing';
      default:
        return 'default';
    }
  };

  const getChannelIcon = (channel) => {
    switch (channel) {
      case 'EMAIL':
        return <MailOutlined />;
      case 'SMS':
        return <PhoneOutlined />;
      case 'PUSH':
        return <BellOutlined />;
      default:
        return null;
    }
  };

  const getChannelColor = (channel) => {
    switch (channel) {
      case 'EMAIL':
        return 'blue';
      case 'SMS':
        return 'green';
      case 'PUSH':
        return 'purple';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: 'Notification ID',
      dataIndex: 'id',
      key: 'id',
      width: 200,
      render: (id) => <span className="font-mono text-xs">{id?.substring(0, 12)}...</span>,
      ellipsis: {
        showTitle: false,
      },
      render: (id) => (
        <Tooltip title={id}>
          <span className="font-mono text-xs">{id?.substring(0, 12)}...</span>
        </Tooltip>
      ),
    },
    {
      title: 'Recipient',
      dataIndex: 'beneficiaryId',
      key: 'beneficiaryId',
      width: 150,
      render: (id, record) => (
        <div>
          <p className="font-semibold">{record.recipientName}</p>
          <p className="text-xs text-gray-500 font-mono">{record.recipientEmail || record.recipientPhone}</p>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'notificationType',
      key: 'notificationType',
      width: 150,
      render: (type) => (
        <Tag color="blue">{type?.replace(/_/g, ' ')}</Tag>
      ),
    },
    {
      title: 'Channel',
      dataIndex: 'channel',
      key: 'channel',
      width: 100,
      render: (channel) => (
        <Tag icon={getChannelIcon(channel)} color={getChannelColor(channel)}>
          {channel}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag icon={getStatusIcon(status)} color={getStatusColor(status)}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Sent At',
      dataIndex: 'sentAt',
      key: 'sentAt',
      width: 170,
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a, b) => new Date(a.sentAt) - new Date(b.sentAt),
    },
    {
      title: 'Retries',
      dataIndex: 'retryCount',
      key: 'retryCount',
      width: 80,
      render: (count) => count || 0,
    },
    {
      title: 'Provider ID',
      dataIndex: 'providerMessageId',
      key: 'providerMessageId',
      width: 150,
      render: (id) => (
        <Tooltip title={id}>
          <span className="font-mono text-xs">{id?.substring(0, 15)}...</span>
        </Tooltip>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedNotification(record);
            setDrawerVisible(true);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <Spin spinning={loading}>
      <div className="p-6">
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }} align="middle">
          <Col flex="auto">
            <h1 className="text-3xl font-bold mb-0">Notification Logs & Tracking</h1>
          </Col>
          <Col>
            <HelpButton
              title="Logs & Tracking Help"
              description="Monitor all notification delivery attempts, failures, and retries. Debug issues and track performance."
              features={[
                'Real-time notification logs',
                'Filter by status/channel/recipient',
                'View failure reasons',
                'Retry failed notifications',
                'Export logs',
                'Performance metrics',
              ]}
              tips={[
                'Check logs when notifications fail',
                'Look for provider error codes',
                'Monitor retry attempts',
                'Use timestamps to debug timing issues',
                'Export for audit trails',
              ]}
            />
          </Col>
        </Row>

        {/* Stats Cards */}
        <Row gutter={16} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Sent"
                value={stats.totalSent}
                prefix={<MailOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Successful"
                value={stats.totalSuccessful}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Failed"
                value={stats.totalFailed}
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<CloseCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Success Rate"
                value={stats.successRate}
                suffix="%"
                valueStyle={{ color: stats.successRate > 90 ? '#52c41a' : '#faad14' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card className="mb-6">
          <div className="flex gap-3 flex-wrap items-end">
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label className="block text-sm font-medium mb-2">Status</label>
              <Select
                style={{ width: '100%' }}
                value={filters.status}
                onChange={(value) => {
                  setFilters({ ...filters, status: value });
                  setPagination({ ...pagination, current: 1 });
                }}
                options={[
                  { label: 'All', value: 'ALL' },
                  { label: 'Sent', value: 'SENT' },
                  { label: 'Failed', value: 'FAILED' },
                  { label: 'Retrying', value: 'RETRYING' },
                  { label: 'Pending', value: 'PENDING' },
                ]}
              />
            </div>

            <div style={{ flex: 1, minWidth: '200px' }}>
              <label className="block text-sm font-medium mb-2">Channel</label>
              <Select
                style={{ width: '100%' }}
                value={filters.channel}
                onChange={(value) => {
                  setFilters({ ...filters, channel: value });
                  setPagination({ ...pagination, current: 1 });
                }}
                options={[
                  { label: 'All', value: 'ALL' },
                  { label: 'Email', value: 'EMAIL' },
                  { label: 'SMS', value: 'SMS' },
                  { label: 'Push', value: 'PUSH' },
                ]}
              />
            </div>

            <div style={{ flex: 2, minWidth: '250px' }}>
              <label className="block text-sm font-medium mb-2">Date Range</label>
              <DatePicker.RangePicker
                style={{ width: '100%' }}
                value={filters.dateRange}
                onChange={(dates) => {
                  setFilters({ ...filters, dateRange: dates });
                  setPagination({ ...pagination, current: 1 });
                }}
              />
            </div>

            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  setFilters({ status: 'ALL', channel: 'ALL', dateRange: [null, null] });
                  setPagination({ ...pagination, current: 1 });
                }}
              >
                Reset
              </Button>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleExport}
              >
                Export
              </Button>
            </Space>
          </div>
        </Card>

        {/* Logs Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={notifications}
            rowKey="id"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              onChange: (page) =>
                setPagination({ ...pagination, current: page }),
              showSizeChanger: false,
            }}
            loading={loading}
            scroll={{ x: 1200 }}
          />
        </Card>
      </div>

      {/* Detail Drawer */}
      <Drawer
        title="Notification Details"
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={600}
      >
        {selectedNotification && (
          <div>
            {/* Header Info */}
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-3">Overview</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Notification ID:</span>
                  <span className="font-mono text-sm">{selectedNotification.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Tag
                    icon={getStatusIcon(selectedNotification.status)}
                    color={getStatusColor(selectedNotification.status)}
                  >
                    {selectedNotification.status}
                  </Tag>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Channel:</span>
                  <Tag icon={getChannelIcon(selectedNotification.channel)} color={getChannelColor(selectedNotification.channel)}>
                    {selectedNotification.channel}
                  </Tag>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <Tag color="blue">{selectedNotification.notificationType?.replace(/_/g, ' ')}</Tag>
                </div>
              </div>
            </div>

            {/* Recipient Info */}
            <div className="mb-6 p-4 bg-blue-50 rounded">
              <h3 className="font-bold mb-2">Recipient</h3>
              <p><strong>Name:</strong> {selectedNotification.recipientName}</p>
              <p><strong>Email:</strong> {selectedNotification.recipientEmail}</p>
              <p><strong>Phone:</strong> {selectedNotification.recipientPhone}</p>
            </div>

            {/* Content */}
            <div className="mb-6">
              <h3 className="font-bold mb-2">Content</h3>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600 mb-2">Title:</p>
                <p className="font-semibold mb-3">{selectedNotification.title}</p>
                <p className="text-sm text-gray-600 mb-2">Message:</p>
                <p className="text-sm">{selectedNotification.message}</p>
              </div>
            </div>

            {/* Timing Info */}
            <div className="mb-6">
              <h3 className="font-bold mb-3">Timing</h3>
              <Timeline
                items={[
                  {
                    dot: <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '18px' }} />,
                    children: (
                      <>
                        <p className="font-semibold">Sent</p>
                        <p className="text-sm text-gray-600">
                          {dayjs(selectedNotification.sentAt).format('YYYY-MM-DD HH:mm:ss')}
                        </p>
                      </>
                    ),
                  },
                  selectedNotification.deliveredAt && {
                    dot: <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '18px' }} />,
                    children: (
                      <>
                        <p className="font-semibold">Delivered</p>
                        <p className="text-sm text-gray-600">
                          {dayjs(selectedNotification.deliveredAt).format('YYYY-MM-DD HH:mm:ss')}
                        </p>
                      </>
                    ),
                  },
                  selectedNotification.failedAt && {
                    dot: <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: '18px' }} />,
                    children: (
                      <>
                        <p className="font-semibold">Failed</p>
                        <p className="text-sm text-gray-600">
                          {dayjs(selectedNotification.failedAt).format('YYYY-MM-DD HH:mm:ss')}
                        </p>
                      </>
                    ),
                  },
                ].filter(Boolean)}
              />
            </div>

            {/* Provider Response */}
            {selectedNotification.providerMessageId && (
              <div className="mb-6 p-4 bg-gray-50 rounded">
                <h3 className="font-bold mb-2">Provider Response</h3>
                <p className="text-sm">
                  <strong>Message ID:</strong>
                  <br />
                  <span className="font-mono text-xs">{selectedNotification.providerMessageId}</span>
                </p>
                {selectedNotification.providerResponse && (
                  <>
                    <p className="text-sm mt-2">
                      <strong>Response:</strong>
                      <br />
                      <span className="text-xs">{selectedNotification.providerResponse}</span>
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Failure Reason */}
            {selectedNotification.failureReason && (
              <div className="mb-6 p-4 bg-red-50 rounded border border-red-200">
                <h3 className="font-bold mb-2 text-red-800">Failure Reason</h3>
                <p className="text-sm text-red-700">{selectedNotification.failureReason}</p>
              </div>
            )}

            {/* Retry Info */}
            {selectedNotification.retryCount > 0 && (
              <div className="p-4 bg-yellow-50 rounded border border-yellow-200">
                <p className="text-sm">
                  <strong>Retry Count:</strong> {selectedNotification.retryCount}
                </p>
                <p className="text-sm">
                  <strong>Last Retry:</strong> {dayjs(selectedNotification.lastRetryAt).format('YYYY-MM-DD HH:mm:ss')}
                </p>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </Spin>
  );
};

export default LogsTracking;
