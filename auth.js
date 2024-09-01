const express = require("express");
const passport = require("passport");
const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000"; // Set default for local development

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
    // Successful authentication
    res.redirect(FRONTEND_URL); // Redirect to the React frontend
  }
);

// Route 3: Logout the user
router.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect(FRONTEND_URL); // Redirect to the React frontend
  });
});

// Route 4: Check the currently authenticated user
router.get("/current_user", (req, res) => {
  res.send(req.user || {}); // Send user data if logged in, otherwise send an empty object
});

module.exports = router;
