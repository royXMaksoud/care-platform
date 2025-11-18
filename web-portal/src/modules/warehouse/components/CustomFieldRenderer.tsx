/**
 * CustomFieldRenderer Component
 * 
 * Dynamically renders form fields based on CustomFieldDefinition metadata
 * Supports all data types: STRING, NUMBER, BOOLEAN, DATE, DATETIME, ENUM, LIST, JSON, MEDIA
 * 
 * @author CARE Team
 */

import React from 'react'
import { Form, Input, InputNumber, Switch, DatePicker, Select, Upload, message } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import type { CustomFieldDefinition } from '../types'
import dayjs from 'dayjs'

const { TextArea } = Input
const { RangePicker } = DatePicker

interface CustomFieldRendererProps {
  field: CustomFieldDefinition
  value?: any
  onChange?: (value: any) => void
  disabled?: boolean
  locale?: string
}

/**
 * Renders a single custom field based on its data type
 */
export const CustomFieldRenderer: React.FC<CustomFieldRendererProps> = ({
  field,
  value,
  onChange,
  disabled = false,
  locale = 'en',
}) => {
  const label = field.labelTranslations[locale] || field.labelTranslations['en'] || field.fieldKey
  const isRequired = field.isRequired

  // Get field validation rules
  const rules: any[] = []
  if (isRequired) {
    rules.push({ required: true, message: `${label} is required` })
  }

  // Handle different data types
  switch (field.dataType) {
    case 'STRING':
      if (field.regexPattern) {
        rules.push({
          pattern: new RegExp(field.regexPattern),
          message: `${label} format is invalid`,
        })
      }
      return (
        <Form.Item
          label={label}
          name={field.fieldKey}
          rules={rules}
          initialValue={value}
        >
          <Input
            disabled={disabled}
            onChange={(e) => onChange?.(e.target.value)}
            maxLength={field.maxValue ? Number(field.maxValue) : undefined}
          />
        </Form.Item>
      )

    case 'NUMBER':
      return (
        <Form.Item
          label={label}
          name={field.fieldKey}
          rules={[
            ...rules,
            {
              type: 'number',
              min: field.minValue,
              max: field.maxValue,
              message: `${label} must be between ${field.minValue || 0} and ${field.maxValue || '∞'}`,
            },
          ]}
          initialValue={value}
        >
          <InputNumber
            disabled={disabled}
            style={{ width: '100%' }}
            min={field.minValue}
            max={field.maxValue}
            onChange={(val) => onChange?.(val)}
          />
        </Form.Item>
      )

    case 'BOOLEAN':
      return (
        <Form.Item
          label={label}
          name={field.fieldKey}
          valuePropName="checked"
          initialValue={value || false}
        >
          <Switch
            disabled={disabled}
            onChange={(checked) => onChange?.(checked)}
          />
        </Form.Item>
      )

    case 'DATE':
      return (
        <Form.Item
          label={label}
          name={field.fieldKey}
          rules={rules}
          initialValue={value ? dayjs(value) : undefined}
        >
          <DatePicker
            disabled={disabled}
            style={{ width: '100%' }}
            onChange={(date) => onChange?.(date ? date.format('YYYY-MM-DD') : null)}
          />
        </Form.Item>
      )

    case 'DATETIME':
      return (
        <Form.Item
          label={label}
          name={field.fieldKey}
          rules={rules}
          initialValue={value ? dayjs(value) : undefined}
        >
          <DatePicker
            showTime
            disabled={disabled}
            style={{ width: '100%' }}
            onChange={(date) => onChange?.(date ? date.toISOString() : null)}
          />
        </Form.Item>
      )

    case 'ENUM':
    case 'LIST':
      const options = (field.allowedValues || []).map((item) => ({
        label: item.label[locale] || item.label['en'] || item.code,
        value: item.code,
      }))

      return (
        <Form.Item
          label={label}
          name={field.fieldKey}
          rules={rules}
          initialValue={value}
        >
          <Select
            disabled={disabled}
            options={options}
            onChange={(val) => onChange?.(val)}
            mode={field.dataType === 'LIST' ? 'multiple' : undefined}
          />
        </Form.Item>
      )

    case 'JSON':
      return (
        <Form.Item
          label={label}
          name={field.fieldKey}
          rules={rules}
          initialValue={value ? JSON.stringify(value, null, 2) : ''}
        >
          <TextArea
            rows={4}
            disabled={disabled}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value)
                onChange?.(parsed)
              } catch {
                // Invalid JSON, but let user continue typing
              }
            }}
          />
        </Form.Item>
      )

    case 'MEDIA':
      return (
        <Form.Item
          label={label}
          name={field.fieldKey}
          rules={rules}
        >
          <Upload
            disabled={disabled}
            beforeUpload={() => false} // Prevent auto upload
            onChange={(info) => {
              if (info.fileList.length > 0) {
                onChange?.(info.fileList[0].originFileObj)
              }
            }}
          >
            <button type="button">
              <UploadOutlined /> Upload
            </button>
          </Upload>
        </Form.Item>
      )

    default:
      return (
        <Form.Item
          label={label}
          name={field.fieldKey}
          rules={rules}
          initialValue={value}
        >
          <Input
            disabled={disabled}
            onChange={(e) => onChange?.(e.target.value)}
          />
        </Form.Item>
      )
  }
}

/**
 * Renders multiple custom fields in a form
 */
interface CustomFieldsFormProps {
  fields: CustomFieldDefinition[]
  values?: Record<string, any>
  onChange?: (values: Record<string, any>) => void
  disabled?: boolean
  locale?: string
}

export const CustomFieldsForm: React.FC<CustomFieldsFormProps> = ({
  fields,
  values = {},
  onChange,
  disabled = false,
  locale = 'en',
}) => {
  const sortedFields = [...fields].sort((a, b) => a.sortOrder - b.sortOrder)

  const handleFieldChange = (fieldKey: string, value: any) => {
    const newValues = { ...values, [fieldKey]: value }
    onChange?.(newValues)
  }

  return (
    <>
      {sortedFields.map((field) => (
        <CustomFieldRenderer
          key={field.id}
          field={field}
          value={values[field.fieldKey]}
          onChange={(val) => handleFieldChange(field.fieldKey, val)}
          disabled={disabled}
          locale={locale}
        />
      ))}
    </>
  )
}

