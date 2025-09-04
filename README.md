# ACME Leasify Demo Application

A professional React application for managing IFRS compliance reports using the Leasify API. This demo application simulates a company called ACME and serves as a closed demo for lease accounting report management.

## Features

- **Secure Authentication**: Login with email and password using Leasify API
- **Professional Dashboard**: View and manage IFRS reports with real-time data
- **Report Creation**: Create new reports with configurable parameters through an intuitive modal
- **Dark Theme**: Professional dark interface with blue (primary) and yellow (accent) color scheme
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **Real-time Updates**: Refresh button to get the latest report data from the API

## Technology Stack

- **Frontend**: React 18.3 with TypeScript 5.9
- **Build Tool**: Vite 5.4 (requires Node.js 22+)
- **Styling**: Tailwind CSS 3.3 with custom dark theme
- **Icons**: Lucide React
- **API Integration**: Leasify API v3 with Laravel Sanctum authentication
- **JSON Viewer**: @uiw/react-json-view for interactive report inspection
- **Testing**: Vitest 3.2 with React Testing Library

## Getting Started

### Prerequisites

- **Node.js 22.0.0 or higher** (required) - This application requires Node.js version 22
- npm package manager
- Valid Leasify API credentials

### Installation

1. Clone this repository

2. Verify your Node.js version:
   ```bash
   node --version  # Should show v22.x.x or higher
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:5173 in your browser

### Building for Production

```bash
npm run build
```

## Application Structure

### Authentication
- Login page with company branding and feature highlights
- Secure token-based authentication using Laravel Sanctum
- Automatic token persistence and validation

### Dashboard
- Professional header with company logo and user information
- Comprehensive reports table with:
  - Report name and ID
  - Report type (IFRS16, LOCALGAAP, RKRR5, GENERATOR)
  - Associated template information
  - Status indicators with color coding
  - Break dates and duration
  - Creation timestamps
- Refresh functionality for real-time updates

### Report Creation
- Modal-based report creation form
- Support for all report types defined in the API
- Template selection from available options
- Configurable parameters:
  - Report name
  - Report type
  - Template selection
  - Break date
  - Duration in months
  - Optional years parameter
  - Language selection
  - Webhook URL for notifications
- Form validation and error handling
- Progress indicators during creation

## API Integration

The application integrates with the Leasify API v3 endpoints:

- `POST /login` - User authentication
- `GET /whoami` - User profile information
- `GET /templates` - Available report templates
- `GET /reports` - User's reports
- `POST /report` - Create new report
- `GET /report/{id}` - Get specific report details

## Design System

### Color Scheme
- **Primary Colors**: Blue tones for branding and main UI elements
- **Accent Colors**: Yellow tones for highlights and call-to-action elements
- **Background**: Dark grays for professional appearance
- **Text**: White and light grays for optimal contrast

### Typography
- Clean, professional fonts optimized for readability
- Consistent hierarchy with proper sizing and weights

### Components
- Reusable UI components with consistent styling
- Professional form elements with validation states
- Responsive modals and dialogs
- Status indicators with appropriate color coding

## Security Features

- Secure API token storage in localStorage
- Automatic token validation and refresh
- Protected routes requiring authentication
- Proper error handling for unauthorized access
- Input validation and sanitization

## Browser Support

- Modern browsers with ES2020 support
- Chrome 88+
- Firefox 88+
- Safari 14+
- Edge 88+

## Development

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm test` - Run tests in watch mode
- `npm run test:run` - Run all tests once
- `npm run test:ui` - Run tests with UI interface
- `npm run coverage` - Run tests with coverage report

### Project Structure
```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── Dashboard.tsx   # Main dashboard
│   ├── LoginPage.tsx   # Authentication page
│   └── CreateReportModal.tsx
├── contexts/           # React contexts
├── services/           # API services
├── types/             # TypeScript definitions
├── lib/               # Utility functions
└── index.css          # Global styles
```

## Testing

The application includes a comprehensive test suite with 80+ tests covering:

- **Unit Tests**: UI components, utility functions, API services
- **Integration Tests**: Authentication flows, page components, context providers
- **Error Handling**: Network failures, validation errors, edge cases
- **User Interactions**: Form submissions, modal behavior, table interactions

See [TESTING.md](./TESTING.md) for detailed testing documentation.

### Test Results Summary
- ✅ API Service: 13 tests
- ✅ UI Components: 49 tests  
- ✅ Utils: 6 tests
- ✅ Authentication: 8 tests
- ✅ Page Components: 12+ tests

## License

This is a demo application for evaluation purposes.