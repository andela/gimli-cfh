const mongoose = require('mongoose'),
  LocalStrategy = require('passport-local').Strategy,
  TwitterStrategy = require('passport-twitter').Strategy,
  FacebookStrategy = require('passport-facebook').Strategy,
  GitHubStrategy = require('passport-github').Strategy,
  GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
  User = mongoose.model('User'),
  config = require('./config'),
  passportJWT = require('passport-jwt'),
  ExtractJwt = passportJWT.ExtractJwt,
  JwtStrategy = passportJWT.Strategy;


module.exports = (passport) => {
// Serialize sessions
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    User.findOne({
      _id: id
    }, (err, user) => {
      user.email = null;
      user.facebook = null;
      user.hashed_password = null;
      done(err, user);
    });
  });

// use jwt strategy
  const jwtOptions = {};
  jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeader();
  jwtOptions.secretOrKey = process.env.TOKENSECRET;

  passport.use(new JwtStrategy(jwtOptions,
(jwtPayload, next) => {
// usually this would be a database call:
  const user = User.findOne({ email: jwtPayload.email });
  if (user) {
    next(null, user);
  } else {
    next(null, false);
  }
}
));

// Use local strategy
  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  },
(email, password, done) => {
  User.findOne({
    email
  }, (err, user) => {
    if (err) {
      return done(err);
    }
    if (!user) {
      return done(null, false, {
        message: 'Unknown user'
      });
    }
    if (!user.authenticate(password)) {
      return done(null, false, {
        message: 'Invalid password'
      });
    }
    user.email = null;
    user.hashed_password = null;
    return done(null, user);
  });
}
));

// Use twitter strategy
  passport.use(new TwitterStrategy({
    consumerKey: process.env.TWITTER_CONSUMER_KEY || config.twitter.clientID,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET
  || config.twitter.clientSecret,
    callbackURL: 'http://localhost:3000/auth/twitter/callback'
  || config.twitter.callbackURL
  },
(token, tokenSecret, profile, done) => {
  User.findOne({
    'twitter.id_str': profile.id
  }, (err, user) => {
    if (err) {
      return done(err);
    }
    if (!user) {
      user = new User({
        name: profile.displayName,
        username: profile.username,
        provider: 'twitter',
        twitter: profile._json
      });
      user.save((err) => {
        if (err) return done(err, user);
      });
    } else {
      return done(err, user);
    }
  });
}
));

// Use facebook strategy
  passport.use(new FacebookStrategy({
    clientID: process.env.FB_CLIENT_ID || config.facebook.clientID,
    clientSecret: process.env.FB_CLIENT_SECRET || config.facebook.clientSecret,
    callbackURL: 'http://localhost:3000/auth/facebook/callback'
 || config.facebook.callbackURL
  },
  (accessToken, refreshToken, profile, done) => {
    User.findOne({
      'facebook.id': profile.id
    }, (err, user) => {
      if (err) {
        return done(err);
      }
      if (!user) {
        user = new User({
          name: profile.displayName,
          email: (profile.emails && profile.emails[0].value) || '',
          username: profile.username,
          provider: 'facebook',
          facebook: profile._json
        });
        user.save((err) => {
          if (err) { user.facebook = null; }
          return done(err, user);
        });
      } else {
        user.facebook = null;
        return done(err, user);
      }
    });
  }
));

// Use github strategy
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID || config.github.clientID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET
  || config.github.clientSecret,
    callbackURL: 'http://localhost:3000/auth/github/callback'
  || config.github.callbackURL
  },
(accessToken, refreshToken, profile, done) => {
  User.findOne({
    'github.id': profile.id
  }, (err, user) => {
    if (err) {
      return done(err);
    }
    if (!user) {
      user = new User({
        name: profile.displayName,
        email: profile.emails[0].value,
        username: profile.username,
        provider: 'github',
        github: profile._json
      });
      user.save((err) => {
        if (err) return done(err, user);
      });
    } else {
      return done(err, user);
    }
  });
}
));

// Use google strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || config.google.clientID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET
  || config.google.clientSecret,
    callbackURL: 'http://localhost:3000/auth/google/callback'
  || config.google.callbackURL
  },
(accessToken, refreshToken, profile, done) => {
  User.findOne({
    'google.id': profile.id
  }, (err, user) => {
    if (err) {
      return done(err);
    }
    if (!user) {
      user = new User({
        name: profile.displayName,
        email: profile.emails[0].value,
        username: profile.username,
        provider: 'google',
        google: profile._json
      });
      user.save((err) => {
        if (err) { return done(err, user); }
      });
    } else {
      return done(err, user);
    }
  });
}
));
};
