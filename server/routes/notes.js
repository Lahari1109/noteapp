const express = require("express");
const Note = require("../models/Note");
const jwt = require("jsonwebtoken");

const router = express.Router();

const auth = (req, res, next) => {
  try {
    const token = req.header("x-auth-token");
    if (!token) return res.status(401).json("No auth token");
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified.id;
    next();
  } catch (err) {
    res.status(401).json("Token verification failed");
  }
};

router.get("/", auth, async (req, res) => {
  const notes = await Note.find({ userId: req.user });
  res.json(notes);
});

router.post("/", auth, async (req, res) => {
  // Color palette
  const palette = [
    '#f6d365', // yellow
    '#a770ef', // purple
    '#fd6e6a', // red
    '#42e695', // green
    '#43cea2', // teal
    '#f7971e', // orange
    '#2b86c5', // blue
    '#ffb6b9', // pink
    '#6a89cc', // indigo
    '#f8ffae'  // light yellow
  ];
  let color = req.body.color;
  if (!color) {
    color = palette[Math.floor(Math.random() * palette.length)];
  }
  const note = new Note({ ...req.body, userId: req.user, color });
  await note.save();
  res.json(note);
});

router.put("/:id", auth, async (req, res) => {
  const note = await Note.findOneAndUpdate(
    { _id: req.params.id, userId: req.user },
    req.body,
    { new: true }
  );
  res.json(note);
});

router.delete("/:id", auth, async (req, res) => {
  await Note.findOneAndDelete({ _id: req.params.id, userId: req.user });
  res.json("Note deleted");
});

module.exports = router;
