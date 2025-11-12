const mongoose = require("mongoose");

const RoundSchema = new mongoose.Schema(
  {
    roundType: {
      type: String,
      enum: ["aptitude", "technical", "coding"],
      required: true,
    },
    questions: {
      type: Array,
      default: [],
    },
    answers: {
      type: Array,
      default: [],
    },
    score: {
      type: Number,
      default: 0,
    },
    feedback: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
  },
  { _id: false }
);

const InterviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["in_progress", "completed"],
      default: "in_progress",
    },
    rounds: {
      type: [RoundSchema],
      default: [
        { roundType: "aptitude" },
        { roundType: "technical" },
        { roundType: "coding" },
      ],
    },
    totalScore: {
      type: Number,
      default: 0,
    },
    overallFeedback: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Interview", InterviewSchema);
