import mongoose, { Schema, Document } from "mongoose";

export interface IReview extends Document {
    user: mongoose.Types.ObjectId;
    targetId: mongoose.Types.ObjectId;
    targetType: "CampingSite"; // or other content to review
    rating: number;
    comment: string;
}

const ReviewSchema = new Schema<IReview>(
    {
        user: { type: mongoose.Types.ObjectId, ref:"User", required: true },
        targetId: { type: mongoose.Types.ObjectId, required: true, refPath: "targetType" },
        targetType: {
            type: String,
            enum: ["CampingSite"],
            required: true
        },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: {type: String },
    },
    { timestamps: true }
);

export default mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);