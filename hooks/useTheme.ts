"use client";

import { useEffect, useState } from "react";

function getInitialTheme(): "dark" | "light" {
    if (typeof window === "undefined") return "dark";
    return (localStorage.getItem("theme") as "dark" | "light") ?? "dark";
}

export function useTheme() {
    const [theme, setTheme] = useState<"dark" | "light">(getInitialTheme);

    useEffect(() => {
        function onThemeChange(e: Event) {
            setTheme((e as CustomEvent<"dark" | "light">).detail);
        }

        window.addEventListener("themechange", onThemeChange);
        return () => window.removeEventListener("themechange", onThemeChange);
    }, []);

    return theme;
}
