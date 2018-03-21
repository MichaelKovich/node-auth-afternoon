const express = require('express');
const session = require('express-session');
const passport = require('passport');
const Auth0Strategy = require('passport-auth0');

const students = require(`${__dirname}/students.json`);
require('dotenv').config();

const strategy = require(`${__dirname}/strategy`);
const {DOMAIN, CLIENT_ID, CLIENT_SECRET} = process.env;

const app = express();

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));

// We now need to initialize passport and configure it to use sessions.
// Invoke the use method off of the app object.
// Pass in as an argument the passport variable from the top of the index.js file.
// passport is an object with methods that we'll use. Invoke the initialize method off of the passport object.
// On the next line, invoke the use method off of the app object again.
// Pass in as an argument the passport and invoke the session method.

app.use(passport.initialize());
app.use(passport.session());

passport.use(new Auth0Strategy(
  {
    domain: DOMAIN,
    clientID: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    callbackURL: '/login',
    scope: 'openid email profile',
  },
  (accessToken, refreshToken, extraParams, profile, done) => done(null, profile),
  // accessToken is the token to call Auth0 API (not needed in the most cases)
  // extraParams.id_token has the JSON Web Token
  // profile has all the information from the user
));

passport.serializeUser((user, done) =>
  done({clientID: user.id, email: user._json.email, name: user._json.name}));
passport.deserializeUser((obj, done) => done(null, obj));

app.get(
  '/login',
  passport.authenticate('auth0', {
    successRedirect: '/students',
    failureRedirect: '/login',
    connection: 'github',
  }),
);

const authenticated = (req, res, next) => {
  if (req.user) {
    next();
  } else {
    res.sendStatus(401);
  }
};

app.get('/students', authenticated, (req, res, next) => {
  res.status(200).send(students);
});

const port = 3001 || process.env.PORT;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
