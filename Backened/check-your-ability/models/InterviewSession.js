// import mongoose from "mongoose";

// const interviewSessionSchema = new mongoose.Schema(
//   {
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     companyType: {
//       type: String,
//       required: true,
//     },
//     role: {
//       type: String,
//       required: true,
//     },
//     startedAt: {
//       type: Date,
//       default: Date.now,
//     },
//     endedAt: {
//       type: Date,
//     },
//     status: {
//       type: String,
//       enum: ["started", "completed", "abandoned"],
//       default: "started",
//     },
//     reportUrl: {
//       type: String,
//     },
//   },
//   { timestamps: true }
// );

// export const InterviewSession = mongoose.model(
//   "InterviewSession",
//   interviewSessionSchema
// );


// ========================================
// 1. UPDATE INTERVIEW SESSION MODEL
// File: models/InterviewSession.js
// ========================================

import mongoose from "mongoose";

const interviewSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    companyType: {
      type: String,
      required: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    reportUrl: {
      type: String,
    },
    // ✅ NEW: Store conversation messages
    messages: [
      {
        sender: {
          type: String,
          enum: ["User", "AI"],
          required: true,
        },
        text: {
          type: String,
          required: true,
        },
        time: String,
        stage: String,
        feedback: {
          suggestion: String,
          example: String,
        },
      },
    ],
    // ✅ NEW: Store solved coding problems
    solvedProblems: [
      {
        problem: {
          title: String,
          description: String,
          example: String,
          testCases: [
            {
              input: String,
              expected: String,
            },
          ],
          companies: [String],
        },
        userCode: String,
        testResults: [
          {
            id: Number,
            input: String,
            expected: String,
            output: String,
            passed: Boolean,
          },
        ],
        skipped: Boolean,
        solvedAt: Date,
      },
    ],
    status: {
      type: String,
      enum: ["in-progress", "completed"],
      default: "in-progress",
    },
  },
  { timestamps: true }
);

export const InterviewSession = mongoose.model("InterviewSession", interviewSessionSchema);
