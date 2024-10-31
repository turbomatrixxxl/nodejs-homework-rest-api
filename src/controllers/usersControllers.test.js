/* eslint-disable no-undef */
// loginController.test.js
const { login } = require("./usersControllers"); // Adjust the path accordingly
const { loginUser } = require("../services/userServices"); // Adjust the path accordingly
const { validateUser } = require("../middlewares/validationMiddleware"); // Adjust the path accordingly

// Mock the loginUser function and validateUser
jest.mock("../services/userServices");
jest.mock("../middlewares/validationMiddleware");

describe("login controller", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it("should return a token and user details on successful login", async () => {
    const mockUser = {
      token: "testToken",
      user: {
        email: "test@example.com",
        subscription: "premium",
      },
    };

    req.body = {
      email: "test@example.com",
      password: "testPassword",
    };

    validateUser.validate.mockReturnValue({ error: null }); // No validation error
    loginUser.mockResolvedValue(mockUser); // Mock successful login

    await login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      token: mockUser.token,
      user: {
        email: mockUser.user.email,
        subscription: mockUser.user.subscription,
      },
    });
  });

  it("should return a 400 status code for validation error", async () => {
    const validationError = { message: "Invalid email or password" };

    req.body = {
      email: "test@example.com",
      password: "testPassword",
    };

    validateUser.validate.mockReturnValue({ error: validationError }); // Simulate validation error

    await login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: validationError.message });
  });

  it("should return a 500 status code for internal server error", async () => {
    req.body = {
      email: "test@example.com",
      password: "testPassword",
    };

    validateUser.validate.mockReturnValue({ error: null }); // No validation error
    loginUser.mockRejectedValue(new Error("Database error")); // Simulate internal server error

    await login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Database error" });
  });
});
