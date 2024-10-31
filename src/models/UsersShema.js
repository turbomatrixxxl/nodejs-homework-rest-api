const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const gravatar = require("gravatar");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    subscription: {
      type: String,
      enum: ["starter", "pro", "business"],
      default: "starter",
    },
    token: {
      type: String,
      default: null,
    },
    avatarURL: {
      type: String,
      minLength: 2,
    },
    verify: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String || null,
      // required: [true, "Verify token is required"],
    },
  },
  { versionKey: false, timestamps: true }
);

userSchema.methods.setPassword = function (password) {
  this.password = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
};

userSchema.methods.validPassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

userSchema.pre("save", function (next) {
  if (!this.avatarURL) {
    this.avatarURL = gravatar.url(
      this.email,
      { s: 200, r: "pg", d: "identicon" },
      true
    );
  }
  next();
});

const User = mongoose.model("User", userSchema);
module.exports = User;
