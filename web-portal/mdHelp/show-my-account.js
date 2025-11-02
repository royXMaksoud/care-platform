// معلومات الحساب الحالي - Current Account Info
// افتح console في المتصفح ثم الصق هذا الكود
// Open browser console and paste this code

const token = localStorage.getItem('portal:access_token');
const user = JSON.parse(localStorage.getItem('portal:user') || '{}');

if (!token) {
  console.log('⚠️ لم يتم تسجيل الدخول / Not logged in');
} else {
  // Decode JWT token
  function decodeJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const json = atob(base64Url.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decodeURIComponent(escape(json)));
    } catch { return null; }
  }

  const claims = decodeJwt(token);
  
  console.log('═══════════════════════════════════════════════');
  console.log('📋 معلومات الحساب الحالي / Current Account Info');
  console.log('═══════════════════════════════════════════════');
  console.log('');
  console.log('👤 User ID:', claims?.userId || claims?.sub);
  console.log('📧 Email:', claims?.email);
  console.log('🏷️  User Type:', claims?.userType || claims?.type);
  console.log('🌐 Language:', claims?.lang || claims?.language);
  console.log('');
  console.log('📅 Token Issued:', claims?.iat ? new Date(claims.iat * 1000).toLocaleString('ar-EG') : 'N/A');
  console.log('⏰ Token Expires:', claims?.exp ? new Date(claims.exp * 1000).toLocaleString('ar-EG') : 'N/A');
  console.log('');
  console.log('🔐 Full Claims:', claims);
  console.log('💾 Stored User:', user);
  console.log('═══════════════════════════════════════════════');
}
