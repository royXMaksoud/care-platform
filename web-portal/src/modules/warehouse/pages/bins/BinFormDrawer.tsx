/**
 * BinFormDrawer Component
 *
 * Create/Edit bin form in a drawer
 *
 * @author CARE Team
 */

import React, { useEffect, useState } from 'react'
import { Drawer, Form, Input, Select, Button, Space, InputNumber, message } from 'antd'
import { useTranslation } from 'react-i18next'
import { Barcode, RefreshCw } from 'lucide-react'
import {
  useCreateBinMutation,
  useUpdateBinMutation,
  useGetBinByIdQuery,
} from '../../store/api/binApi'
import { useGetZonesQuery } from '../../store/api/zoneApi'
import type { Bin } from '../../types'

interface BinFormDrawerProps {
  open: boolean
  onClose: () => void
  binId?: string
  zoneId?: string // Pre-selected zone
  onSuccess?: () => void
}

export const BinFormDrawer: React.FC<BinFormDrawerProps> = ({
  open,
  onClose,
  binId,
  zoneId,
  onSuccess,
}) => {
  const { t } = useTranslation()
  const [form] = Form.useForm()
  const isEdit = !!binId

  // Fetch bin data for editing
  const { data: bin, isLoading: isLoadingBin } = useGetBinByIdQuery(binId!, {
    skip: !binId,
  })

  // Fetch zones for dropdown
  const { data: zonesData, isLoading: isLoadingZones } = useGetZonesQuery({
    page: 0,
    size: 100,
    status: 'ACTIVE',
  })

  const [createBin, { isLoading: isCreating }] = useCreateBinMutation()
  const [updateBin, { isLoading: isUpdating }] = useUpdateBinMutation()

  // Populate form when editing
  useEffect(() => {
    if (bin && isEdit) {
      form.setFieldsValue({
        code: bin.code,
        name: bin.name,
        zoneId: bin.zoneId,
        binType: bin.binType,
        status: bin.status,
        maxWeightKg: bin.maxWeightKg,
        capacityCubicMeters: bin.capacityCubicMeters,
        aisleNumber: bin.aisleNumber,
        shelfNumber: bin.shelfNumber,
        levelNumber: bin.levelNumber,
        barcode: bin.barcode,
      })
    } else {
      form.resetFields()
      if (zoneId) {
        form.setFieldValue('zoneId', zoneId)
      }
    }
  }, [bin, isEdit, form, zoneId])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      if (isEdit && binId) {
        await updateBin({ id: binId, data: values }).unwrap()
        message.success('Bin updated successfully')
      } else {
        await createBin(values).unwrap()
        message.success('Bin created successfully')
      }

      form.resetFields()
      onSuccess?.()
      onClose()
    } catch (error: any) {
      console.error('Bin form error:', error)
      message.error(error?.data?.message || 'Failed to save bin')
    }
  }

  /**
   * Generate a random barcode
   */
  const generateBarcode = () => {
    const prefix = 'BIN'
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    const barcode = `${prefix}-${timestamp}-${random}`
    form.setFieldValue('barcode', barcode)
  }

  /**
   * Auto-generate location string from aisle/shelf/level
   */
  const updateLocationString = () => {
    const aisle = form.getFieldValue('aisleNumber')
    const shelf = form.getFieldValue('shelfNumber')
    const level = form.getFieldValue('levelNumber')

    if (aisle || shelf || level) {
      const parts = []
      if (aisle) parts.push(`A${aisle}`)
      if (shelf) parts.push(`S${shelf}`)
      if (level) parts.push(`L${level}`)
      return parts.join('-')
    }
    return ''
  }

  const zones = zonesData?.content || []

  return (
    <Drawer
      title={isEdit ? 'Edit Bin' : 'Create Bin'}
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
        disabled={isLoadingBin || isLoadingZones}
        initialValues={{
          status: 'AVAILABLE',
          binType: 'SHELF',
        }}
      >
        {/* Zone Selection */}
        <Form.Item
          label="Zone"
          name="zoneId"
          rules={[{ required: true, message: 'Please select a zone' }]}
        >
          <Select
            placeholder="Select zone"
            loading={isLoadingZones}
            disabled={isEdit || !!zoneId}
            showSearch
            optionFilterProp="children"
          >
            {zones.map((zone: any) => (
              <Select.Option key={zone.id} value={zone.id}>
                {zone.code} - {zone.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {/* Code */}
        <Form.Item
          label="Bin Code"
          name="code"
          rules={[
            { required: true, message: 'Bin code is required' },
            { max: 50, message: 'Code must be 50 characters or less' },
            { pattern: /^[A-Z0-9_-]+$/, message: 'Code must be uppercase letters, numbers, underscores, or hyphens' },
          ]}
        >
          <Input
            placeholder="e.g., BIN-A1-001"
            disabled={isEdit}
            style={{ textTransform: 'uppercase' }}
          />
        </Form.Item>

        {/* Name */}
        <Form.Item
          label="Bin Name"
          name="name"
          rules={[
            { max: 100, message: 'Name must be 100 characters or less' },
          ]}
        >
          <Input placeholder="e.g., Pallet Rack A1-001 (optional)" />
        </Form.Item>

        {/* Bin Type */}
        <Form.Item
          label="Bin Type"
          name="binType"
          rules={[{ required: true, message: 'Please select a bin type' }]}
        >
          <Select placeholder="Select bin type">
            <Select.Option value="PALLET">Pallet</Select.Option>
            <Select.Option value="SHELF">Shelf</Select.Option>
            <Select.Option value="RACK">Rack</Select.Option>
            <Select.Option value="CAGE">Cage</Select.Option>
            <Select.Option value="DRAWER">Drawer</Select.Option>
          </Select>
        </Form.Item>

        {/* Status */}
        <Form.Item
          label="Status"
          name="status"
          rules={[{ required: true, message: 'Please select a status' }]}
        >
          <Select placeholder="Select status">
            <Select.Option value="AVAILABLE">Available</Select.Option>
            <Select.Option value="OCCUPIED">Occupied</Select.Option>
            <Select.Option value="RESERVED">Reserved</Select.Option>
            <Select.Option value="MAINTENANCE">Maintenance</Select.Option>
          </Select>
        </Form.Item>

        {/* Capacity and Weight */}
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            label="Capacity (Cubic Meters)"
            name="capacityCubicMeters"
            rules={[
              { required: true, message: 'Capacity is required' },
              { type: 'number', min: 0.01, message: 'Capacity must be greater than 0' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0.01}
              step={0.01}
              precision={2}
              placeholder="e.g., 1.5"
              addonAfter="m³"
            />
          </Form.Item>

          <Form.Item
            label="Max Weight (kg)"
            name="maxWeightKg"
            rules={[
              { type: 'number', min: 0, message: 'Weight must be 0 or greater' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={1}
              precision={2}
              placeholder="e.g., 500"
              addonAfter="kg"
            />
          </Form.Item>
        </div>

        {/* Location Information */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Location</h4>
          <div className="grid grid-cols-3 gap-4">
            <Form.Item
              label="Aisle"
              name="aisleNumber"
              rules={[
                { type: 'number', min: 1, message: 'Aisle must be 1 or greater' },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={1}
                placeholder="1"
              />
            </Form.Item>

            <Form.Item
              label="Shelf"
              name="shelfNumber"
              rules={[
                { type: 'number', min: 1, message: 'Shelf must be 1 or greater' },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={1}
                placeholder="1"
              />
            </Form.Item>

            <Form.Item
              label="Level"
              name="levelNumber"
              rules={[
                { type: 'number', min: 1, message: 'Level must be 1 or greater' },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={1}
                placeholder="1"
              />
            </Form.Item>
          </div>
        </div>

        {/* Barcode */}
        <Form.Item
          label="Barcode"
          name="barcode"
          rules={[
            { max: 100, message: 'Barcode must be 100 characters or less' },
          ]}
        >
          <Input
            placeholder="Enter barcode or generate"
            addonAfter={
              <button
                type="button"
                onClick={generateBarcode}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                title="Generate barcode"
              >
                <RefreshCw className="w-4 h-4" />
                Generate
              </button>
            }
          />
        </Form.Item>

        {/* Help Text */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
          <p className="font-medium mb-2">Bin Types:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Pallet:</strong> Large floor-level storage for palletized goods</li>
            <li><strong>Shelf:</strong> Shelving unit storage</li>
            <li><strong>Rack:</strong> Vertical racking system</li>
            <li><strong>Cage:</strong> Secure enclosed storage</li>
            <li><strong>Drawer:</strong> Small parts storage</li>
          </ul>
        </div>

        {/* Status Help */}
        <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
          <p className="font-medium mb-2">Status Types:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Available:</strong> Ready to receive items</li>
            <li><strong>Occupied:</strong> Contains items</li>
            <li><strong>Reserved:</strong> Reserved for incoming items</li>
            <li><strong>Maintenance:</strong> Under maintenance, not usable</li>
          </ul>
        </div>
      </Form>
    </Drawer>
  )
}

export default BinFormDrawer
