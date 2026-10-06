const express = require("express");
const store = require("../db/store");

const router = express.Router();

// GET /users — list every user
router.get("/", (req, res) => {
  res.json(store.getAllUsers());
});

// GET /users/:id — fetch a single user, or 404 if it doesn't exist
router.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  const user = store.getUserById(id);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json(user);
});

// POST /users — create a user; name and email are required
router.post("/", (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "name and email are required" });
  }

  const user = store.createUser({ name, email });
  res.status(201).json(user);
});

// A deliberately loose check: something@something.something, no spaces.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Checks a user payload and returns a list of problems, one per bad field.
// An empty list means the input is valid.
function validateUserInput(body) {
  const errors = [];
  const { name, email } = body;

  if (name === undefined || name === null) {
    errors.push("name is required");
  } else if (typeof name !== "string" || name.trim() === "") {
    errors.push("name must be a non-empty string");
  }

  if (email === undefined || email === null) {
    errors.push("email is required");
  } else if (typeof email !== "string" || email.trim() === "") {
    errors.push("email must be a non-empty string");
  } else if (!EMAIL_PATTERN.test(email.trim())) {
    errors.push("email must be a valid email address");
  }

  return errors;
}

// PUT /users/:id — replace a user's name and email; both are required
router.put("/:id", (req, res) => {
  const id = Number(req.params.id);
  const errors = validateUserInput(req.body);

  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join("; "), errors });
  }

  const name = req.body.name.trim();
  const email = req.body.email.trim();
  const user = store.updateUser(id, { name, email });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json(user);
});

module.exports = router;
