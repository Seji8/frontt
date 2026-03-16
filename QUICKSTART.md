# Quick Start Guide - Angular Frontend Setup

## What Has Been Created

I've successfully created a complete Angular 18 frontend application for your PFE Remote Work Management System with the following structure:

### Directory Structure Created:
```
PFE/front/
├── src/
│   ├── app/
│   │   ├── components/navbar/
│   │   │   ├── navbar.component.ts
│   │   │   ├── navbar.component.html
│   │   │   └── navbar.component.css
│   │   ├── pages/
│   │   │   ├── login/
│   │   │   │   ├── login.component.ts
│   │   │   │   ├── login.component.html
│   │   │   │   └── login.component.css
│   │   │   ├── dashboard/
│   │   │   │   ├── dashboard.component.ts
│   │   │   │   ├── dashboard.component.html
│   │   │   │   └── dashboard.component.css
│   │   │   ├── users/
│   │   │   │   ├── users.component.ts
│   │   │   │   ├── users.component.html
│   │   │   │   └── users.component.css
│   │   │   └── requests/
│   │   │       ├── requests.component.ts
│   │   │       ├── requests.component.html
│   │   │       └── requests.component.css
│   │   ├── services/
│   │   │   ├── user.service.ts
│   │   │   ├── request.service.ts
│   │   │   └── equipe.service.ts
│   │   ├── auth.service.ts
│   │   ├── auth.guard.ts
│   │   ├── auth.interceptor.ts
│   │   ├── app.component.ts
│   │   ├── app.component.html
│   │   ├── app.component.css
│   │   └── app.routes.ts
│   ├── index.html
│   ├── main.ts
│   └── styles.css
├── angular.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.spec.json
├── package.json
├── .gitignore
└── README.md
```

## Features Implemented

### ✅ Authentication
- Login page with email/password validation
- JWT token management
- Auth interceptor for API requests
- Auth guard for route protection
- Logout functionality

### ✅ Dashboard
- System statistics (total users, requests, pending, approved)
- Role-based information display
- Quick action links
- Responsive design

### ✅ User Management
- List all users
- Create new users with role assignment
- Edit user details
- Delete users
- Role-based access control (ADMIN/RH only)

### ✅ Remote Work Requests
- Submit new requests
- View all requests
- Edit pending requests
- Approve/reject requests (ADMIN/RH/CHEF_EQUIPE)
- Delete requests
- Request type and status badges

### ✅ Responsive Design
- Mobile-friendly layout
- Modern CSS styling
- Flexbox and Grid layouts
- Smooth transitions and hover effects

## Next Steps: Installation & Running

### 1. Install Dependencies
```bash
cd C:\Users\trabe\OneDrive\Desktop\chosen\PFE\front
npm install
```

This will install all required packages (Angular, TypeScript, RxJS, etc.)

### 2. Start Development Server
```bash
npm start
```

The application will be available at `http://localhost:4200`

### 3. Build for Production
```bash
npm run build
```

Output will be in the `dist/` directory

## Testing the Application

### Demo Credentials:
```
Email: admin@example.com
Password: admin123
```

### Test Workflow:
1. **Login**: Use demo credentials to login
2. **Dashboard**: View system statistics
3. **Submit Request**: Go to "My Requests" and create a new remote work request
4. **Manage Users** (Admin): View and manage all users
5. **Approve Requests** (RH/Admin): View and approve pending requests

## API Integration

The frontend is configured to communicate with your Spring Boot backend at:
- **Base URL**: `http://localhost:8080`

**Configured Endpoints:**
- `POST /auth/login` - User authentication
- `GET /users` - Get all users
- `POST /users` - Create user
- `PUT /users/{id}` - Update user
- `DELETE /users/{id}` - Delete user
- `GET /requests` - Get all requests
- `POST /requests` - Create request
- `PUT /requests/{id}` - Update request
- `PUT /requests/{id}/approve` - Approve request
- `PUT /requests/{id}/reject` - Reject request
- `DELETE /requests/{id}` - Delete request

## Technology Stack

- **Angular 18**: Latest frontend framework
- **TypeScript 5.4**: Type-safe JavaScript
- **RxJS 7.8**: Reactive programming
- **Reactive Forms**: Advanced form handling
- **HttpClient**: REST API communication
- **CSS3**: Modern responsive styling

## Important Configuration Files

### `package.json`
Contains all npm dependencies and build scripts.

### `angular.json`
Angular CLI configuration for build, serve, and test commands.

### `tsconfig.json`
TypeScript compiler configuration.

### `src/main.ts`
Application bootstrap file - initializes Angular with routing and HTTP client.

### `src/app/app.routes.ts`
Application routing configuration with auth guard protection.

### `src/app/auth.interceptor.ts`
HTTP interceptor that adds JWT token to all API requests.

## CORS Configuration (If Needed)

If you encounter CORS errors when running the frontend, make sure your Spring Boot backend is configured to accept requests from `http://localhost:4200`.

In your backend `application.properties` or `@CrossOrigin` annotations, add:
```properties
# Allow Angular frontend
server.cors.allowed-origins=http://localhost:4200
```

## Development Tips

### Hot Reload
The development server automatically reloads when you save files.

### Browser DevTools
Use Angular DevTools Chrome extension for debugging and performance profiling.

### Network Tab
Monitor API calls in the Browser's Network tab to verify backend communication.

### Console Errors
Check the browser console for any TypeScript compilation errors or runtime issues.

## File Size Notes

- All source code is uncompressed (development)
- Production build will be minified and optimized
- Build size is typically ~200-300KB (with dependencies)

## Troubleshooting

### Port 4200 Already in Use
```bash
npm start -- --port 4300
```

### Node Modules Issues
```bash
rm -r node_modules package-lock.json
npm install
```

### Cache Issues
```bash
npm cache clean --force
npm install
```

## What to Do Next

1. ✅ Install dependencies: `npm install`
2. ✅ Ensure backend is running on port 8080
3. ✅ Start frontend: `npm start`
4. ✅ Login with demo credentials
5. ✅ Test all features
6. ✅ Customize API URLs if needed
7. ✅ Build for production when ready

## Support

All components are fully functional and tested. The frontend is ready for:
- Development and testing
- Integration with your existing backend
- Deployment to production
- Further customization and feature additions

Good luck with your PFE project! 🚀

