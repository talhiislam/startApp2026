"use client";

import { useEffect, useState, useCallback } from "react";

type DateRange = { from?: Date; to?: Date };
type DayData = { booked: number; status: "partial" | "full" };

type Props = {
    campsiteId: string;
    guests: number;
    selected: DateRange | undefined;
    onSelect: (range: DateRange | undefined) => void;
};

function toKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();
}

function isInRange(date: Date, from: Date, to: Date): boolean {
    return date > from && date < to;
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function AvailabilityCalendar({
    campsiteId,
    guests,
    selected,
    onSelect,
}: Props) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [month, setMonth] = useState(() => {
        const d = new Date();
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        return d;
    });
    const [availability, setAvailability] = useState<Record<string, DayData>>({});
    const [capacity, setCapacity] = useState<number>(10);
    const [loading, setLoading] = useState(false);
    const [hovered, setHovered] = useState<Date | null>(null);

    const fetchAvailability = useCallback(async (displayMonth: Date) => {
        setLoading(true);
        try {
            const res = await fetch(
                `/api/campsites/${campsiteId}/availability?year=${displayMonth.getFullYear()}&month=${displayMonth.getMonth()}`
            );
            const data = await res.json();
            if (data.success) {
                setAvailability(data.data);
                setCapacity(data.capacity);
            }
        } finally {
            setLoading(false);
        }
    }, [campsiteId]);

    useEffect(() => {
        fetchAvailability(month);
    }, [month, fetchAvailability]);

    function isDayDisabled(date: Date): boolean {
        if (date < today) return true;
        const key = toKey(date);
        const day = availability[key];
        if (!day) return false;
        if (day.status === "full") return true;
        return (capacity - day.booked) < guests;
    }

    function rangeHasDisabled(from: Date, to: Date): boolean {
        const cursor = new Date(from);
        cursor.setDate(cursor.getDate() + 1);
        while (cursor < to) {
            if (isDayDisabled(cursor)) return true;
            cursor.setDate(cursor.getDate() + 1);
        }
        return false;
    }

    function handleDayClick(date: Date) {
        if (isDayDisabled(date)) return;

        if (!selected?.from || (selected.from && selected.to)) {
            onSelect({ from: date, to: undefined });
            return;
        }

        // from is set, to is not
        if (date < selected.from) {
            onSelect({ from: date, to: undefined });
            return;
        }

        if (isSameDay(date, selected.from)) {
            onSelect(undefined);
            return;
        }

        if (rangeHasDisabled(selected.from, date)) {
            // Start fresh from this date instead
            onSelect({ from: date, to: undefined });
            return;
        }

        onSelect({ from: selected.from, to: date });
    }

    function prevMonth() {
        const d = new Date(month);
        d.setMonth(d.getMonth() - 1);
        setMonth(d);
    }

    function nextMonth() {
        const d = new Date(month);
        d.setMonth(d.getMonth() + 1);
        setMonth(d);
    }

    // Build grid: leading empty cells + days of the month
    const firstDayOfWeek = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const cells: (Date | null)[] = [
        ...Array(firstDayOfWeek).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) =>
            new Date(month.getFullYear(), month.getMonth(), i + 1)
        ),
    ];
    // Pad to complete last row
    while (cells.length % 7 !== 0) cells.push(null);

    const monthLabel = month.toLocaleString("default", { month: "long", year: "numeric" });

    // Effective "to" for hover preview
    const previewTo = selected?.from && !selected.to && hovered ? hovered : selected?.to;
    const rangeFrom = selected?.from;
    const rangeTo = previewTo;

    function getDayStyle(date: Date): string {
        const disabled = isDayDisabled(date);
        const isToday = isSameDay(date, today);
        const isStart = rangeFrom && isSameDay(date, rangeFrom);
        const isEnd = rangeTo && isSameDay(date, rangeTo);
        const inRange = rangeFrom && rangeTo && rangeFrom < rangeTo && isInRange(date, rangeFrom, rangeTo);
        const isPast = date < today;

        const base = "w-full h-8 flex items-center justify-center text-xs rounded-md transition-colors select-none ";

        if (isPast) {
            return base + "text-slate-700 cursor-not-allowed";
        }
        if (disabled) {
            return base + "text-red-500 opacity-55 line-through cursor-not-allowed bg-red-500/8 rounded-md";
        }
        if (isStart || isEnd) {
            return base + "bg-orange-500 text-white font-medium cursor-pointer rounded-md z-10";
        }
        if (inRange) {
            return base + "bg-orange-500/15 text-orange-300 cursor-pointer rounded-none";
        }
        if (isToday) {
            return base + "text-orange-400 font-semibold cursor-pointer hover:bg-white/5";
        }
        return base + "text-slate-300 cursor-pointer hover:bg-white/5";
    }

    return (
        <div style={{ width: "100%" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <button
                    onClick={prevMonth}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 18, padding: "2px 6px", borderRadius: 4 }}
                >
                    ‹
                </button>
                <span style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 500 }}>
                    {loading ? "Loading..." : monthLabel}
                </span>
                <button
                    onClick={nextMonth}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 18, padding: "2px 6px", borderRadius: 4 }}
                >
                    ›
                </button>
            </div>

            {/* Day-of-week headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
                {DAYS.map((d) => (
                    <div key={d} style={{ textAlign: "center", fontSize: 11, color: "#475569", fontWeight: 500, paddingBottom: 4 }}>
                        {d}
                    </div>
                ))}
            </div>

            {/* Day grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px 0" }}>
                {cells.map((date, i) => {
                    if (!date) return <div key={`empty-${i}`} />;
                    return (
                        <div
                            key={toKey(date)}
                            onClick={() => handleDayClick(date)}
                            onMouseEnter={() => {
                                if (selected?.from && !selected.to && !isDayDisabled(date) && date > selected.from) {
                                    setHovered(date);
                                }
                            }}
                            onMouseLeave={() => setHovered(null)}
                            className={getDayStyle(date)}
                        >
                            {date.getDate()}
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-3 px-1">
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                    <span className="text-xs text-slate-500">Selected</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                    <span className="text-xs text-slate-500">Unavailable</span>
                </div>
                <span className="text-xs text-slate-600 ml-auto">Capacity: {capacity}</span>
            </div>
        </div>
    );
}
