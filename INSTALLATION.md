# Installation & Setup Guide

## System Requirements

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18 or higher (includes npm)
- **npm**: Version 9 or higher
- **Git**: For version control (optional)
- **Visual Studio Code**: Recommended editor

### Check Your Installation

```bash
# Check Node.js version
node --version

# Check npm version
npm --version
```

If you need to install Node.js, download it from: https://nodejs.org/

## Step-by-Step Installation

### Step 1: Navigate to Front Directory

Open PowerShell or Command Prompt and navigate to the front directory:

```bash
cd C:\Users\trabe\OneDrive\Desktop\chosen\PFE\front
```

### Step 2: Install Dependencies

Install all required npm packages:

```bash
npm install
```

**What this does:**
- Downloads Angular and all dependencies (~500MB)
- Creates `node_modules` folder
- Takes 3-10 minutes depending on internet speed

**Expected Output:**
```
added X packages, and audited X packages in Xm Xs
found 0 vulnerabilities
```

### Step 3: Verify Installation

Check that everything installed correctly:

```bash
npm list @angular/core
```

Should show: `@angular/core@18.0.0`

## Running the Application

### Start Development Server

```bash
npm start
```

**Expected Output:**
```
✔ Compiled successfully.

Local:        http://localhost:4200
External:     http://YOUR-IP:4200

Press u to update, h for help, q to quit
```

### Access the Application

Open your browser and go to:
```
http://localhost:4200
```

**If port 4200 is already in use:**

```bash
npm start -- --port 4300
```

Then access at `http://localhost:4300`

## Troubleshooting Installation

### Issue 1: npm install fails

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Try installation again
npm install
```

### Issue 2: "Node is not recognized"

**Solution:**
- Restart your terminal/PowerShell
- Add Node.js to PATH (usually automatic)
- Reinstall Node.js

### Issue 3: Port 4200 in use

**Solution:**
```bash
# Kill the process using port 4200
netstat -ano | findstr :4200
taskkill /PID <PID> /F

# Or use a different port
npm start -- --port 4300
```

### Issue 4: CORS errors when calling backend

**Solution:** Configure your Spring Boot backend to accept requests from localhost:4200

In `application.properties`:
```properties
# Allow Angular frontend
server.cors.allowed-origins=http://localhost:4200
```

Or add to your controller:
```java
@CrossOrigin(origins = "http://localhost:4200")
```

## First Time Usage

### Default Login Credentials

```
Email: admin@example.com
Password: admin123
```

**Note:** These are demo credentials. Create your own users in the backend or admin panel.

### Initial Setup Checklist

- [ ] Backend API is running on `http://localhost:8080`
- [ ] Database is connected and migrations are complete
- [ ] Dependencies installed (`npm install` completed)
- [ ] Development server started (`npm start` running)
- [ ] Can access `http://localhost:4200`
- [ ] Can login with demo credentials
- [ ] Dashboard loads and shows statistics

## Configuration

### API Base URL

If your backend is on a different URL, update these files:

**1. src/app/auth.service.ts**
```typescript
private apiUrl = 'http://YOUR-BACKEND-URL:8080/auth';
```

**2. src/app/services/user.service.ts**
```typescript
private apiUrl = 'http://YOUR-BACKEND-URL:8080/users';
```

**3. src/app/services/request.service.ts**
```typescript
private apiUrl = 'http://YOUR-BACKEND-URL:8080/requests';
```

**4. src/app/services/equipe.service.ts**
```typescript
private apiUrl = 'http://YOUR-BACKEND-URL:8080/equipes';
```

**Or use environment files:**

**src/environments/environment.ts** (development):
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080'
};
```

Then in services:
```typescript
import { environment } from '../../environments/environment';

private apiUrl = `${environment.apiUrl}/auth`;
```

## Common Commands

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Watch mode (rebuild on file changes)
npm run watch

# Clear cache
npm cache clean --force

# Reinstall dependencies
rm -r node_modules package-lock.json
npm install
```

## Project Structure After Installation

```
front/
├── node_modules/                 # All dependencies (created by npm install)
├── .angular/                     # Angular cache (created automatically)
├── dist/                         # Build output (created by npm run build)
├── src/
│   ├── app/                      # Application code
│   ├── environments/             # Environment configs
│   ├── index.html                # Entry point
│   ├── main.ts                   # Bootstrap file
│   └── styles.css                # Global styles
├── angular.json                  # Angular configuration
├── package.json                  # Dependencies list
├── package-lock.json             # Dependency lock file
├── tsconfig.json                 # TypeScript config
├── README.md                      # Documentation
└── QUICKSTART.md                 # Quick reference
```

## Development Workflow

### 1. Start the Development Server

```bash
npm start
```

### 2. Make Changes

Edit any TypeScript, HTML, or CSS file. The browser will automatically reload.

### 3. Test Your Changes

- Open Browser DevTools (F12)
- Check Console for errors
- Verify functionality

### 4. Commit Changes (if using Git)

```bash
git add .
git commit -m "Feature description"
git push
```

## Production Deployment

### Build for Production

```bash
npm run build
```

**Output location:** `dist/pfe-app/`

### Deployment Options

#### Option 1: Static Hosting (Firebase, Netlify, GitHub Pages)
```bash
# Build
npm run build

# Upload dist/pfe-app/ to your hosting service
```

#### Option 2: Docker Container
```dockerfile
FROM node:18 as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:latest
COPY --from=build /app/dist/pfe-app /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Option 3: Server with Node.js
```bash
# Install global server
npm install -g http-server

# Start from dist directory
cd dist/pfe-app
http-server -c-1 -o -p 8000
```

## Performance Tips

1. **Use Production Build**: Always build with `npm run build` for deployment
2. **Enable Compression**: Configure server-side gzip compression
3. **Use CDN**: Serve static assets from a CDN
4. **Monitor Bundle Size**: Run `npm run build -- --stats-json` to analyze

## Monitoring & Debugging

### Browser DevTools

```
F12 or Ctrl+Shift+I
```

**Check:**
- Console tab for errors
- Network tab for API calls
- Application tab for localStorage (tokens)
- Performance tab for optimization

### Angular DevTools

Install Chrome extension:
1. Go to Chrome Web Store
2. Search "Angular DevTools"
3. Install official Angular extension
4. Restart Chrome
5. Access in DevTools → "Angular" tab

## Getting Help

### Common Issues

1. **Blank page after login**
   - Check Network tab for 401 errors
   - Verify backend is running
   - Check localStorage for token

2. **CORS errors**
   - Configure backend CORS settings
   - Check API URL configuration

3. **Slow performance**
   - Check Network tab for slow API calls
   - Inspect bundle size
   - Use production build

4. **Form validation not working**
   - Check browser console for errors
   - Verify form control names match

## Support & Resources

- **Angular Documentation**: https://angular.io/docs
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **RxJS Guide**: https://rxjs.dev/guide/overview
- **Node.js Docs**: https://nodejs.org/en/docs/

## Next Steps

1. ✅ Install Node.js if not already done
2. ✅ Run `npm install` in the front directory
3. ✅ Start backend Spring Boot application
4. ✅ Run `npm start` for frontend
5. ✅ Login with demo credentials
6. ✅ Test all features
7. ✅ Configure API URLs for production
8. ✅ Build and deploy when ready

---

**For detailed usage**, see [README.md](README.md)

**For quick reference**, see [QUICKSTART.md](QUICKSTART.md)

**For project overview**, see [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)

