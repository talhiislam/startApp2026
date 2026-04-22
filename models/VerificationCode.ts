import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVerificationCode extends Document {
  email: string;
  code: string;
  expiresAt: Date;
  createdAt: Date;
}

const VerificationCodeSchema = new Schema<IVerificationCode>(
  {
    email: { type: String, required: true },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// Auto-delete expired code
VerificationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const VerificationCode: Model<IVerificationCode> =
  mongoose.models.VerificatiionCode ||
  mongoose.model<IVerificationCode>("VerificationCode", VerificationCodeSchema);

export default VerificationCode;
