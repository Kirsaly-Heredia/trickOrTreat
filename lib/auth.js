var passport = require('passport');
var LocalStrategy = require('passport-local');
var User = require('../models/user');

module.exports = function (app, options) {
  
  return {
    init: function () {
      
      passport.use( new LocalStrategy(User.authenticate()));
      
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



