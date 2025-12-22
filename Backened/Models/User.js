import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    phone: String,
    bio: { type: String, maxLength: 300 },
    location: {
      city: String,
      state: String,
      country: String,
      pincode: String,
    },
    avatarUrl: String,
    lastLogin: { type: Date, default: Date.now },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ✅ THIS LINE PREVENTS OverwriteModelError
export const User =
  mongoose.models.User || mongoose.model("User", userSchema);
