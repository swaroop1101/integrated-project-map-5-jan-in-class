import Notification from "../Models/Notification.js";
import { io } from "../server.js";

/**
 * Create and send a notification to a user
 * @param {string} userId - User ID
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type (welcome, course_started, course_completed, interview_completed, achievement)
 * @param {object} metadata - Additional data to store with notification
 */
export const sendNotification = async (userId, title, message, type = "general", metadata = {}) => {
  try {
    // Create notification in database
    const notification = new Notification({
      userId,
      title,
      message,
      type,
      isRead: false,
      metadata,
    });

    await notification.save();

    // Emit socket event to send real-time notification
    if (io) {
      io.to(userId.toString()).emit("NEW_NOTIFICATION", notification);
    }

    return notification;
  } catch (error) {
    console.error("Error sending notification:", error);
    return null;
  }
};

/**
 * Welcome notification when user signs up
 */
export const sendWelcomeNotification = async (userId, userName) => {
  return sendNotification(
    userId,
    "🎉 Welcome to Prepvio!",
    `Hey ${userName}, welcome! Start your learning journey with our AI-powered interview prep.`,
    "welcome",
    { action: "welcome", userName }
  );
};

/**
 * Course started notification
 */
export const sendCourseStartedNotification = async (userId, courseTitle, channelName) => {
  return sendNotification(
    userId,
    "📚 Course Started",
    `You've started "${courseTitle}" from ${channelName}. Keep going, you're doing great!`,
    "course_started",
    { action: "course_started", courseTitle, channelName }
  );
};

/**
 * Course completed notification
 */
export const sendCourseCompletedNotification = async (userId, courseTitle, channelName) => {
  return sendNotification(
    userId,
    "🏆 Course Completed!",
    `Congratulations! You've completed "${courseTitle}" from ${channelName}. On to the next one!`,
    "course_completed",
    { action: "course_completed", courseTitle, channelName }
  );
};

/**
 * Interview completed notification
 */
export const sendInterviewCompletedNotification = async (userId, role, score) => {
  return sendNotification(
    userId,
    "🎤 Interview Completed!",
    `Great job! You completed the ${role} interview. Check your detailed report to improve further.`,
    "interview_completed",
    { action: "interview_completed", role, score }
  );
};

/**
 * Achievement unlocked notification
 */
export const sendAchievementNotification = async (userId, achievementTitle, achievementDescription) => {
  return sendNotification(
    userId,
    `🌟 ${achievementTitle}`,
    achievementDescription,
    "achievement",
    { action: "achievement", title: achievementTitle }
  );
};
