import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useTranslation } from 'react-i18next';
import './i18n';
import Login from './components/Login';

const App = () => {
  const { i18n } = useTranslation();

  // Create theme with RTL support
  const theme = createTheme({
    direction: i18n.language === 'ar' ? 'rtl' : 'ltr',
    palette: {
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
    },
    typography: {
      fontFamily: i18n.language === 'ar' 
        ? '"Noto Sans Arabic", "Roboto", "Helvetica", "Arial", sans-serif'
        : '"Roboto", "Helvetica", "Arial", sans-serif',
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Login />
    </ThemeProvider>
  );
};

export default App; 