const express = require("express");
const passport = require("passport");
const router = express.Router();

// Use environment variables for frontend and backend URLs
const FRONTEND_URL = process.env.REACT_APP_FRONTEND_URL; // Make sure this is set correctly

// Route 1: Start Google Authentication
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Route 2: Handle the callback after Google has authenticated the user
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  function (req, res) {
    res.redirect(FRONTEND_URL); // Redirect to the React frontend
  }
);

// Route 3: Logout the user
router.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    // Redirect to the React frontend after logout
    res.redirect(FRONTEND_URL);
  });
});

// Route 4: Check the currently authenticated user
router.get("/current_user", (req, res) => {
  // Send user data if logged in, otherwise send an empty object
  res.send(req.user || {});
});

module.exports = router;
