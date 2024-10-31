const User = require("../models/UsersShema");
const jwt = require("jsonwebtoken");

require("dotenv").config();

const secret = process.env.JWT_SECRET;

const sendVerificationEmail = require("../utils/emailService");

// Register a new user
const registerUser = async (email, password) => {
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error("Email in use");
  }

  const verificationToken = await sendVerificationEmail(email);

  const user = new User({
    email,
    password,
    verificationToken: verificationToken,
  });
  user.setPassword(password);

  const token = jwt.sign({ email }, secret, { expiresIn: "1h" });

  user.token = token;

  await user.save();
  return user;
};

// Login a user
const loginUser = async (email, password) => {
  const user = await User.findOne({ email: email });

  if (!user || !user.validPassword(password)) {
    throw new Error("Email or password is wrong");
  }

  if (!user.verify) {
    throw new Error("Verify your email to confirm registration...!");
  }

  const payload = { id: user._id, email: user.email };
  console.log(payload);

  const token = jwt.sign(payload, secret, {
    expiresIn: "1h",
  });

  user.token = token;
  await user.save();

  return { token, user };
};

// Get user by ID
const getUserById = async (userId) => {
  return await User.findById(userId);
};

// Logout user
const logoutUser = async (userId) => {
  const loggedOutUser = await User.findByIdAndUpdate(
    userId,
    { $set: { token: null } }, // Set the token field to null
    { new: true }
  );

  return loggedOutUser;
};

const updateUser = async (userId, fields) => {
  try {
    const user = await User.findOne({ _id: userId });

    if (!user) {
      throw new Error(`User with id ${userId} not exists!`);
    }

    return await User.findByIdAndUpdate({ _id: userId }, fields, {
      new: true,
    });
  } catch (error) {
    console.log(error.message);
    throw error;
  }
};

// Update user subscription
const updateSubscription = async (userId, { subscription }) => {
  const isValidSubscription = (subscription) => {
    const validSubscriptions = ["starter", "pro", "business"];
    return validSubscriptions.includes(subscription);
  };

  if (!isValidSubscription(subscription)) {
    throw new Error("Invalid subscription type");
  }

  const updatedSubscriptionUser = await User.findByIdAndUpdate(
    userId,
    { $set: { subscription: subscription } },
    { new: true }
  );

  console.log(updatedSubscriptionUser);

  return updatedSubscriptionUser;
};

const verifyUserEmail = async (verificationToken) => {
  const updates = {
    verify: true,
    verificationToken: null,
  };

  try {
    const user = await User.findOne({ verificationToken });
    if (!user) {
      throw new Error("Invalid or expired verification token.");
    }

    if (user.verify) {
      throw new Error("Verification has already been passed");
    }

    const updatedUser = await User.findOneAndUpdate(
      { verificationToken }, // Cast to string to ensure type
      { $set: updates },
      { new: true }
    );

    return updatedUser; // Optionally return the result if needed elsewhere
  } catch (error) {
    console.error("Error verifying user email:", error.message);
    throw error; // Re-throw the error to be handled by caller if needed
  }
};

const resendVerificationEmail = async (email) => {
  const user = await User.findOne({ email: email });
  console.log(user);

  if (!user) {
    throw new Error("User not found");
  }

  if (user.verify) {
    throw new Error("Verification has already been passed");
  }

  try {
    // Generate a new verification token if the user is unverified and resend email
    const verificationToken = await sendVerificationEmail(user.email);
    user.verificationToken = verificationToken;

    await user.save();
  } catch (error) {
    throw new Error(
      `Failed to send verification email. Error: ${error.message}`
    );
  }

  return { message: "Verification email sent" };
};

module.exports = {
  registerUser,
  loginUser,
  getUserById,
  logoutUser,
  updateUser,
  updateSubscription,
  verifyUserEmail,
  resendVerificationEmail,
};
