# Web Admin Login Page

A responsive React login page with Material UI, internationalization (i18next), and JWT authentication.

## Features

- ✅ Responsive design that works on all devices
- ✅ Username and password input fields
- ✅ Language dropdown (Arabic, English)
- ✅ POST /auth/login API integration
- ✅ JWT token storage in localStorage
- ✅ Material UI components
- ✅ i18next internationalization
- ✅ RTL support for Arabic language
- ✅ Form validation
- ✅ Loading states
- ✅ Error handling

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000).

## API Configuration

The login form makes a POST request to `/auth/login` with the following payload:

```json
{
  "username": "user_input",
  "password": "password_input"
}
```

Expected response:
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "username": "username",
    "email": "email@example.com"
  }
}
```

To configure the API URL, set the `REACT_APP_API_URL` environment variable:

```bash
REACT_APP_API_URL=http://your-api-server.com npm start
```

## Project Structure

```
src/
├── components/
│   └── Login.js          # Main login component
├── i18n/
│   ├── index.js          # i18next configuration
│   └── locales/
│       ├── en.json       # English translations
│       └── ar.json       # Arabic translations
├── services/
│   └── authService.js    # Authentication service
├── App.js                # Main app component
└── index.js              # React entry point
```

## Features in Detail

### Internationalization (i18next)
- Supports English and Arabic languages
- Automatic language detection
- RTL layout support for Arabic
- All UI text is translatable

### Material UI
- Modern, responsive design
- Consistent theming
- Built-in form validation
- Loading states and error handling

### Authentication
- JWT token storage in localStorage
- User data persistence
- Automatic token management
- Logout functionality

### Responsive Design
- Mobile-first approach
- Adaptive layout for all screen sizes
- Touch-friendly interface

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run eject` - Ejects from Create React App

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Dependencies

- React 18.2.0
- Material UI 5.14.20
- i18next 23.7.6
- Axios 1.6.2
- React Scripts 5.0.1 