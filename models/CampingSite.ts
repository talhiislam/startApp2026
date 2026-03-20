import mongoose, { Schema, Document } from "mongoose";

export interface ICampingSite extends Document {
    owner: mongoose.Types.ObjectId;
    name: string;
    description: string;
    location: {
        wilaya: string;
        city: string;
        coordinates : { lat: number; lng: number };
    };
    images: string[];
    amenities: string[];
    pricePerNight: number;
    capacity: number;
    averageRating: number;
}

const CampingSiteSchema = new Schema<ICampingSite>(
    {
        owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
        name: { type: String, required: true },
        description: { type: String, required: true },
        location: {
            wilaya: { type: String, required: true },
            city: { type: String },
            coordinates: {
                lat: { type: Number },
                lng: { type: Number },
            },
        },
        images: [{ type: String }],
        amenities: [{ type : String }],
        pricePerNight: { type: Number, required: true },
        capacity: { type: Number, required: true },
        averageRating: { type: Number, default: 0 },
    },
    { timestamps: true }
);

export default mongoose.models.CampingSite || mongoose.model<ICampingSite>("CampingSite", CampingSiteSchema);