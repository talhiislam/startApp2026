import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import mongoose from "mongoose";
import CampingSite from "../models/CampingSite";

const MONGO_URL = process.env.MONGODB_URI!;

const campsites = [
  {
    name: "Taghit Dunes Camp",
    description:
      "Sleep under the stars among the golden dunes of Taghit, one of Algeria's most stunning desert landscapes.",
    wilaya: "Béchar",
    region: "sahara",
    coordinates: { lat: 30.9, lng: -2.03 },
    images: ["https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80"],
    pricePerNight: 2500,
    amenities: ["Bonfire", "Guided tours", "Traditional meals"],
    type: "tent",
    owner: new mongoose.Types.ObjectId(),
    isApproved: true,
    averageRating: 4.8,
    reviewCount: 34,
  },
  {
    name: "Tassili Hoggar Retreat",
    description:
      "A remote glamping experience in the heart of the Hoggar mountains, surrounded by ancient rock formations.",
    wilaya: "Tamanrasset",
    region: "hoggar",
    coordinates: { lat: 22.78, lng: 5.52 },
    images: ["https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80"],
    pricePerNight: 4500,
    amenities: [
      "Private tent",
      "Star gazing",
      "Tuareg guides",
      "Meals included",
    ],
    type: "glamping",
    owner: new mongoose.Types.ObjectId(),
    isApproved: true,
    averageRating: 4.9,
    reviewCount: 18,
  },
  {
    name: "Kabylie Pine Forest Camp",
    description:
      "A peaceful campsite nestled in the pine forests of Kabylie, perfect for hiking and fresh mountain air.",
    wilaya: "Tizi Ouzou",
    region: "kabylie",
    coordinates: { lat: 36.7, lng: 4.05 },
    images: ["https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80"],
    pricePerNight: 1800,
    amenities: ["Hiking trails", "Fire pits", "Toilets", "Parking"],
    type: "wild",
    owner: new mongoose.Types.ObjectId(),
    isApproved: true,
    averageRating: 4.5,
    reviewCount: 52,
  },
  {
    name: "Tipaza Coastal Bungalows",
    description:
      "Wake up to Mediterranean views at this relaxed coastal camp near the Roman ruins of Tipaza.",
    wilaya: "Tipaza",
    region: "coastal",
    coordinates: { lat: 36.59, lng: 2.44 },
    images: [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
    ],
    pricePerNight: 3200,
    amenities: ["Sea view", "BBQ area", "Showers", "Beach access"],
    type: "bungalow",
    owner: new mongoose.Types.ObjectId(),
    isApproved: true,
    averageRating: 4.6,
    reviewCount: 27,
  },
];

async function seed() {
    await mongoose.connect(MONGO_URL, { dbName: "startup-project" });
    console.log("Connected to MongoDB");

    await CampingSite.deleteMany({});
    console.log("Cleared existing campsites");

    await CampingSite.insertMany(campsites);
    console.log(`Seeded ${campsites.length} campsites`);

    await mongoose.disconnect();
    console.log("Done");
}

seed().catch((err) => {
    console.error(err);
    process.exit(1);
});
