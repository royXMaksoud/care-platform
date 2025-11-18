/**
 * ZoneFormDrawer Component
 *
 * Create/Edit zone form in a drawer
 *
 * @author CARE Team
 */

import React, { useEffect, useState } from 'react'
import { Drawer, Form, Input, Select, Switch, Button, Space, InputNumber, message } from 'antd'
import { useTranslation } from 'react-i18next'
import {
  useCreateZoneMutation,
  useUpdateZoneMutation,
  useGetZoneByIdQuery,
} from '../../store/api/zoneApi'
import { useGetWarehousesQuery } from '../../store/api/warehouseApi'
import type { Zone } from '../../types'

interface ZoneFormDrawerProps {
  open: boolean
  onClose: () => void
  zoneId?: string
  warehouseId?: string // Pre-selected warehouse
  onSuccess?: () => void
}

export const ZoneFormDrawer: React.FC<ZoneFormDrawerProps> = ({
  open,
  onClose,
  zoneId,
  warehouseId,
  onSuccess,
}) => {
  const { t } = useTranslation()
  const [form] = Form.useForm()
  const isEdit = !!zoneId
  const [showTempFields, setShowTempFields] = useState(false)

  // Fetch zone data for editing
  const { data: zone, isLoading: isLoadingZone } = useGetZoneByIdQuery(zoneId!, {
    skip: !zoneId,
  })

  // Fetch warehouses for dropdown
  const { data: warehousesData, isLoading: isLoadingWarehouses } = useGetWarehousesQuery({
    page: 0,
    size: 100,
    isActive: true,
  })

  const [createZone, { isLoading: isCreating }] = useCreateZoneMutation()
  const [updateZone, { isLoading: isUpdating }] = useUpdateZoneMutation()

  // Populate form when editing
  useEffect(() => {
    if (zone && isEdit) {
      form.setFieldsValue({
        code: zone.code,
        name: zone.name,
        warehouseId: zone.warehouseId,
        zoneType: zone.zoneType,
        status: zone.status,
        capacityCubicMeters: zone.capacityCubicMeters,
        temperatureControlled: zone.temperatureControlled,
        temperatureMin: zone.temperatureMin,
        temperatureMax: zone.temperatureMax,
      })
      setShowTempFields(zone.temperatureControlled || false)
    } else {
      form.resetFields()
      if (warehouseId) {
        form.setFieldValue('warehouseId', warehouseId)
      }
      setShowTempFields(false)
    }
  }, [zone, isEdit, form, warehouseId])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      // If temperature controlled is false, clear temp fields
      if (!values.temperatureControlled) {
        values.temperatureMin = null
        values.temperatureMax = null
      }

      if (isEdit && zoneId) {
        await updateZone({ id: zoneId, data: values }).unwrap()
        message.success('Zone updated successfully')
      } else {
        await createZone(values).unwrap()
        message.success('Zone created successfully')
      }

      form.resetFields()
      onSuccess?.()
      onClose()
    } catch (error: any) {
      console.error('Zone form error:', error)
      message.error(error?.data?.message || 'Failed to save zone')
    }
  }

  const handleTempControlledChange = (checked: boolean) => {
    setShowTempFields(checked)
    if (!checked) {
      form.setFieldsValue({
        temperatureMin: null,
        temperatureMax: null,
      })
    }
  }

  const warehouses = warehousesData?.content || []

  return (
    <Drawer
      title={isEdit ? 'Edit Zone' : 'Create Zone'}
      open={open}
      onClose={onClose}
      width={600}
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            loading={isCreating || isUpdating}
            onClick={handleSubmit}
          >
            {isEdit ? 'Update' : 'Create'}
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        disabled={isLoadingZone || isLoadingWarehouses}
        initialValues={{
          status: 'ACTIVE',
          temperatureControlled: false,
        }}
      >
        {/* Warehouse Selection */}
        <Form.Item
          label="Warehouse"
          name="warehouseId"
          rules={[{ required: true, message: 'Please select a warehouse' }]}
        >
          <Select
            placeholder="Select warehouse"
            loading={isLoadingWarehouses}
            disabled={isEdit || !!warehouseId}
            showSearch
            optionFilterProp="children"
          >
            {warehouses.map((wh: any) => (
              <Select.Option key={wh.id} value={wh.id}>
                {wh.code} - {wh.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {/* Code */}
        <Form.Item
          label="Zone Code"
          name="code"
          rules={[
            { required: true, message: 'Zone code is required' },
            { max: 50, message: 'Code must be 50 characters or less' },
            { pattern: /^[A-Z0-9_-]+$/, message: 'Code must be uppercase letters, numbers, underscores, or hyphens' },
          ]}
        >
          <Input
            placeholder="e.g., ZONE-A1"
            disabled={isEdit}
            style={{ textTransform: 'uppercase' }}
          />
        </Form.Item>

        {/* Name */}
        <Form.Item
          label="Zone Name"
          name="name"
          rules={[
            { required: true, message: 'Zone name is required' },
            { max: 100, message: 'Name must be 100 characters or less' },
          ]}
        >
          <Input placeholder="e.g., Receiving Area A" />
        </Form.Item>

        {/* Zone Type */}
        <Form.Item
          label="Zone Type"
          name="zoneType"
          rules={[{ required: true, message: 'Please select a zone type' }]}
        >
          <Select placeholder="Select zone type">
            <Select.Option value="RECEIVING">Receiving</Select.Option>
            <Select.Option value="STORAGE">Storage</Select.Option>
            <Select.Option value="PICKING">Picking</Select.Option>
            <Select.Option value="PACKING">Packing</Select.Option>
            <Select.Option value="SHIPPING">Shipping</Select.Option>
          </Select>
        </Form.Item>

        {/* Status */}
        <Form.Item
          label="Status"
          name="status"
          rules={[{ required: true, message: 'Please select a status' }]}
        >
          <Select placeholder="Select status">
            <Select.Option value="ACTIVE">Active</Select.Option>
            <Select.Option value="INACTIVE">Inactive</Select.Option>
            <Select.Option value="MAINTENANCE">Maintenance</Select.Option>
          </Select>
        </Form.Item>

        {/* Capacity */}
        <Form.Item
          label="Capacity (Cubic Meters)"
          name="capacityCubicMeters"
          rules={[
            { required: true, message: 'Capacity is required' },
            { type: 'number', min: 0.1, message: 'Capacity must be greater than 0' },
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={0.1}
            step={0.1}
            precision={2}
            placeholder="e.g., 100.00"
            addonAfter="m³"
          />
        </Form.Item>

        {/* Temperature Controlled */}
        <Form.Item
          label="Temperature Controlled"
          name="temperatureControlled"
          valuePropName="checked"
        >
          <Switch onChange={handleTempControlledChange} />
        </Form.Item>

        {/* Temperature Range - Conditional */}
        {showTempFields && (
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="Min Temperature (°C)"
              name="temperatureMin"
              rules={[
                { required: showTempFields, message: 'Min temperature is required' },
                { type: 'number', min: -50, max: 50, message: 'Temperature must be between -50 and 50°C' },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={-50}
                max={50}
                step={1}
                placeholder="e.g., 2"
                addonAfter="°C"
              />
            </Form.Item>

            <Form.Item
              label="Max Temperature (°C)"
              name="temperatureMax"
              rules={[
                { required: showTempFields, message: 'Max temperature is required' },
                { type: 'number', min: -50, max: 50, message: 'Temperature must be between -50 and 50°C' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('temperatureMin') <= value) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error('Max temperature must be greater than min'))
                  },
                }),
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={-50}
                max={50}
                step={1}
                placeholder="e.g., 8"
                addonAfter="°C"
              />
            </Form.Item>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
          <p className="font-medium mb-2">Zone Types:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Receiving:</strong> Where goods arrive and are inspected</li>
            <li><strong>Storage:</strong> Long-term storage of inventory</li>
            <li><strong>Picking:</strong> Where items are selected for orders</li>
            <li><strong>Packing:</strong> Where orders are packaged</li>
            <li><strong>Shipping:</strong> Where orders are dispatched</li>
          </ul>
        </div>
      </Form>
    </Drawer>
  )
}

export default ZoneFormDrawer
