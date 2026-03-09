require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

// Database connection
const { connectDB } = require('./config/database');
connectDB();

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');
const tenantsRouter = require('./routes/tenants');
const apiKeysRouter = require('./routes/apiKeys');
const chatbotRouter = require('./routes/chatbot');
const knowledgeRouter = require('./routes/knowledge');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Middleware
const allowedOrigins = (process.env.CORS_ORIGIN || '*').split(',').map(o => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', indexRouter);
app.use('/api/auth', authRouter);
app.use('/api/tenants', tenantsRouter);
app.use('/api/tenants/api-keys', apiKeysRouter);
app.use('/api/chatbot', chatbotRouter);
app.use('/api/users', usersRouter);
app.use('/api/knowledge', knowledgeRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // Set locals, only providing error in development
  const isDevelopment = req.app.get('env') === 'development';
  
  // If it's an API route, return JSON
  if (req.path.startsWith('/api')) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error',
      ...(isDevelopment && { stack: err.stack, error: err })
    });
  }

  // Otherwise, render error page
  res.locals.message = err.message;
  res.locals.error = isDevelopment ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
