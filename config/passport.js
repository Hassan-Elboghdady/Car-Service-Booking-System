const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/User');

// Only initialize Google strategy if credentials are available
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            // Link Google ID and update provider if not already done
            let changed = false;
            if (!user.googleId) { user.googleId = profile.id; changed = true; }
            if (user.authProvider === 'local') { user.authProvider = 'google'; changed = true; }
            if (changed) await user.save();
            return done(null, user);
          }

          user = await User.create({
            googleId: profile.id,
            authProvider: 'google',
            firstName: profile.name.givenName || '',
            lastName: profile.name.familyName || '',
            email: profile.emails[0].value,
            profileImage: profile.photos[0]?.value || '',
            phone: '01000000000',
            password: Math.random().toString(36).slice(-12),
            role: 'customer',
            profileCompleted: false,
          });

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
} else {
  console.warn('⚠️  Google OAuth credentials not found in environment variables. OAuth login will be unavailable.');
}

// Only initialize Facebook strategy if credentials are available
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: process.env.FACEBOOK_CALLBACK_URL,
        profileFields: ['id', 'name', 'emails', 'photos'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;

          let user = null;
          if (email) {
            user = await User.findOne({ email: email.toLowerCase() });
          } else {
            user = await User.findOne({ facebookId: profile.id });
          }

          if (user) {
            // Link Facebook ID and update provider if not already done
            let changed = false;
            if (!user.facebookId) { user.facebookId = profile.id; changed = true; }
            if (user.authProvider === 'local') { user.authProvider = 'facebook'; changed = true; }
            if (changed) await user.save();
            return done(null, user);
          }

          user = await User.create({
            facebookId: profile.id,
            authProvider: 'facebook',
            firstName: profile.name?.givenName || '',
            lastName: profile.name?.familyName || '',
            email: email || `${profile.id}@facebook.com`,
            profileImage: profile.photos && profile.photos[0] ? profile.photos[0].value : '',
            phone: '01000000000',
            password: Math.random().toString(36).slice(-12),
            role: 'customer',
            profileCompleted: false,
          });

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
} else {
  console.warn('⚠️  Facebook OAuth credentials not found in environment variables. Facebook login will be unavailable.');
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;

