import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISupportRequest extends Document {
  user: mongoose.Types.ObjectId;
  category: "bug" | "booking" | "campsite" | "account" | "other";
  message: string;
  status: "open" | "resolved";
  createdAt: Date;
  updatedAt: Date;
}

const SupportRequestSchema = new Schema<ISupportRequest>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    category: {
      type: String,
      enum: ["bug", "booking", "campsite", "account", "other"],
      required: true,
    },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["open", "resolved"],
      default: "open",
    },
  },
  { timestamps: true },
);

const SupportRequest: Model<ISupportRequest> =
  mongoose.models.SupportRequest ||
  mongoose.model<ISupportRequest>("SupportRequest", SupportRequestSchema);

export default SupportRequest;