import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { PLANS } from "../config/plans.js";
import { User } from "../models/User.js";
import { verifyToken } from "../middleware/verifytoken.js";

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ===========================
   GET PLANS
=========================== */
router.get("/plans", (req, res) => {
  res.json(PLANS);
});

/* ===========================
   CREATE ORDER
=========================== */
router.post("/create-order", verifyToken, async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user.id;

    if (!planId) {
      return res.status(400).json({ message: "planId is required" });
    }

    const plan = PLANS[planId];
    if (!plan) {
      return res.status(400).json({ message: "Invalid planId" });
    }

    const order = await razorpay.orders.create({
      amount: plan.amount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: { planId, userId },
    });

    await User.findByIdAndUpdate(userId, {
      $push: {
        payments: {
          productType: "subscription",
          amount: plan.amount,
          provider: "razorpay",
          orderId: order.id,
          status: "pending",
          planId,
          interviewsGranted: plan.interviews,
        },
      },
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      planName: plan.name,
      interviews: plan.interviews,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Order creation failed" });
  }
});

/* ===========================
   VERIFY PAYMENT
=========================== */
router.post("/verify", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment data" });
    }

    const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    const user = await User.findById(userId);
    const payment = user.payments.find(
      (p) => p.orderId === razorpay_order_id
    );

    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    if (payment.status === "success") {
      return res.json({
        success: true,
        subscription: user.subscription,
        interviews: {
          remaining: user.subscription.interviewsRemaining,
          total: user.subscription.interviewsTotal,
        },
      });
    }

    const plan = PLANS[payment.planId];

    const startDate = new Date();
    let endDate = new Date(startDate);

    if (payment.planId === "lifetime") {
      endDate = new Date("2099-12-31");
    } else if (payment.planId === "yearly") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    await User.findOneAndUpdate(
      { _id: userId, "payments.orderId": razorpay_order_id },
      {
        $set: {
          "payments.$.paymentId": razorpay_payment_id,
          "payments.$.signature": razorpay_signature,
          "payments.$.status": "success",
          "payments.$.paidAt": new Date(),
          "subscription.active": true,
          "subscription.planId": payment.planId,
          "subscription.planName": plan.name,
          "subscription.startDate": startDate,
          "subscription.endDate": endDate,
        },
        $inc: {
          "subscription.interviewsTotal": plan.interviews,
          "subscription.interviewsRemaining": plan.interviews,
        },
      }
    );

    const updatedUser = await User.findById(userId);

    res.json({
      success: true,
      subscription: updatedUser.subscription,
      interviews: {
        remaining: updatedUser.subscription.interviewsRemaining,
        total: updatedUser.subscription.interviewsTotal,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Payment verification failed" });
  }
});

/* ===========================
   USE INTERVIEW
=========================== */
router.post("/use-interview", verifyToken, async (req, res) => {
  const userId = req.user.id;

  const user = await User.findById(userId);

  if (!user.subscription.active) {
    return res.status(403).json({ message: "No active subscription" });
  }

  if (user.subscription.interviewsRemaining <= 0) {
    return res.status(403).json({ message: "No interview credits remaining" });
  }

  await User.findByIdAndUpdate(userId, {
    $inc: {
      "subscription.interviewsUsed": 1,
      "subscription.interviewsRemaining": -1,
    },
  });

  res.json({ success: true });
});

/* ===========================
   INTERVIEW STATUS
=========================== */
router.get("/interview-status", verifyToken, async (req, res) => {
  const user = await User.findById(req.user.id);

  res.json({
    subscription: user.subscription,
    recentInterviews: user.interviewAttempts.slice(-5),
  });
});

export default router;
