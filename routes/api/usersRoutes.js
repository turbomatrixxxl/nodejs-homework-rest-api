const express = require("express");
const authController = require("../../controllers/usersControllers");
const { authMiddleware } = require("../../middlewares/authMiddleware");

const upload = require("../../middlewares/multer");

const router = express.Router();

router.post("/users/signup", authController.register);
router.post("/users/login", authController.login);
router.post("/users/logout", authMiddleware, authController.logout);
router.get("/users/current", authMiddleware, authController.getCurrentUser);
router.patch("/users", authMiddleware, authController.updateSubscription);
router.patch(
  "/users/avatar",
  authMiddleware,
  upload.single("avatar"),
  authController.updateUseravatar
);

module.exports = router;
