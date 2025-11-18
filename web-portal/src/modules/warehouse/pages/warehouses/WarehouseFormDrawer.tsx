/**
 * WarehouseFormDrawer Component
 * 
 * Create/Edit warehouse form in a drawer
 * 
 * @author CARE Team
 */

import React, { useEffect } from 'react'
import { Drawer, Form, Input, Select, Switch, Button, Space, message } from 'antd'
import { useTranslation } from 'react-i18next'
import {
  useCreateWarehouseMutation,
  useUpdateWarehouseMutation,
  useGetWarehouseByIdQuery,
} from '../../store/api/warehouseApi'
import type { Warehouse } from '../../types'

const { TextArea } = Input

interface WarehouseFormDrawerProps {
  open: boolean
  onClose: () => void
  warehouseId?: string
  onSuccess?: () => void
}

export const WarehouseFormDrawer: React.FC<WarehouseFormDrawerProps> = ({
  open,
  onClose,
  warehouseId,
  onSuccess,
}) => {
  const { t } = useTranslation()
  const [form] = Form.useForm()
  const isEdit = !!warehouseId

  const { data: warehouse, isLoading } = useGetWarehouseByIdQuery(warehouseId!, {
    skip: !warehouseId,
  })

  const [createWarehouse, { isLoading: isCreating }] = useCreateWarehouseMutation()
  const [updateWarehouse, { isLoading: isUpdating }] = useUpdateWarehouseMutation()

  useEffect(() => {
    if (warehouse && isEdit) {
      form.setFieldsValue({
        code: warehouse.code,
        nameTranslations: warehouse.nameTranslations,
        descriptionTranslations: warehouse.descriptionTranslations,
        warehouseType: warehouse.warehouseType,
        latitude: warehouse.latitude,
        longitude: warehouse.longitude,
        isActive: warehouse.isActive,
      })
    } else {
      form.resetFields()
    }
  }, [warehouse, isEdit, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      
      if (isEdit && warehouseId) {
        await updateWarehouse({ id: warehouseId, data: values }).unwrap()
        message.success(t('warehouse.warehouses.edit') + ' ' + t('warehouse.common.success'))
      } else {
        await createWarehouse(values).unwrap()
        message.success(t('warehouse.warehouses.create') + ' ' + t('warehouse.common.success'))
      }
      
      form.resetFields()
      onSuccess?.()
      onClose()
    } catch (error: any) {
      message.error(error?.data?.message || t('warehouse.common.error'))
    }
  }

  return (
    <Drawer
      title={isEdit ? t('warehouse.warehouses.edit') : t('warehouse.warehouses.create')}
      open={open}
      onClose={onClose}
      width={600}
      extra={
        <Space>
          <Button onClick={onClose}>{t('warehouse.common.cancel')}</Button>
          <Button
            type="primary"
            loading={isCreating || isUpdating}
            onClick={handleSubmit}
          >
            {t('warehouse.common.save')}
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        disabled={isLoading}
      >
        <Form.Item
          label={t('warehouse.warehouses.code')}
          name="code"
          rules={[{ required: true, message: t('warehouse.warehouses.code') + ' is required' }]}
        >
          <Input disabled={isEdit} />
        </Form.Item>

        <Form.Item
          label={t('warehouse.warehouses.name')}
          name="nameTranslations"
          rules={[{ required: true }]}
        >
          <Input placeholder="Enter name" />
        </Form.Item>

        <Form.Item
          label="Type"
          name="warehouseType"
          rules={[{ required: true }]}
        >
          <Select>
            <Select.Option value="MAIN">Main</Select.Option>
            <Select.Option value="BRANCH">Branch</Select.Option>
            <Select.Option value="TEMP">Temporary</Select.Option>
            <Select.Option value="DAMAGED">Damaged</Select.Option>
            <Select.Option value="OTHER">Other</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Latitude"
          name="latitude"
        >
          <InputNumber style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          label="Longitude"
          name="longitude"
        >
          <InputNumber style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          label={t('warehouse.warehouses.status')}
          name="isActive"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </Form>
    </Drawer>
  )
}

