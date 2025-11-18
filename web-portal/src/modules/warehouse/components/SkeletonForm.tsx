/**
 * SkeletonForm Component
 * 
 * Displays skeleton loading state for forms
 * 
 * @author CARE Team
 */

import React from 'react'
import { Skeleton, Card } from 'antd'

interface SkeletonFormProps {
  fields?: number
}

export const SkeletonForm: React.FC<SkeletonFormProps> = ({ fields = 5 }) => {
  return (
    <Card>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} style={{ marginBottom: 24 }}>
          <Skeleton.Input active size="small" style={{ width: 100, marginBottom: 8 }} />
          <Skeleton.Input active block style={{ height: 32 }} />
        </div>
      ))}
      <div style={{ marginTop: 24, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Skeleton.Button active size="default" style={{ width: 80 }} />
        <Skeleton.Button active size="default" style={{ width: 80 }} />
      </div>
    </Card>
  )
}

