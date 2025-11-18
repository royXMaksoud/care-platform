/**
 * useDraft Hook
 * 
 * Manages offline draft functionality for forms
 * 
 * @author CARE Team
 */

import { useEffect, useState } from 'react'
import { useWarehouseDispatch, useWarehouseSelector } from '../store/hooks'
import { saveDraft, deleteDraft } from '../store/slices/draftSlice'

interface UseDraftOptions {
  autoSave?: boolean
  autoSaveDelay?: number
}

export const useDraft = (draftId: string, type: string, options: UseDraftOptions = {}) => {
  const { autoSave = false, autoSaveDelay = 2000 } = options
  const dispatch = useWarehouseDispatch()
  const drafts = useWarehouseSelector((state) => state.drafts.drafts)
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null)

  const draft = drafts[draftId]

  const save = (data: any) => {
    dispatch(saveDraft({ id: draftId, type: type as any, data }))
  }

  const remove = () => {
    dispatch(deleteDraft(draftId))
  }

  const autoSaveData = (data: any) => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
    }

    const timer = setTimeout(() => {
      save(data)
    }, autoSaveDelay)

    setAutoSaveTimer(timer)
  }

  useEffect(() => {
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer)
      }
    }
  }, [autoSaveTimer])

  return {
    draft: draft?.data,
    hasDraft: !!draft,
    save,
    remove,
    autoSave: autoSave ? autoSaveData : undefined,
  }
}

