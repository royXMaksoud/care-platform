import { useTranslation } from 'react-i18next'
import { useCallback } from 'react'

export function useModuleTranslation(moduleKey, options) {
  const { t, i18n } = useTranslation(undefined, options)

  const prefix = moduleKey ? `${moduleKey}.` : ''

  const translate = useCallback((key, defaultValue, opts = {}) => {
    if (!key) return defaultValue
    const fullKey = prefix ? `${prefix}${key}` : key
    return t(fullKey, {
      defaultValue: defaultValue ?? key,
      ...opts,
    })
  }, [t, prefix])

  const translateColumns = useCallback((columns, keyPrefix = 'columns') => {
    if (!Array.isArray(columns)) return columns
    return columns.map((col) => {
      if (!col) return col
      const headerIsString = typeof col.header === 'string'
      const candidateKey = col.translationKey || col.i18nKey || col.accessorKey || col.id
      const translatedHeader = candidateKey
        ? translate(`${keyPrefix}.${candidateKey}`, headerIsString ? col.header : undefined)
        : headerIsString
          ? translate(col.header, col.header)
          : col.header

      return {
        ...col,
        header: translatedHeader,
      }
    })
  }, [translate])

  const translateFields = useCallback((fields, keyPrefix = 'fields') => {
    if (!Array.isArray(fields)) return fields
    return fields.map((field) => {
      if (!field) return field
      const fieldName = field.translationKey || field.i18nKey || field.name || field.id
      if (!fieldName) return field

      const labelIsString = typeof field.label === 'string'
      const translatedLabel = translate(`${keyPrefix}.${fieldName}`, labelIsString ? field.label : undefined)
      return {
        ...field,
        label: translatedLabel,
      }
    })
  }, [translate])

  return {
    t: translate,
    tRaw: t,
    i18n,
    translateColumns,
    translateFields,
  }
}


