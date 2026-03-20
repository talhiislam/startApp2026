import mongoose, { Document, Model, Schema } from "mongoose";

export interface IUser extends Document {
  email: string;
  username: string;
  password?: string;
  role: "camper" | "owner" | "admin";
  phone?: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    password: { type: String }, // optional if not using email
    role: {
      type: String,
      enum: ["camper", "owner", "admin"],
      default: "camper"
    },
    phone: { type: String },
  },
  { timestamps: true }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
