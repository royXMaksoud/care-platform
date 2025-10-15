import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Grid
} from '@mui/material';
import { styled } from '@mui/material/styles';
import authService from '../services/authService';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  maxWidth: 400,
  width: '100%',
  margin: 'auto',
  marginTop: theme.spacing(8),
  [theme.breakpoints.down('sm')]: {
    marginTop: theme.spacing(4),
    padding: theme.spacing(3),
  },
}));

const Login = () => {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleLanguageChange = (event) => {
    const newLang = event.target.value;
    i18n.changeLanguage(newLang);
    
    // Update document direction for RTL support
    document.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = t('login.usernameRequired');
    }
    
    if (!formData.password.trim()) {
      newErrors.password = t('login.passwordRequired');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      await authService.login(formData.username, formData.password);
      // Redirect or update app state here
      console.log('Login successful');
    } catch (error) {
      setErrorMessage(t('login.error'));
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <StyledPaper elevation={3}>
        <Typography component="h1" variant="h4" gutterBottom>
          {t('login.title')}
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, width: '100%' }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="language-label">{t('login.language')}</InputLabel>
                <Select
                  labelId="language-label"
                  value={i18n.language}
                  label={t('login.language')}
                  onChange={handleLanguageChange}
                >
                  <MenuItem value="en">{t('languages.english')}</MenuItem>
                  <MenuItem value="ar">{t('languages.arabic')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('login.username')}
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                error={!!errors.username}
                helperText={errors.username}
                disabled={loading}
                autoComplete="username"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('login.password')}
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                error={!!errors.password}
                helperText={errors.password}
                disabled={loading}
                autoComplete="current-password"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 2, mb: 2 }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  t('login.loginButton')
                )}
              </Button>
            </Grid>
            
            {errorMessage && (
              <Grid item xs={12}>
                <Alert severity="error" sx={{ mt: 2 }}>
                  {errorMessage}
                </Alert>
              </Grid>
            )}
          </Grid>
        </Box>
      </StyledPaper>
    </Container>
  );
};

export default Login; 