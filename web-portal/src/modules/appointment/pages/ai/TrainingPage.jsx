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
  Upload,
  Tabs,
  Table,
  Modal,
} from 'antd';
import {
  PlayCircleOutlined,
  ExperimentOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  DownloadOutlined,
  UploadOutlined,
  FileExcelOutlined,
  FileTextOutlined,
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
  const [uploadedData, setUploadedData] = useState(null);
  const [uploadedDataPreview, setUploadedDataPreview] = useState([]);
  const [activeTab, setActiveTab] = useState('config'); // config or upload

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
      message.success(t('appointment.ai.training.success.started', { defaultValue: 'Training started successfully' }));

      // Start polling for progress
      const interval = setInterval(() => {
        pollTrainingStatus(response.data.jobId);
      }, 2000);
      setPollInterval(interval);
    } catch (err) {
      setError(err.response?.data?.message || t('appointment.ai.training.error.start', { defaultValue: 'Error starting training' }));
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
        message.success(t('appointment.ai.training.success.completed', { defaultValue: 'Training completed successfully!' }));
        setTraining(false);
      } else if (response.data.status === 'FAILED') {
        if (pollInterval) clearInterval(pollInterval);
        setError(t('appointment.ai.training.error.failed', { defaultValue: 'Training failed' }));
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
    if (job.progressPercentage < 25) return t('appointment.ai.training.progress.extracting', { defaultValue: 'Extracting data...' });
    if (job.progressPercentage < 50) return t('appointment.ai.training.progress.preparing', { defaultValue: 'Preparing features...' });
    if (job.progressPercentage < 75) return t('appointment.ai.training.progress.training', { defaultValue: 'Training model...' });
    if (job.progressPercentage < 100) return t('appointment.ai.training.progress.evaluating', { defaultValue: 'Evaluating model...' });
    return t('appointment.ai.training.progress.completed', { defaultValue: 'Completed!' });
  };

  // Download Template
  const downloadTemplate = () => {
    const templateData = [
      {
        appointmentId: '1001',
        age: '35',
        gender: 'M',
        serviceType: 'Cardiology',
        appointmentTime: '10:30',
        dayOfWeek: 'Monday',
        distanceKm: '45',
        priority: 'NORMAL',
        previousNoShows: '1',
        previousAppointments: '5',
        noShow: 'true', // Training data must include the outcome
      },
      {
        appointmentId: '1002',
        age: '48',
        gender: 'F',
        serviceType: 'General',
        appointmentTime: '14:00',
        dayOfWeek: 'Tuesday',
        distanceKm: '15',
        priority: 'URGENT',
        previousNoShows: '0',
        previousAppointments: '3',
        noShow: 'false',
      },
      {
        appointmentId: '1003',
        age: '62',
        gender: 'M',
        serviceType: 'Ophthalmology',
        appointmentTime: '09:00',
        dayOfWeek: 'Wednesday',
        distanceKm: '8',
        priority: 'NORMAL',
        previousNoShows: '0',
        previousAppointments: '10',
        noShow: 'false',
      },
    ];

    const csv = [
      'appointmentId,age,gender,serviceType,appointmentTime,dayOfWeek,distanceKm,priority,previousNoShows,previousAppointments,noShow',
      ...templateData.map(row =>
        `${row.appointmentId},${row.age},${row.gender},${row.serviceType},${row.appointmentTime},${row.dayOfWeek},${row.distanceKm},${row.priority},${row.previousNoShows},${row.previousAppointments},${row.noShow}`
      ),
    ].join('\n');

    const element = document.createElement('a');
    element.setAttribute('href', `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`);
    element.setAttribute('download', 'training_data_template.csv');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    message.success(t('appointment.ai.training.success.templateDownloaded', { defaultValue: 'Template downloaded successfully' }));
  };

  // Parse CSV
  const parseCSV = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csv = e.target.result;
          const lines = csv.split('\n').filter(line => line.trim());
          const headers = lines[0].split(',').map(h => h.trim());
          const data = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim());
            const obj = {};
            headers.forEach((header, index) => {
              obj[header] = values[index];
            });
            return obj;
          });
          resolve(data);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  // Handle Upload
  const handleUpload = async (file) => {
    try {
      setLoading(true);
      const data = await parseCSV(file);
      setUploadedData(data);
      setUploadedDataPreview(data.slice(0, 5)); // Preview first 5 rows
      message.success(t('appointment.ai.training.success.uploadedRecords', { defaultValue: `${data.length} records loaded successfully`, count: data.length }));
    } catch (err) {
      message.error(t('appointment.ai.training.error.fileProcess', { defaultValue: 'Error processing file: ' }) + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Train with uploaded data
  const handleTrainWithUploadedData = async () => {
    if (!uploadedData || uploadedData.length === 0) {
      message.error(t('appointment.ai.training.error.noData', { defaultValue: 'No data to train' }));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const request = {
        uploadedData: uploadedData,
        algorithm: 'RANDOM_FOREST',
        trainTestSplit: 0.7,
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
          maxDepth: 10,
          numTrees: 100,
          minSamplesSplit: 5,
        },
      };

      const response = await axios.post('/api/ai/training/start-with-data', request);
      setJob(response.data);
      setTraining(true);
      message.success(t('appointment.ai.training.success.started', { defaultValue: 'Training started successfully' }));

      const interval = setInterval(() => {
        pollTrainingStatus(response.data.jobId);
      }, 2000);
      setPollInterval(interval);
    } catch (err) {
      setError(err.response?.data?.message || t('appointment.ai.training.error.start', { defaultValue: 'Error starting training' }));
      console.error('Training error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Download Results
  const downloadResults = () => {
    if (!job || !job.results) return;

    const results = {
      jobId: job.jobId,
      completedAt: new Date().toISOString(),
      metrics: {
        accuracy: job.results.accuracy,
        precision: job.results.precision,
        recall: job.results.recall,
        f1Score: job.results.f1Score,
      },
      trainingDataCount: job.results.trainingDataCount,
      modelVersion: job.results.modelVersionNumber,
    };

    const csv = [
      `${t('appointment.ai.training.results.metricHeader', { defaultValue: 'Metric' })},${t('appointment.ai.training.results.valueHeader', { defaultValue: 'Value' })}`,
      `${t('appointment.ai.training.stats.accuracy', { defaultValue: 'Accuracy' })},${job.results.accuracy}%`,
      `${t('appointment.ai.training.stats.precision', { defaultValue: 'Precision' })},${job.results.precision}%`,
      `${t('appointment.ai.training.stats.recall', { defaultValue: 'Recall' })},${job.results.recall}%`,
      `${t('appointment.ai.training.stats.f1Score', { defaultValue: 'F1 Score' })},${job.results.f1Score}%`,
      `${t('appointment.ai.training.results.trainingCount', { defaultValue: 'Training Data Count' })},${job.results.trainingDataCount}`,
      `${t('appointment.ai.training.results.modelVersionLabel', { defaultValue: 'Model Version' })},v${job.results.modelVersionNumber}`,
    ].join('\n');

    const element = document.createElement('a');
    element.setAttribute('href', `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`);
    element.setAttribute('download', `training-results-${job.jobId.substring(0, 8)}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    message.success(t('appointment.ai.training.success.resultsDownloaded', { defaultValue: 'Results downloaded successfully' }));
  };

  return (
    <div className="training-page">
      <Card
        title={
          <Space>
            <ExperimentOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
            <span>{t('appointment.ai.training.title', { defaultValue: 'Model Training Center' })}</span>
          </Space>
        }
        variant="borderless"
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
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  key: 'config',
                  label: t('appointment.ai.training.tabs.manual', { defaultValue: 'Manual Configuration' }),
                  children: (
                    <div style={{ paddingTop: '20px' }}>

              <Form
                form={form}
                layout="vertical"
                onFinish={handleStartTraining}
                initialValues={{
                  dateRange: [dayjs().subtract(3, 'months'), dayjs()],
                  algorithm: 'RANDOM_FOREST',
                  numTrees: 100,
                  maxDepth: 10,
                  trainTestSplit: 0.7,
                }}
              >
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="dateRange"
                    label={t('appointment.ai.training.dateRange', { defaultValue: 'Date Range' })}
                    rules={[{ required: true, message: t('appointment.ai.training.required', { defaultValue: 'Required' }) }]}
                  >
                    <DatePicker.RangePicker
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    name="algorithm"
                    label={t('appointment.ai.training.algorithm', { defaultValue: 'Algorithm' })}
                  >
                    <Select
                      options={[
                        { label: t('appointment.ai.training.randomForest', { defaultValue: 'Random Forest (Recommended)' }), value: 'RANDOM_FOREST' },
                        { label: t('appointment.ai.training.logisticRegression', { defaultValue: 'Logistic Regression' }), value: 'LOGISTIC_REGRESSION' },
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider>{t('appointment.ai.training.sections.hyperparameters', { defaultValue: 'Hyperparameters' })}</Divider>

              <Row gutter={16}>
                <Col xs={24} sm={8}>
                  <Form.Item
                    name="numTrees"
                    label={t('appointment.ai.training.numTrees', { defaultValue: 'Number of Trees' })}
                  >
                    <Input type="number" min={10} max={500} />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={8}>
                  <Form.Item
                    name="maxDepth"
                    label={t('appointment.ai.training.maxDepth', { defaultValue: 'Max Depth' })}
                  >
                    <Input type="number" min={3} max={50} />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={8}>
                  <Form.Item
                    name="trainTestSplit"
                    label={t('appointment.ai.training.trainTestSplit', { defaultValue: 'Train/Test Split' })}
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
                  {t('appointment.ai.training.actions.start', { defaultValue: 'Start Training' })}
                </Button>
              </Form.Item>
            </Form>

                <Alert
                  type="info"
                  message={t('appointment.ai.training.tip', { defaultValue: 'Tip' })}
                  description={t('appointment.ai.training.tipDescription', { defaultValue: 'Full training may take 5-15 minutes. Use an appropriate date range for best results.' })}
                  showIcon
                  style={{ marginTop: '20px' }}
                />
                    </div>
                  ),
                },
                {
                  key: 'upload',
                  label: t('appointment.ai.training.tabs.upload', { defaultValue: 'Upload Data' }),
                  children: (
                    <div style={{ paddingTop: '20px' }}>
              <Divider>{t('appointment.ai.training.sections.uploadData', { defaultValue: 'Upload Training Data' })}</Divider>

              <Card style={{ marginBottom: '20px', backgroundColor: '#fafafa' }}>
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <h3 style={{ marginBottom: '15px', color: '#1890ff' }}>
                      {t('appointment.ai.training.upload.steps', { defaultValue: 'How to Upload:' })}
                    </h3>
                    <ol style={{ lineHeight: '1.8' }}>
                      <li>
                        <strong>{t('appointment.ai.training.upload.step1', { defaultValue: 'Click "Download Template"' })}</strong>
                        <br />
                        <span style={{ fontSize: '12px', color: '#666' }}>
                          {t('appointment.ai.training.upload.step1desc', { defaultValue: 'This saves a CSV file with the correct format' })}
                        </span>
                      </li>
                      <li style={{ marginTop: '10px' }}>
                        <strong>{t('appointment.ai.training.upload.step2', { defaultValue: 'Fill the CSV with your data' })}</strong>
                        <br />
                        <span style={{ fontSize: '12px', color: '#666' }}>
                          {t('appointment.ai.training.upload.step2desc', { defaultValue: 'Open in Excel and add your appointment records' })}
                        </span>
                      </li>
                      <li style={{ marginTop: '10px' }}>
                        <strong>{t('appointment.ai.training.upload.step3', { defaultValue: 'Upload the file below' })}</strong>
                        <br />
                        <span style={{ fontSize: '12px', color: '#666' }}>
                          {t('appointment.ai.training.upload.step3desc', { defaultValue: 'Drag and drop or click to select your CSV file' })}
                        </span>
                      </li>
                      <li style={{ marginTop: '10px' }}>
                        <strong>{t('appointment.ai.training.upload.step4', { defaultValue: 'Click "Start Training"' })}</strong>
                        <br />
                        <span style={{ fontSize: '12px', color: '#666' }}>
                          {t('appointment.ai.training.upload.step4desc', { defaultValue: 'The model will train on your data' })}
                        </span>
                      </li>
                    </ol>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Card type="inner" style={{ backgroundColor: '#e6f7ff', border: '1px solid #91d5ff' }}>
                      <h4 style={{ marginBottom: '15px', color: '#0b4ea2' }}>
                        {t('appointment.ai.training.upload.requirements', { defaultValue: 'File Requirements:' })}
                      </h4>
                      <ul style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
                        <li>{t('appointment.ai.training.upload.req1', { defaultValue: 'Format: CSV file only' })}</li>
                        <li>{t('appointment.ai.training.upload.req2', { defaultValue: 'Encoding: UTF-8' })}</li>
                        <li>{t('appointment.ai.training.upload.req3', { defaultValue: 'Minimum 50 records' })}</li>
                        <li>{t('appointment.ai.training.upload.req4', { defaultValue: 'Maximum 100,000 records' })}</li>
                        <li>{t('appointment.ai.training.upload.req5', { defaultValue: 'Must have all required columns' })}</li>
                      </ul>
                    </Card>
                  </Col>
                </Row>
              </Card>

              <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <Button
                  type="primary"
                  size="large"
                  icon={<DownloadOutlined />}
                  onClick={downloadTemplate}
                  loading={loading}
                >
                  {t('appointment.ai.training.upload.downloadTemplate', { defaultValue: 'Download Template' })}
                </Button>
                <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                  {t('appointment.ai.training.upload.templateInfo', { defaultValue: 'This will download a CSV file named training_data_template.csv' })}
                </p>
              </div>

              <Card className="upload-card" style={{ marginBottom: '20px', border: '2px dashed #1890ff' }}>
                <Upload.Dragger
                  accept=".csv"
                  maxCount={1}
                  beforeUpload={(file) => {
                    handleUpload(file);
                    return false;
                  }}
                  disabled={loading}
                >
                  <p style={{ fontSize: '24px', marginBottom: '10px' }}>
                    📤
                  </p>
                  <p style={{ fontSize: '16px', fontWeight: '500' }}>
                    {t('appointment.ai.training.upload.dragdrop', { defaultValue: 'Drag CSV file here or click to select' })}
                  </p>
                  <p style={{ color: '#8c8c8c', marginTop: '5px' }}>
                    {t('appointment.ai.training.upload.csvonly', { defaultValue: 'CSV files only' })}
                  </p>
                </Upload.Dragger>
              </Card>

              {uploadedDataPreview.length > 0 && (
              <>
                <Card style={{ marginBottom: '20px' }}>
                  <h3>{t('appointment.ai.training.upload.preview', { defaultValue: 'Data Preview (First 5 rows)' })}</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <Table
                      dataSource={uploadedDataPreview.map((row, idx) => ({ ...row, key: idx }))}
                      columns={Object.keys(uploadedDataPreview[0] || {}).map(key => ({
                        title: key,
                        dataIndex: key,
                        key: key,
                        width: 100,
                      }))}
                      pagination={false}
                      size="small"
                    />
                  </div>
                  <Alert
                    type="success"
                    message={t('appointment.ai.training.upload.recordsLoaded', { defaultValue: `${uploadedData.length} records loaded` })}
                    style={{ marginTop: '15px' }}
                    showIcon
                  />
                </Card>

                <Button
                  type="primary"
                  size="large"
                  block
                  loading={loading}
                  onClick={handleTrainWithUploadedData}
                  icon={<PlayCircleOutlined />}
                >
                  {t('appointment.ai.training.upload.startTraining', { defaultValue: 'Start Training with Uploaded Data' })}
                </Button>
              </>
              )}
                    </div>
                  ),
                },
              ]}
            />
          </>
        )}

        {job && training && (
          <>
            <Divider>{t('appointment.ai.training.sections.inProgress', { defaultValue: 'Training in Progress' })}</Divider>

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
                  { title: t('appointment.ai.training.steps.extract', { defaultValue: 'Extract' }) },
                  { title: t('appointment.ai.training.steps.engineer', { defaultValue: 'Engineer' }) },
                  { title: t('appointment.ai.training.steps.train', { defaultValue: 'Train' }) },
                  { title: t('appointment.ai.training.steps.evaluate', { defaultValue: 'Evaluate' }) },
                  { title: t('appointment.ai.training.steps.complete', { defaultValue: 'Complete' }) },
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
              <h3>{t('appointment.ai.training.details', { defaultValue: 'Details' })}</h3>
              <Timeline
                items={[
                  {
                    dot: <CheckCircleOutlined style={{ fontSize: '16px', color: '#52c41a' }} />,
                    children: (
                      <p>
                        {t('appointment.ai.training.timeline.dataCount', { defaultValue: 'Training Data Count' })}:
                        <strong style={{ marginLeft: '8px' }}>{job.results?.trainingDataCount || 'N/A'}</strong>
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
                    children: <p>{t('appointment.ai.training.timeline.featuresPrepared', { defaultValue: 'Features prepared' })}</p>,
                  },
                  {
                    dot:
                      job.progressPercentage >= 75 ? (
                        <CheckCircleOutlined style={{ fontSize: '16px', color: '#52c41a' }} />
                      ) : (
                        <LoadingOutlined />
                      ),
                    children: <p>{t('appointment.ai.training.timeline.modelTraining', { defaultValue: 'Model training' })}</p>,
                  },
                  {
                    dot:
                      job.progressPercentage === 100 ? (
                        <CheckCircleOutlined style={{ fontSize: '16px', color: '#52c41a' }} />
                      ) : (
                        <LoadingOutlined />
                      ),
                    children: <p>{t('appointment.ai.training.timeline.evaluating', { defaultValue: 'Evaluating and saving' })}</p>,
                  },
                ]}
              />
            </Card>
          </>
        )}

        {job && !training && (
          <>
            <Divider>{t('appointment.ai.training.sections.results', { defaultValue: 'Training Results' })}</Divider>

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
                  message={t('appointment.ai.training.success.complete', { defaultValue: 'Training Completed Successfully!' })}
                  description={
                    <>
                      <p>
                        {t('appointment.ai.training.success.modelVersion', { defaultValue: 'Model created' })}:
                        <Tag color="green" style={{ marginLeft: '8px' }}>v{job.results.modelVersionNumber}</Tag>
                      </p>
                      <p>
                        {t('appointment.ai.training.success.modelAccuracy', { defaultValue: `Accuracy: ${job.results.accuracy}%` })}
                      </p>
                      <p>
                        {t('appointment.ai.training.success.readyForUse', { defaultValue: 'Model is ready to use for predictions' })}
                      </p>
                    </>
                  }
                  showIcon
                  style={{ marginTop: '20px' }}
                />

                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                  <Space>
                    <Button
                      type="primary"
                      size="large"
                      icon={<DownloadOutlined />}
                      onClick={downloadResults}
                    >
                      {t('appointment.ai.training.actions.downloadResults', { defaultValue: 'Download Results' })}
                    </Button>
                  </Space>
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
              {t('appointment.ai.training.actions.newModel', { defaultValue: 'Train New Model' })}
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
