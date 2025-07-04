const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const router = express.Router();

// Configure your email transport (use your real credentials in production)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // your email
    pass: process.env.EMAIL_PASS  // your email password or app password
  }
});

// Send verification email
async function sendVerificationEmail(user, token) {
  const url = `${BASE_URL}/verify-email?token=${token}`;
  await transporter.sendMail({
    to: user.email,
    subject: 'Verify your email',
    html: `<p>Click <a href="${url}">here</a> to verify your email.</p>`
  });
}

// Send password reset email
async function sendResetEmail(user, token) {
  const url = `${BASE_URL}/reset-password?token=${token}`;
  await transporter.sendMail({
    to: user.email,
    subject: 'Reset your password',
    html: `<p>Click <a href="${url}">here</a> to reset your password.</p>`
  });
}

router.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json("User already exists");
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const newUser = new User({ email, password: hashedPassword, verificationToken, verified: false });
    await newUser.save();
    await sendVerificationEmail(newUser, verificationToken);
    res.json({ message: 'Signup successful. Please check your email to verify your account.' });
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Email verification endpoint
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;
  try {
    const user = await User.findOne({ verificationToken: token });
    if (!user) return res.status(400).json('Invalid or expired verification token');
    user.verified = true;
    user.verificationToken = undefined;
    await user.save();
    res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Forgot password endpoint
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json('User not found');
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    await user.save();
    await sendResetEmail(user, resetToken);
    res.json({ message: 'Password reset email sent. Please check your inbox.' });
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Reset password endpoint
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  try {
    const user = await User.findOne({ resetPasswordToken: token });
    if (!user) return res.status(400).json('Invalid or expired reset token');
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    await user.save();
    res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Prevent login if not verified
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json("User not found");
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json("Invalid credentials");
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ token, user: { id: user._id, email: user.email } });
  } catch (err) {
    res.status(500).json(err.message);
  }
});

module.exports = router;
