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
      userId: req.userId,        // ✅ FIXED FIELD
      companyType,
      role,
      status: "in-progress",     // ✅ VALID ENUM
      startedAt: new Date(),
      messages: [],              // optional but safe
      solvedProblems: [],        // optional but safe
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
    const { reportUrl, messages, solvedProblems, highlightClips } = req.body;

    if (!reportUrl) {
      return res.status(400).json({ message: "Report URL is required" });
    }

    const session = await InterviewSession.findOne({
      _id: sessionId,
      userId: req.userId, // ⚠️ MUST be userId, not user
    });

    if (!session) {
      return res.status(404).json({ message: "Interview session not found" });
    }

    session.reportUrl = reportUrl;
    session.messages = messages || [];
    session.solvedProblems = solvedProblems || [];
    session.highlightClips = highlightClips || [];
    session.status = "completed";
    session.completedAt = new Date();

    await session.save();

    res.json({
      success: true,
      message: "Interview completed successfully",
    });
  } catch (err) {
    console.error("Complete interview error:", err);
    res.status(500).json({ message: "Failed to complete interview session" });
  }
});



// GET all interviews for logged-in user
router.get("/my", verifyToken, async (req, res) => {
  try {
    const interviews = await InterviewSession.find({
      userId: req.userId,
    })
      .sort({ startedAt: -1 })
      .select(
        "role companyType startedAt completedAt reportUrl messages solvedProblems highlightClips status"
      );

    res.json({
      success: true,
      interviews,
    });
  } catch (err) {
    console.error("Fetch interviews error:", err);
    res.status(500).json({ message: "Failed to fetch interviews" });
  }
});



router.get("/:sessionId", verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await InterviewSession.findOne({
      _id: sessionId,
      userId: req.userId,
    });

    if (!session) {
      return res.status(404).json({ message: "Interview session not found" });
    }

    res.json({
      success: true,
      session,
    });
  } catch (err) {
    console.error("Fetch session error:", err);
    res.status(500).json({ message: "Failed to fetch interview session" });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const session = await InterviewSession.findOne({
      _id: req.params.id,
      userId: req.userId, // IMPORTANT: ownership check
    });

    if (!session) {
      return res.status(404).json({ success: false, message: "Interview not found" });
    }

    await session.deleteOne();

    return res.json({ success: true });
  } catch (err) {
    console.error("Delete interview failed:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ ADMIN: get all interview sessions for a user
router.get("/admin/user/:userId", async (req, res) => {
  try {
    const sessions = await InterviewSession.find({
      userId: req.params.userId
    })
      .sort({ startedAt: -1 })
      .select(
        "companyType role status startedAt completedAt reportUrl messages solvedProblems highlightClips"
      )
      .lean();

    res.json({
      success: true,
      interviews: sessions
    });
  } catch (err) {
    console.error("Admin interview fetch error:", err);
    res.status(500).json({ message: "Failed to fetch interviews" });
  }
});

// ✅ ADMIN: GLOBAL INTERVIEW STATS
router.get("/admin/stats", async (req, res) => {
  try {
    const sessions = await InterviewSession.find({}).select(
      "status companyType messages solvedProblems highlightClips"
    );

    const stats = {
      total: sessions.length,
      completed: 0,
      inProgress: 0,
      startup: 0,
      service: 0,
      product: 0,

      // 🔥 NEW GLOBAL COUNTS
      totalMessages: 0,
      totalProblems: 0,
      totalClips: 0,
    };

    sessions.forEach(s => {
      // status
      if (s.status === "completed") stats.completed++;
      else stats.inProgress++;

      // company type
      const type = s.companyType?.toLowerCase();
      if (type === "startup") stats.startup++;
      if (type === "service") stats.service++;
      if (type === "product") stats.product++;

      // 🔥 NEW AGGREGATES
      stats.totalMessages += s.messages?.length || 0;
      stats.totalProblems += s.solvedProblems?.length || 0;
      stats.totalClips += s.highlightClips?.length || 0;
    });

    res.json({ success: true, stats });
  } catch (err) {
    console.error("Interview stats error:", err);
    res.status(500).json({ message: "Failed to fetch interview stats" });
  }
});


export default router;
