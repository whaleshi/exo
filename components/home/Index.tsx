"use client";

import React, { useEffect, useState } from "react";
import HomeBanner from "./Banner";
import List from "./List";
// import List1 from "./List1";
import PrefetchLinks from "@/components/PrefetchLinks";
const Home = () => {
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
            <HomeBanner />
            <List />
            {/* <List1 /> */}
            <PrefetchLinks
                paths={['/create', '/meme/[addr]']}
                delay={1500}
            />
            <style jsx>{`
                div::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
};

export default Home;
