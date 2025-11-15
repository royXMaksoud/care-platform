import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Button,
  Switch,
  Select,
  TimePicker,
  Checkbox,
  Input,
  Space,
  Spin,
  message,
  Tabs,
  Table,
  Tag,
  Modal,
  InputNumber,
  Divider,
  Row,
  Col,
  Alert,
} from 'antd';
import {
  SaveOutlined,
  ReloadOutlined,
  MailOutlined,
  PhoneOutlined,
  BellOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { notificationApi } from '../api/notificationApi';
import { useAuth } from '../../../auth/useAuth';
import { useTranslation } from 'react-i18next';
import HelpButton from '../components/HelpButton';

const UserPreferences = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState(null);
  const [verificationModal, setVerificationModal] = useState({ visible: false, type: null });
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [activeTab, setActiveTab] = useState('channels');

  // Load user preferences on mount
  useEffect(() => {
    if (user?.id) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const data = await notificationApi.getUserPreferences(user.id);
      setPreferences(data);
      form.setFieldsValue({
        preferredChannel: data.preferredChannel,
        multiChannelEnabled: data.multiChannelEnabled,
        notifyAppointmentCreated: data.notifyAppointmentCreated,
        notifyAppointmentReminder: data.notifyAppointmentReminder,
        notifyAppointmentCancelled: data.notifyAppointmentCancelled,
        allowMarketing: data.allowMarketing,
        smsEnabled: data.smsEnabled,
        smsNumber: data.smsNumber,
        emailEnabled: data.emailEnabled,
        emailAddress: data.emailAddress,
        pushEnabled: data.pushEnabled,
        quietHoursEnabled: data.quietHoursEnabled,
        quietHoursStart: data.quietHoursStart ? dayjs(data.quietHoursStart, 'HH:mm') : null,
        quietHoursEnd: data.quietHoursEnd ? dayjs(data.quietHoursEnd, 'HH:mm') : null,
        timezone: data.timezone,
        language: data.language,
        digestFrequency: data.digestFrequency,
      });
    } catch (error) {
      message.error(t('common.error') || 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async (values) => {
    try {
      setLoading(true);
      const payload = {
        ...values,
        beneficiaryId: user.id,
        quietHoursStart: values.quietHoursStart ? values.quietHoursStart.format('HH:mm') : null,
        quietHoursEnd: values.quietHoursEnd ? values.quietHoursEnd.format('HH:mm') : null,
      };
      await notificationApi.updateUserPreferences(user.id, payload);
      message.success(t('notification.preferencesUpdated') || 'Preferences updated successfully');
      loadPreferences();
    } catch (error) {
      message.error(t('common.error') || 'Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    try {
      setVerifying(true);
      await notificationApi.verifyEmail(user.id, {
        code: verificationCode,
      });
      message.success(t('notification.emailVerified') || 'Email verified successfully');
      setVerificationModal({ visible: false, type: null });
      loadPreferences();
    } catch (error) {
      message.error(t('common.error') || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyPhone = async () => {
    try {
      setVerifying(true);
      await notificationApi.verifyPhone(user.id, {
        code: verificationCode,
      });
      message.success(t('notification.phoneVerified') || 'Phone verified successfully');
      setVerificationModal({ visible: false, type: null });
      loadPreferences();
    } catch (error) {
      message.error(t('common.error') || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleSendVerificationCode = async (type) => {
    try {
      setVerifying(true);
      if (type === 'email') {
        await notificationApi.sendEmailVerificationCode(user.id);
      } else {
        await notificationApi.sendPhoneVerificationCode(user.id);
      }
      message.success(t('notification.codesSent') || 'Verification code sent');
      setVerificationModal({ visible: true, type });
    } catch (error) {
      message.error(t('common.error') || 'Failed to send code');
    } finally {
      setVerifying(false);
    }
  };

  const channelsTab = (
    <Form layout="vertical">
      <Card title="Channel Preferences" className="mb-6">
        <Form.Item label="Preferred Channel" name="preferredChannel">
          <Select
            placeholder="Select preferred channel"
            options={[
              { label: 'Email', value: 'EMAIL' },
              { label: 'SMS', value: 'SMS' },
              { label: 'Push Notification', value: 'PUSH' },
            ]}
          />
        </Form.Item>

        <Form.Item name="multiChannelEnabled" valuePropName="checked">
          <Checkbox>Enable multi-channel fallback (try alternative channels if preferred fails)</Checkbox>
        </Form.Item>

        <Divider />

        {/* Email Channel */}
        <Row gutter={16} className="mb-6">
          <Col span={24}>
            <Card type="inner" title={<><MailOutlined /> Email Channel</>}>
              <Form.Item name="emailEnabled" valuePropName="checked">
                <Checkbox>Enable Email Notifications</Checkbox>
              </Form.Item>

              <Form.Item name="emailAddress" label="Email Address">
                <Input placeholder="your-email@example.com" />
              </Form.Item>

              {preferences?.emailVerified ? (
                <Tag icon={<CheckCircleOutlined />} color="success">
                  Email Verified
                </Tag>
              ) : (
                <Space>
                  <Tag icon={<CloseCircleOutlined />} color="error">
                    Email Not Verified
                  </Tag>
                  <Button
                    size="small"
                    type="primary"
                    onClick={() => handleSendVerificationCode('email')}
                    loading={verifying}
                  >
                    Send Verification Code
                  </Button>
                </Space>
              )}
            </Card>
          </Col>
        </Row>

        {/* SMS Channel */}
        <Row gutter={16} className="mb-6">
          <Col span={24}>
            <Card type="inner" title={<><PhoneOutlined /> SMS Channel</>}>
              <Form.Item name="smsEnabled" valuePropName="checked">
                <Checkbox>Enable SMS Notifications</Checkbox>
              </Form.Item>

              <Form.Item name="smsNumber" label="Phone Number">
                <Input placeholder="+1234567890" />
              </Form.Item>

              {preferences?.smsVerified ? (
                <Tag icon={<CheckCircleOutlined />} color="success">
                  Phone Verified
                </Tag>
              ) : (
                <Space>
                  <Tag icon={<CloseCircleOutlined />} color="error">
                    Phone Not Verified
                  </Tag>
                  <Button
                    size="small"
                    type="primary"
                    onClick={() => handleSendVerificationCode('phone')}
                    loading={verifying}
                  >
                    Send Verification Code
                  </Button>
                </Space>
              )}
            </Card>
          </Col>
        </Row>

        {/* Push Notification Channel */}
        <Row gutter={16}>
          <Col span={24}>
            <Card type="inner" title={<><BellOutlined /> Push Notifications</>}>
              <Form.Item name="pushEnabled" valuePropName="checked">
                <Checkbox>Enable Push Notifications</Checkbox>
              </Form.Item>
              <Alert
                message="Push notifications are automatically enabled when you use the mobile app"
                type="info"
                showIcon
              />
            </Card>
          </Col>
        </Row>
      </Card>
    </Form>
  );

  const notificationsTab = (
    <Form layout="vertical">
      <Card title="Notification Types">
        <Form.Item name="notifyAppointmentCreated" valuePropName="checked">
          <Checkbox>Notify when appointment is created</Checkbox>
        </Form.Item>

        <Form.Item name="notifyAppointmentReminder" valuePropName="checked">
          <Checkbox>Send appointment reminder (24 hours before)</Checkbox>
        </Form.Item>

        <Form.Item name="notifyAppointmentCancelled" valuePropName="checked">
          <Checkbox>Notify when appointment is cancelled</Checkbox>
        </Form.Item>

        <Divider />

        <Form.Item name="allowMarketing" valuePropName="checked">
          <Checkbox>Allow marketing and promotional messages</Checkbox>
        </Form.Item>
      </Card>
    </Form>
  );

  const quietHoursTab = (
    <Form layout="vertical">
      <Card title="Quiet Hours Settings">
        <Alert
          message="Notifications will not be sent during quiet hours, except for urgent appointments"
          type="info"
          showIcon
          className="mb-4"
        />

        <Form.Item name="quietHoursEnabled" valuePropName="checked">
          <Checkbox>Enable quiet hours</Checkbox>
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="quietHoursStart" label="Start Time">
              <TimePicker format="HH:mm" placeholder="21:00" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="quietHoursEnd" label="End Time">
              <TimePicker format="HH:mm" placeholder="08:00" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="timezone" label="Timezone">
          <Select
            placeholder="Select timezone"
            options={[
              { label: 'UTC-12:00', value: 'Etc/GMT+12' },
              { label: 'UTC-06:00 (CST)', value: 'America/Chicago' },
              { label: 'UTC-05:00 (EST)', value: 'America/New_York' },
              { label: 'UTC+00:00 (GMT)', value: 'UTC' },
              { label: 'UTC+02:00 (EET)', value: 'Africa/Cairo' },
              { label: 'UTC+03:00 (EAT)', value: 'Africa/Nairobi' },
            ]}
          />
        </Form.Item>
      </Card>
    </Form>
  );

  const settingsTab = (
    <Form layout="vertical">
      <Card title="Additional Settings">
        <Form.Item name="language" label="Preferred Language">
          <Select
            options={[
              { label: 'English', value: 'en' },
              { label: 'العربية', value: 'ar' },
              { label: 'Français', value: 'fr' },
            ]}
          />
        </Form.Item>

        <Form.Item name="digestFrequency" label="Digest Frequency">
          <Select
            placeholder="How often to receive digest notifications"
            options={[
              { label: 'Off', value: 'OFF' },
              { label: 'Daily', value: 'DAILY' },
              { label: 'Weekly', value: 'WEEKLY' },
              { label: 'Monthly', value: 'MONTHLY' },
            ]}
          />
        </Form.Item>

        <Divider />

        <Card type="inner" className="bg-blue-50">
          <h4 className="font-semibold mb-2">GDPR & Privacy</h4>
          {preferences?.gdprConsentGiven ? (
            <Tag icon={<CheckCircleOutlined />} color="success">
              You have given consent to process your data (on {preferences.gdprConsentDate})
            </Tag>
          ) : (
            <Alert
              message="You need to give consent to receive notifications"
              type="warning"
              showIcon
            />
          )}
        </Card>
      </Card>
    </Form>
  );

  const tabItems = [
    {
      key: 'channels',
      label: (
        <>
          <BellOutlined /> Channels
        </>
      ),
      children: channelsTab,
    },
    {
      key: 'notifications',
      label: (
        <>
          <MailOutlined /> Notifications
        </>
      ),
      children: notificationsTab,
    },
    {
      key: 'quiet-hours',
      label: (
        <>
          <ClockCircleOutlined /> Quiet Hours
        </>
      ),
      children: quietHoursTab,
    },
    {
      key: 'settings',
      label: 'Settings',
      children: settingsTab,
    },
  ];

  return (
    <Spin spinning={loading}>
      <div className="p-6">
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }} align="middle">
          <Col flex="auto">
            <h1 className="text-3xl font-bold mb-0">Notification Preferences</h1>
          </Col>
          <Col>
            <HelpButton
              title="User Preferences Help"
              description="Manage notification preferences for beneficiaries including channels, frequency, and opt-out options."
              features={[
                'Set preferred notification channel',
                'Enable/disable channels',
                'Quiet hours configuration',
                'Notification type preferences',
                'Multi-language support',
              ]}
              tips={[
                'Verify email/phone before enabling',
                'Respect user opt-out preferences',
                'Set reasonable quiet hours',
                'Update preferences regularly',
                'Keep records of changes',
              ]}
            />
          </Col>
        </Row>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSavePreferences}
        >
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

          <div className="mt-6 flex gap-2">
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
              size="large"
            >
              Save Changes
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadPreferences}
              size="large"
            >
              Reset
            </Button>
          </div>
        </Form>
      </div>

      {/* Verification Modal */}
      <Modal
        title={`Verify ${verificationModal.type === 'email' ? 'Email' : 'Phone'}`}
        open={verificationModal.visible}
        onCancel={() => setVerificationModal({ visible: false, type: null })}
        footer={[
          <Button key="cancel" onClick={() => setVerificationModal({ visible: false, type: null })}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={verifying}
            onClick={
              verificationModal.type === 'email'
                ? handleVerifyEmail
                : handleVerifyPhone
            }
          >
            Verify
          </Button>,
        ]}
      >
        <p className="mb-4">Enter the verification code sent to your {verificationModal.type}</p>
        <Input
          placeholder="000000"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          maxLength={6}
        />
      </Modal>
    </Spin>
  );
};

export default UserPreferences;
