import type { Metadata } from "next";
import CampsiteDetail from "./CampsiteDetail";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/campsites/${id}`, {
      next: { revalidate: 3600 },
    });
    const data = await res.json();

    if (!data.success) {
      return { title: "Campsite Not Found" };
    }

    const campsite = data.data;

    return {
      title: campsite.name,
      description: campsite.description,
      openGraph: {
        title: `${campsite.name} - SahaTour`,
        description: campsite.description,
        images: campsite.images?.[0]
          ? [
              {
                url: campsite.images[0],
                width: 1200,
                height: 630,
                alt: campsite.name,
              },
            ]
          : [],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `${campsite.name} - SahaTour`,
        description: campsite.description,
        images: campsite.images?.[0] ? [campsite.images[0]] : [],
      },
    };
  } catch {
    return { title: "Campsite" };
  }
}

export default function CampsiteDetailPage() {
  return <CampsiteDetail />;
}
