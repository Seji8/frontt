# PFE - Remote Work Management System (Angular Frontend)

This is the Angular frontend application for the RemoteFlow (Remote Work Management System) project.

## Features

- **User Authentication**: Login with JWT token-based authentication
- **Dashboard**: Overview of requests and system statistics
- **User Management**: Create, read, update, and delete users (Admin/RH only)
- **Request Management**: Submit, view, edit, and manage remote work requests
- **Role-Based Access Control**: Different features available based on user role (ADMIN, RH, CHEF_EQUIPE, EMPLOYE)

## Technology Stack

- **Angular 18**: Latest version of Angular framework
- **TypeScript**: Type-safe JavaScript
- **Reactive Forms**: For form management and validation
- **HttpClient**: For API communication
- **RxJS**: Reactive programming with Observables
- **CSS3**: Modern styling with flexbox and grid

## Project Structure

```
pfe-app/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   └── navbar/              # Navigation bar component
│   │   ├── pages/
│   │   │   ├── login/               # Login page
│   │   │   ├── dashboard/           # Dashboard page
│   │   │   ├── users/               # User management page
│   │   │   └── requests/            # Remote work requests page
│   │   ├── services/
│   │   │   ├── user.service.ts      # User API service
│   │   │   ├── request.service.ts   # Request API service
│   │   │   └── equipe.service.ts    # Team/Equipe API service
│   │   ├── auth.service.ts          # Authentication service
│   │   ├── auth.guard.ts            # Route protection guard
│   │   ├── auth.interceptor.ts      # HTTP interceptor for JWT
│   │   ├── app.component.*          # Root component
│   │   └── app.routes.ts            # Application routes
│   ├── index.html                   # HTML entry point
│   ├── main.ts                      # Angular bootstrap
│   └── styles.css                   # Global styles
├── package.json                     # Dependencies
├── angular.json                     # Angular configuration
├── tsconfig.json                    # TypeScript configuration
└── README.md                        # This file
```

## Installation

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)

### Setup

1. Navigate to the front directory:
   ```bash
   cd PFE/front
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure the API URL if needed (default: http://localhost:8080):
   - Edit `src/app/auth.service.ts`
   - Edit `src/app/services/user.service.ts`
   - Edit `src/app/services/request.service.ts`
   - Edit `src/app/services/equipe.service.ts`

## Development Server

Run the development server:

```bash
npm start
```

Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Building

Build the project for production:

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Testing

Run unit tests:

```bash
npm test
```

## Authentication

The application uses JWT (JSON Web Tokens) for authentication:

1. Users login with their email and password
2. Backend returns a JWT token and user role
3. Token is stored in localStorage
4. Token is sent with all subsequent API requests via the auth interceptor
5. Auth guard protects routes that require authentication

### Demo Credentials

```
Email: admin@example.com
Password: admin123
```

## User Roles

- **ADMIN**: Full system access, can manage users and approve requests
- **RH**: Human Resources role, can manage users and approve requests
- **CHEF_EQUIPE**: Team leader role, can approve requests from their team
- **EMPLOYE**: Regular employee, can submit and view their own requests

## API Integration

The frontend communicates with the backend Spring Boot API:

- **Base URL**: http://localhost:8080
- **Auth Endpoint**: `/auth/login`
- **Users Endpoint**: `/users`
- **Requests Endpoint**: `/requests`
- **Teams Endpoint**: `/equipes`

## Features by Page

### Login Page
- Email and password validation
- Error handling for failed login
- JWT token storage

### Dashboard
- System overview with statistics
- Quick action links
- Role-specific information display

### User Management
- List all users (ADMIN/RH only)
- Create new users with role assignment
- Edit user details
- Delete users
- Role-based access control

### Remote Work Requests
- Submit new remote work requests
- View all requests
- Edit pending requests
- Approve/reject requests (ADMIN/RH/CHEF_EQUIPE)
- Delete requests
- Filter by status and type

## Styling

The application uses a custom CSS design with:
- Modern card-based layout
- Responsive grid system
- Smooth transitions and hover effects
- Bootstrap-inspired color scheme
- Mobile-responsive design

## Error Handling

- HTTP error interception and user-friendly messages
- Form validation with detailed error messages
- Service error handling with observable operators
- Global error alerts for user notifications

## Future Enhancements

- Add notification system
- Implement request filters and search
- Add export functionality (PDF/Excel)
- Implement advanced analytics and reporting
- Add file upload for supporting documents
- Implement real-time notifications with WebSocket
- Add audit logging
- Implement approval workflow management

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add new feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Submit a pull request

## License

This project is proprietary and confidential.

## Support

For issues or questions, contact the development team.

