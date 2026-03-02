const { User } = require("./Schema");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

async function registerUser(username, email, password) {
  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return {
        success: false,
        status: 409,
        error: "Username or email already exists",
      };
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, passwordHash });
    await newUser.save();
    return {
      success: true,
      status: 201,
      message: "User registered successfully",
    };
  } catch (error) {
    return {
      success: false,
      status: 500,
      error: error.message || "Failed to register user",
    };
  }
}

async function loginUser(usernameOrEmail, password) {
  try {
    const user = await User.findOne({
      $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
    });
    if (!user) {
      return {
        success: false,
        status: 401,
        error: "Invalid username/email or password",
      };
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return {
        success: false,
        status: 401,
        error: "Invalid username/email or password",
      };
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "1h",
    });
    return {
      success: true,
      status: 200,
      message: "Login successful",
      token,
    };
  } catch (error) {
    return {
      success: false,
      status: 500,
      error: error.message || "Failed to login user",
    };
  }
}

function authMiddleware(req, res, next) {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    console.error("Authentication error:", error.message);
    return res.status(401).json({ error: "Authentication failed" });
  }
}

module.exports = { registerUser, loginUser, authMiddleware };
