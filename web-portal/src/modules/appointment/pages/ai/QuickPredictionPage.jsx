import React, { useMemo, useState } from 'react';
import {
  Card,
  Form,
  Button,
  Input,
  Select,
  InputNumber,
  Space,
  Spin,
  Alert,
  Divider,
  Progress,
  Tag,
  Table,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  ThunderboltOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './QuickPredictionPage.css';

/**
 * Quick No-Show Prediction Page
 * Allows users to:
 * 1. Select an existing appointment or
 * 2. Enter manual features to get a prediction
 */
const QuickPredictionPage = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  const [predictionMode, setPredictionMode] = useState('manual'); // 'manual' or 'appointment'

  const handlePredict = async (values) => {
    setLoading(true);
    setError(null);
    setPrediction(null);

    try {
      const response = await axios.post('/api/ai/predictions/predict', {
        ...values,
      });

      setPrediction(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        t('appointment.ai.quickPrediction.errors.predict', { defaultValue: 'Error getting prediction' })
      );
      console.error('Prediction error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'HIGH':
        return 'red';
      case 'MEDIUM':
        return 'orange';
      case 'LOW':
        return 'green';
      default:
        return 'blue';
    }
  };

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'HIGH':
        return <ExclamationCircleOutlined />;
      case 'MEDIUM':
        return <InfoCircleOutlined />;
      case 'LOW':
        return <CheckCircleOutlined />;
      default:
        return null;
    }
  };

  const getRiskLabel = (riskLevel) => {
    switch (riskLevel) {
      case 'HIGH':
        return t('appointment.ai.quickPrediction.risk.high', { defaultValue: 'High' });
      case 'MEDIUM':
        return t('appointment.ai.quickPrediction.risk.medium', { defaultValue: 'Medium' });
      case 'LOW':
        return t('appointment.ai.quickPrediction.risk.low', { defaultValue: 'Low' });
      default:
        return riskLevel;
    }
  };

  const getRiskPercentage = (riskScore) => {
    return Math.round(parseFloat(riskScore) * 100);
  };

  const recommendationLabels = useMemo(
    () => ({
      send_sms_reminder_24h: t('appointment.ai.quickPrediction.recommendations.sms', { defaultValue: '📱 Send SMS reminder 24 hours before' }),
      call_beneficiary_12h: t('appointment.ai.quickPrediction.recommendations.call', { defaultValue: '☎️ Call the beneficiary 12 hours before' }),
      send_email_reminder: t('appointment.ai.quickPrediction.recommendations.email', { defaultValue: '📧 Send an email reminder' }),
      have_standby_list_ready: t('appointment.ai.quickPrediction.recommendations.standby', { defaultValue: '📋 Prepare a standby list' }),
      prepare_alternative_appointment: t('appointment.ai.quickPrediction.recommendations.alternative', { defaultValue: '📅 Prepare an alternative appointment' }),
    }),
    [t]
  );

  return (
    <div className="quick-prediction-page">
      <Card
        title={
          <Space>
            <ThunderboltOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
            <span>{t('appointment.ai.quickPrediction.title', { defaultValue: '🎯 Quick No-Show Prediction' })}</span>
          </Space>
        }
        bordered={false}
      >
        {error && (
          <Alert
            message={t('appointment.ai.quickPrediction.errorTitle', { defaultValue: 'Error' })}
            description={error}
            type="error"
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: '20px' }}
          />
        )}

        <Form form={form} layout="vertical" onFinish={handlePredict}>
          <Form.Item label={t('appointment.ai.quickPrediction.inputOption', { defaultValue: '📊 Input Mode' })}>
            <Select
              value={predictionMode}
              onChange={setPredictionMode}
              options={[
                { label: t('appointment.ai.quickPrediction.mode.manual', { defaultValue: '✍️ Manual Feature Entry' }), value: 'manual' },
                { label: t('appointment.ai.quickPrediction.mode.appointment', { defaultValue: '📋 Select Existing Appointment' }), value: 'appointment' },
              ]}
            />
          </Form.Item>

          {predictionMode === 'manual' && (
            <>
              <Divider>{t('appointment.ai.quickPrediction.sections.patient', { defaultValue: '👤 Patient Data' })}</Divider>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="age"
                    label={t('appointment.ai.quickPrediction.fields.age', { defaultValue: 'Age' })}
                    rules={[{ required: true, message: t('appointment.ai.quickPrediction.validation.required', { defaultValue: 'Required' }) }]}
                  >
                    <InputNumber min={1} max={120} placeholder="35" />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    name="gender"
                    label={t('appointment.ai.quickPrediction.fields.gender', { defaultValue: 'Gender' })}
                    rules={[{ required: true, message: t('appointment.ai.quickPrediction.validation.required', { defaultValue: 'Required' }) }]}
                  >
                    <Select
                      placeholder={t('appointment.ai.quickPrediction.placeholders.select', { defaultValue: 'Select' })}
                      options={[
                        { label: t('appointment.ai.quickPrediction.options.gender.male', { defaultValue: 'Male' }), value: 'MALE' },
                        { label: t('appointment.ai.quickPrediction.options.gender.female', { defaultValue: 'Female' }), value: 'FEMALE' },
                        { label: t('appointment.ai.quickPrediction.options.gender.other', { defaultValue: 'Other' }), value: 'OTHER' },
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider>{t('appointment.ai.quickPrediction.sections.appointment', { defaultValue: '🏥 Appointment Data' })}</Divider>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="serviceType"
                    label={t('appointment.ai.quickPrediction.fields.serviceType', { defaultValue: 'Service Type' })}
                    rules={[{ required: true, message: t('appointment.ai.quickPrediction.validation.required', { defaultValue: 'Required' }) }]}
                  >
                    <Select
                      placeholder={t('appointment.ai.quickPrediction.placeholders.select', { defaultValue: 'Select' })}
                      options={[
                        { label: t('appointment.ai.quickPrediction.options.serviceType.cardiology', { defaultValue: 'Cardiology' }), value: 'CARDIOLOGY' },
                        { label: t('appointment.ai.quickPrediction.options.serviceType.gynecology', { defaultValue: 'Gynecology' }), value: 'GYNECOLOGY' },
                        { label: t('appointment.ai.quickPrediction.options.serviceType.pediatrics', { defaultValue: 'Pediatrics' }), value: 'PEDIATRICS' },
                        { label: t('appointment.ai.quickPrediction.options.serviceType.general', { defaultValue: 'General Medicine' }), value: 'GENERAL' },
                      ]}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    name="appointmentTime"
                    label={t('appointment.ai.quickPrediction.fields.appointmentTime', { defaultValue: 'Appointment Time' })}
                    rules={[{ required: true, message: t('appointment.ai.quickPrediction.validation.required', { defaultValue: 'Required' }) }]}
                  >
                    <Input type="time" placeholder="10:30" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="dayOfWeek"
                    label={t('appointment.ai.quickPrediction.fields.dayOfWeek', { defaultValue: 'Day of Week' })}
                    rules={[{ required: true, message: t('appointment.ai.quickPrediction.validation.required', { defaultValue: 'Required' }) }]}
                  >
                    <Select
                      placeholder={t('appointment.ai.quickPrediction.placeholders.select', { defaultValue: 'Select' })}
                      options={[
                        { label: t('appointment.ai.quickPrediction.options.weekdays.sunday', { defaultValue: 'Sunday' }), value: 'SUNDAY' },
                        { label: t('appointment.ai.quickPrediction.options.weekdays.monday', { defaultValue: 'Monday' }), value: 'MONDAY' },
                        { label: t('appointment.ai.quickPrediction.options.weekdays.tuesday', { defaultValue: 'Tuesday' }), value: 'TUESDAY' },
                        { label: t('appointment.ai.quickPrediction.options.weekdays.wednesday', { defaultValue: 'Wednesday' }), value: 'WEDNESDAY' },
                        { label: t('appointment.ai.quickPrediction.options.weekdays.thursday', { defaultValue: 'Thursday' }), value: 'THURSDAY' },
                        { label: t('appointment.ai.quickPrediction.options.weekdays.friday', { defaultValue: 'Friday' }), value: 'FRIDAY' },
                        { label: t('appointment.ai.quickPrediction.options.weekdays.saturday', { defaultValue: 'Saturday' }), value: 'SATURDAY' },
                      ]}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    name="distanceKm"
                    label={t('appointment.ai.quickPrediction.fields.distanceKm', { defaultValue: 'Distance from Home (km)' })}
                  >
                    <InputNumber min={0} step={0.1} placeholder="3.2" />
                  </Form.Item>
                </Col>
              </Row>

              <Divider>{t('appointment.ai.quickPrediction.sections.history', { defaultValue: '📈 History' })}</Divider>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="previousNoShows"
                    label={t('appointment.ai.quickPrediction.fields.previousNoShows', { defaultValue: 'Previous No-Shows' })}
                  >
                    <InputNumber min={0} placeholder="1" />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    name="previousAppointments"
                    label={t('appointment.ai.quickPrediction.fields.previousAppointments', { defaultValue: 'Total Previous Appointments' })}
                  >
                    <InputNumber min={0} placeholder="5" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="priority"
                    label={t('appointment.ai.quickPrediction.fields.priority', { defaultValue: 'Priority' })}
                    initialValue="NORMAL"
                  >
                    <Select
                      options={[
                        { label: t('appointment.ai.quickPrediction.options.priority.normal', { defaultValue: 'Normal' }), value: 'NORMAL' },
                        { label: t('appointment.ai.quickPrediction.options.priority.urgent', { defaultValue: 'Urgent' }), value: 'URGENT' },
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          {predictionMode === 'appointment' && (
            <Form.Item
              name="appointmentId"
              label={t('appointment.ai.quickPrediction.fields.appointmentId', { defaultValue: 'Select Appointment' })}
              rules={[{ required: true, message: t('appointment.ai.quickPrediction.validation.required', { defaultValue: 'Required' }) }]}
            >
              <Input placeholder="APT-2025-00154" />
            </Form.Item>
          )}

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              block
              icon={<ThunderboltOutlined />}
            >
              {t('appointment.ai.quickPrediction.actions.predict', { defaultValue: '🎲 Predict' })}
            </Button>
          </Form.Item>
        </Form>

        {prediction && (
          <>
            <Divider style={{ margin: '40px 0' }}>
              {t('appointment.ai.quickPrediction.sections.results', { defaultValue: '📊 Prediction Results' })}
            </Divider>

            <Row gutter={16} style={{ marginBottom: '30px' }}>
              <Col xs={24} sm={8}>
                <Card className="prediction-stat-card">
                  <Statistic
                    title={t('appointment.ai.quickPrediction.stats.riskLevel', { defaultValue: 'Risk Level' })}
                    value={
                      <Tag
                        icon={getRiskIcon(prediction.riskLevel)}
                        color={getRiskColor(prediction.riskLevel)}
                        style={{ fontSize: '16px' }}
                      >
                        {getRiskLabel(prediction.riskLevel)}
                      </Tag>
                    }
                  />
                </Card>
              </Col>

              <Col xs={24} sm={8}>
                <Card className="prediction-stat-card">
                  <Statistic
                    title={t('appointment.ai.quickPrediction.stats.riskScore', { defaultValue: 'Risk Score' })}
                    value={`${getRiskPercentage(prediction.riskScore)}%`}
                    valueStyle={{ color: getRiskColor(prediction.riskLevel) }}
                  />
                </Card>
              </Col>

              <Col xs={24} sm={8}>
                <Card className="prediction-stat-card">
                  <Statistic
                    title={t('appointment.ai.quickPrediction.stats.confidence', { defaultValue: 'Confidence' })}
                    value={`${Math.round(parseFloat(prediction.confidence) * 100)}%`}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
            </Row>

            <Card className="prediction-progress">
              <p style={{ marginBottom: '10px' }}>
                {t('appointment.ai.quickPrediction.stats.likelihood', { defaultValue: 'Likelihood of No-Show' })}
              </p>
              <Progress
                percent={getRiskPercentage(prediction.riskScore)}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
                status={
                  prediction.riskLevel === 'HIGH' ? 'exception' :
                  prediction.riskLevel === 'MEDIUM' ? 'active' : 'success'
                }
              />
            </Card>

            {/* Contributing Factors */}
            {prediction.contributingFactors && prediction.contributingFactors.length > 0 && (
              <Card className="factors-card" style={{ marginTop: '20px' }}>
                <h3>{t('appointment.ai.quickPrediction.sections.factors', { defaultValue: '📊 Contributing Factors' })}</h3>
                <Table
                  dataSource={prediction.contributingFactors.map((f, idx) => ({
                    ...f,
                    key: idx,
                  }))}
                  columns={[
                    {
                      title: t('appointment.ai.quickPrediction.table.factor', { defaultValue: 'Factor' }),
                      dataIndex: 'factor',
                      key: 'factor',
                    },
                    {
                      title: t('appointment.ai.quickPrediction.table.value', { defaultValue: 'Value' }),
                      dataIndex: 'value',
                      key: 'value',
                    },
                    {
                      title: t('appointment.ai.quickPrediction.table.impact', { defaultValue: 'Impact' }),
                      dataIndex: 'impactPercent',
                      key: 'impact',
                      render: (impact) => (
                        <Tag color={impact > 0 ? 'red' : 'green'}>
                          {impact > 0 ? '+' : ''}{impact}%
                        </Tag>
                      ),
                    },
                  ]}
                  pagination={false}
                  size="small"
                />
              </Card>
            )}

            {/* Recommendations */}
            {prediction.recommendedActions && prediction.recommendedActions.length > 0 && (
              <Card className="recommendations-card" style={{ marginTop: '20px' }}>
                <h3>{t('appointment.ai.quickPrediction.sections.recommendations', { defaultValue: '⚠️ Recommended Actions' })}</h3>
                <Space direction="vertical" style={{ width: '100%' }}>
                  {prediction.recommendedActions.map((action, idx) => (
                    <Alert
                      key={idx}
                      type={
                        prediction.riskLevel === 'HIGH' ? 'error' :
                        prediction.riskLevel === 'MEDIUM' ? 'warning' : 'success'
                      }
                      message={recommendationLabels[action] || action}
                      showIcon
                    />
                  ))}
                </Space>
              </Card>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default QuickPredictionPage;
