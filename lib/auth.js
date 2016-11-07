var passport = require('passport');
var LocalStrategy = require('passport-local');
var FacebookStrategy = require('passport-facebook');
var User = require('../models/user');

var fbOptions = {
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:8081/login/facebook/return"
};

function fbCallback(accessToken, refreshToken, profile, cb) {
  // query database for a user that matches this FB profile
  User.findOne({facebookId: progile.id}, function (err, user) {
    if (err) {
      console.log(err);
    }     
    
    // 1. user already is in our database
    if (user) {
      return cb(err, user);
    }
    // 2. create a new user
    var newUser = new User({
      facebookId: profile.id,
      username: profile.first_name
    });
    
    newUser.save(function(err, user){
      if (err) {
        console.log(err);
      } 
      return cb(err, user);
    });
  });
}

module.exports = function (app, options) {
  
  return {
    init: function () {
      
      //this was one strategy...
      passport.use( new LocalStrategy(User.authenticate()));
      
      //here is another
      passport.use(new FacebookStrategy (fbOptions, fbCallback) );  
        
      passport.serializeUser(function (user, done) {
        done(null, user._id);
      });

      passport.deserializeUser(function (id, done) {
        User.findById(id, function (err, user) {
          //handle err
          if (err || !user) return done(err, null);
          done(null, user);
        });
      });
      
        
      app.use(passport.initialize());
      app.use(passport.session());
      
      app.use(function(req, res, next) {
        //add user to res.locals
        //passport adds req.user
        //we can use res.locals.user in our views
        res.locals.user = req.user;
        next();
      });
    },
    
    registerRoutes: function () {
      
      //display signup page
      app.get('/signup', function (req, res){
        res.render('signup', {viewName: 'signup'})
      });
      
      //process signup form data
      app.post('/signup', function (req, res, next) {
        //create new user
        var newUser = new User({username: req.body.username});
        
        //User.register is a function added by passportLocalMongoose
        //It adds salt and hast to the password, then saves to DB
        User.register(newUser, req.body.password, function(err, user) {
          
          //Error
          if (err) {
            console.log('signup error!', err);

            //return flash message to notify user of the error
            return res.render('signup', {
              flash: {
                type: 'negative',
                header: 'Signup Error',
                body: err.message
              },
              viewName: 'signup'//header
            });
          }
          
          //Success!
          //Authenticate with local strategy to sign in the user
          passport.authenticate('local')(req, res, function() {
            req.session.flash = {
              type: 'positive',
              header: 'Registration Success',
              body: 'Welcome, ' + user.username
            }
            res.redirect('/');
          });          
        });
      });
      
      //display login page
      app.get('/login', function (req,res) {
        res.render('signup', {viewName: 'login'});
      });
      
      //process login form data
      app.post('/login', passport.authenticate('local'), function (req, res, next) {
        req.session.flash = {
          type: 'positive',
          header: 'Signed in',
          body: 'Welcome, ' + req.body.username
        };
        
        //redirect home
        res.redirect('/');
      });
      
      //two routes for facebook login
      app.get('/auth/facebook', passport.authenticate('facebook'));
      
      app.get('/auth/facebook/callback', passport.authenticate('facebook', {  failureRedirect: '/login' }),
        function(req, res) {
          res.redirect('/');
        }
      );
      
      
      //logout user (delete session cookie) redirect home
      app.get('/logout', function(req, res) {
        req.logout();
        req.session.flash = {
          type: 'positive',
          header: 'Signed out',
          body: 'Successfully signed out'
        };
        res.redirect('/');
      });
    }
  };
};

