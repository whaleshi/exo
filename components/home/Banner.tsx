import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import Image from "next/image";
import Link from "next/link";

const Home = () => {
    const router = useRouter();
    return (
        <div className="w-full flex flex-col items-center justify-center pt-[16px] pb-[36px] bg-[#101010]">
            <div className="max-w-[450px] mx-auto w-full px-[16px]">
                <div className="px-[10px] w-full flex items-center h-[36px] border-[0.5px] border-[#F3F3F3] text-[11px]">
                    <div className="flex flex-1 items-center text-[#FFF] gap-[4px]">
                        EXOPAD Token <span className="text-[#569F8C]">$EXO</span> Airdrop Ongoing
                    </div>
                    <div className="text-[#569F8C] cursor-pointer" onClick={() => router.push('/airdrop')}>View Details</div>
                </div>
                <div className="relative flex flex-col items-center pt-[16px]">
                    <Image src="/banner.png" width={160} height={160} alt="logo" />
                    <div className="text-[18px] font-medium text-[#FFF] text-center">
                        Build a Borderless Launchpad on Plasma
                    </div>
                </div>
                <div className="w-full px-[16px] mt-[24px] md:mt-[32px] flex justify-center gap-[12px]">
                    <Button className="h-[48px] border-[0.5px] border-solid border-[#F3F3F3] w-[150px] md:w-[180px] bg-[#101010] text-[#FFF] f600" radius="none"
                        onPress={() => { window.open("https://x.com/ExoPadFun/status/1972326413987676279", "_blank") }}
                    >
                        Mechanism
                    </Button>
                    <Button
                        as={Link}
                        href="/create"
                        className="h-[48px] opacity-100 bg-[#FFF] text-[#101010] w-[150px] md:w-[180px]"
                        radius="none"
                    >
                        Create Token
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Home;
