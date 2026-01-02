# Hyloc - React + Node.js + PostgreSQL Application

A full-stack application with React frontend and Node.js backend using MVC architecture with PostgreSQL database.

## Project Structure

```
Hyloc/
├── client/                 # React frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service layer
│   │   ├── styles/        # CSS files
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
│
└── server/                 # Node.js Express backend
    ├── src/
    │   ├── config/        # Database configuration
    │   ├── controllers/    # Request handlers
    │   ├── models/        # Database models
    │   ├── routes/        # API routes
    │   ├── middleware/    # Custom middleware
    │   ├── utils/         # Utility functions
    │   └── index.js       # Server entry point
    ├── .env               # Environment variables
    └── package.json
```

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Setup Instructions

### 1. Database Setup

1. Install PostgreSQL if not already installed
2. Create a new database:
   ```sql
   CREATE DATABASE hyloc_db;
   ```
3. Run the SQL schema file to create tables:
   ```bash
   psql -U postgres -d hyloc_db -f server/src/config/db.sql
   ```

### 2. Server Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Update `.env` file with your PostgreSQL credentials:
   ```env
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_HOST=localhost
   DB_NAME=hyloc_db
   DB_PORT=5432
   PORT=5000
   NODE_ENV=development
   ```

4. Start the server:
   ```bash
   npm run dev
   ```
   The server will run on `http://localhost:5000`

### 3. Client Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the React development server:
   ```bash
   npm start
   ```
   The application will open at `http://localhost:3000`

## API Endpoints

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Posts
- `GET /api/posts` - Get all posts
- `GET /api/posts/:id` - Get post by ID
- `GET /api/users/:userId/posts` - Get posts by user
- `POST /api/posts` - Create new post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

## Technologies Used

### Frontend
- React 18
- React Router DOM
- Axios
- CSS3

### Backend
- Node.js
- Express.js
- PostgreSQL
- dotenv

## Development

### Backend Development
- Server runs with hot-reload using `nodemon`
- All server code is in the `src` directory
- MVC pattern is followed with separate folders for models, views, and controllers

### Frontend Development
- React with functional components and hooks
- Services layer abstracts API calls
- Responsive design with CSS Grid and Flexbox

## Environment Variables

### Server (.env)
```
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_NAME=hyloc_db
DB_PORT=5432
PORT=5000
NODE_ENV=development
```

### Client (.env)
No additional environment variables needed. API base URL is configured in `src/services/api.js`

## Future Enhancements

- Authentication & Authorization
- User input validation
- Error handling improvements
- Unit tests
- Docker containerization
- CI/CD pipeline
- API documentation (Swagger)

## License

ISC
