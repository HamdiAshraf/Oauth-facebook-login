// Import required modules
const express = require('express');
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const session = require('express-session');
const User = require('./models/User'); // Your user model
const dotenv = require('dotenv');

// Load environment variables from a .env file
dotenv.config();

// Initialize Express app
const app = express();
const PORT = 3000;

// Set up view engine and middleware
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

// Express session setup
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Configure Passport with Facebook strategy
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: process.env.FACEBOOK_CALLBACK_URL,
    profileFields: ['id', 'email', 'name', 'photos']
}, (accessToken, refreshToken, profile, done) => {
    // Check if user exists in the database
    User.findOne({ 'facebookId': profile.id }, (err, user) => {
        if (err) {
            return done(err);
        }
        if (user) {
            return done(null, user); // User found, return user
        } else {
            // Create new user if not found
            const newUser = new User({
                facebookId: profile.id,
                name: profile.displayName,
                email: profile.emails[0].value,
                photo: profile.photos[0].value
            });
            newUser.save((err) => {
                if (err) {
                    return done(err);
                }
                return done(null, newUser);
            });
        }
    });
}));

// Serialize and deserialize user for session management
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user);
    });
});

// Routes

// Home route
app.get('/', (req, res) => {
    res.render('index', { user: req.user });
});

// Facebook authentication route
app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));

// Facebook authentication callback route
app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
        successRedirect: '/profile',
        failureRedirect: '/'
    })
);

// Profile route (accessible after authentication)
app.get('/profile', isLoggedIn, (req, res) => {
    res.render('profile', { user: req.user });
});

// Logout route
app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

// Middleware to check if user is authenticated
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
