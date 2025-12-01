# Warehouse Scanning System

A comprehensive warehouse management system for tracking receiving, shipping, and inventory operations with real-time dashboard analytics and role-based access control.

## Overview

This Angular-based web application provides a complete solution for warehouse operations management, including barcode scanning, stock tracking, reporting, and user management. The system features real-time data updates, interactive charts, and role-based permissions for different warehouse operations.

## Tech Stack

- **Framework**: Angular 17.3.0
- **UI Components**: Angular Material 17.3.10
- **Admin Template**: AdminLTE 4.0.0-rc3
- **Styling**: Bootstrap 5.3.8, SCSS
- **Icons**: Bootstrap Icons, Font Awesome 7.1.0
- **Charts**: Chart.js 4.4.0 with ng2-charts
- **Language**: TypeScript 5.4.2
- **HTTP Client**: RxJS 7.8.0

## Features

### Core Modules

1. **Dashboard**
   - Real-time warehouse statistics (first stock, receiving, shipping, current stock)
   - Daily receiving/shipping trends chart
   - Shift-based scan performance tracking
   - Warehouse item status overview
   - Recent receiving/shipping activity lists
   - Auto-refresh every 5 seconds

2. **Receiving Management** (Role: RECEIVING, IT)
   - Barcode scanning for incoming inventory
   - Product details tracking (model, color, size, quantity)
   - Real-time scan recording

3. **Shipping Management** (Role: SHIPPING, IT)
   - Barcode scanning for outgoing inventory
   - Product validation and tracking
   - Real-time shipment recording

4. **Stock Management**
   - Current inventory overview
   - Product tracking by warehouse, brand, model, color, and size
   - Stock status monitoring

5. **Transaction History**
   - Complete receiving and shipping transaction logs
   - Search and filter capabilities
   - Transaction details view

6. **Reporting** (Role: MANAGEMENT, IT)
   - Daily reports with detailed metrics
   - Monthly summary reports
   - Export capabilities

7. **Master Data Management** (Role: IT)
   - Product master data configuration
   - Warehouse configuration
   - System settings

8. **User Management** (Role: IT)
   - User creation and modification
   - Role assignment (IT, RECEIVING, SHIPPING, MANAGEMENT)
   - Permission management

### Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Auth guard for protected routes
- HTTP interceptors for token management
- Error interceptor for centralized error handling

## Project Structure

```
src/
├── app/
│   ├── core/                    # Core functionality
│   │   ├── auth/               # Authentication & authorization
│   │   │   ├── auth.guard.ts   # Route protection
│   │   │   ├── role.guard.ts   # Role-based access control
│   │   │   ├── auth.service.ts # Auth service
│   │   │   ├── auth.interceptor.ts
│   │   │   └── error.interceptor.ts
│   │   ├── models/             # Data models
│   │   │   ├── user.model.ts
│   │   │   ├── scan.model.ts
│   │   │   └── stock.model.ts
│   │   └── services/           # Business services
│   │       ├── dashboard.service.ts
│   │       ├── receiving.service.ts
│   │       ├── shipping.service.ts
│   │       └── stock.service.ts
│   ├── features/               # Feature modules
│   │   ├── auth/               # Login & authentication
│   │   ├── dashboard/          # Main dashboard
│   │   ├── receiving/          # Receiving operations
│   │   ├── shipping/           # Shipping operations
│   │   ├── stock/              # Stock management
│   │   ├── transaction/        # Transaction history
│   │   ├── report/             # Daily & monthly reports
│   │   ├── master-data/        # Master data management
│   │   └── user/               # User management
│   └── shared/                 # Shared components
│       ├── layout/             # Main layout wrapper
│       └── components/         # Reusable components
│           ├── navbar/
│           ├── sidebar/
│           └── footer/
├── environments/               # Environment configurations
└── assets/                     # Static assets
```

## User Roles & Permissions

| Role | Access |
|------|--------|
| **IT** | Full system access (all modules) |
| **RECEIVING** | Dashboard, Receiving, Stock, Transactions |
| **SHIPPING** | Dashboard, Shipping, Stock, Transactions |
| **MANAGEMENT** | Dashboard, Reports (Daily/Monthly), Stock, Transactions |

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Angular CLI 17.3.17

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd scan-system
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
   - Update `src/environments/environment.ts` with your API endpoint
   - Default API URL: `http://localhost:3000/api`

### Development Server

Run the development server:
```bash
npm start
# or
ng serve
```

Navigate to `http://localhost:4200/`. The application will automatically reload when you make changes to source files.

### Build

Build the project for production:
```bash
npm run build
# or
ng build
```

Build artifacts will be stored in the `dist/scan-frontend/` directory.

### Testing

Run unit tests:
```bash
npm test
# or
ng test
```

Tests are executed using [Karma](https://karma-runner.github.io) with Jasmine.

## API Integration

The application communicates with a backend API. Expected endpoints:

### Authentication
- `POST /api/auth/login` - User authentication

### Dashboard
- `GET /api/dashboard/warehouse-stats` - Warehouse statistics
- `GET /api/dashboard/daily-chart` - Daily chart data
- `GET /api/dashboard/shift-scan` - Shift scan performance
- `GET /api/dashboard/warehouse-items` - Warehouse items overview
- `GET /api/dashboard/receiving-list` - Recent receiving records
- `GET /api/dashboard/shipping-list` - Recent shipping records

### Operations
- `POST /api/receiving/scan` - Record receiving scan
- `POST /api/shipping/scan` - Record shipping scan
- `GET /api/stock` - Get stock inventory
- `GET /api/transactions` - Get transaction history

### Reports
- `GET /api/reports/daily` - Daily reports
- `GET /api/reports/monthly` - Monthly reports

### Administration
- `GET /api/users` - Get users list
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/master-data` - Get master data
- `POST /api/master-data` - Update master data

## Development Guidelines

### Code Scaffolding

Generate new components:
```bash
ng generate component component-name
ng generate directive|pipe|service|class|guard|interface|enum|module
```

### Styling

- Use SCSS for component styles
- Follow Bootstrap 5 utility classes where applicable
- AdminLTE classes for admin interface consistency

### State Management

- Services use RxJS for reactive data management
- HTTP calls leverage Angular HttpClient
- Real-time updates via interval-based polling

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Configuration

### Build Budgets

Production build budgets:
- Initial bundle: 1MB maximum
- Component styles: 4KB maximum

### TypeScript

Strict mode enabled with:
- `strict: true`
- `noImplicitOverride: true`
- `noImplicitReturns: true`
- `noFallthroughCasesInSwitch: true`

## License

Private project - All rights reserved

## Support

For Angular CLI help:
```bash
ng help
```

Visit [Angular CLI Documentation](https://angular.io/cli) for detailed command reference.
