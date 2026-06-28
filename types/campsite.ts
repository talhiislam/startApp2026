export type Campsite = {
    _id: string;
    owner?: {
        _id: string;
        username: string;
        createdAt: string;
        avatar?: string;
    };
    name: string;
    wilaya: string;
    region: string;
    type: "tent" | "bungalow" | "wild" | "glamping";
    images: string[];
    pricePerNight: number;
    capacity: number;
    description: string;
    amenities: string[];
    averageRating: number;
    reviewCount: number;
    coordinates?: {
        lat: number;
        lng: number;
    };
};

export const typeColors: Record<Campsite["type"], string> = {
    tent: "text-green-400 bg-green-400/10",
    bungalow: "text-blue-400 bg-blue-400/10",
    wild: "text-orange-400 bg-orange-400/10",
    glamping: "text-amber-400 bg-amber-400/10",
};

export const typeLabels: Record<Campsite["type"], string> = {
    tent: "Tent",
    bungalow: "Bungalow",
    wild: "Wild",
    glamping: "Glamping",
};