import mongoose, { Schema, Document } from "mongoose";

export interface IBooking extends Document {
    user: mongoose.Types.ObjectId;
    site: mongoose.Types.ObjectId;
    checkIn: Date;
    checkOut: Date;
    guests: number;
    totalPrice: number;
    status: "pending" | "confirmed" | "cancelled" | "completed"; 
}

const BookingSchema = new Schema<IBooking>(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        site: { type: Schema.Types.ObjectId, ref: "CampingSite", required: true },
        checkIn: { type: Date, required: true },
        checkOut: { type: Date, required: true },
        guests: { type: Number, required: true },
        totalPrice: { type: Number, required: true },
        status: {
            type: String,
            enum: ["pending", "confirmed", "cancelled", "completed"],
            default: "pending",
        },
    },
    { timestamps: true }
);

export default mongoose.models.Booking || mongoose.model<IBooking>("Booking", BookingSchema);