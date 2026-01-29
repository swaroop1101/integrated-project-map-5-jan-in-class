// config/plans.js
export const PLANS = {
  free: {
    name: "Free Plan",
    amount: 0,
    duration: "lifetime",
    interviews: 0,
  },
  monthly: { // 👈 Changed from "basic" to "monthly"
    name: "Basic Plan",
    amount: 79,
    duration: "monthly",
    interviews: 2,
  },
  premium: {
    name: "Premium Plan",
    amount: 120,
    duration: "monthly",
    interviews: 4,
  },
  yearly: {
    name: "Yearly Plan",
    amount: 999,
    duration: "yearly",
    interviews: 50,
  },
  lifetime: {
    name: "Lifetime Plan",
    amount: 2999,
    duration: "lifetime",
    interviews: 999,
  },
};