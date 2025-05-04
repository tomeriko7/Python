# PlateVite Blog Platform

## Overview
PlateVite is a modern blog platform built with a Django backend and a React frontend. The application allows users to create accounts, publish articles, categorize content, add tags, and engage through comments. It features a responsive design with user role management (regular users, authors, and admins).

## Project Structure

### Backend (Django)
- **Framework**: Django REST Framework
- **Database**: PostgreSQL
- **Key features**:
  - User authentication and authorization
  - Article management with categories and tags
  - Comment system with nested replies
  - RESTful API endpoints

### Frontend (React)
- **Framework**: React 19
- **Build Tool**: Vite 6
- **UI Components**: React Bootstrap
- **Key features**:
  - Responsive design
  - JWT authentication
  - Dynamic content loading
  - Modern UI with React Icons

## Features
- **User Management**:
  - User registration and authentication
  - Profile management with custom user types (regular, author, admin)
  - User profile pictures and bios

- **Content Management**:
  - Article creation and editing
  - Category and tag management
  - Rich text editing

- **Social Features**:
  - Commenting system with nested replies
  - Comment moderation

## Installation

### Prerequisites
- Python 3.8 or higher
- Node.js 16 or higher
- PostgreSQL

### Backend Setup
1. Navigate to the server directory:
   ```
   cd server
   ```

2. Create and activate a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies using the provided requirements.txt file:
   ```
   pip install -r requirements.txt
   ```
   
   The requirements.txt file includes all necessary packages:
   - Django and DRF for the backend framework
   - psycopg2-binary for PostgreSQL database connection
   - python-dotenv for environment variable management
   - djangorestframework-simplejwt for JWT authentication
   - Pillow for image processing
   - Additional development and production tools

4. Create a `.env` file with necessary environment variables:
   ```
   # Django settings
   DEBUG=True
   SECRET_KEY=django-insecure-jv5a$u*ri3v+b&0nlg2@17mqnjnzkpm_!rm9t4x$qh^-m#p1eh
   ALLOWED_HOSTS=localhost,127.0.0.1
   
   # Database configuration
   DB_NAME=my.db
   DB_USER=postgres
   DB_PASSWORD=123456
   DB_HOST=localhost
   DB_PORT=5432
   
   # CORS settings
   CORS_ALLOW_ALL_ORIGINS=True
   CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
   
   # JWT settings
   JWT_ACCESS_TOKEN_LIFETIME=1  # in days
   JWT_REFRESH_TOKEN_LIFETIME=7  # in days
   ```

5. Run migrations:
   ```
   python manage.py migrate
   ```

6. Seed the database with sample data:
   ```
   python seed_db.py
   ```
   
   This will create the following users:
   - **Admin User**:
     - Username: `admin`
     - Password: `Admin123!`
     - Type: Administrator with full access
   
   - **Regular User**:
     - Username: `user`
     - Password: `User123!`
     - Type: Regular user with basic permissions
   
   - **Author User**:
     - Username: `author`
     - Password: `Author123!`
     - Type: Content creator with article publishing rights
   
   It will also create sample categories, tags, articles, and comments to help you get started.

7. Start the server:
   ```
   python manage.py runserver
   ```

### Frontend Setup
1. Navigate to the client directory:
   ```
   cd client
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with necessary environment variables:
   ```
   # API connection - required for API calls
   VITE_API_URL=http://localhost:5173/api
   
   # App information
   VITE_APP_TITLE=PlateVite Blog
   
   # For cookie settings in AuthContext
   NODE_ENV=development
   ```

4. Start the development server:
   ```
   npm run dev
   ```

## Usage
- Access the admin panel at `http://localhost:8000/admin/`
- Access the frontend at `http://localhost:5173/`

## API Endpoints
- `/api/auth/` - Authentication endpoints
- `/api/users/` - User management
- `/api/articles/` - Article CRUD operations
- `/api/categories/` - Category management
- `/api/tags/` - Tag management
- `/api/comments/` - Comment operations

## Contributors
- Project developed by Tomer Karavani
