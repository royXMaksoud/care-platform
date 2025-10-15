import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import authStorage from './authStorage'

export default function Login() {
  const { login, register, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [language, setLanguage] = useState('en')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  
  // Redirect if already logged in
  useEffect(() => {
    const token = authStorage.getToken()
    if (token) {
      navigate('/', { replace: true })
    }
  }, [navigate])
  
  // Sign up additional fields
  const [firstName, setFirstName] = useState('')
  const [fatherName, setFatherName] = useState('')
  const [surname, setSurname] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    
    if (isSignUp) {
      // Sign up validation
      if (!firstName.trim()) {
        setError('First name is required.')
        return
      }
      if (!surname.trim()) {
        setError('Surname is required.')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.')
        return
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters.')
        return
      }
      
      // Build full name from parts
      const fullName = `${firstName} ${fatherName ? fatherName + ' ' : ''}${surname}`.trim()
      
      try {
        await register(firstName, fatherName, surname, fullName, email, password, confirmPassword, language)
      } catch (err) {
        const status = err?.response?.status
        if (status === 400) {
          setError(err?.response?.data?.message || 'Invalid input. Please check your details.')
        } else if (status === 409) {
          setError('Email already exists. Please use a different email.')
        } else {
          setError('Registration failed. Please try again.')
        }
      }
      return
    }
    
    // Login
    try {
      await login(email, password, language)
    }
    catch (err) {
      const status = err?.response?.status 
      if (err?.message === 'NO_TOKEN_IN_LOGIN_RESPONSE') {
        setError('Login succeeded but no token was returned by the server.')
        return
      }
      if (status === 403) {
        setError('Your account has no permissions. Please contact an administrator.')
      } else if (status === 502) {
        setError('Permission service is unavailable. Please try again later.')
      } else if (status === 401) {
        setError('Invalid credentials.')
      } else {
        setError('Server error. Please try again.')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 p-4">
      {/* Animated Background Elements - UNHCR inspired colors */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-slate-200 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Card */}
      <div className="relative w-full max-w-6xl">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="grid lg:grid-cols-2">
            {/* Left Side - Illustration/Branding - UNHCR Blue */}
            <div className="hidden lg:flex bg-gradient-to-br from-[#0072BC] via-[#005A9C] to-[#004A7C] p-12 flex-col justify-between relative overflow-hidden">
              {/* Decorative Circles */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full -ml-48 -mb-48"></div>
              
              <div className="relative z-10">
                {/* Logo */}
                <div className="flex items-center gap-3 mb-12">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/30">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">Care Portal</h1>
                    <p className="text-white/80 text-sm">Professional Platform</p>
                  </div>
                </div>

                {/* Main Message */}
                <div className="mb-8">
                  <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
                    {isSignUp ? 'Join Our Platform' : 'Welcome Back!'}
                  </h2>
                  <p className="text-white/90 text-lg leading-relaxed">
                    {isSignUp 
                      ? 'Create your account and start managing your projects with our powerful tools.'
                      : 'Sign in to access your dashboard and manage everything in one place.'
                    }
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-white">
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-sm">Advanced security & encryption</span>
                  </div>
                  <div className="flex items-center gap-3 text-white">
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-sm">Multi-language support</span>
                  </div>
                  <div className="flex items-center gap-3 text-white">
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-sm">24/7 customer support</span>
                  </div>
                </div>
              </div>

              {/* Footer Text */}
              <div className="relative z-10 text-white/70 text-sm">
                © {new Date().getFullYear()} Care Portal. All rights reserved.
              </div>
            </div>

            {/* Right Side - Form */}
            <div className="p-8 lg:p-12">
              {/* Mobile Logo */}
              <div className="lg:hidden flex justify-center mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-[#0072BC] rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <span className="text-xl font-bold text-slate-900">Care Portal</span>
                </div>
              </div>

              {/* Toggle Tabs */}
              <div className="flex gap-2 mb-8 p-1 bg-slate-100 rounded-lg">
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
                    !isSignUp
                      ? 'bg-white text-[#0072BC] shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true)
                    setError('')
                  }}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all ${
                    isSignUp
                      ? 'bg-white text-[#0072BC] shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Form Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  {isSignUp ? 'Create Account' : 'Welcome back'}
                </h2>
                <p className="text-slate-600 text-sm">
                  {isSignUp 
                    ? 'Fill in your details to get started'
                    : 'Enter your credentials to access your account'
                  }
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 animate-shake">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-red-800 flex-1">{error}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={onSubmit} className="space-y-4">
                {/* Name Fields - Sign Up Only */}
                {isSignUp && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* First Name */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">
                          First Name <span className="text-red-500">*</span>
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
                            placeholder="John" 
                            className="w-full pl-10 pr-4 py-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0072BC] focus:border-transparent transition-all"
                          />
                        </div>
                      </div>

                      {/* Father Name */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">
                          Father Name
                        </label>
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
                            placeholder="Michael (optional)" 
                            className="w-full pl-10 pr-4 py-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0072BC] focus:border-transparent transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Surname */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">
                        Surname <span className="text-red-500">*</span>
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
                          placeholder="Smith" 
                          className="w-full pl-10 pr-4 py-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0072BC] focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Email */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Email Address
                  </label>
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
                      placeholder="you@company.com" 
                      className="w-full pl-10 pr-4 py-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0072BC] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input 
                      type={showPassword ? "text" : "password"}
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required
                      placeholder={isSignUp ? "At least 8 characters" : "Enter your password"}
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
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

                {/* Confirm Password - Sign Up Only */}
                {isSignUp && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <input 
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        required={isSignUp}
                        placeholder="Re-enter your password"
                        className="w-full pl-10 pr-4 py-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0072BC] focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Language */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Language
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                      </svg>
                    </div>
                    <select 
                      value={language} 
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0072BC] focus:border-transparent appearance-none cursor-pointer transition-all bg-white"
                    >
                      <option value="en">English</option>
                      <option value="ar">العربية</option>
                      <option value="de">Deutsch</option>
                      <option value="fr">Français</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Submit Button - UNHCR Blue */}
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 px-4 py-3 text-sm font-semibold text-white bg-[#0072BC] rounded-lg hover:bg-[#005A9C] focus:outline-none focus:ring-2 focus:ring-[#0072BC] focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {isSignUp ? 'Creating account...' : 'Signing in...'}
                    </span>
                  ) : (
                    <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                  )}
                </button>
              </form>

              {/* Footer Links */}
              <div className="mt-6 text-center">
                <p className="text-xs text-slate-500">
                  {isSignUp ? (
                    <>
                      By signing up, you agree to our{' '}
                      <a href="#" className="text-[#0072BC] hover:text-[#005A9C] font-medium">Terms of Service</a>
                      {' '}and{' '}
                      <a href="#" className="text-[#0072BC] hover:text-[#005A9C] font-medium">Privacy Policy</a>
                    </>
                  ) : (
                    <>
                      Protected by enterprise-grade security
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Animations */}
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
