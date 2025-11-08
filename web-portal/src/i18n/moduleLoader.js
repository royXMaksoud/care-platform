import i18n from './config'

/**
 * Register module-specific translations by merging them into the default
 * "translation" namespace. Accepts an object keyed by locale code (en, ar...)
 * whose value is either the module tree (e.g. { appointment: { ... } }) or
 * the raw translation entries (will be wrapped under the provided moduleKey).
 */
export function registerModuleTranslations(moduleKey, resourcesByLocale = {}) {
  if (!moduleKey) return

  Object.entries(resourcesByLocale).forEach(([locale, resource]) => {
    if (!resource) return

    const payload = resource[moduleKey]
      ? resource
      : { [moduleKey]: resource }

    i18n.addResourceBundle(locale, 'translation', payload, true, true)
  })
}


