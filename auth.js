// backend/auth.js
const express = require('express');
const passport = require('passport');
const router = express.Router();

router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect(FRONTEND_URL); // Assuming your React app runs on port 
  }
);

router.get('/logout', (req, res) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect(FRONTEND_URL);
  });
});

router.get('/current_user', (req, res) => {
  res.send(req.user); // Send the authenticated user to the frontend
});

module.exports = router;
