import React, { useState, useEffect } from 'react';
import {
  Card,
  List,
  Spin,
  Empty,
  Tag,
  Button,
  Space,
  Drawer,
  Badge,
  Pagination,
  Row,
  Col,
  Input,
  Select,
  message,
} from 'antd';
import {
  DeleteOutlined,
  MailOutlined,
  PhoneOutlined,
  BellOutlined,
  CheckOutlined,
  CloseOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { notificationApi } from '../api/notificationApi';
import { useAuth } from '../../../auth/useAuth';
import { useTranslation } from 'react-i18next';
import HelpButton from '../components/HelpButton';

dayjs.extend(relativeTime);

const NotificationInbox = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    status: 'ALL', // ALL, UNREAD, READ
    channel: 'ALL', // ALL, EMAIL, SMS, PUSH
  });

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
    }
  }, [user, pagination.current, filters]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationApi.getUserInbox(user.id, {
        page: pagination.current - 1,
        size: pagination.pageSize,
        status: filters.status === 'ALL' ? undefined : filters.status,
        channel: filters.channel === 'ALL' ? undefined : filters.channel,
      });
      setNotifications(response.content || []);
      setPagination((prev) => ({
        ...prev,
        total: response.totalElements || 0,
      }));
    } catch (error) {
      message.error(t('common.error') || 'Failed to load inbox');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notification) => {
    try {
      await notificationApi.markNotificationAsRead(notification.id);
      message.success('Marked as read');
      loadNotifications();
    } catch (error) {
      message.error(t('common.error') || 'Failed to mark as read');
    }
  };

  const handleMarkAsUnread = async (notification) => {
    try {
      await notificationApi.markNotificationAsUnread(notification.id);
      message.success('Marked as unread');
      loadNotifications();
    } catch (error) {
      message.error(t('common.error') || 'Failed to mark as unread');
    }
  };

  const handleDelete = async (notification) => {
    try {
      await notificationApi.deleteNotification(notification.id);
      message.success('Notification deleted');
      loadNotifications();
    } catch (error) {
      message.error(t('common.error') || 'Failed to delete notification');
    }
  };

  const handleViewDetails = (notification) => {
    setSelectedNotification(notification);
    if (!notification.read) {
      handleMarkAsRead(notification);
    }
    setDrawerVisible(true);
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
        return <BellOutlined />;
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

  const getTypeColor = (type) => {
    switch (type) {
      case 'APPOINTMENT_CREATED':
        return 'blue';
      case 'APPOINTMENT_REMINDER':
        return 'orange';
      case 'APPOINTMENT_CANCELLED':
        return 'red';
      case 'BULK_MESSAGE':
        return 'cyan';
      default:
        return 'default';
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const renderNotificationItem = (notification) => (
    <div
      key={notification.id}
      className={`p-4 border rounded-lg mb-3 cursor-pointer transition-all ${
        notification.read ? 'bg-white' : 'bg-blue-50 border-blue-200'
      } hover:shadow-md`}
      onClick={() => handleViewDetails(notification)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {!notification.read && (
              <Badge
                color="blue"
                text="New"
                style={{ fontSize: '12px' }}
              />
            )}
            <Tag color={getTypeColor(notification.notificationType)}>
              {notification.notificationType?.replace(/_/g, ' ')}
            </Tag>
            <Tag icon={getChannelIcon(notification.channel)} color={getChannelColor(notification.channel)}>
              {notification.channel}
            </Tag>
          </div>

          <h4 className="font-semibold text-lg mb-1">{notification.title}</h4>
          <p className="text-gray-600 mb-2 line-clamp-2">{notification.message}</p>

          <div className="text-xs text-gray-500">
            {dayjs(notification.sentAt).fromNow()}
            {notification.metadata?.appointmentCode && (
              <span className="ml-4 text-blue-600 font-mono">
                Code: {notification.metadata.appointmentCode}
              </span>
            )}
          </div>
        </div>

        <Space direction="vertical" align="end">
          <Button
            type="text"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails(notification);
            }}
            icon={<ArrowRightOutlined />}
          />
          {notification.read ? (
            <Button
              type="text"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleMarkAsUnread(notification);
              }}
            >
              Mark unread
            </Button>
          ) : (
            <Button
              type="text"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleMarkAsRead(notification);
              }}
            >
              Mark read
            </Button>
          )}
          <Button
            type="text"
            size="small"
            danger
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(notification);
            }}
            icon={<DeleteOutlined />}
          />
        </Space>
      </div>
    </div>
  );

  return (
    <Spin spinning={loading}>
      <div className="p-6">
        <div className="mb-6">
          <Row gutter={[16, 16]} style={{ marginBottom: '16px' }} align="middle">
            <Col flex="auto">
              <h1 className="text-3xl font-bold mb-0">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-gray-600 mb-0">
                  You have <Badge count={unreadCount} style={{ backgroundColor: '#1890ff' }} /> unread notifications
                </p>
              )}
            </Col>
            <Col>
              <HelpButton
                title="Notification Inbox Help"
                description="View and manage notifications received by users. Mark as read, delete, and track notification history."
                features={[
                  'View all notifications',
                  'Filter by status/channel/date',
                  'Mark as read/unread',
                  'Delete notifications',
                  'Search notifications',
                  'Export history',
                ]}
                tips={[
                  'Use filters to find specific notifications',
                  'Archive old notifications',
                  'Check read status to track engagement',
                  'Export for reporting',
                  'Respect user privacy',
                ]}
              />
            </Col>
          </Row>

          {/* Filters */}
          <Row gutter={16}>
            <Col span={12}>
              <Select
                placeholder="Filter by status"
                style={{ width: '100%' }}
                value={filters.status}
                onChange={(value) => {
                  setFilters({ ...filters, status: value });
                  setPagination({ ...pagination, current: 1 });
                }}
                options={[
                  { label: 'All', value: 'ALL' },
                  { label: 'Unread', value: 'UNREAD' },
                  { label: 'Read', value: 'READ' },
                ]}
              />
            </Col>
            <Col span={12}>
              <Select
                placeholder="Filter by channel"
                style={{ width: '100%' }}
                value={filters.channel}
                onChange={(value) => {
                  setFilters({ ...filters, channel: value });
                  setPagination({ ...pagination, current: 1 });
                }}
                options={[
                  { label: 'All Channels', value: 'ALL' },
                  { label: 'Email', value: 'EMAIL' },
                  { label: 'SMS', value: 'SMS' },
                  { label: 'Push', value: 'PUSH' },
                ]}
              />
            </Col>
          </Row>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <Empty description="No notifications" />
        ) : (
          <>
            <div className="space-y-3">
              {notifications.map((notification) => renderNotificationItem(notification))}
            </div>

            {/* Pagination */}
            <div className="mt-6 text-center">
              <Pagination
                current={pagination.current}
                pageSize={pagination.pageSize}
                total={pagination.total}
                onChange={(page) =>
                  setPagination({ ...pagination, current: page })
                }
                showSizeChanger={false}
              />
            </div>
          </>
        )}
      </div>

      {/* Notification Detail Drawer */}
      <Drawer
        title="Notification Details"
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={500}
      >
        {selectedNotification && (
          <div>
            <div className="mb-6">
              <div className="flex gap-2 mb-4">
                <Tag color={getTypeColor(selectedNotification.notificationType)}>
                  {selectedNotification.notificationType?.replace(/_/g, ' ')}
                </Tag>
                <Tag
                  icon={getChannelIcon(selectedNotification.channel)}
                  color={getChannelColor(selectedNotification.channel)}
                >
                  {selectedNotification.channel}
                </Tag>
              </div>

              <h2 className="text-2xl font-bold mb-2">{selectedNotification.title}</h2>
              <p className="text-gray-600 mb-4">{selectedNotification.message}</p>

              <div className="text-sm text-gray-500">
                <p>Sent: {dayjs(selectedNotification.sentAt).format('YYYY-MM-DD HH:mm:ss')}</p>
                <p>Status: {selectedNotification.read ? '✓ Read' : 'Unread'}</p>
              </div>
            </div>

            {/* Metadata */}
            {selectedNotification.metadata && (
              <>
                <h3 className="font-semibold mb-3">Details</h3>
                <div className="space-y-2 text-sm mb-6">
                  {Object.entries(selectedNotification.metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between border-b pb-2">
                      <span className="text-gray-600">{key}:</span>
                      <span className="font-mono">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Actions */}
            <Space direction="vertical" style={{ width: '100%' }}>
              {selectedNotification.read ? (
                <Button
                  block
                  onClick={() => {
                    handleMarkAsUnread(selectedNotification);
                    setDrawerVisible(false);
                  }}
                >
                  Mark as Unread
                </Button>
              ) : (
                <Button
                  block
                  type="primary"
                  onClick={() => {
                    handleMarkAsRead(selectedNotification);
                    setDrawerVisible(false);
                  }}
                >
                  Mark as Read
                </Button>
              )}
              <Button
                block
                danger
                onClick={() => {
                  handleDelete(selectedNotification);
                  setDrawerVisible(false);
                }}
              >
                Delete
              </Button>
            </Space>
          </div>
        )}
      </Drawer>
    </Spin>
  );
};

export default NotificationInbox;
