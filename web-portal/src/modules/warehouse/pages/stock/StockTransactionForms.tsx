/**
 * Stock Transaction Forms
 * 
 * Forms for Stock-IN, Stock-OUT, Transfer, and Adjustment
 * 
 * @author CARE Team
 */

import React, { useState, useEffect } from 'react'
import { Modal, Form, InputNumber, Select, Input, Button, Space, message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useCreateStockTransactionMutation } from '../../store/api/stockApi'
import { useGetWarehousesQuery } from '../../store/api/warehouseApi'
import { useWarehouseDispatch } from '../../store/hooks'
import { saveDraft, deleteDraft } from '../../store/slices/draftSlice'
import type { CreateStockTransactionRequest } from '../../store/api/stockApi'

const { TextArea } = Input

interface StockTransactionFormProps {
  type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT'
  open: boolean
  onClose: () => void
  materialId?: string
  onSuccess?: () => void
}

export const StockTransactionForm: React.FC<StockTransactionFormProps> = ({
  type,
  open,
  onClose,
  materialId,
  onSuccess,
}) => {
  const { t } = useTranslation()
  const [form] = Form.useForm()
  const dispatch = useWarehouseDispatch()
  
  const [createTransaction, { isLoading }] = useCreateStockTransactionMutation()
  const { data: warehousesData } = useGetWarehousesQuery({ page: 0, size: 1000 })
  const warehouses = warehousesData?.content || []

  const draftId = `stock-${type}-${materialId || 'new'}`

  // Load draft from localStorage
  useEffect(() => {
    const drafts = JSON.parse(localStorage.getItem('warehouse_drafts') || '{}')
    const draft = drafts[draftId]
    if (draft && open) {
      form.setFieldsValue(draft.data)
      message.info('Draft loaded from offline storage')
    }
  }, [draftId, open, form])

  const handleSaveDraft = () => {
    const values = form.getFieldsValue()
    dispatch(saveDraft({
      id: draftId,
      type: `stock-${type.toLowerCase()}` as any,
      data: values,
    }))
    message.success('Draft saved offline')
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      
      const payload: CreateStockTransactionRequest = {
        materialId: values.materialId || materialId!,
        transactionType: type,
        quantity: values.quantity,
        reason: values.reason,
        referenceDocument: values.referenceDocument,
        notes: values.notes,
      }

      if (type === 'IN' || type === 'TRANSFER') {
        payload.targetWarehouseId = values.targetWarehouseId
      }
      if (type === 'OUT' || type === 'TRANSFER') {
        payload.sourceWarehouseId = values.sourceWarehouseId
      }
      if (type === 'ADJUSTMENT') {
        if (values.adjustmentType === 'increase') {
          payload.targetWarehouseId = values.warehouseId
        } else {
          payload.sourceWarehouseId = values.warehouseId
        }
      }

      await createTransaction(payload).unwrap()
      
      // Delete draft after successful submission
      dispatch(deleteDraft(draftId))
      
      message.success(t('warehouse.stock.transactionCreated'))
      form.resetFields()
      onSuccess?.()
      onClose()
    } catch (error: any) {
      message.error(error?.data?.message || t('warehouse.common.error'))
    }
  }

  const getTitle = () => {
    switch (type) {
      case 'IN': return t('warehouse.stock.stockIn')
      case 'OUT': return t('warehouse.stock.stockOut')
      case 'TRANSFER': return t('warehouse.stock.transfer')
      case 'ADJUSTMENT': return t('warehouse.stock.adjustment')
    }
  }

  return (
    <Modal
      title={getTitle()}
      open={open}
      onCancel={onClose}
      width={600}
      footer={
        <Space>
          <Button onClick={handleSaveDraft}>Save Draft</Button>
          <Button onClick={onClose}>{t('warehouse.common.cancel')}</Button>
          <Button type="primary" loading={isLoading} onClick={handleSubmit}>
            {t('warehouse.stock.createTransaction')}
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        {!materialId && (
          <Form.Item
            label="Material"
            name="materialId"
            rules={[{ required: true }]}
          >
            <Select showSearch placeholder="Select material">
              {/* Material options would come from materials API */}
            </Select>
          </Form.Item>
        )}

        {type === 'IN' && (
          <Form.Item
            label={t('warehouse.stock.targetWarehouse')}
            name="targetWarehouseId"
            rules={[{ required: true }]}
          >
            <Select showSearch placeholder="Select target warehouse">
              {warehouses.map((wh) => (
                <Select.Option key={wh.id} value={wh.id}>
                  {wh.nameTranslations?.en || wh.code}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        )}

        {type === 'OUT' && (
          <Form.Item
            label={t('warehouse.stock.sourceWarehouse')}
            name="sourceWarehouseId"
            rules={[{ required: true }]}
          >
            <Select showSearch placeholder="Select source warehouse">
              {warehouses.map((wh) => (
                <Select.Option key={wh.id} value={wh.id}>
                  {wh.nameTranslations?.en || wh.code}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        )}

        {type === 'TRANSFER' && (
          <>
            <Form.Item
              label={t('warehouse.stock.sourceWarehouse')}
              name="sourceWarehouseId"
              rules={[{ required: true }]}
            >
              <Select showSearch>
                {warehouses.map((wh) => (
                  <Select.Option key={wh.id} value={wh.id}>
                    {wh.nameTranslations?.en || wh.code}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              label={t('warehouse.stock.targetWarehouse')}
              name="targetWarehouseId"
              rules={[{ required: true }]}
            >
              <Select showSearch>
                {warehouses.map((wh) => (
                  <Select.Option key={wh.id} value={wh.id}>
                    {wh.nameTranslations?.en || wh.code}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </>
        )}

        {type === 'ADJUSTMENT' && (
          <>
            <Form.Item
              label="Adjustment Type"
              name="adjustmentType"
              rules={[{ required: true }]}
            >
              <Select>
                <Select.Option value="increase">Increase</Select.Option>
                <Select.Option value="decrease">Decrease</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              label="Warehouse"
              name="warehouseId"
              rules={[{ required: true }]}
            >
              <Select showSearch>
                {warehouses.map((wh) => (
                  <Select.Option key={wh.id} value={wh.id}>
                    {wh.nameTranslations?.en || wh.code}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </>
        )}

        <Form.Item
          label={t('warehouse.stock.quantity')}
          name="quantity"
          rules={[{ required: true, type: 'number', min: 0.0001 }]}
        >
          <InputNumber style={{ width: '100%' }} min={0.0001} precision={4} />
        </Form.Item>

        <Form.Item
          label={t('warehouse.stock.reason')}
          name="reason"
        >
          <Select>
            <Select.Option value="PURCHASE">Purchase</Select.Option>
            <Select.Option value="SALE">Sale</Select.Option>
            <Select.Option value="CONSUMPTION">Consumption</Select.Option>
            <Select.Option value="TRANSFER">Transfer</Select.Option>
            <Select.Option value="CORRECTION">Correction</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label={t('warehouse.stock.referenceDocument')}
          name="referenceDocument"
        >
          <Input />
        </Form.Item>

        <Form.Item
          label={t('warehouse.stock.notes')}
          name="notes"
        >
          <TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  )
}

