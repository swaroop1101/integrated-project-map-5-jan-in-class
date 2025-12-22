import express from "express";
import { InterviewSession } from "../models/InterviewSession.js";
import { verifyToken } from "../../middleware/verifytoken.js";

const router = express.Router();

// ✅ START INTERVIEW SESSION
router.post("/start", verifyToken, async (req, res) => {
  try {
    const { companyType, role } = req.body;

    if (!companyType || !role) {
      return res.status(400).json({ message: "companyType and role are required" });
    }

    const session = await InterviewSession.create({
      user: req.userId,
      companyType,
      role,
      status: "started",
      startedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      sessionId: session._id,
    });
  } catch (err) {
    console.error("Start interview error:", err);
    res.status(500).json({ message: "Failed to start interview session" });
  }
});

// ✅ COMPLETE INTERVIEW SESSION
router.patch("/complete/:sessionId", verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { reportUrl } = req.body;

    if (!reportUrl) {
      return res.status(400).json({ message: "Report URL is required" });
    }

    const session = await InterviewSession.findOne({
      _id: sessionId,
      user: req.userId,
    });

    if (!session) {
      return res.status(404).json({ message: "Interview session not found" });
    }

    session.reportUrl = reportUrl;
    session.status = "completed";
    session.endedAt = new Date();

    await session.save();

    res.json({
      success: true,
      message: "Interview session updated",
    });
  } catch (err) {
    console.error("Complete interview error:", err);
    res.status(500).json({ message: "Failed to update interview session" });
  }
});

// GET all interviews for logged-in user
router.get("/my", verifyToken, async (req, res) => {
  try {
    const interviews = await InterviewSession.find({ user: req.userId })
      .sort({ startedAt: -1 });

    res.json({
      success: true,
      interviews,
    });
  } catch (err) {
    console.error("Fetch interviews error:", err);
    res.status(500).json({ message: "Failed to fetch interviews" });
  }
});


export default router;
