/**
 * Draft Slice for Offline Draft Mode
 * 
 * Manages draft forms in localStorage for offline editing
 * 
 * @author CARE Team
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface Draft {
  id: string
  type: 'stock-in' | 'stock-out' | 'stock-transfer' | 'stock-adjustment' | 'material' | 'warehouse'
  data: any
  timestamp: number
}

interface DraftState {
  drafts: Record<string, Draft>
}

const initialState: DraftState = {
  drafts: {},
}

// Load drafts from localStorage on initialization
const loadDraftsFromStorage = (): Record<string, Draft> => {
  try {
    const stored = localStorage.getItem('warehouse_drafts')
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

// Save drafts to localStorage
const saveDraftsToStorage = (drafts: Record<string, Draft>) => {
  try {
    localStorage.setItem('warehouse_drafts', JSON.stringify(drafts))
  } catch (error) {
    console.error('Failed to save drafts to localStorage:', error)
  }
}

const draftSlice = createSlice({
  name: 'drafts',
  initialState: {
    ...initialState,
    drafts: loadDraftsFromStorage(),
  },
  reducers: {
    saveDraft: (state, action: PayloadAction<Omit<Draft, 'timestamp'>>) => {
      const draft: Draft = {
        ...action.payload,
        timestamp: Date.now(),
      }
      state.drafts[draft.id] = draft
      saveDraftsToStorage(state.drafts)
    },
    deleteDraft: (state, action: PayloadAction<string>) => {
      delete state.drafts[action.payload]
      saveDraftsToStorage(state.drafts)
    },
    clearDrafts: (state) => {
      state.drafts = {}
      localStorage.removeItem('warehouse_drafts')
    },
    clearDraftsByType: (state, action: PayloadAction<Draft['type']>) => {
      Object.keys(state.drafts).forEach((key) => {
        if (state.drafts[key].type === action.payload) {
          delete state.drafts[key]
        }
      })
      saveDraftsToStorage(state.drafts)
    },
  },
})

export const { saveDraft, deleteDraft, clearDrafts, clearDraftsByType } = draftSlice.actions
export default draftSlice.reducer

