import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '@/lib/axios'
import authStorage from './authStorage'

/**
 * OAuth Callback Handler
 * This component handles the OAuth redirect after user authenticates with provider
 * It exchanges the authorization code for a JWT token and redirects to the dashboard
 */
export default function OAuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('processing') // processing, success, error
  const [message, setMessage] = useState('Completing authentication...')

  useEffect(() => {
    handleOAuthCallback()
  }, [])

  /**
   * Handle OAuth callback and exchange code for token
   */
  const handleOAuthCallback = async () => {
    try {
      // Get authorization code and state from URL query params
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const error = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')

      // Check for OAuth errors
      if (error) {
        console.error('OAuth error:', error, errorDescription)
        setStatus('error')
        setMessage(errorDescription || 'Authentication was cancelled or failed.')
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { replace: true })
        }, 3000)
        return
      }

      // Verify required parameters
      if (!code) {
        console.error('No authorization code received')
        setStatus('error')
        setMessage('No authorization code received. Please try again.')
        
        setTimeout(() => {
          navigate('/login', { replace: true })
        }, 3000)
        return
      }

      // Get stored OAuth data from session
      const storedState = sessionStorage.getItem('oauth_state')
      const provider = sessionStorage.getItem('oauth_provider')
      const redirectUri = sessionStorage.getItem('oauth_redirect_uri')

      // Verify state for CSRF protection
      if (state !== storedState) {
        console.error('State mismatch - possible CSRF attack')
        setStatus('error')
        setMessage('Authentication failed due to security check. Please try again.')
        
        // Clear OAuth session data
        sessionStorage.removeItem('oauth_state')
        sessionStorage.removeItem('oauth_provider')
        sessionStorage.removeItem('oauth_redirect_uri')
        
        setTimeout(() => {
          navigate('/login', { replace: true })
        }, 3000)
        return
      }

      if (!provider) {
        console.error('No provider stored in session')
        setStatus('error')
        setMessage('OAuth session expired. Please try again.')
        
        setTimeout(() => {
          navigate('/login', { replace: true })
        }, 3000)
        return
      }

      // Call backend to exchange code for token
      setMessage('Exchanging authorization code...')
      
      const response = await api.post('/auth/oauth/callback', {
        provider: provider,
        code: code,
        redirectUri: redirectUri,
        state: state
      })

      const data = response.data

      // Store authentication token
      if (data.accessToken) {
        authStorage.setToken(data.accessToken)
        
        // Store user info if needed
        if (data.userId) {
          authStorage.setUserId(data.userId)
        }
        
        setStatus('success')
        setMessage(data.isNewUser 
          ? 'Account created successfully! Redirecting...' 
          : 'Signed in successfully! Redirecting...'
        )

        // Fetch user permissions (optional for new users)
        setMessage('Loading your permissions...')
        try {
          const permissionsResponse = await api.get('/ams/api/permissions/users/me')
          if (permissionsResponse.data) {
            authStorage.setPermissions(permissionsResponse.data)
          }
        } catch (permErr) {
          console.warn('Failed to load permissions (normal for new OAuth users):', permErr)
          // For new OAuth users without permissions setup, this is expected
          // Set empty permissions to avoid repeated failed requests
          authStorage.setPermissions({ systems: [] })
        }

        // Clear OAuth session data
        sessionStorage.removeItem('oauth_state')
        sessionStorage.removeItem('oauth_provider')
        sessionStorage.removeItem('oauth_redirect_uri')

        // Redirect based on user type
        setTimeout(() => {
          if (data.isNewUser) {
            // New users go to welcome page
            navigate('/welcome', { replace: true })
          } else {
            // Existing users go to dashboard
            navigate('/', { replace: true })
          }
        }, 1500)

      } else {
        throw new Error('No access token received from server')
      }

    } catch (err) {
      console.error('OAuth callback failed:', err)
      
      let errorMessage = 'Authentication failed. Please try again.'
      
      const status = err?.response?.status
      const serverMessage = err?.response?.data?.message
      
      if (status === 400) {
        errorMessage = serverMessage || 'Invalid OAuth request. Please try again.'
      } else if (status === 401) {
        errorMessage = 'Authentication failed. Please try again.'
      } else if (status === 403) {
        errorMessage = 'Your account is disabled. Please contact support.'
      } else if (status === 409) {
        errorMessage = 'Account linking conflict. Please contact support.'
      } else if (serverMessage) {
        errorMessage = serverMessage
      }
      
      setStatus('error')
      setMessage(errorMessage)
      
      // Clear OAuth session data
      sessionStorage.removeItem('oauth_state')
      sessionStorage.removeItem('oauth_provider')
      sessionStorage.removeItem('oauth_redirect_uri')
      
      // Redirect to login
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 4000)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-md w-full text-center">
        {/* Status Icon */}
        <div className="mb-6">
          {status === 'processing' && (
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full">
              <svg className="w-10 h-10 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
          
          {status === 'success' && (
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full animate-bounce">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          
          {status === 'error' && (
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full animate-shake">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
        </div>

        {/* Status Title */}
        <h2 className="text-2xl font-bold text-slate-800 mb-3">
          {status === 'processing' && 'Authenticating...'}
          {status === 'success' && 'Success!'}
          {status === 'error' && 'Authentication Failed'}
        </h2>

        {/* Status Message */}
        <p className="text-slate-600 text-sm mb-6">
          {message}
        </p>

        {/* Loading Bar for Processing State */}
        {status === 'processing' && (
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        )}

        {/* Retry Button for Error State */}
        {status === 'error' && (
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="mt-4 px-6 py-2 bg-[#0072BC] text-white rounded-lg hover:bg-[#005A9C] transition-colors text-sm font-semibold"
          >
            Return to Login
          </button>
        )}
      </div>

      {/* Animations */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  )
}

