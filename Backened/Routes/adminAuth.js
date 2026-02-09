import express from "express";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../Models/User.js";

const router = express.Router();

router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        console.log("Admin Login Attempt:", { email, passwordReceived: !!password });

        // Try database authentication first
        try {
            const user = await User.findOne({
                $or: [{ email: email.toLowerCase() }, { userId: email }]
            }).select("+password");

            console.log("User found:", user ? { id: user._id, email: user.email, userId: user.userId, role: user.role, hasPassword: !!user.password } : "NOT FOUND");

            if (user) {
                const isPasswordValid = await bcryptjs.compare(password, user.password);
                console.log("Password check:", isPasswordValid);

                if (isPasswordValid) {
                    // Check if user has admin privileges
                    if (user.role !== "admin" && user.role !== "superadmin") {
                        return res.status(403).json({
                            success: false,
                            message: "Access denied - Admin credentials required"
                        });
                    }

                    const token = jwt.sign(
                        { userId: user._id, email: user.email, role: user.role },
                        process.env.JWT_SECRET,
                        { expiresIn: "7d" }
                    );

                    console.log("✅ Admin login successful (database)");
                    return res.status(200).json({
                        success: true,
                        token,
                        user: {
                            name: user.name,
                            email: user.email,
                            role: user.role,
                            userId: user.userId, // ✅ Added userId
                            phone: user.phone    // ✅ Added phone
                        }
                    });
                }
            }
        } catch (dbError) {
            console.warn("⚠️ Database authentication failed:", dbError.message);
            console.log("Attempting fallback authentication...");
        }

        // FALLBACK: Check hardcoded admin credentials from .env
        // This allows admin login even when MongoDB is unavailable
        if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
            if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
                const token = jwt.sign(
                    { userId: "admin-fallback", email: process.env.ADMIN_EMAIL, role: "admin" },
                    process.env.JWT_SECRET,
                    { expiresIn: "7d" }
                );

                console.log("✅ Admin login successful (fallback .env credentials)");
                return res.status(200).json({
                    success: true,
                    token,
                    user: {
                        name: "Admin",
                        email: process.env.ADMIN_EMAIL,
                        role: "admin"
                    }
                });
            }
        }

        console.log("❌ Login failed: Invalid credentials");
        return res.status(401).json({ success: false, message: "Invalid admin credentials" });

    } catch (error) {
        console.error("Admin login error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

export default router;
