const jwt = require("jsonwebtoken");

const {
  registerUser,
  getUserById,
  loginUser,
  logoutUser,
  updateUser,
  updateSubscription,
  verifyUserEmail,
  resendVerificationEmail,
} = require("../services/userServices");

const { validateUser } = require("../middlewares/validationMiddleware");

const bCrypt = require("bcryptjs");

const fs = require("fs").promises;
const path = require("path");

const { Jimp } = require("jimp");

const Joi = require("joi");

require("dotenv").config();
const secret = process.env.JWT_SECRET;

exports.register = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const newUser = await registerUser(email, password);
    // console.log(newUser);

    res.status(201).json({
      user: {
        email: newUser.email,
        subscription: newUser.subscription,
        avatarURL: newUser.avatarURL,
        token: newUser.token,
        verificationToken: newUser.verificationToken,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
    next(error);
  }
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  const { error } = validateUser.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.message });
  }
  try {
    const user = await loginUser(email, password);

    res.status(200).json({
      token: user.token,
      user: {
        email: user.user.email,
        subscription: user.user.subscription,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.logout = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    // console.log(authHeader);

    if (!authHeader) {
      // Dacă antetul "Authorization" lipsește, returnați o eroare de autentificare
      return res
        .status(401)
        .json({ status: "error", message: "Missing Authorization header" });
    }

    // Extrageți token-ul eliminând prefixul "Bearer "
    const token = authHeader.split(" ")[1];
    // console.log(token);

    // Verificați token-ul utilizând cheia secretă
    const user = jwt.verify(token, secret);
    // console.log(user);

    const userId = user.id;

    // Continuați cu logica dvs. pentru a găsi utilizatorul și a trimite răspunsul
    const result = await logoutUser(userId);

    if (result) {
      res.status(204).json({ message: "Logged out", data: result });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
    next(error);
  }
};

exports.getCurrentUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    // console.log(authHeader);

    if (!authHeader) {
      // Dacă antetul "Authorization" lipsește, returnați o eroare de autentificare
      return res
        .status(401)
        .json({ status: "error", message: "Missing Authorization header" });
    }

    // Extrageți token-ul eliminând prefixul "Bearer "
    const token = authHeader.split(" ")[1];
    // console.log(token);

    // Verificați token-ul utilizând cheia secretă
    const user = jwt.verify(token, secret);
    // console.log(user);

    const userId = user.id;

    // Continuați cu logica dvs. pentru a găsi utilizatorul și a trimite răspunsul
    const result = await getUserById(userId);
    // console.log(result);
    if (result) {
      res.status(200).json({
        status: "success",
        code: 200,
        data: { email: result.email, subscription: result.subscription },
      });
    } else {
      // Returnați o eroare 404 sau 401 în funcție de situație
      res.status(404).json({ status: "error", message: "User not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: "error", message: "Server error" });
    next(error);
  }
};

exports.updateUserInfo = async (req, res, next) => {
  const { userId } = req.params; // Get userId from params
  const { email, password } = req.body;

  try {
    // Hash the password if a new password is provided
    const updateFields = { email };

    if (password) {
      const hashedPassword = bCrypt.hashSync(password, bCrypt.genSaltSync(10));
      updateFields.password = hashedPassword;
    }

    // Call the service to update user information
    const updatedUser = await updateUser(userId, updateFields);

    if (!updatedUser) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // If the update is successful, return the updated user data
    res.status(200).json({
      status: "success",
      code: 200,
      data: { user: updatedUser },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
    next(error);
  }
};

exports.updateSubscription = async (req, res) => {
  const { subscription } = req.body;
  //   console.log(subscription);

  try {
    const authHeader = req.headers.authorization;
    // console.log(authHeader);

    if (!authHeader) {
      // Dacă antetul "Authorization" lipsește, returnați o eroare de autentificare
      return res
        .status(401)
        .json({ status: "error", message: "Missing Authorization header" });
    }

    // Extrageți token-ul eliminând prefixul "Bearer "
    const token = authHeader.split(" ")[1];
    // console.log(token);

    // Verificați token-ul utilizând cheia secretă
    const user = jwt.verify(token, secret);
    // console.log(user);

    const { id, email } = user;
    // console.log(id);

    // Continuați cu logica dvs. pentru a găsi utilizatorul și a trimite răspunsul
    const updatedUser = await updateSubscription(id, { subscription });
    // console.log(updatedUser);

    res.status(200).json({
      email: email,
      subscription: updatedUser.subscription,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateUseravatar = async (req, res) => {
  try {
    const tempDir = path.join(__dirname, "../temp");

    // Create the directory if it doesn't exist
    await fs.mkdir(tempDir, { recursive: true });

    const avatarsDir = path.join(__dirname, "../public/avatars");
    // console.log(avatarsDir);

    // Create the directory if it doesn't exist
    await fs.mkdir(avatarsDir, { recursive: true });

    if (!req.file) {
      return res.status(404).json({ error: "There is no file to upload!" });
    }

    // console.log(req.user.avatarURL);

    // Generate unique filename
    const uniqFilename = `${req.user._id}-${Date.now()}${path.extname(
      req.file.originalname
    )}`;
    // console.log(uniqFilename);

    const imagePath = req.file.path;
    // console.log(imageName);

    const tempPath = path.join(tempDir, uniqFilename);

    // Move file to avatars directory
    await fs.rename(imagePath, tempPath);

    // Resize the image
    const image = await Jimp.read(`${tempPath}`);
    // console.log(image);

    // Resize the image to width 250 and heigth 250.
    image.resize({ w: 250, h: 250 });

    // Save and overwrite the image
    await image.write(tempPath);

    const destinationPath = path.join(avatarsDir, uniqFilename);

    // Move file to avatars directory
    await fs.rename(tempPath, destinationPath);

    const updateFields = {};

    // Update user avatar URL
    const newAvatarURL = `/avatars/${uniqFilename}`;
    const userId = req.user._id;

    updateFields.avatarURL = newAvatarURL;

    const updatedUser = await updateUser(userId, updateFields);

    res.status(200).json({ avatarUrl: updatedUser.avatarURL });
  } catch (error) {
    console.error("Error in uploading avatar:", error.message);
    res.status(500).json({
      status: "fail",
      code: 500,
      message: error.message,
      data: "Internal Server Error",
    });
  }
};

exports.verifyUserEmail = async (req, res, next) => {
  const { verificationToken } = req.params;

  try {
    await verifyUserEmail(verificationToken);

    res.status(200).json({ message: "User successfully verified", code: 200 });
  } catch (error) {
    res
      .status(404)
      .json({ message: "Error verifying user", error: error.message });
  }
};

exports.handleResendVerificationEmail = async (req, res) => {
  const emailSchema = Joi.object({
    email: Joi.string().email().required(),
  });

  // Validate request body
  const { error } = emailSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: "Email wrong written" });
  }

  console.log(req.body);

  const { email } = req.body;
  // console.log(email);

  if (!email) {
    return res.status(400).json({ message: "Missing required field email" });
  }

  try {
    const response = await resendVerificationEmail(email);
    return res.status(200).json(response);
  } catch (error) {
    if (error.message === "User not found") {
      return res.status(400).json({ message: "User not found" });
    }
    if (error.message === "Verification has already been passed") {
      return res
        .status(400)
        .json({ message: "Verification has already been passed" });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};
