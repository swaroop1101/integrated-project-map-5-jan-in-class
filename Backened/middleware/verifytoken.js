// import jwt from "jsonwebtoken";

// export const verifyToken = (req, res, next) => {
//   const token = req.cookies.token;

//   if (!token) {
//     return res
//       .status(401)
//       .json({ success: false, message: "Unauthorized - no token provided" });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     if (!decoded || !decoded.id) {
//       return res
//         .status(401)
//         .json({ success: false, message: "Unauthorized - invalid token" });
//     }

//     req.userId = decoded.id; // ✅ FIXED
//     next();
//   } catch (error) {
//     console.log("Error in verifyToken:", error);
//     return res
//       .status(401)
//       .json({ success: false, message: "Invalid or expired token" });
//   }
// };

import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

export const verifyToken = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - no token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - invalid token",
      });
    }

    const user = await User.findById(decoded.id).select("_id");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - user not found",
      });
    }

    req.user = { id: user._id };
    next();
  } catch (error) {
    console.error("verifyToken error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};
