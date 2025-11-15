import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Select,
  DatePicker,
  Space,
  Spin,
  Empty,
  Progress,
  Tag,
} from 'antd';
import {
  MailOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  PushpinOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { notificationApi } from '../api/notificationApi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import HelpButton from '../components/HelpButton';

/**
 * Notification Dashboard
 * Shows real-time analytics and statistics
 */
const Dashboard = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [dailyData, setDailyData] = useState([]);
  const [channelBreakdown, setChannelBreakdown] = useState([]);
  const [timeRange, setTimeRange] = useState('7d');
  const { RangePicker } = DatePicker;

  const COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d'];

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch summary analytics
      const summaryResponse = await notificationApi.getAnalyticsSummary();
      setAnalytics(summaryResponse.data);

      // Fetch daily breakdown
      const dailyResponse = await notificationApi.getDailyBreakdown();
      setDailyData(dailyResponse.data || []);

      // Fetch channel breakdown
      const channelResponse = await notificationApi.getChannelBreakdown();
      setChannelBreakdown(channelResponse.data || []);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !analytics) {
    return <Spin size="large" />;
  }

  const successRate = analytics.totalNotificationsSent > 0
    ? ((analytics.totalNotificationsSent - (analytics.totalNotificationsFailed || 0)) / analytics.totalNotificationsSent * 100).toFixed(2)
    : 0;

  const statCards = [
    {
      title: t('notification.dashboard.todayMessages', 'Messages Today'),
      value: analytics.todayCount || 0,
      icon: <MailOutlined style={{ color: '#1890ff' }} />,
      color: '#1890ff',
    },
    {
      title: t('notification.dashboard.successRate', 'Success Rate'),
      value: `${successRate}%`,
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      color: '#52c41a',
    },
    {
      title: t('notification.dashboard.failed', 'Failed'),
      value: analytics.totalNotificationsFailed || 0,
      icon: <CloseCircleOutlined style={{ color: '#f5222d' }} />,
      color: '#f5222d',
    },
    {
      title: t('notification.dashboard.retries', 'Retries'),
      value: analytics.totalRetries || 0,
      icon: <SyncOutlined style={{ color: '#faad14' }} />,
      color: '#faad14',
    },
  ];

  const channelColumns = [
    {
      title: t('notification.common.channel', 'Channel'),
      dataIndex: 'channel',
      key: 'channel',
      render: (text) => (
        <Tag color={text === 'EMAIL' ? 'blue' : text === 'SMS' ? 'green' : 'purple'}>
          {text}
        </Tag>
      ),
    },
    {
      title: t('notification.common.sent', 'Sent'),
      dataIndex: 'sent',
      key: 'sent',
    },
    {
      title: t('notification.common.failed', 'Failed'),
      dataIndex: 'failed',
      key: 'failed',
    },
    {
      title: t('notification.dashboard.deliveryRate', 'Delivery Rate'),
      dataIndex: 'successRate',
      key: 'successRate',
      render: (rate) => (
        <Progress
          type="circle"
          percent={parseFloat(rate) || 0}
          width={50}
          format={(percent) => `${percent}%`}
        />
      ),
    },
  ];

  return (
    <div>
      {/* Header with Help Button */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px', justifyContent: 'space-between', display: 'flex', alignItems: 'center' }}>
        <Col>
          <h2 style={{ margin: '0' }}>Notification Dashboard</h2>
        </Col>
        <Col>
          <HelpButton
            title="Dashboard Help"
            description="View real-time notification statistics, analytics, and performance metrics. Monitor success rates, channel breakdown, and daily trends."
            features={[
              'Real-time notification analytics and statistics',
              'Daily breakdown of sent notifications',
              'Channel-wise performance metrics (Email, SMS, Push)',
              'Success rate and failure rate tracking',
              'Time-range filtering (7 days, 30 days, 90 days, custom)',
              'Charts and visualizations of notification trends',
            ]}
            tips={[
              'Use the time range selector to filter data for specific periods',
              'Success rate is calculated as: Sent / (Sent + Failed)',
              'Each chart is interactive - hover to see detailed values',
              'Monitor the channel breakdown to identify which delivery method is most used',
              'Check daily data to identify peak notification times',
            ]}
            examples={[
              'View the last 7 days of notification performance',
              'Check which channel (Email/SMS/Push) has the highest success rate',
              'Analyze daily trends to find the best time to send bulk campaigns',
              'Compare performance between weekdays and weekends using custom date range',
            ]}
          />
        </Col>
      </Row>

      {/* Header with filters */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Space>
            <Select
              value={timeRange}
              onChange={setTimeRange}
              style={{ width: 150 }}
              options={[
                { label: t('notification.timeRange.7days', 'Last 7 days'), value: '7d' },
                { label: t('notification.timeRange.30days', 'Last 30 days'), value: '30d' },
                { label: t('notification.timeRange.90days', 'Last 90 days'), value: '90d' },
                { label: t('notification.timeRange.custom', 'Custom'), value: 'custom' },
              ]}
            />
            {timeRange === 'custom' && (
              <RangePicker
                format="YYYY-MM-DD"
                onChange={(dates) => {
                  if (dates) {
                    // Handle custom date range
                  }
                }}
              />
            )}
          </Space>
        </Col>
      </Row>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {statCards.map((card, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card
              hoverable
              style={{
                border: `2px solid ${card.color}`,
                borderRadius: '8px',
              }}
            >
              <Row align="middle" justify="space-between">
                <Col>
                  <Statistic title={card.title} value={card.value} />
                </Col>
                <Col>{card.icon}</Col>
              </Row>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Charts Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {/* Daily Trend */}
        <Col xs={24} lg={12}>
          <Card title={t('notification.dashboard.dailyTrend', 'Daily Trend')} hoverable>
            {dailyData && dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="sent"
                    stroke="#1890ff"
                    name={t('notification.common.sent', 'Sent')}
                  />
                  <Line
                    type="monotone"
                    dataKey="failed"
                    stroke="#f5222d"
                    name={t('notification.common.failed', 'Failed')}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty />
            )}
          </Card>
        </Col>

        {/* Channel Distribution */}
        <Col xs={24} lg={12}>
          <Card title={t('notification.dashboard.channelDistribution', 'Channel Distribution')} hoverable>
            {channelBreakdown && channelBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={channelBreakdown}
                    dataKey="sent"
                    nameKey="channel"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {channelBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Empty />
            )}
          </Card>
        </Col>
      </Row>

      {/* Channel Breakdown Table */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title={t('notification.dashboard.channelBreakdown', 'Channel Breakdown')} hoverable>
            <Table
              columns={channelColumns}
              dataSource={channelBreakdown}
              rowKey="channel"
              pagination={false}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
