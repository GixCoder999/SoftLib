const { User } = require("./Schema");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const ADMIN_USERNAME = "msohaib-adm";
const ADMIN_EMAIL = "msohaib@adm00";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "msohaib-adm-pass";

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
  const authResult = verifyAuthFromRequest(req);
  if (!authResult.authenticated) {
    return res.status(401).json({ error: "Authentication failed" });
  }

  req.user = authResult.user;
  return next();
}

function verifyAuthFromRequest(req) {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return { authenticated: false, error: "No token provided" };
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    return { authenticated: true, user: decoded };
  } catch (error) {
    return { authenticated: false, error: "Authentication failed" };
  }
}

function isAdminIdentity(user) {
  if (!user) {
    return false;
  }
  return user.username === ADMIN_USERNAME && user.email === ADMIN_EMAIL;
}

async function adminMiddleware(req, res, next) {
  const authResult = verifyAuthFromRequest(req);
  if (!authResult.authenticated) {
    return res.status(401).json({ error: "Authentication failed" });
  }

  const user = await User.findById(authResult.user.userId).select("username email").lean();
  if (!user || !isAdminIdentity(user)) {
    return res.status(403).json({ error: "Admin access required" });
  }

  req.user = authResult.user;
  req.admin = user;
  return next();
}

async function ensureAdminUser() {
  const existingAdmin = await User.findOne({
    $or: [{ username: ADMIN_USERNAME }, { email: ADMIN_EMAIL }],
  });

  if (existingAdmin) {
    let shouldSave = false;
    if (existingAdmin.username !== ADMIN_USERNAME) {
      existingAdmin.username = ADMIN_USERNAME;
      shouldSave = true;
    }
    if (existingAdmin.email !== ADMIN_EMAIL) {
      existingAdmin.email = ADMIN_EMAIL;
      shouldSave = true;
    }
    const isCurrentPasswordValid = await bcrypt.compare(
      ADMIN_PASSWORD,
      existingAdmin.passwordHash || ""
    );
    if (!isCurrentPasswordValid) {
      existingAdmin.passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
      shouldSave = true;
    }

    if (shouldSave) {
      await existingAdmin.save();
    }
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await User.create({
    username: ADMIN_USERNAME,
    email: ADMIN_EMAIL,
    passwordHash,
  });
}

module.exports = {
  registerUser,
  loginUser,
  authMiddleware,
  verifyAuthFromRequest,
  adminMiddleware,
  ensureAdminUser,
  isAdminIdentity,
};
