export default function Card({ children, className = "" }: { children: React.ReactNode, className?: string }) {
    return (
        <div className={`bg-[#111827] border border-white/[0.08] rounded-2xl shadow-xl ${className}`}>
            {children}
        </div>
    );
}