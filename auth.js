const express = require("express");
const passport = require("passport");
const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect(`${FRONTEND_URL}`); // Redirect to the React frontend
  }
);

router.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("http://localhost:3000");
  });
});

router.get("/current_user", (req, res) => {
  res.redirect({}); // Send user data if logged in, otherwise send an empty object
});

module.exports = router;
