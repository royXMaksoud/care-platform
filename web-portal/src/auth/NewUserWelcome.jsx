import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

/**
 * Welcome page for new OAuth users
 * Shows a simple message that their account was created and they need to wait for permissions
 */
export default function NewUserWelcome() {
  const navigate = useNavigate()

  useEffect(() => {
    // Auto-redirect to dashboard after 5 seconds
    const timer = setTimeout(() => {
      navigate('/', { replace: true })
    }, 5000)

    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-lg w-full text-center">
        {/* Success Icon */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full animate-bounce">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Welcome Message */}
        <h1 className="text-3xl font-bold text-slate-800 mb-4">
          مرحباً بك!
        </h1>
        
        <h2 className="text-xl font-semibold text-slate-700 mb-3">
          Account Created Successfully
        </h2>

        <p className="text-slate-600 mb-6 leading-relaxed">
          تم إنشاء حساب جديد لك بنجاح. <br />
          Your account has been created successfully.
        </p>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 text-left">
          <p className="text-sm text-slate-700">
            <strong className="text-blue-700">📌 ملاحظة مهمة:</strong>
          </p>
          <p className="text-sm text-slate-600 mt-2">
            حسابك جاهز، ولكن يرجى الانتظار حتى يتم منحك الصلاحيات المناسبة من قبل المسؤول.
          </p>
          <p className="text-sm text-slate-600 mt-2">
            <strong>Important:</strong> Your account is ready, but please wait for the administrator to grant you appropriate permissions.
          </p>
        </div>

        {/* Account Details */}
        <div className="bg-slate-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center gap-2 text-slate-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="font-medium">User Account</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Account Type: General User
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate('/', { replace: true })}
            className="px-8 py-3 bg-[#0072BC] text-white rounded-lg hover:bg-[#005A9C] transition-colors font-semibold shadow-md"
          >
            Go to Dashboard
          </button>
          
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="px-8 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
          >
            Return to Login
          </button>
        </div>

        {/* Auto-redirect notice */}
        <p className="text-xs text-slate-400 mt-4">
          Redirecting to dashboard in 5 seconds...
        </p>
      </div>
    </div>
  )
}

