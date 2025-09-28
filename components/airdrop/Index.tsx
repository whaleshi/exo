"use client";

import React, { useEffect, useState } from "react";
import AirBanner from "./Banner";
import AirTrade from "./Trade";
import AirAbout from "./About";

const Air = () => {
    const [isMobile, setIsMobile] = useState<boolean | null>(null);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    return (
        <div
            className="w-full fixed top-0 left-0 right-0 h-[100vh] pt-[56px] overflow-y-auto scrollbar-hide"
            style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
        >
            <AirBanner />
            <AirTrade />
            <AirAbout />
        </div>
    );
};

export default Air;
