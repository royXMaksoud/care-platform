import React, { useState } from 'react';
import { Button, Modal, Card, List, Space, Tag, Divider } from 'antd';
import { QuestionCircleOutlined, CheckCircleOutlined, InfoCircleOutlined, BulbOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

/**
 * Reusable Help Button Component
 * Shows helpful information about a page/feature
 *
 * Usage:
 * <HelpButton
 *   title="Dashboard Help"
 *   description="Learn about the notification dashboard"
 *   features={[...]}
 *   tips={[...]}
 *   examples={[...]}
 * />
 */
const HelpButton = ({
  title = 'Help',
  description = 'Help information',
  features = [],
  tips = [],
  examples = [],
  width = 700,
}) => {
  const { t } = useTranslation();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
  };

  return (
    <>
      {/* Help Button */}
      <Button
        type="primary"
        ghost
        icon={<QuestionCircleOutlined />}
        onClick={showModal}
        style={{
          borderRadius: '4px',
          height: '32px',
        }}
      >
        Help
      </Button>

      {/* Help Modal */}
      <Modal
        title={
          <Space>
            <InfoCircleOutlined style={{ color: '#1890ff', fontSize: '20px' }} />
            <span>{title}</span>
          </Space>
        }
        open={isModalVisible}
        onCancel={closeModal}
        footer={[
          <Button key="close" type="primary" onClick={closeModal}>
            Close
          </Button>,
        ]}
        width={width}
        styles={{
          body: {
            maxHeight: '70vh',
            overflowY: 'auto',
            padding: '24px',
          },
        }}
      >
        {/* Description */}
        <Card
          style={{
            marginBottom: '20px',
            backgroundColor: '#f5f7fa',
            border: 'none',
          }}
        >
          <p style={{ fontSize: '14px', color: '#333' }}>
            <strong>📋 Overview:</strong> {description}
          </p>
        </Card>

        {/* Features Section */}
        {features.length > 0 && (
          <>
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#1890ff', marginBottom: '12px' }}>
                <CheckCircleOutlined /> Features
              </h4>
              <List
                dataSource={features}
                renderItem={(feature, index) => (
                  <List.Item
                    style={{
                      padding: '8px 0',
                      borderBottom: index < features.length - 1 ? '1px solid #f0f0f0' : 'none',
                    }}
                  >
                    <div>
                      <Tag color="blue" style={{ marginRight: '8px' }}>
                        ✓
                      </Tag>
                      <span>{feature}</span>
                    </div>
                  </List.Item>
                )}
              />
            </div>
            <Divider />
          </>
        )}

        {/* Tips Section */}
        {tips.length > 0 && (
          <>
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#faad14', marginBottom: '12px' }}>
                <BulbOutlined /> Tips & Best Practices
              </h4>
              <List
                dataSource={tips}
                renderItem={(tip, index) => (
                  <List.Item
                    style={{
                      padding: '8px 0',
                      borderBottom: index < tips.length - 1 ? '1px solid #f0f0f0' : 'none',
                    }}
                  >
                    <div>
                      <Tag color="gold" style={{ marginRight: '8px' }}>
                        💡
                      </Tag>
                      <span>{tip}</span>
                    </div>
                  </List.Item>
                )}
              />
            </div>
            <Divider />
          </>
        )}

        {/* Examples Section */}
        {examples.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#52c41a', marginBottom: '12px' }}>
              📝 Example Use Cases
            </h4>
            <List
              dataSource={examples}
              renderItem={(example, index) => (
                <List.Item
                  style={{
                    padding: '8px 0',
                    borderBottom: index < examples.length - 1 ? '1px solid #f0f0f0' : 'none',
                  }}
                >
                  <div>
                    <Tag color="green" style={{ marginRight: '8px' }}>
                      ✓
                    </Tag>
                    <span>{example}</span>
                  </div>
                </List.Item>
              )}
            />
          </div>
        )}

        {/* Footer Note */}
        <Card
          style={{
            marginTop: '20px',
            backgroundColor: '#e6f7ff',
            border: '1px solid #91d5ff',
          }}
        >
          <p style={{ fontSize: '12px', color: '#0050b3', marginBottom: '0' }}>
            <InfoCircleOutlined /> Need more help? Check the full documentation in the sidebar or contact support.
          </p>
        </Card>
      </Modal>
    </>
  );
};

export default HelpButton;
