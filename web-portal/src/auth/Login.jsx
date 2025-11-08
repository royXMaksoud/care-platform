import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation, Trans } from 'react-i18next'
import { useAuth } from './useAuth'
import authStorage from './authStorage'

const RAW_LANGUAGE_OPTIONS = [
  { value: 'en', fallbackLabel: 'English' },
  { value: 'ar', fallbackLabel: 'العربية' },
  { value: 'fr', fallbackLabel: 'Français' },
  { value: 'de', fallbackLabel: 'Deutsch' },
]

export default function Login() {
  const { t, i18n } = useTranslation()
  const { login, register, loading } = useAuth()
  const navigate = useNavigate()

  const initialLang = useMemo(() => {
    const stored = localStorage.getItem('lang')
    if (stored) return stored
    const browser = navigator?.language?.split('-')[0]
    return RAW_LANGUAGE_OPTIONS.some((opt) => opt.value === browser) ? browser : 'en'
  }, [])

  const [language, setLanguage] = useState(initialLang)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)

  const [firstName, setFirstName] = useState('')
  const [fatherName, setFatherName] = useState('')
  const [surname, setSurname] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // keep i18n in sync with stored language
  useEffect(() => {
    i18n.changeLanguage(initialLang)
  }, [initialLang, i18n])

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
  }, [language])

  // Redirect if already logged in
  useEffect(() => {
    const token = authStorage.getToken()
    if (token) {
      navigate('/', { replace: true })
    }
  }, [navigate])

  const languageOptions = useMemo(
    () =>
      RAW_LANGUAGE_OPTIONS.map((opt) => ({
        value: opt.value,
        label: t(`auth.language_${opt.value}`, opt.fallbackLabel),
      })),
    [t]
  )

  const featureItems = useMemo(
    () => [
      {
        icon: (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        ),
        label: t('auth:featureSecurity'),
      },
      {
        icon: (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        ),
        label: t('auth:featureMultilang'),
      },
      {
        icon: (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        ),
        label: t('auth:featureSupport'),
      },
    ],
    [t]
  )

  const handleLanguageChange = (value) => {
    setLanguage(value)
    localStorage.setItem('lang', value)
    i18n.changeLanguage(value)
  }

  const heroTitle = isSignUp ? t('auth.heroSignUpTitle') : t('auth.heroSignInTitle')
  const heroDescription = isSignUp ? t('auth.heroSignUpDesc') : t('auth.heroSignInDesc')
  const formTitle = isSignUp ? t('auth.createAccountTitle') : t('auth.welcomeBack')
  const formSubtitle = isSignUp ? t('auth.createAccountSubtitle') : t('auth.signInSubtitle')
  const submitLabel = isSignUp ? t('auth.createAccountCta') : t('auth.signInCta')
  const submitLoadingLabel = isSignUp ? t('auth.creatingAccount') : t('auth.signingIn')
  const currentYear = useMemo(() => new Date().getFullYear(), [])

  async function onSubmit(e) {
    e.preventDefault()
    setError('')

    if (isSignUp) {
      if (!firstName.trim()) {
        setError(t('auth.firstNameRequired'))
        return
      }
      if (!surname.trim()) {
        setError(t('auth.surnameRequired'))
        return
      }
      if (password !== confirmPassword) {
        setError(t('auth.passwordMismatch'))
        return
      }
      if (password.length < 8) {
        setError(t('auth.passwordMin'))
        return
      }

      const fullName = `${firstName} ${fatherName ? fatherName + ' ' : ''}${surname}`.trim()

      try {
        await register(firstName, fatherName, surname, fullName, email, password, confirmPassword, language)
      } catch (err) {
        const status = err?.response?.status
        if (status === 400) {
          setError(err?.response?.data?.message || t('auth.invalidInput'))
        } else if (status === 409) {
          setError(t('auth.emailExists'))
        } else {
          setError(t('auth.registerFailed'))
        }
      }
      return
    }

    try {
      await login(email, password, language)
    } catch (err) {
      const status = err?.response?.status
      const responseData = err?.response?.data

      if (err?.message === 'NO_TOKEN_IN_LOGIN_RESPONSE') {
        setError(t('auth.noToken'))
        return
      }

      if (status === 409 && responseData?.requiresPasswordChange) {
        navigate('/password-change-required', {
          state: { email },
          replace: true,
        })
        return
      }

      if (status === 403) {
        setError(t('auth.noPermissions'))
      } else if (status === 502) {
        setError(t('auth.permServiceDown'))
      } else if (status === 401) {
        setError(t('auth.invalidCredentials'))
      } else {
        setError(responseData?.message || t('auth.serverError'))
      }
    }
  }

  const handleOAuthLogin = async (provider) => {
    setError('')

    try {
      const redirectUri = `${window.location.origin}/oauth/callback`
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8090'
      const clientId =
        provider === 'google'
          ? import.meta.env.VITE_GOOGLE_CLIENT_ID
          : import.meta.env.VITE_MICROSOFT_CLIENT_ID

      let authUrl
      const state = Math.random().toString(36).substring(7)

      if (provider === 'google') {
        authUrl =
          `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${clientId}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `response_type=code&` +
          `scope=${encodeURIComponent('openid email profile')}&` +
          `state=${state}&` +
          `access_type=offline&` +
          `prompt=select_account`
      } else if (provider === 'microsoft') {
        const tenantId = import.meta.env.VITE_MICROSOFT_TENANT_ID || 'common'
        authUrl =
          `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?` +
          `client_id=${clientId}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `response_type=code&` +
          `scope=${encodeURIComponent('openid email profile User.Read')}&` +
          `state=${state}&` +
          `prompt=select_account`
      }

      sessionStorage.setItem('oauth_state', state)
      sessionStorage.setItem('oauth_provider', provider)
      sessionStorage.setItem('oauth_redirect_uri', redirectUri)

      window.location.href = authUrl
    } catch (err) {
      console.error('OAuth initialization failed:', err)
      setError(t('auth.oauthFailed'))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-slate-200 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative w-full max-w-6xl">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="grid lg:grid-cols-2">
            <div className="hidden lg:flex bg-gradient-to-br from-[#0072BC] via-[#005A9C] to-[#004A7C] p-12 flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full -ml-48 -mb-48"></div>

              <div className="relative z-10 space-y-12">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/30">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">Care Portal</h1>
                    <p className="text-white/80 text-sm">{t('auth.brandTagline')}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-4xl font-bold text-white leading-tight">{heroTitle}</h2>
                  <p className="text-white/90 text-lg leading-relaxed">{heroDescription}</p>
                </div>

                <div className="space-y-3">
                  {featureItems.map((item) => (
                    <div key={item.label} className="flex items-center gap-3 text-white">
                      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                        {item.icon}
                      </div>
                      <span className="text-sm">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative z-10 text-white/70 text-sm">
                {t('auth.heroFooter', { year: currentYear })}
              </div>
            </div>

            <div className="p-8 lg:p-12">
              <div className="lg:hidden flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-[#0072BC] rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <span className="text-xl font-bold text-slate-900">Care Portal</span>
                </div>
                <div className="relative w-32">
                  <select
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="w-full pl-8 pr-8 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0072BC] focus:border-transparent appearance-none bg-white"
                  >
                    {languageOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-slate-400">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                  </div>
                  <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-slate-400">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 mb-8">
                <div className="hidden lg:flex justify-end">
                  <div className="relative w-full sm:w-48">
                    <label htmlFor="login-language" className="sr-only">
                      {t('auth.language')}
                    </label>
                    <select
                      id="login-language"
                      value={language}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0072BC] focus:border-transparent appearance-none bg-white"
                    >
                      {languageOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                      </svg>
                    </div>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(false)
                      setError('')
                      setFirstName('')
                      setFatherName('')
                      setSurname('')
                      setConfirmPassword('')
                    }}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all ${
                      !isSignUp ? 'bg-white text-[#0072BC] shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t('auth.signInTab')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(true)
                      setError('')
                    }}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all ${
                      isSignUp ? 'bg-white text-[#0072BC] shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t('auth.signUpTab')}
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{formTitle}</h2>
                <p className="text-slate-600 text-sm">{formSubtitle}</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 animate-shake">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm text-red-800 flex-1">{error}</p>
                </div>
              )}

              <form onSubmit={onSubmit} className="space-y-4">
                {isSignUp && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">
                          {t('auth.firstName')} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                            placeholder={t('auth.firstNamePlaceholder')}
                            className="w-full pl-10 pr-4 py-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0072BC] focus:border-transparent transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">{t('auth.fatherName')}</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            value={fatherName}
                            onChange={(e) => setFatherName(e.target.value)}
                            placeholder={t('auth.fatherNamePlaceholder')}
                            className="w-full pl-10 pr-4 py-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0072BC] focus:border-transparent transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">
                        {t('auth.surname')} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          value={surname}
                          onChange={(e) => setSurname(e.target.value)}
                          required
                          placeholder={t('auth.surnamePlaceholder')}
                          className="w-full pl-10 pr-4 py-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0072BC] focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">{t('auth.emailAddress')}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder={t('auth.emailPlaceholder')}
                      className="w-full pl-10 pr-4 py-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0072BC] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">{t('auth.password')}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder={isSignUp ? t('auth.passwordPlaceholderSignUp') : t('auth.passwordPlaceholder')}
                      className="w-full pl-10 pr-11 py-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0072BC] focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268-2.943 9.543 7-1.274 4.057-5.064 7-9.543 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {isSignUp && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">{t('auth.confirmPassword')}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required={isSignUp}
                        placeholder={t('auth.confirmPasswordPlaceholder')}
                        className="w-full pl-10 pr-4 py-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0072BC] focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 px-4 py-3 text-sm font-semibold text-white bg-[#0072BC] rounded-lg hover:bg-[#005A9C] focus:outline-none focus:ring-2 focus:ring-[#0072BC] focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      {submitLoadingLabel}
                    </span>
                  ) : (
                    <span>{submitLabel}</span>
                  )}
                </button>

                {!isSignUp && (
                  <>
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-300"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white text-slate-500 font-medium">{t('auth.orContinueWith')}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => handleOAuthLogin('google')}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 bg-white border-2 border-slate-300 rounded-lg hover:bg-slate-50 hover:border-sLate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span>{t('auth.continueWithGoogle')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOAuthLogin('microsoft')}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 bg-white border-2 border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 23 23">
                          <path fill="#f35325" d="M1 1h10v10H1z" />
                          <path fill="#81bc06" d="M12 1h10v10H12z" />
                          <path fill="#05a6f0" d="M1 12h10v10H1z" />
                          <path fill="#ffba08" d="M12 12h10v10H12z" />
                        </svg>
                        <span>{t('auth.continueWithMicrosoft')}</span>
                      </button>
                    </div>
                  </>
                )}
              </form>

              <div className="mt-6 text-center">
                <p className="text-xs text-slate-500">
                  {isSignUp ? (
                    <Trans
                      i18nKey="auth.termsPrompt"
                      components={[
                        <a href="#" className="text-[#0072BC] hover:text-[#005A9C] font-medium" key="terms" />, 
                        <a href="#" className="text-[#0072BC] hover:text-[#005A9C] font-medium" key="privacy" />,
                      ]}
                    />
                  ) : (
                    <>{t('auth.securityNote')}</>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -20px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(20px, 20px) scale(1.05); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  )
}
