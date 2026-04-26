import { MetadataRoute } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import CampingSite from "@/models/CampingSite";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://sahatour.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connectToDatabase();

  const campsites = await CampingSite.find({ isApproved: true })
    .select("_id updatedAt")
    .lean();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/explore`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/auth/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/auth/signup`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  const campsiteRoutes: MetadataRoute.Sitemap = campsites.map((c) => ({
    url: `${BASE_URL}/explore/${c._id}`,
    lastModified: c.updatedAt ?? new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...campsiteRoutes];
}