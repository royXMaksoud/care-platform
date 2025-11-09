import { api } from '../shared/lib/axios'

// POST /auth/login -> { token } or { accessToken }
export async function loginApi(email, password, language = 'en') {
  const { data } = await api.post('/auth/login', { email, password, language })

  console.log('🔐 Login API Response:', {
    fullData: data,
    token: data?.token || data?.accessToken,
    sessionTimeoutMinutes: data?.sessionTimeoutMinutes,
    tenantLogo: data?.tenantLogo,
  })

  const token =
    data?.token ??
    data?.accessToken ??
    data?.jwt ??
    data?.access_token

  if (!token) {
    const err = new Error('NO_TOKEN_IN_LOGIN_RESPONSE')
    err.response = { status: 500 }
    throw err
  }
  return {
    token,
    sessionTimeoutMinutes: data?.sessionTimeoutMinutes ?? null,
    tenantLogo: data?.tenantLogo ?? null
  }
}

// POST /auth/register -> { token }
export async function registerApi(firstName, fatherName, surname, fullName, email, password, confirmPassword, language = 'en') {
  // Debug logging - check what we're sending
  const payload = { 
    firstName,
    fatherName,
    surname,
    fullName, 
    email, 
    password, 
    confirmPassword,
    type: 'USER', // Default user type
    language 
  }
  console.log('🚀 Sending registration data:', payload)
  
  const { data } = await api.post('/auth/register', payload)
  const token =
    data?.token ??
    data?.accessToken ??   
    data?.jwt ??
    data?.access_token

  if (!token) {
    const err = new Error('NO_TOKEN_IN_REGISTER_RESPONSE')
    err.response = { status: 500 }
    throw err
  }
  return { token }
}
