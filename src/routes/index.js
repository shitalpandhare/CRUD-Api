const express = require("express");
const router = express.Router();

const {
  getAllUsers,
  getUserDetails,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/users.js");
router.get("/api/users", getAllUsers);
router.get("/api/users/:id", getUserDetails);

router.post("/api/users", createUser);
router.put("/api/users/:id", updateUser);
router.delete("/api/users/:id", deleteUser);
router.use((req, res, next) => {
  res.status(404).json({ error: "Route Not found" });
});
module.exports = router;
