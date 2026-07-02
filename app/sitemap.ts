import { MetadataRoute } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import CampingSite from "@/models/CampingSite";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://sahatour.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    await connectToDatabase();
  } catch {
    return staticRoutes(BASE_URL);
  }

  const campsites = await CampingSite.find({ isApproved: true })
    .select("_id updatedAt")
    .lean();


  const campsiteRoutes: MetadataRoute.Sitemap = campsites.map((c) => ({
    url: `${BASE_URL}/explore/${c._id}`,
    lastModified: c.updatedAt ?? new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes(BASE_URL), ...campsiteRoutes];
}

function staticRoutes(base: string): MetadataRoute.Sitemap {
  return [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/explore`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/auth/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/auth/signup`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];
}