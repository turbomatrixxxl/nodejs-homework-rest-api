const express = require("express");
const logger = require("morgan");

const passport = require("./passport/passportConfig");

const cors = require("cors");
const corsOptions = require("./cors");

const usersRouter = require("./routes/api/usersRoutes");
const contactsRouter = require("./routes/api/contactsRoutes");

const path = require("path");

const sgMail = require("@sendgrid/mail");
require("dotenv").config();

const sendGridApiKey = process.env.SENDGRID_API_KEY;
if (!sendGridApiKey) throw new Error("SendGrid API key is missing.");

sgMail.setApiKey(sendGridApiKey);

const app = express();

const formatsLogger = app.get("env") === "development" ? "dev" : "short";

app.use(logger(formatsLogger));
app.use(cors(corsOptions));
app.use(express.json());
// app.use(logger("tiny"));

app.use(express.static(path.join(__dirname, "public")));

app.use("/api", usersRouter);
app.use("/api", contactsRouter);

app.use(passport.initialize());

app.use((_, res, __) => {
  res.status(404).json({
    status: "error",
    code: 404,
    message: "Use api on routes: /api/users or /api/contacts ",
    data: "Not found",
  });
});

app.use((err, _, res, __) => {
  console.log(err.stack);
  res.status(500).json({
    status: "fail",
    code: 500,
    message: err.message,
    data: "Internal Server Error",
  });
});

module.exports = app;
