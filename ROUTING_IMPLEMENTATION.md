# Routing Implementation

This document describes the routing implementation for the Vue.js chat application.

## Overview

The application now uses Vue Router to handle client-side routing with the following routes:

- `/login` - Login page
- `/register` - Registration page  
- `/lobby` - Room lobby (requires authentication)
- `/room/{roomId}` - Individual chat room (requires authentication)

## Features

### Route Protection
- Routes `/lobby` and `/room/{roomId}` require authentication
- Unauthenticated users are automatically redirected to `/login`
- Authentication is checked using localStorage/sessionStorage tokens

### Navigation Guards
- Global navigation guard checks authentication status
- Redirects unauthenticated users to login page
- Preserves intended destination for post-login navigation

### Route Structure

```
/ (root) → redirects to /login
/login → Login component
/register → Registration component  
/lobby → Lobby component (protected)
/room/:roomId → Room chat component (protected)
```

## Implementation Details

### Router Configuration (`src/router/index.js`)

```javascript
const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: MainApp
  },
  {
    path: '/register', 
    name: 'Register',
    component: MainApp
  },
  {
    path: '/lobby',
    name: 'Lobby',
    component: MainApp,
    meta: { requiresAuth: true }
  },
  {
    path: '/room/:roomId',
    name: 'Room', 
    component: MainApp,
    meta: { requiresAuth: true },
    props: true
  }
]
```

### Navigation Guard

```javascript
router.beforeEach((to, from, next) => {
  if (to.matched.some(record => record.meta.requiresAuth)) {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    
    if (!token) {
      next('/login')
    } else {
      next()
    }
  } else {
    next()
  }
})
```

### MainApp Component

The `MainApp.vue` component serves as the main container that:

1. **Handles Authentication State**: Manages login/logout and token storage
2. **Route-based Rendering**: Shows appropriate components based on current route
3. **Socket Management**: Handles WebSocket connections and real-time communication
4. **Navigation**: Provides methods for programmatic navigation

### Key Methods

- `checkAuth()` - Checks for existing authentication on app load
- `clearAuth()` - Clears authentication data and redirects to login
- `handleRouteChange()` - Handles route parameter changes (e.g., roomId)
- `logout()` - Logs out user and redirects to login page

## Usage

### Programmatic Navigation

```javascript
// Navigate to login
this.$router.push('/login')

// Navigate to lobby
this.$router.push('/lobby')

// Navigate to specific room
this.$router.push(`/room/${roomId}`)

// Navigate to register
this.$router.push('/register')
```

### Route Parameters

The room route accepts a `roomId` parameter:

```
/room/123 → Room with ID "123"
/room/abc → Room with ID "abc"
```

### Authentication Flow

1. User visits protected route without token
2. Router guard redirects to `/login`
3. User logs in successfully
4. Token stored in localStorage
5. User redirected to intended destination

## File Structure

```
src/
├── router/
│   └── index.js          # Router configuration
├── components/
│   ├── MainApp.vue       # Main application component
│   ├── UserLogin.vue     # Login component
│   ├── UserRegister.vue  # Registration component
│   ├── RoomLobby.vue     # Lobby component
│   └── RoomChat.vue      # Chat room component
└── main.js               # App entry point with router
```

## Browser Support

- Uses HTML5 History Mode for clean URLs
- Falls back to hash mode if needed
- Requires server configuration for production deployment

## Production Deployment

For production deployment, ensure your server is configured to handle client-side routing by redirecting all requests to `index.html`.

### Apache (.htaccess)
```apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

### Nginx
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

## Testing

To test the routing:

1. Start the development server: `npm run serve`
2. Visit `http://localhost:8080`
3. You should be redirected to `/login`
4. Try accessing `/lobby` directly - you should be redirected to `/login`
5. After logging in, you should be able to access `/lobby`
6. Click on a room to navigate to `/room/{roomId}`
7. Test the logout functionality - you should be redirected to `/login`
