export type Product = {
    _id: string;
    name: string;
    description: string;
    category: "tents" | "sleeping" | "cooking" | "backpacks" | "lighting" | "tools" | "other";
    price: number;
    images: string[];
    stock: number;
    isActive: boolean;
    createdAt: string;
};

export const categoryColors: Record<Product["category"], string> = {
    tents: "text-green-400 bg-green-400/10",
    sleeping: "text-blue-400 bg-blue-400/10",
    cooking: "text-orange-400 bg-orange-400/10",
    backpacks: "text-amber-400 bg-amber-400/10",
    lighting: "text-purple-400 bg-purple-400/10",
    tools: "text-slate-400 bg-slate-400/10",
    other: "text-slate-400 bg-slate-400/10",
};

export const categoryLabels: Record<Product["category"], string> = {
    tents: "Tents",
    sleeping: "Sleeping Gear",
    cooking: "Cooking",
    backpacks: "Backpacks",
    lighting: "Lighting",
    tools: "Tools",
    other: "Other",
};
