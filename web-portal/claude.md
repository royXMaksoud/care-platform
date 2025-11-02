# Web Portal - React Frontend

## Overview
The Web Portal is a modern React-based web application that serves as the primary administrative interface for the Care Management System. It provides comprehensive access to all system services including user management, appointment scheduling, organization management, data analysis dashboards, and more.

## Technology Stack
- **Framework**: React 19.1.1 with Vite
- **Language**: TypeScript
- **UI Framework**: Ant Design Pro Components
- **Styling**: TailwindCSS
- **Package Manager**: npm
- **Node Version**: 18+ (recommended)

## Key Technologies & Libraries
- **React 19.1.1**: Modern UI framework with latest features
- **Vite**: Fast build tool and dev server
- **TypeScript**: Type-safe JavaScript development
- **TailwindCSS**: Utility-first CSS framework
- **Ant Design Pro**: Enterprise-grade UI components
- **TanStack Query (React Query)**: Server state management
- **TanStack Table**: Powerful data table library
- **Framer Motion**: Animation library
- **i18next**: Internationalization and localization
  - **ar.json**: Arabic translation
  - **en.json**: English translation
- **Axios**: HTTP client for API communication
- **React Router**: Client-side routing

## Project Structure
```
web-portal/
├── src/
│   ├── auth/                    # Authentication components
│   │   ├── Login.jsx            # Login page
│   │   ├── OAuthCallback.jsx    # OAuth callback handling
│   │   ├── PasswordChangeRequired.jsx
│   │   ├── NewUserWelcome.jsx   # New user welcome screen
│   │   ├── authStorage.jsx      # Token storage management
│   │   └── useAuth.jsx          # Auth hook
│   ├── components/              # Reusable components
│   │   ├── CrudFormModal.jsx    # Generic CRUD form
│   │   └── SearchableSelect.jsx # Searchable dropdown
│   ├── config/                  # Configuration files
│   │   └── permissions-constants.js
│   ├── contexts/                # React contexts
│   │   └── PermissionsContext.jsx
│   ├── lib/
│   │   └── axios.ts             # Axios instance configuration
│   ├── locales/                 # Internationalization
│   │   ├── ar/translation.json  # Arabic translations
│   │   └── en/translation.json  # English translations
│   ├── modules/
│   │   ├── cms/                 # Content Management System
│   │   │   └── pages/
│   │   │       ├── codeTable/       # Code table management
│   │   │       ├── codeCountry/     # Country master data
│   │   │       ├── codeOrganization/# Organization master data
│   │   │       ├── dutyStation/     # Duty station management
│   │   │       ├── location/        # Location management
│   │   │       ├── operation/       # Operation management
│   │   │       ├── organizationBranch/ # Branch management
│   │   │       ├── tenants/         # Tenant management
│   │   │       ├── users/           # User management
│   │   │       └── Home.jsx         # CMS home page
│   │   │   └── routes.jsx
│   │   └── das/                 # Data Analysis System (legacy)
│   ├── main.jsx                 # React app entry point
│   └── App.jsx                  # Root component

├── public/                      # Static assets
├── package.json                 # Dependencies and scripts
├── package-lock.json            # Lock file
├── vite.config.js              # Vite configuration
└── tailwind.config.js           # TailwindCSS configuration
```

## Core Features & Pages

### Authentication Module (`src/auth/`)
- **Login.jsx**: User login with email/password
- **OAuthCallback.jsx**: OAuth2 callback handling
- **PasswordChangeRequired.jsx**: Force password change on first login
- **NewUserWelcome.jsx**: Welcome screen for new users
- **useAuth.jsx**: Custom hook for auth state management
- **authStorage.jsx**: Token storage and retrieval

### CMS Modules (`src/modules/cms/pages/`)
1. **Code Table Management**
   - List all code tables
   - Create/edit/delete code table entries
   - View code table details

2. **Country Management** (`codeCountry/`)
   - Country list view
   - Country details view
   - CRUD operations

3. **Organization Management** (`codeOrganization/`)
   - Organization hierarchy
   - Organization details
   - Branch management

4. **Duty Station Management**
   - List all duty stations
   - Assign locations to duty stations
   - Staff assignment

5. **Location Management**
   - Geographic locations
   - Region and area management
   - Nested location hierarchy

6. **Operation Management**
   - Define operations/programs
   - Operation status tracking
   - Coverage areas

7. **Organization Branch Management**
   - Branch details and hierarchy
   - Branch-to-organization mapping

8. **Tenant Management** (`tenants/`)
   - Multi-tenant configuration
   - Tenant details and settings

9. **User Management** (`users/`)
   - User listing with data table
   - User creation and editing
   - Role assignment
   - Permission management
   - User status control

### Reusable Components

#### CrudFormModal (`src/components/CrudFormModal.jsx`)
- Generic modal form for CRUD operations
- Dynamic field generation
- Validation support
- Customizable for different entities

#### SearchableSelect (`src/components/SearchableSelect.jsx`)
- Dropdown with search capability
- Multi-select support
- Async loading of options

## Key Technologies Details

### Axios Configuration (`src/lib/axios.ts`)
- Configured with backend API base URL
- Automatic JWT token inclusion in headers
- Response interceptors for error handling
- Request timeout configuration

### Permissions Context (`src/contexts/PermissionsContext.jsx`)
- Global permissions state management
- User role and permission information
- Feature flag management
- Used throughout components for conditional rendering

### TanStack Query (React Query)
- Server state management
- Automatic caching
- Background refetching
- Optimistic updates
- Loading/error states

### TanStack Table
- Powerful data table component
- Sorting, filtering, pagination
- Column customization
- Row selection
- Used in user list, organization list, etc.

## Internationalization (i18n)

### Supported Languages
- **English** (`en/translation.json`)
- **Arabic** (`ar/translation.json`)

### Usage
```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <h1>{t('common.welcome')}</h1>;
}
```

### RTL Support
- Arabic locale automatically enables RTL layout
- TailwindCSS supports RTL directives
- Components adapt to text direction

## API Integration

### Authentication Flow
1. User logs in via Login.jsx
2. Credentials sent to `/auth/login`
3. JWT token received and stored in localStorage
4. Token included in all subsequent API requests via Axios interceptor

### OAuth2 Flow
1. User clicks OAuth login button
2. Redirected to OAuth provider
3. Callback handled in OAuthCallback.jsx
4. Token exchanged for JWT
5. Redirected to dashboard

### CRUD Operations
- **GET** - Fetch data (lists, details)
- **POST** - Create new records
- **PUT** - Update existing records
- **DELETE** - Delete records
- All through REST endpoints via Axios

## Development

### Install Dependencies
```bash
npm install
```

### Start Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Lint and Format
```bash
npm run lint
npm run format
```

### Run Tests
```bash
npm run test
```

## Environment Configuration

### Environment Variables
Create `.env.local`:
```env
VITE_API_URL=http://localhost:6060/api
VITE_AUTH_URL=http://localhost:6060/auth
VITE_OAUTH_CLIENT_ID=your-client-id
VITE_OAUTH_REDIRECT_URI=http://localhost:5173/oauth-callback
```

### Vite Configuration
- Hot module replacement (HMR) for fast development
- Optimized build output
- Source maps for debugging

## Security Features

### Authentication
- JWT token-based authentication
- Token storage in localStorage
- Token refresh mechanism
- Logout with token cleanup

### Authorization
- Role-based access control (RBAC)
- Permission-based feature visibility
- Route-level access control

### Data Security
- HTTPS communication with backend
- Secure headers configuration
- Input validation before submission
- XSS protection

## Performance Optimization

### Code Splitting
- Route-based code splitting
- Lazy loading of pages
- Component-level splitting with React.lazy()

### Image Optimization
- Asset optimization
- Lazy image loading

### Build Optimization
- Tree shaking of unused code
- CSS minification
- JavaScript minification
- Compression

## Common Tasks

### Adding a New Page
1. Create component in `src/modules/cms/pages/NewFeature/`
2. Add route in `src/modules/cms/routes.jsx`
3. Update navigation menu
4. Add translations in `locales/`

### Creating a New CRUD Module
1. Create folder structure
2. Create list page with TanStack Table
3. Create detail/edit page
4. Create form modal component
5. Connect to API endpoints
6. Add permissions checks

### Adding Translations
1. Add keys to `locales/en/translation.json`
2. Add corresponding keys to `locales/ar/translation.json`
3. Use `useTranslation()` hook to access

## Testing
- Unit tests for components
- Integration tests for pages
- E2E tests for user flows
- Mock API responses for testing

## Troubleshooting

### Build Issues
- Clear `node_modules` and reinstall
- Clear Vite cache: `npm run clean`
- Check Node version compatibility

### API Connection Issues
- Verify backend services are running
- Check environment variable configuration
- Review browser console for CORS errors

### Authentication Issues
- Check token storage in browser DevTools
- Verify token expiration
- Check OAuth configuration

## Deployment

### Build for Production
```bash
npm run build
```

### Serve Built Files
```bash
npm run preview
```

### Docker Deployment
Dockerfile available for containerization.

## Recent Changes
- Modern React 19 with latest features
- Upgraded to latest TanStack libraries
- Enhanced OAuth integration
- Improved permissions system
- RTL support for Arabic
- New user welcome flow
