import React, { useEffect } from "react";
import { Button } from "@heroui/button";
import Image from "next/image";
import Link from "next/link";

const AirBanner = () => {

    return (
        <div className="w-full flex flex-col items-center justify-center pt-[16px] pb-[36px] bg-[#101010]">
            <div className="max-w-[450px] mx-auto w-full px-[16px]">
                <div className="relative flex flex-col items-center pt-[16px]">
                    <Image src="/banner.png" width={160} height={160} alt="logo" />
                    <div className="text-[18px] font-medium text-[#FFF] text-center">
                        EXOPAD Pioneers Dual-Token Model
                    </div>
                    <div className="text-[15px] font-medium text-[#FFF] text-center mt-[10px]">
                        <span className="text-[#DCCC7A]">pEXO</span> for Growth Incentives - <span className="text-[#569F8C]">EXO</span> for Governance
                    </div>
                </div>
                <div className="w-full px-[16px] mt-[24px] md:mt-[32px] flex justify-center gap-[12px]">
                    <Button className="h-[48px] border-[0.5px] border-solid border-[#F3F3F3] w-[150px] md:w-[180px] bg-[#101010] text-[#FFF] f600" radius="none"
                        onPress={() => {
                            const text = ``
                            const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
                            window.open(url, "_blank");
                        }}
                    >
                        Share to X
                    </Button>
                    <Button
                        className="h-[48px] opacity-100 bg-[#FFF] text-[#101010] w-[150px] md:w-[180px]"
                        radius="none"
                        onPress={() => { window.open("https://x.com/exopadfun/status/1972960993870483943?s=46&t=sKCMgE2u8cDlKJdlNM2zWQ", "_blank") }}
                    >
                        Read Docs
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AirBanner;
