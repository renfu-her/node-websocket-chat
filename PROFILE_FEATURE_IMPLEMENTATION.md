# Profile Feature Implementation

## Overview
This document describes the implementation of the user profile management feature, including the `/profile` route, profile editing capabilities, and avatar upload functionality.

## Features Implemented

### 1. Profile Route (`/profile`)
- **Route**: `/profile`
- **Authentication**: Required (redirects to `/login` if not authenticated)
- **Component**: `UserProfile.vue`

### 2. UserProfile Component
Located at `src/components/UserProfile.vue`

#### Features:
- **Profile Information Editing**:
  - Username
  - Email
  - Nickname
  - Avatar image

- **Avatar Management**:
  - Upload new avatar image
  - Remove existing avatar
  - File validation (image files only, max 5MB)
  - Automatic fallback to FontAwesome user icon

- **UI Features**:
  - Responsive design
  - Form validation
  - Loading states
  - Error handling
  - Back button navigation

### 3. Navigation Integration
- **Profile Button**: Added to both `RoomLobby.vue` and `RoomChat.vue`
- **Access Points**: Users can access profile from lobby or chat rooms
- **Navigation**: Uses Vue Router for seamless navigation

### 4. Backend API Endpoints

#### Avatar Upload (`POST /api/upload-avatar`)
- **Purpose**: Handle avatar image uploads
- **File Storage**: `public/static/img/user/`
- **File Naming**: Unique filenames with timestamps
- **Validation**: Image files only, 5MB size limit
- **Response**: Returns avatar URL for frontend use

#### Profile Update (`PUT /api/update-profile`)
- **Purpose**: Update user profile information
- **Data**: username, email, nickname, avatarUrl
- **Authentication**: JWT token required
- **Response**: Updated user object

### 5. File Structure Changes

#### New Files Created:
```
src/components/UserProfile.vue          # Profile management component
public/static/img/user/                 # User avatar storage directory
```

#### Modified Files:
```
src/router/index.js                     # Added /profile route
src/components/MainApp.vue              # Added UserProfile component integration
src/components/RoomLobby.vue            # Added profile button
src/components/RoomChat.vue             # Added profile button
server/index.js                         # Added API endpoints and file upload handling
```

### 6. Dependencies Added
- **multer**: For handling file uploads in Express.js

## Implementation Details

### Frontend Implementation

#### UserProfile Component Structure:
```vue
<template>
  <div class="user-profile-container">
    <div class="profile-panel">
      <!-- Avatar Section -->
      <div class="avatar-section">
        <!-- Avatar display with fallback -->
        <!-- Upload/Remove buttons -->
      </div>
      
      <!-- Form Section -->
      <div class="form-section">
        <!-- Username, Email, Nickname fields -->
        <!-- Save/Cancel buttons -->
      </div>
    </div>
  </div>
</template>
```

#### Key Methods:
- `selectFile()`: Trigger file input
- `handleFileChange()`: Validate and process uploaded file
- `uploadImage()`: Send file to backend API
- `saveProfile()`: Update profile information
- `removeAvatar()`: Clear avatar image

### Backend Implementation

#### File Upload Configuration:
```javascript
const storage = multer.diskStorage({
  destination: 'public/static/img/user',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'user-' + uniqueSuffix + path.extname(file.originalname));
  }
});
```

#### API Routes:
```javascript
// Avatar upload
app.post('/api/upload-avatar', upload.single('avatar'), (req, res) => {
  // Handle file upload and return avatar URL
});

// Profile update
app.put('/api/update-profile', (req, res) => {
  // Update user profile and return updated user data
});
```

### Styling Features

#### Design Elements:
- **Semi-transparent Background**: `rgba(255, 255, 255, 0.95)` with `backdrop-filter: blur(10px)`
- **Consistent with App Theme**: Matches the gradient background design
- **Responsive Layout**: Adapts to mobile and desktop screens
- **Interactive Elements**: Hover effects and transitions

#### Avatar Styling:
- **Circular Design**: 120px diameter with border and shadow
- **FontAwesome Fallback**: `fas fa-user-circle` when no avatar is set
- **Upload Interface**: Hidden file input with styled button triggers

## Usage Instructions

### For Users:
1. **Access Profile**: Click "個人資料" button from lobby or chat room
2. **Update Information**: Edit username, email, or nickname
3. **Change Avatar**: Click "更換頭像" to upload new image
4. **Remove Avatar**: Click "移除頭像" to clear current avatar
5. **Save Changes**: Click "保存" to update profile
6. **Cancel**: Click "取消" or "返回" to go back

### For Developers:
1. **Route Access**: Navigate to `/profile` (requires authentication)
2. **API Integration**: Use `/api/upload-avatar` and `/api/update-profile` endpoints
3. **File Storage**: User images stored in `public/static/img/user/`
4. **Component Integration**: Import and use `UserProfile` component

## Security Considerations

### File Upload Security:
- **File Type Validation**: Only image files allowed
- **Size Limits**: Maximum 5MB per file
- **Unique Filenames**: Prevents filename conflicts
- **Directory Isolation**: Separate directory for user uploads

### Authentication:
- **Route Protection**: `/profile` requires authentication
- **API Protection**: Profile update endpoints require JWT token
- **Session Management**: Uses localStorage/sessionStorage for token persistence

## Future Enhancements

### Potential Improvements:
1. **Image Compression**: Automatic image resizing and compression
2. **Crop Tool**: Allow users to crop uploaded images
3. **Multiple Formats**: Support for additional image formats
4. **Profile Privacy**: Privacy settings for profile visibility
5. **Activity History**: Track profile update history
6. **Email Verification**: Email confirmation for profile changes

## Testing

### Manual Testing Checklist:
- [ ] Profile route accessible when logged in
- [ ] Profile route redirects to login when not authenticated
- [ ] Avatar upload works with valid image files
- [ ] File validation rejects non-image files
- [ ] File size validation works (5MB limit)
- [ ] Profile information updates correctly
- [ ] Avatar removal works
- [ ] Navigation between profile and other pages works
- [ ] Responsive design works on mobile devices
- [ ] Error handling displays appropriate messages

### API Testing:
- [ ] `/api/upload-avatar` accepts valid image files
- [ ] `/api/upload-avatar` rejects invalid files
- [ ] `/api/update-profile` updates user data
- [ ] Both endpoints require authentication
- [ ] Error responses are properly formatted
