/**
 * MultilingualInput Component
 *
 * A reusable input component that supports English and Arabic translations.
 * Provides tabbed interface for entering translations in multiple languages.
 *
 * @author CARE Team
 */

import React, { useState } from 'react'
import { Languages } from 'lucide-react'

interface MultilingualInputProps {
  value: Record<string, string>
  onChange: (value: Record<string, string>) => void
  label: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  multiline?: boolean
  rows?: number
  error?: string
  className?: string
}

const LANGUAGES = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'ar', label: 'Arabic', dir: 'rtl' },
]

export default function MultilingualInput({
  value = {},
  onChange,
  label,
  placeholder = '',
  required = false,
  disabled = false,
  multiline = false,
  rows = 3,
  error,
  className = '',
}: MultilingualInputProps) {
  const [activeTab, setActiveTab] = useState('en')

  const handleChange = (langCode: string, text: string) => {
    onChange({
      ...value,
      [langCode]: text,
    })
  }

  const activeLanguage = LANGUAGES.find((lang) => lang.code === activeTab)

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700">
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-gray-500" />
          {label}
          {required && <span className="text-red-500">*</span>}
        </div>
      </label>

      {/* Language Tabs */}
      <div className="flex border-b border-gray-200">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => setActiveTab(lang.code)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === lang.code
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            disabled={disabled}
          >
            {lang.label}
            {value[lang.code] && (
              <span className="ml-1 text-green-500">&#10003;</span>
            )}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <div className="mt-2">
        {multiline ? (
          <textarea
            value={value[activeTab] || ''}
            onChange={(e) => handleChange(activeTab, e.target.value)}
            placeholder={`${placeholder} (${activeLanguage?.label})`}
            disabled={disabled}
            rows={rows}
            dir={activeLanguage?.dir}
            className={`w-full px-3 py-2 border rounded-lg transition-colors
              ${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}
              ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
              focus:outline-none focus:ring-2 focus:ring-opacity-50
              ${activeLanguage?.dir === 'rtl' ? 'text-right' : 'text-left'}
            `}
          />
        ) : (
          <input
            type="text"
            value={value[activeTab] || ''}
            onChange={(e) => handleChange(activeTab, e.target.value)}
            placeholder={`${placeholder} (${activeLanguage?.label})`}
            disabled={disabled}
            dir={activeLanguage?.dir}
            className={`w-full px-3 py-2 border rounded-lg transition-colors
              ${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}
              ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
              focus:outline-none focus:ring-2 focus:ring-opacity-50
              ${activeLanguage?.dir === 'rtl' ? 'text-right' : 'text-left'}
            `}
          />
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Translation Status */}
      <div className="flex gap-2 text-xs text-gray-500">
        {LANGUAGES.map((lang) => (
          <span key={lang.code} className="flex items-center gap-1">
            <span
              className={`w-2 h-2 rounded-full ${
                value[lang.code] ? 'bg-green-500' : 'bg-gray-300'
              }`}
            />
            {lang.label}
          </span>
        ))}
      </div>
    </div>
  )
}
