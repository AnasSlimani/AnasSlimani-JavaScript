// create user 
const express = require("express");
const bcrypt = require("bcrypt");
const User = require("./models/user");
const router = express.Router();    

// Register a new user
router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  //hash password before saving
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashedPassword });
  try {
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: "Error registering user" });
  }
});


module.exports = router;