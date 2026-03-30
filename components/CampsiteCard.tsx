import Link from "next/link";

type CampsiteCardProps = {
    id: string;
    name: string;
    location: string;
    region: string;
    type: "tent" | "bungalow" | "wild" | "glamping";
    image: string;
    price?: number;    
};

const typeLabels = {
    tent: "Tent",
    bungalow: "Bungalow",
    wild: "Wild",
    glamping: "Glamping"
};

const typeColors = {
    tent: "text-green-400 bg-green-400/10",
    bungalow: "text-blue-400 bg-blue-400/10",
    wild: "text-amber-400 bg-amber-400/10",
    glamping: "text-orange-400 bg-orange-400/10"
};

export default function CampsiteCard({ id, name, location, type, region, image, price }: CampsiteCardProps) {
    return (
        <Link href={`/explore/${id}`} className="group block">
            <div className="bg-[#111827] border border-white/[0.08] rounded-2xl overflow-hidden hover:border-orange-500/40 transition-all duration-300">

                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                    <img
                      src={image}
                      alt={name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className={`absolute top-3 left-3 text-xs font-medium px-2 py-1 rounded-full ${typeColors[type]}`}>
                        {typeLabels[type]}
                    </span>
                </div>

                {/* Info */}
                <div className="p-4 flex flex-col gap-1">
                    <h3 className="text-slate-100 font-semibold text-sm">{name}</h3>
                    <p className="text-slate-500 text-xs">📍 {location}, {region}</p>
                    {price !== undefined && (
                        <p className="text-orange-400 text-sm font-medium mt-1">{price} DZD <span className="text-slate-500 font-normal">/ night</span></p>
                    )}
                </div>
            </div>
        </Link>    
    );
}