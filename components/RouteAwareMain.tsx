"use client";

import React from "react";
import { usePathname } from "next/navigation";

export default function RouteAwareMain({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isGooey = pathname === "/gooey" || pathname.startsWith("/gooey/");

    if (isGooey) {
        return (
            <main className="flex-grow p-0 m-0 w-full h-auto">
                {children}
            </main>
        );
    }

    return (
        <main className="flex-grow mx-auto w-full pt-[56px]">
            {children}
        </main>
    );
}
