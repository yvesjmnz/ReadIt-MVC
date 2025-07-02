# Moderator System Documentation

## Overview
The ReadIT forum now includes a comprehensive moderator system that allows community creators to manage their communities effectively and assign moderator privileges to trusted members.

## Features

### 1. Community Roles
- **Creator**: The user who created the community
  - Automatically becomes a moderator
  - Can assign and remove moderators
  - Cannot leave their own community
  - Has full moderation privileges

- **Moderator**: Users assigned by the creator
  - Can moderate posts and comments within their community
  - Can edit/delete posts and comments from other users
  - Cannot assign other moderators (only creator can)

- **Member**: Regular community members
  - Can create posts and comments
  - Can only edit/delete their own content

### 2. Moderation Capabilities

#### Post Moderation
- Moderators and creators can delete any post in their community
- Post authors can edit their own posts
- Moderators can delete posts but cannot edit posts from other users
- Visual indicators show when actions are performed by moderators

#### Comment Moderation
- Moderators and creators can delete any comment in their community
- Comment authors can edit their own comments
- Moderators can delete comments but cannot edit comments from other users
- Comments show edit timestamps when modified

### 3. Community Management

#### Adding Moderators
- Only community creators can add moderators
- Moderators must be existing users in the system
- Users are automatically added to community members when made moderators
- Validation ensures users exist before assignment

#### Removing Moderators
- Only community creators can remove moderators
- Creators cannot remove themselves as moderators
- Removed moderators remain as regular members

#### Community Membership
- Users can join and leave communities
- Creators cannot leave their own communities
- Leaving a community removes moderator status if applicable

### 4. User Interface Features

#### Visual Indicators
- Role badges display user status (Creator 👑, Moderator 🛡️, Member 👤)
- Moderator actions are clearly labeled
- Different styling for moderation vs. user actions

#### Community Sidebar
- Shows community statistics (members, moderators count)
- Displays creator information
- Moderator management tools for creators
- Join/Leave community buttons

#### Post and Comment Actions
- Edit/Delete buttons appear based on permissions
- Moderator-specific action labels
- Confirmation dialogs for destructive actions

### 5. Backend Validation

#### Authentication
- All moderation actions require user authentication
- Session-based authentication system
- Proper error handling for unauthorized access

#### Authorization
- Role-based access control for all moderation features
- Middleware validates moderator status before allowing actions
- Community-specific permission checks

#### Data Validation
- Input validation for all forms (usernames, post content, etc.)
- Length limits on posts and comments
- Sanitization of user inputs

### 6. API Endpoints

#### Community Management
- `GET /api/community/:name` - Get community details with user role
- `POST /api/community/:name/moderator` - Add moderator (creator only)
- `DELETE /api/community/:name/moderator/:username` - Remove moderator (creator only)
- `GET /api/community/:name/moderators` - Get list of moderators
- `POST /api/community/:name/join` - Join community
- `POST /api/community/:name/leave` - Leave community

#### Post Moderation
- `PUT /api/post/:id` - Edit post (author or moderator)
- `DELETE /api/post/:id` - Delete post (author or moderator)
- `POST /api/post/:id/comment` - Add comment
- `PUT /api/post/:postId/comment/:commentId` - Edit comment (author or moderator)
- `DELETE /api/post/:postId/comment/:commentId` - Delete comment (author or moderator)

### 7. Database Schema Updates

#### Community Model
```javascript
{
  name: String,
  description: String,
  creator: String,           // New field
  moderators: [String],      // New field
  members: [String],         // New field
  createdAt: Date           // New field
}
```

#### Methods Added
- `isModerator(username)` - Check if user is moderator
- `addModerator(username)` - Add user as moderator
- `removeModerator(username)` - Remove user as moderator

### 8. Security Features

#### Input Validation
- Username validation (3-20 characters)
- Post title validation (5-200 characters)
- Post description validation (10-5000 characters)
- Comment validation (1-1000 characters)

#### Permission Checks
- Middleware validates user roles before actions
- Community-specific permission validation
- Prevents privilege escalation

#### Error Handling
- Comprehensive error messages
- Proper HTTP status codes
- User-friendly error pages

### 9. Migration

#### Existing Data
- Migration script updates existing communities
- Adds default creator and member fields
- Preserves existing community data

#### Running Migration
```bash
node scripts/migrateCommunities.js
```

### 10. Usage Instructions

#### For Community Creators
1. Create a community (automatically becomes creator/moderator)
2. Access moderator management in community sidebar
3. Add trusted members as moderators
4. Monitor and moderate content as needed

#### For Moderators
1. Join communities and get assigned moderator role
2. Use moderation tools to manage posts and comments
3. Maintain community guidelines and standards

#### For Members
1. Join communities of interest
2. Create posts and engage in discussions
3. Follow community guidelines

### 11. Future Enhancements

#### Potential Features
- Moderator activity logs
- Community rules and guidelines system
- Automated moderation tools
- Moderator permissions granularity
- Community analytics and reporting
- Bulk moderation actions
- Moderator notifications system

## Technical Implementation

### File Structure
```
├── models/
│   └── Community.js          # Updated with moderator fields
├── controllers/
│   ├── communityController.js # Community and moderator management
│   └── postController.js      # Post moderation features
├── middleware/
│   └── authMiddleware.js      # Authentication and authorization
├── views/
│   ├── community.hbs          # Updated with moderator UI
│   ├── post.hbs              # Updated with moderation features
│   └── error.hbs             # Error handling page
├── public/
│   ├── js/
│   │   └── moderatorActions.js # Frontend moderator functionality
│   └── css/
│       ├── style_community.css # Updated community styles
│       └── style_post.css      # Updated post styles
├── helpers/
│   └── handlebarsHelpers.js   # Template helpers for role checks
└── scripts/
    └── migrateCommunities.js  # Database migration script
```

### Dependencies
- Express.js for routing and middleware
- Mongoose for database operations
- Express-handlebars for templating
- Express-session for authentication

This moderator system provides a robust foundation for community management while maintaining security and user experience standards.