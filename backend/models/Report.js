const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    scanId: { type: mongoose.Schema.Types.ObjectId, ref: "Scan", required: true, unique: true },
    votes: {
      up: { type: Number, default: 0 },
      down: { type: Number, default: 0 }
    },
    tags: [{ type: String, trim: true }],
    voters: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        voteType: { type: String, enum: ["up", "down"] }
      }
    ]
  },
  { timestamps: true }
);

reportSchema.virtual("trustScore").get(function trustScore() {
  const total = this.votes.up + this.votes.down;
  if (!total) return 0;
  return Math.round((this.votes.up / total) * 100);
});

module.exports = mongoose.model("Report", reportSchema);
