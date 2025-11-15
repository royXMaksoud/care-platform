import React from 'react';
import { Layout, Menu, Breadcrumb } from 'antd';
import {
  DashboardOutlined,
  MailOutlined,
  FileTextOutlined,
  UserOutlined,
  InboxOutlined,
  FileOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

// Import all sub-modules
import Dashboard from './pages/Dashboard';
import CampaignsManagement from './pages/CampaignsManagement';
import TemplateManagement from './pages/TemplateManagement';
import UserPreferences from './pages/UserPreferences';
import NotificationInbox from './pages/NotificationInbox';
import LogsTracking from './pages/LogsTracking';
import AdminActions from './pages/AdminActions';

const { Sider, Content } = Layout;

/**
 * Notification Module - Main Layout & Router
 * Comprehensive notification management dashboard
 */
const NotificationModule = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Parse current page from URL
  const currentPath = location.pathname.split('/').pop() || 'dashboard';

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: t('notification.menu.dashboard', 'Dashboard'),
    },
    {
      key: 'campaigns',
      icon: <MailOutlined />,
      label: t('notification.menu.campaigns', 'Campaigns'),
    },
    {
      key: 'templates',
      icon: <FileTextOutlined />,
      label: t('notification.menu.templates', 'Templates'),
    },
    {
      key: 'preferences',
      icon: <UserOutlined />,
      label: t('notification.menu.preferences', 'Preferences'),
    },
    {
      key: 'inbox',
      icon: <InboxOutlined />,
      label: t('notification.menu.inbox', 'Inbox'),
    },
    {
      key: 'logs',
      icon: <FileOutlined />,
      label: t('notification.menu.logs', 'Logs & Tracking'),
    },
    {
      key: 'actions',
      icon: <SettingOutlined />,
      label: t('notification.menu.actions', 'Admin Actions'),
    },
  ];

  const handleMenuClick = (e) => {
    navigate(`/notification/${e.key}`);
  };

  const renderContent = () => {
    switch (currentPath) {
      case 'dashboard':
        return <Dashboard />;
      case 'campaigns':
        return <CampaignsManagement />;
      case 'templates':
        return <TemplateManagement />;
      case 'preferences':
        return <UserPreferences />;
      case 'inbox':
        return <NotificationInbox />;
      case 'logs':
        return <LogsTracking />;
      case 'actions':
        return <AdminActions />;
      default:
        return <Dashboard />;
    }
  };

  const getBreadcrumb = () => {
    const menuItem = menuItems.find((item) => item.key === currentPath);
    return menuItem?.label || 'Dashboard';
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        breakpoint="lg"
        collapsedWidth={0}
        style={{
          background: '#fff',
          borderRight: '1px solid #f0f0f0',
        }}
      >
        <div
          style={{
            padding: '20px',
            fontWeight: 'bold',
            fontSize: '16px',
            textAlign: 'center',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          {t('notification.title', 'Notifications')}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[currentPath]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>

      <Layout>
        <div
          style={{
            padding: '24px',
            background: '#fafafa',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Breadcrumb
            items={[
              { title: t('common.home', 'Home') },
              { title: t('notification.module', 'Notifications') },
              { title: getBreadcrumb() },
            ]}
          />
        </div>

        <Content style={{ padding: '24px' }}>{renderContent()}</Content>
      </Layout>
    </Layout>
  );
};

export default NotificationModule;
