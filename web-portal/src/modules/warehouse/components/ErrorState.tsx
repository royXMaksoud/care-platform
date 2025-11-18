/**
 * ErrorState Component
 * 
 * Displays error state with retry functionality
 * 
 * @author CARE Team
 */

import React from 'react'
import { Result, Button } from 'antd'
import { ExclamationCircleOutlined, ReloadOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  retryLabel?: string
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message,
  onRetry,
  retryLabel,
}) => {
  const { t } = useTranslation()

  return (
    <Result
      status="error"
      icon={<ExclamationCircleOutlined />}
      title={title || t('warehouse.common.error')}
      subTitle={message || t('warehouse.common.error')}
      extra={
        onRetry && (
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={onRetry}
          >
            {retryLabel || t('warehouse.common.retry')}
          </Button>
        )
      }
    />
  )
}

