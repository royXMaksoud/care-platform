import React, { useEffect, useMemo, useState } from 'react';
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
import api from '@/lib/axios';
import './QuickPredictionPage.css';

/**
 * Quick No-Show Prediction Page
 * Allows users to:
 * 1. Select an existing appointment or
 * 2. Enter manual features to get a prediction
 */
const QuickPredictionPage = () => {
  const { t, i18n } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  const [predictionMode, setPredictionMode] = useState('manual'); // 'manual' or 'appointment'
  const [models, setModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState(null);
  const [serviceTypeOptions, setServiceTypeOptions] = useState([]);
  const uiLang = (i18n.language || '').startsWith('ar') ? 'ar' : 'en';

  // Load available models on mount
  useEffect(() => {
    const loadModels = async () => {
      setModelsLoading(true);
      try {
        const { data } = await api.get('/api/ai/models');
        setModels(data || []);
      } catch (err) {
        console.error('Failed to load models', err);
      } finally {
        setModelsLoading(false);
      }
    };
    loadModels();
  }, []);

  // Helper: build service type options with parent › child label, leaf-only enabled
  const buildServiceTypeOptions = (nodes = []) => {
    const collected = [];

    const traverse = (items, path = [], depth = 0) => {
      if (!Array.isArray(items)) return;
      items.forEach((item) => {
        if (!item) return;
        const name = item.name || item.code || 'Service';
        const children = Array.isArray(item.children) ? item.children : [];
        const isLeaf = item.leaf ?? children.length === 0;
        const currentPath = [...path, name];
        const pathLabel = currentPath.join(' › ');
        collected.push({
          value: item.code || item.serviceTypeId,
          label: pathLabel,
          disabled: !isLeaf, // لا نستعمل الأب كقيمة بحد ذاته
        });
        if (children.length) {
          traverse(children, currentPath, depth + 1);
        }
      });
    };

    traverse(nodes, [], 0);
    return collected;
  };

  // Load service types with localization
  useEffect(() => {
    let active = true;
    const loadServiceTypes = async () => {
      try {
        const { data } = await api.get('/appointment-service/api/admin/service-types/tree', {
          params: { lang: uiLang },
        });
        if (!active) return;
        const tree = Array.isArray(data) ? data : [];
        const options = buildServiceTypeOptions(tree);
        setServiceTypeOptions(options);
      } catch (err) {
        console.error('Failed to load service types for quick prediction', err);
        if (active) {
          setServiceTypeOptions([]);
        }
      }
    };
    loadServiceTypes();
    return () => {
      active = false;
    };
  }, [uiLang]);

  const handlePredict = async (values) => {
    setLoading(true);
    setError(null);
    setPrediction(null);

    try {
      const response = await api.post('/api/ai/predictions/predict', {
        ...values,
        modelVersionId: selectedModelId || null,
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
        variant="borderless"
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
          <Form.Item label={t('appointment.ai.quickPrediction.model', { defaultValue: '🧠 Model' })}>
            <Select
              value={selectedModelId}
              onChange={setSelectedModelId}
              loading={modelsLoading}
              allowClear
              placeholder={t('appointment.ai.quickPrediction.modelPlaceholder', {
                defaultValue: 'Use active model or choose a specific one',
              })}
              options={(models || []).map((m) => ({
                label: `${m.modelName} (v${m.versionNumber}) – ${m.accuracy != null ? `${m.accuracy}%` : 'n/a'}`,
                value: m.modelVersionId,
              }))}
            />
          </Form.Item>
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
                      options={serviceTypeOptions}
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

          <Form.Item style={{ marginTop: '24px', marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              block
              icon={<ThunderboltOutlined />}
              style={{ height: '48px', fontSize: '16px', fontWeight: 'bold' }}
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

            {/* Simple Summary Card */}
            <Card 
              style={{ 
                marginBottom: '24px',
                background: prediction.riskLevel === 'HIGH' 
                  ? 'linear-gradient(135deg, #fff1f0 0%, #ffe7e5 100%)'
                  : prediction.riskLevel === 'MEDIUM'
                  ? 'linear-gradient(135deg, #fff7e6 0%, #ffecc7 100%)'
                  : 'linear-gradient(135deg, #f6ffed 0%, #e6f7d9 100%)',
                border: `2px solid ${
                  prediction.riskLevel === 'HIGH' ? '#ff4d4f' :
                  prediction.riskLevel === 'MEDIUM' ? '#faad14' : '#52c41a'
                }`
              }}
            >
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: '#1f2937' }}>
                  {prediction.riskLevel === 'HIGH' 
                    ? t('appointment.ai.quickPrediction.summary.high.title', { 
                        defaultValue: '⚠️ High Risk of No-Show' 
                      })
                    : prediction.riskLevel === 'MEDIUM'
                    ? t('appointment.ai.quickPrediction.summary.medium.title', { 
                        defaultValue: '⚡ Medium Risk - Monitor Closely' 
                      })
                    : t('appointment.ai.quickPrediction.summary.low.title', { 
                        defaultValue: '✅ Low Risk - Good Attendance Expected' 
                      })
                  }
                </div>
                <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
                  {prediction.riskLevel === 'HIGH' 
                    ? t('appointment.ai.quickPrediction.summary.high.description', { 
                        defaultValue: 'There is a high probability that the beneficiary will not attend this appointment. Immediate action is recommended.' 
                      })
                    : prediction.riskLevel === 'MEDIUM'
                    ? t('appointment.ai.quickPrediction.summary.medium.description', { 
                        defaultValue: 'There is a moderate chance of no-show. Consider sending reminders and monitoring this appointment.' 
                      })
                    : t('appointment.ai.quickPrediction.summary.low.description', { 
                        defaultValue: 'The beneficiary is likely to attend. Standard follow-up procedures should be sufficient.' 
                      })
                  }
                </div>
              </div>
            </Card>

            <Row gutter={16} style={{ marginBottom: '24px' }}>
              <Col xs={24} sm={8}>
                <Card className="prediction-stat-card" style={{ textAlign: 'center' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <Tag
                      icon={getRiskIcon(prediction.riskLevel)}
                      color={getRiskColor(prediction.riskLevel)}
                      style={{ fontSize: '18px', padding: '8px 16px', marginBottom: '8px' }}
                    >
                      {getRiskLabel(prediction.riskLevel)}
                    </Tag>
                  </div>
                  <Statistic
                    title={t('appointment.ai.quickPrediction.stats.riskLevel', { defaultValue: 'Risk Level' })}
                    value=""
                    valueStyle={{ display: 'none' }}
                  />
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                    {prediction.riskLevel === 'HIGH' 
                      ? t('appointment.ai.quickPrediction.stats.riskLevel.high.desc', { 
                          defaultValue: '60% or higher chance of missing the appointment' 
                        })
                      : prediction.riskLevel === 'MEDIUM'
                      ? t('appointment.ai.quickPrediction.stats.riskLevel.medium.desc', { 
                          defaultValue: '40-60% chance of missing the appointment' 
                        })
                      : t('appointment.ai.quickPrediction.stats.riskLevel.low.desc', { 
                          defaultValue: 'Less than 40% chance of missing the appointment' 
                        })
                    }
                  </div>
                </Card>
              </Col>

              <Col xs={24} sm={8}>
                <Card className="prediction-stat-card" style={{ textAlign: 'center' }}>
                  <Statistic
                    title={t('appointment.ai.quickPrediction.stats.riskScore', { defaultValue: 'Risk Score' })}
                    value={`${getRiskPercentage(prediction.riskScore)}%`}
                    valueStyle={{ 
                      color: getRiskColor(prediction.riskLevel),
                      fontSize: '32px',
                      fontWeight: 'bold'
                    }}
                  />
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                    {t('appointment.ai.quickPrediction.stats.riskScore.desc', { 
                      defaultValue: 'Probability of no-show based on historical data and patient profile' 
                    })}
                  </div>
                </Card>
              </Col>

              <Col xs={24} sm={8}>
                <Card className="prediction-stat-card" style={{ textAlign: 'center' }}>
                  <Statistic
                    title={t('appointment.ai.quickPrediction.stats.confidence', { defaultValue: 'Confidence' })}
                    value={`${Math.round(parseFloat(prediction.confidence) * 100)}%`}
                    valueStyle={{ color: '#52c41a', fontSize: '32px', fontWeight: 'bold' }}
                  />
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                    {t('appointment.ai.quickPrediction.stats.confidence.desc', { 
                      defaultValue: 'How reliable this prediction is based on available data' 
                    })}
                  </div>
                </Card>
              </Col>
            </Row>

            <Card className="prediction-progress" style={{ marginBottom: '24px' }}>
              <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: '500' }}>
                  {t('appointment.ai.quickPrediction.stats.likelihood', { defaultValue: 'Likelihood of No-Show' })}
                </span>
                <span style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold',
                  color: getRiskColor(prediction.riskLevel)
                }}>
                  {getRiskPercentage(prediction.riskScore)}%
                </span>
              </div>
              <Progress
                percent={getRiskPercentage(prediction.riskScore)}
                strokeColor={{
                  '0%': prediction.riskLevel === 'HIGH' ? '#ff4d4f' : '#108ee9',
                  '100%': prediction.riskLevel === 'LOW' ? '#52c41a' : '#faad14',
                }}
                status={
                  prediction.riskLevel === 'HIGH' ? 'exception' :
                  prediction.riskLevel === 'MEDIUM' ? 'active' : 'success'
                }
                size={12}
              />
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
                {t('appointment.ai.quickPrediction.stats.likelihood.desc', { 
                  defaultValue: 'This percentage shows how likely it is that the beneficiary will not attend' 
                })}
              </div>
            </Card>

            {/* Model Information */}
            {prediction.modelVersion && (
              <Card style={{ marginBottom: '24px', background: '#f0f5ff', border: '1px solid #adc6ff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '16px' }}>🤖</span>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                    {t('appointment.ai.quickPrediction.modelInfo.title', { 
                      defaultValue: 'Model Used' 
                    })}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#666', paddingLeft: '24px' }}>
                  {prediction.modelVersion}
                </div>
              </Card>
            )}

            {/* Contributing Factors */}
            {prediction.contributingFactors && prediction.contributingFactors.length > 0 && (
              <Card className="factors-card" style={{ marginTop: '20px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ marginBottom: '8px', fontSize: '18px', fontWeight: '600' }}>
                    {t('appointment.ai.quickPrediction.sections.factors', { defaultValue: '📊 Contributing Factors' })}
                  </h3>
                  <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>
                    {t('appointment.ai.quickPrediction.sections.factors.desc', { 
                      defaultValue: 'These factors influenced the prediction result' 
                    })}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {prediction.contributingFactors.map((f, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #e8e8e8',
                        background: '#fafafa',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '15px', fontWeight: '500', color: '#1f2937', marginBottom: '4px' }}>
                            {f.factor}
                          </div>
                          <div style={{ fontSize: '13px', color: '#666' }}>
                            {f.description || f.value}
                          </div>
                        </div>
                        <Tag 
                          color={f.impactPercent > 0 ? 'red' : f.impactPercent < 0 ? 'green' : 'default'}
                          style={{ fontSize: '13px', padding: '4px 12px', marginLeft: '12px' }}
                        >
                          {f.impactPercent > 0 ? '+' : ''}{f.impactPercent}%
                        </Tag>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Recommendations */}
            {prediction.recommendedActions && prediction.recommendedActions.length > 0 && (
              <Card 
                className="recommendations-card" 
                style={{ 
                  marginTop: '20px',
                  background: prediction.riskLevel === 'HIGH' 
                    ? '#fff1f0' 
                    : prediction.riskLevel === 'MEDIUM'
                    ? '#fff7e6'
                    : '#f6ffed'
                }}
              >
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ marginBottom: '8px', fontSize: '18px', fontWeight: '600' }}>
                    {t('appointment.ai.quickPrediction.sections.recommendations', { defaultValue: '💡 Recommended Actions' })}
                  </h3>
                  <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>
                    {t('appointment.ai.quickPrediction.sections.recommendations.desc', { 
                      defaultValue: 'Suggested steps to improve attendance or reduce risk' 
                    })}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {prediction.recommendedActions.map((action, idx) => {
                    const actionLabel = recommendationLabels[action] || action;
                    return (
                      <div
                        key={idx}
                        style={{
                          padding: '12px 16px',
                          borderRadius: '6px',
                          border: `1px solid ${
                            prediction.riskLevel === 'HIGH' ? '#ffccc7' :
                            prediction.riskLevel === 'MEDIUM' ? '#ffe58f' : '#b7eb8f'
                          }`,
                          background: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                        }}
                      >
                        <span style={{ 
                          fontSize: '18px',
                          color: prediction.riskLevel === 'HIGH' ? '#ff4d4f' :
                                 prediction.riskLevel === 'MEDIUM' ? '#faad14' : '#52c41a'
                        }}>
                          {idx + 1}.
                        </span>
                        <span style={{ fontSize: '14px', color: '#1f2937', flex: 1 }}>
                          {actionLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default QuickPredictionPage;
