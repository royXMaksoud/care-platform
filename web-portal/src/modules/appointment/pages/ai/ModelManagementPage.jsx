import React, { useEffect, useMemo, useState } from 'react';
import { Card, Table, Tag, Button, Space, Alert, Tooltip, Popconfirm } from 'antd';
import { useTranslation } from 'react-i18next';
import { CheckCircleOutlined, ExclamationCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '@/lib/axios';

const statusColors = {
  ACTIVE: 'green',
  TESTING: 'blue',
  ARCHIVED: 'default',
};

function formatPercent(value) {
  if (value == null) return '—';
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (Number.isNaN(num)) return '—';
  return `${num.toFixed(2)}%`;
}

function inferPredictionType(modelName) {
  if (!modelName) return 'Unknown';
  const lower = modelName.toLowerCase();
  if (lower.includes('noshow') || lower.includes('no-show') || lower.includes('no_show')) {
    return 'No-Show';
  }
  if (lower.includes('distance')) {
    return 'Distance';
  }
  return 'Other';
}

const ModelManagementPage = () => {
  const { t } = useTranslation();
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadModels = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/api/ai/models');
      setModels(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load models', err);
      setError(
        err.response?.data?.message ||
          t('appointment.ai.models.error.load', { defaultValue: 'Failed to load models' })
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  const handleActivate = async (modelVersionId) => {
    setLoading(true);
    setError(null);
    try {
      await api.post(`/api/ai/models/${modelVersionId}/activate`);
      await loadModels();
    } catch (err) {
      console.error('Failed to activate model', err);
      setError(
        err.response?.data?.message ||
          t('appointment.ai.models.error.activate', { defaultValue: 'Failed to activate model' })
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (modelVersionId) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/api/ai/models/${modelVersionId}`);
      await loadModels();
    } catch (err) {
      console.error('Failed to delete model', err);
      setError(
        err.response?.data?.message ||
          t('appointment.ai.models.error.delete', { defaultValue: 'Failed to delete model' })
      );
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        title: t('appointment.ai.models.columns.predictionType', { defaultValue: 'Prediction Type' }),
        dataIndex: 'modelType',
        key: 'predictionType',
        render: (value, record) => {
          if (value) return value;
          return inferPredictionType(record.modelName);
        },
      },
      {
        title: t('appointment.ai.models.columns.modelName', { defaultValue: 'Model Name' }),
        dataIndex: 'modelName',
        key: 'modelName',
      },
      {
        title: t('appointment.ai.models.columns.version', { defaultValue: 'Version' }),
        dataIndex: 'versionNumber',
        key: 'versionNumber',
        width: 90,
      },
      {
        title: t('appointment.ai.models.columns.status', { defaultValue: 'Status' }),
        dataIndex: 'status',
        key: 'status',
        width: 110,
        render: (status) => (
          <Tag color={statusColors[status] || 'default'}>
            {status || t('appointment.ai.models.status.unknown', { defaultValue: 'Unknown' })}
          </Tag>
        ),
      },
      {
        title: t('appointment.ai.models.columns.accuracy', { defaultValue: 'Accuracy' }),
        dataIndex: 'accuracy',
        key: 'accuracy',
        width: 120,
        render: (value) => formatPercent(value),
      },
      {
        title: t('appointment.ai.models.columns.createdAt', { defaultValue: 'Created At' }),
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: (value) => (value ? new Date(value).toLocaleString() : '—'),
      },
      {
        title: t('appointment.ai.models.columns.actions', { defaultValue: 'Actions' }),
        key: 'actions',
        width: 220,
        render: (_, record) => {
          const isActive = record.status === 'ACTIVE';
          return (
            <Space>
              <Tooltip
                title={
                  isActive
                    ? t('appointment.ai.models.actions.activeTooltip', {
                        defaultValue: 'This is the active model used by default',
                      })
                    : t('appointment.ai.models.actions.activateTooltip', {
                        defaultValue: 'Set this model as active',
                      })
                }
              >
                <Button
                  size="small"
                  type={isActive ? 'default' : 'primary'}
                  icon={isActive ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
                  disabled={isActive}
                  onClick={() => handleActivate(record.modelVersionId)}
                >
                  {isActive
                    ? t('appointment.ai.models.actions.active', { defaultValue: 'Active' })
                    : t('appointment.ai.models.actions.activate', { defaultValue: 'Activate' })}
                </Button>
              </Tooltip>
              <Popconfirm
                title={t('appointment.ai.models.actions.deleteConfirmTitle', {
                  defaultValue: 'Delete this model?',
                })}
                description={t('appointment.ai.models.actions.deleteConfirmDescription', {
                  defaultValue:
                    'This will permanently remove the model version. Predictions linked to it may also be affected.',
                })}
                okText={t('appointment.ai.models.actions.delete', { defaultValue: 'Delete' })}
                cancelText={t('appointment.ai.models.actions.cancel', { defaultValue: 'Cancel' })}
                onConfirm={() => handleDelete(record.modelVersionId)}
              >
                <Button size="small" danger>
                  {t('appointment.ai.models.actions.delete', { defaultValue: 'Delete' })}
                </Button>
              </Popconfirm>
            </Space>
          );
        },
      },
    ],
    [t]
  );

  return (
    <div className="p-4 md:p-6">
      <Card
        title={t('appointment.ai.models.title', {
          defaultValue: 'AI Models & Prediction Types',
        })}
        extra={
          <Button icon={<ReloadOutlined />} onClick={loadModels} loading={loading}>
            {t('appointment.ai.models.refresh', { defaultValue: 'Refresh' })}
          </Button>
        }
      >
        {error && (
          <Alert
            type="error"
            message={t('appointment.ai.models.errorTitle', { defaultValue: 'Error' })}
            description={error}
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        <p style={{ marginBottom: 16, color: '#4b5563' }}>
          {t('appointment.ai.models.description', {
            defaultValue:
              'Each row represents a trained model version. For no-show predictions, the active version is used by default unless a specific model is selected.',
          })}
        </p>

        <Table
          rowKey="modelVersionId"
          dataSource={models}
          columns={columns}
          loading={loading}
          pagination={{
            pageSize: 10,
          }}
        />
      </Card>
    </div>
  );
};

export default ModelManagementPage;


