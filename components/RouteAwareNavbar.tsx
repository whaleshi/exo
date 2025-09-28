"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/navbar";

const HIDE_ON: Array<string | RegExp> = [
    "/gooey",
];

export default function RouteAwareNavbar() {
    const pathname = usePathname();
    const shouldHide = HIDE_ON.some((p) =>
        typeof p === "string" ? pathname === p || pathname.startsWith(p + "/") : p.test(pathname)
    );
    if (shouldHide) return null;
    return <Navbar />;
}
