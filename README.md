# StyleHub - Clothing Brand E-commerce Website

A modern, full-stack e-commerce website built with React.js and Node.js for a clothing brand. Features a beautiful UI, complete shopping cart functionality, user authentication, and admin panel.

## 🚀 Features

### Frontend (React.js)
- **Modern UI/UX**: Beautiful, responsive design with Tailwind CSS
- **Product Catalog**: Browse products with filtering and search
- **Shopping Cart**: Add/remove items, quantity management
- **User Authentication**: Login, registration, and profile management
- **Product Details**: Detailed product pages with image galleries
- **Checkout Process**: Complete order flow with payment integration
- **Admin Panel**: Product and order management for administrators

### Backend (Node.js/Express)
- **RESTful API**: Complete API for all e-commerce operations
- **Authentication**: JWT-based user authentication
- **Product Management**: CRUD operations for products
- **Order Processing**: Order creation and management
- **User Management**: User profiles and admin controls
- **Security**: Input validation, CORS, and security headers

## 🛠️ Tech Stack

### Frontend
- **React.js 18** - Modern UI framework
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast build tool and dev server
- **Context API** - State management

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **CORS** - Cross-origin resource sharing

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd clothing-brand-website
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   PORT=5000
   JWT_SECRET=your-secret-key-here
   NODE_ENV=development
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

This will start both the frontend (Vite dev server on port 3000) and backend (Express server on port 5000) concurrently.

## 🏃‍♂️ Available Scripts

- `npm run dev` - Start development servers (frontend + backend)
- `npm run server` - Start backend server only
- `npm run client` - Start frontend dev server only
- `npm run build` - Build frontend for production
- `npm start` - Start production server

## 🗂️ Project Structure

```
clothing-brand-website/
├── src/                    # Frontend source code
│   ├── components/         # Reusable React components
│   ├── contexts/          # React Context providers
│   ├── pages/             # Page components
│   ├── App.jsx            # Main App component
│   ├── main.jsx           # React entry point
│   └── index.css          # Global styles
├── routes/                # Backend API routes
│   ├── auth.js           # Authentication routes
│   ├── products.js       # Product management
│   ├── orders.js         # Order processing
│   ├── categories.js     # Category management
│   └── users.js          # User management
├── server.js             # Express server setup
├── package.json          # Dependencies and scripts
├── vite.config.js        # Vite configuration
├── tailwind.config.js    # Tailwind CSS config
└── README.md            # Project documentation
```

## 🔐 Authentication

The application uses JWT (JSON Web Tokens) for authentication. Users can:

- **Register**: Create new accounts
- **Login**: Sign in with email/password
- **Profile Management**: Update personal information
- **Admin Access**: Special privileges for administrators

### Default Admin Account
- **Email**: admin@stylehub.com
- **Password**: password

## 🛍️ E-commerce Features

### Product Management
- Browse products with filtering and search
- Product categories and tags
- Detailed product pages
- Image galleries and descriptions

### Shopping Cart
- Add/remove items
- Quantity management
- Price calculations
- Persistent cart (localStorage)

### Order Processing
- Complete checkout flow
- Order confirmation
- Order history
- Status tracking

### Admin Features
- Product CRUD operations
- Order management
- User management
- Sales analytics

## 🎨 UI/UX Features

- **Responsive Design**: Works on all device sizes
- **Modern Aesthetics**: Clean, professional design
- **Smooth Animations**: Hover effects and transitions
- **Accessibility**: WCAG compliant components
- **Loading States**: Skeleton loaders and spinners
- **Error Handling**: User-friendly error messages

## 🔧 Development

### Adding New Features

1. **Frontend Components**: Add to `src/components/`
2. **Pages**: Add to `src/pages/` and update routing
3. **API Routes**: Add to `routes/` directory
4. **Styling**: Use Tailwind CSS classes

### Database Integration

Currently using in-memory storage. To integrate with a database:

1. Install database driver (MongoDB, PostgreSQL, etc.)
2. Update route handlers to use database queries
3. Add database connection configuration
4. Implement data models/schemas

## 🚀 Deployment

### Frontend Deployment
```bash
npm run build
# Deploy the 'dist' folder to your hosting service
```

### Backend Deployment
```bash
npm start
# Deploy to services like Heroku, Vercel, or AWS
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support or questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Happy Coding! 🎉** 