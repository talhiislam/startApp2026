import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICampingSite extends Document {
    name: string;
    description: string;
    wilaya: string;
    region: "sahara" | "kabylie" | "hoggar" | "coastal" | "other";
    coordinates: {
        lat: number;
        lng: number
    };
    images: string[];
    pricePerNight: number;
    amenities: string[];
    type: "tent" | "bungalow" | "wild" | "glamping";
    owner: mongoose.Types.ObjectId;
    capacity: number;
    isApproved: boolean;
    averageRating: number;
    reviewCount: number;
    createdAt: Date;
    updatedAt: Date;
}

const CampingSiteSchema = new Schema<ICampingSite>(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, required: true },
        wilaya: { type: String, required: true },
        region: {
            type: String,
            enum: ["sahara", "kabylie", "hoggar", "coastal", "other"],
            required: true,
        },
        coordinates: {
            lat: { type: Number, required: true },
            lng: { type: Number, required: true },
        },
        images: [{ type: String }],
        pricePerNight: { type: Number, required: true },
        amenities: [{ type: String }],
        type: {
            type: String,
            enum: ["tent", "bungalow", "wild", "glamping"],
            required: true,
        },
        owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
        capacity: { type: Number, default: 10 },
        isApproved: { type: Boolean, default: false },
        averageRating: { type: Number, default: 0 },
        reviewCount: { type: Number, default: 0 },
    },
    { timestamps: true }
);

const CampingSite: Model<ICampingSite> =
    mongoose.models.CampingSite ||
    mongoose.model<ICampingSite>("CampingSite", CampingSiteSchema);

    export default CampingSite;