import mongoose, { Schema, model, models } from "mongoose";

export interface ITeamMember {
  _id: string;
  initials: string;
  name: string;
  role: string;
  email: string;
  order: number;
}

const TeamMemberSchema = new Schema<ITeamMember>(
  {
    initials: { type: String, required: true, maxlength: 4 },
    name:     { type: String, required: true },
    role:     { type: String, required: true },
    email:    { type: String, required: true },
    order:    { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default models.TeamMember ?? model<ITeamMember>("TeamMember", TeamMemberSchema);
