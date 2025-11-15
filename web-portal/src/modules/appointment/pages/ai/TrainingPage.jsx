import React, { useState } from 'react';
import {
  Card,
  Form,
  Button,
  Input,
  Select,
  DatePicker,
  Space,
  Spin,
  Alert,
  Divider,
  Progress,
  Statistic,
  Row,
  Col,
  Steps,
  Tag,
  Timeline,
  Tooltip,
  message,
} from 'antd';
import {
  PlayCircleOutlined,
  BrainOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './TrainingPage.css';

/**
 * Model Training Page
 * Allows data scientists to configure and run training jobs
 */
const TrainingPage = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [training, setTraining] = useState(null);
  const [job, setJob] = useState(null);
  const [error, setError] = useState(null);
  const [pollInterval, setPollInterval] = useState(null);

  // Start training
  const handleStartTraining = async (values) => {
    setLoading(true);
    setError(null);

    try {
      const request = {
        dateRangeFrom: values.dateRange[0].format('YYYY-MM-DD'),
        dateRangeTo: values.dateRange[1].format('YYYY-MM-DD'),
        centerIds: values.centerIds || [],
        serviceTypeIds: values.serviceTypeIds || [],
        algorithm: values.algorithm || 'RANDOM_FOREST',
        trainTestSplit: values.trainTestSplit || 0.7,
        features: [
          'age',
          'gender',
          'serviceType',
          'appointmentTime',
          'dayOfWeek',
          'distanceKm',
          'priority',
          'previousNoShows',
          'previousAppointments',
        ],
        hyperparameters: {
          maxDepth: values.maxDepth || 10,
          numTrees: values.numTrees || 100,
          minSamplesSplit: values.minSamplesSplit || 5,
        },
      };

      const response = await axios.post('/api/ai/training/start', request);
      setJob(response.data);
      setTraining(true);
      message.success('التدريب بدأ بنجاح / Training started successfully');

      // Start polling for progress
      const interval = setInterval(() => {
        pollTrainingStatus(response.data.jobId);
      }, 2000);
      setPollInterval(interval);
    } catch (err) {
      setError(err.response?.data?.message || 'خطأ في بدء التدريب / Error starting training');
      console.error('Training error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Poll training status
  const pollTrainingStatus = async (jobId) => {
    try {
      const response = await axios.get(`/api/ai/training/status/${jobId}`);
      setJob(response.data);

      if (response.data.status === 'COMPLETED') {
        if (pollInterval) clearInterval(pollInterval);
        message.success('التدريب اكتمل بنجاح! / Training completed successfully!');
        setTraining(false);
      } else if (response.data.status === 'FAILED') {
        if (pollInterval) clearInterval(pollInterval);
        setError('فشل التدريب / Training failed');
        setTraining(false);
      }
    } catch (err) {
      console.error('Error polling status:', err);
    }
  };

  const getStepStatus = () => {
    if (!job) return 0;
    if (job.progressPercentage < 25) return 0;
    if (job.progressPercentage < 50) return 1;
    if (job.progressPercentage < 75) return 2;
    if (job.progressPercentage < 100) return 3;
    return 4;
  };

  const getStepDescription = () => {
    if (!job) return '';
    if (job.progressPercentage < 25) return 'استخراج البيانات / Extracting data...';
    if (job.progressPercentage < 50) return 'تحضير المميزات / Preparing features...';
    if (job.progressPercentage < 75) return 'تدريب النموذج / Training model...';
    if (job.progressPercentage < 100) return 'تقييم الأداء / Evaluating model...';
    return 'اكتمل / Completed!';
  };

  return (
    <div className="training-page">
      <Card
        title={
          <Space>
            <BrainOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
            <span>{t('appointment.ai.training.title', { defaultValue: '🧠 Model Training Center' })}</span>
          </Space>
        }
        bordered={false}
      >
        {error && (
          <Alert
            message={t('appointment.ai.training.errorTitle', { defaultValue: 'Error' })}
            description={error}
            type="error"
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: '20px' }}
          />
        )}

        {!job && (
          <>
            <Divider>⚙️ تكوين التدريب / Training Configuration</Divider>

            <Form form={form} layout="vertical" onFinish={handleStartTraining}>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="dateRange"
                    label={t('appointment.ai.training.dateRange', { defaultValue: 'Date Range' })}
                    rules={[{ required: true, message: 'مطلوب / Required' }]}
                  >
                    <DatePicker.RangePicker
                      style={{ width: '100%' }}
                      defaultValue={[
                        dayjs().subtract(3, 'months'),
                        dayjs(),
                      ]}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    name="algorithm"
                    label={t('appointment.ai.training.algorithm', { defaultValue: 'Algorithm' })}
                    initialValue="RANDOM_FOREST"
                  >
                    <Select
                      options={[
                        { label: '🌲 Random Forest (Recommended)', value: 'RANDOM_FOREST' },
                        { label: '📈 Logistic Regression', value: 'LOGISTIC_REGRESSION' },
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider>🎯 Hyperparameters</Divider>

              <Row gutter={16}>
                <Col xs={24} sm={8}>
                  <Form.Item
                    name="numTrees"
                    label={t('appointment.ai.training.numTrees', { defaultValue: 'Number of Trees' })}
                    initialValue={100}
                  >
                    <Input type="number" min={10} max={500} />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={8}>
                  <Form.Item
                    name="maxDepth"
                    label={t('appointment.ai.training.maxDepth', { defaultValue: 'Max Depth' })}
                    initialValue={10}
                  >
                    <Input type="number" min={3} max={50} />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={8}>
                  <Form.Item
                    name="trainTestSplit"
                    label={t('appointment.ai.training.trainTestSplit', { defaultValue: 'Train/Test Split' })}
                    initialValue={0.7}
                  >
                    <Input type="number" min={0.5} max={0.9} step={0.1} placeholder="0.7" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  size="large"
                  block
                  icon={<PlayCircleOutlined />}
                >
                  {t('appointment.ai.training.actions.start', { defaultValue: '▶️ Start Training' })}
                </Button>
              </Form.Item>
            </Form>

            <Alert
              type="info"
              message="📌 نصيحة / Tip"
              description="التدريب على البيانات الكاملة قد يستغرق 5-15 دقيقة. استخدم نطاق تاريخي مناسب للحصول على أفضل النتائج. / Full training may take 5-15 minutes. Use an appropriate date range for best results."
              showIcon
              style={{ marginTop: '20px' }}
            />
          </>
        )}

        {job && training && (
          <>
            <Divider>⏳ التدريب جاري / Training in Progress</Divider>

            <Row gutter={16} style={{ marginBottom: '30px' }}>
              <Col xs={24} sm={12}>
                <Card>
                  <Statistic
                    title={t('appointment.ai.training.stats.jobId', { defaultValue: 'Job ID' })}
                    value={job.jobId.substring(0, 8)}
                    suffix="..."
                  />
                </Card>
              </Col>

              <Col xs={24} sm={12}>
                <Card>
                  <Statistic
                    title={t('appointment.ai.training.stats.elapsed', { defaultValue: 'Elapsed' })}
                    value={formatTime(job.elapsedSeconds)}
                  />
                </Card>
              </Col>
            </Row>

            <Card className="progress-card">
              <Steps
                current={getStepStatus()}
                items={[
                  { title: 'استخراج البيانات / Extract' },
                  { title: 'هندسة المميزات / Engineer' },
                  { title: 'تدريب النموذج / Train' },
                  { title: 'التقييم / Evaluate' },
                  { title: 'اكتمل / Complete' },
                ]}
              />
            </Card>

            <Card className="progress-card" style={{ marginTop: '20px' }}>
              <p style={{ marginBottom: '10px' }}>
                {t('appointment.ai.training.stats.progress', { defaultValue: 'Training Progress' })}:
                <strong style={{ marginLeft: '10px' }}>{job.progressPercentage}%</strong>
              </p>
              <Progress
                percent={job.progressPercentage}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#52c41a',
                }}
                status={job.progressPercentage === 100 ? 'success' : 'active'}
              />
              <p style={{ marginTop: '10px', color: '#666' }}>{getStepDescription()}</p>
            </Card>

            <Card className="timeline-card" style={{ marginTop: '20px' }}>
              <h3>📊 التفاصيل / Details</h3>
              <Timeline
                items={[
                  {
                    dot: <CheckCircleOutlined style={{ fontSize: '16px', color: '#52c41a' }} />,
                    children: (
                      <p>
                        عدد البيانات التدريبية: <strong>{job.results?.trainingDataCount || 'N/A'}</strong>
                      </p>
                    ),
                  },
                  {
                    dot:
                      job.progressPercentage >= 25 ? (
                        <CheckCircleOutlined style={{ fontSize: '16px', color: '#52c41a' }} />
                      ) : (
                        <LoadingOutlined />
                      ),
                    children: <p>المميزات جاهزة / Features prepared</p>,
                  },
                  {
                    dot:
                      job.progressPercentage >= 75 ? (
                        <CheckCircleOutlined style={{ fontSize: '16px', color: '#52c41a' }} />
                      ) : (
                        <LoadingOutlined />
                      ),
                    children: <p>النموذج قيد التدريب / Model training</p>,
                  },
                  {
                    dot:
                      job.progressPercentage === 100 ? (
                        <CheckCircleOutlined style={{ fontSize: '16px', color: '#52c41a' }} />
                      ) : (
                        <LoadingOutlined />
                      ),
                    children: <p>التقييم والحفظ / Evaluating and saving</p>,
                  },
                ]}
              />
            </Card>
          </>
        )}

        {job && !training && (
          <>
            <Divider>✅ نتائج التدريب / Training Results</Divider>

            {job.results && (
              <>
                <Row gutter={16} style={{ marginBottom: '30px' }}>
                  <Col xs={24} sm={12}>
                    <Card className="result-card">
                      <Statistic
                        title={t('appointment.ai.training.stats.accuracy', { defaultValue: 'Accuracy' })}
                        value={`${job.results.accuracy}%`}
                        valueStyle={{ color: '#52c41a' }}
                        prefix={<CheckCircleOutlined />}
                      />
                    </Card>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Card className="result-card">
                      <Statistic
                        title={t('appointment.ai.training.stats.precision', { defaultValue: 'Precision' })}
                        value={`${job.results.precision}%`}
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Card>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Card className="result-card">
                      <Statistic
                        title={t('appointment.ai.training.stats.recall', { defaultValue: 'Recall' })}
                        value={`${job.results.recall}%`}
                        valueStyle={{ color: '#faad14' }}
                      />
                    </Card>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Card className="result-card">
                      <Statistic
                        title={t('appointment.ai.training.stats.f1Score', { defaultValue: 'F1 Score' })}
                        value={`${job.results.f1Score}%`}
                        valueStyle={{ color: '#eb2f96' }}
                      />
                    </Card>
                  </Col>
                </Row>

                <Alert
                  type="success"
                  message="🎉 التدريب اكتمل بنجاح! / Training Completed Successfully!"
                  description={
                    <>
                      <p>
                        تم إنشاء النموذج{' '}
                        <Tag color="green">v{job.results.modelVersionNumber}</Tag>{' '}
                        بنجاح بدقة {job.results.accuracy}%
                      </p>
                      <p>
                        يمكنك الآن استخدام هذا النموذج للتنبؤ بعدم الحضور في الموعد القادم.
                      </p>
                    </>
                  }
                  showIcon
                  style={{ marginTop: '20px' }}
                />

                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<DownloadOutlined />}
                    onClick={() => message.info('الميزة قريباً / Feature coming soon')}
                  >
                    تحميل التقرير / Download Report
                  </Button>
                </div>
              </>
            )}

            <Button
              type="default"
              size="large"
              block
              style={{ marginTop: '20px' }}
              onClick={() => {
                setJob(null);
                setTraining(null);
                form.resetFields();
              }}
            >
              تدريب نموذج جديد / Train New Model
            </Button>
          </>
        )}
      </Card>
    </div>
  );
};

const formatTime = (seconds) => {
  if (!seconds) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

export default TrainingPage;
