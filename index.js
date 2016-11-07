// load modules
var express = require('express');
var hbs = require('express-handlebars');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var mongoose = require('mongoose');
var passport = require('passport');

// load .env
require('dotenv').config();

// create app
var app = express();
var PORT = process.env.PORT || 8081;

// setup cookieParser and bodyParser middleware
// before our routes that depend on them
app.use(cookieParser());

// set cookieSecret in .env
app.use(session({
    secret: process.env.cookieSecret,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    },
    resave: false,
    saveUninitialized: true,
    // add session store
    store: new MongoStore({
      url: process.env.DB_URL
    })
  }
));

// attach req.session.flash to res.locals
app.use(function(req, res, next) {
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});

// init handlebars
app.engine('handlebars', hbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// add form fields to req.body, i.e. req.body.username
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// connect to database
mongoose.connect(process.env.DB_URL);

var options = {};
var auth = require('./lib/auth')(app, options);
auth.init(); // setup middleware
auth.registerRoutes();

// home page
app.get('/', function(req, res) {
  if (req.user) {
   return res.render('view', {
     msg: req.user.treats.join(',')
   }); 
  }
  return res.render('view', {
    msg: 'No treats.'
  });
});

app.post('/candy', function(req, res) {
  var User = require('./models/user');
  User.findByIdAndUpdate(req.user._id, {$push: {treats: req.body.treat}}, function(err, user) {
    if (err) {
      return res.status('500').json({
        status: 'error'
      });
    }
    return res.json(user.treats);
  });
                         
});

app.get('/treat', function(req, res) {
  req.session.treat = 'candy corn';
  req.session.flash = {
    type: 'positive',
    header: 'You got a treat',
    body: 'The treat is ' + req.session.treat
  };
//  req.cookie('treat', 'candy corn', {
//    httpOnly: true,
//    signed: true
//  });
  res.redirect('/');
});

app.get('/clear', function(req, res) {
//  res.clearCookie('treat');
  delete req.session.treat;
  req.session.flash = {
    type: 'negative',
    header: 'No treat',
    body: 'Your bag is empty'
  };
  res.redirect('/');
});


// start server
app.listen(PORT, function() {
  console.log('listening on port ', PORT);
});