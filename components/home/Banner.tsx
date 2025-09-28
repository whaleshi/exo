import React, { useEffect } from "react";
import { Button } from "@heroui/button";
import Image from "next/image";
import Link from "next/link";

const Home = () => {

    return (
        <div className="w-full flex flex-col items-center justify-center pt-[16px] pb-[36px] bg-[#101010]">
            <div className="max-w-[450px] mx-auto w-full px-[16px]">
                <div className="px-[10px] w-full flex items-center h-[36px] border-[0.5px] border-[#F3F3F3] text-[11px]">
                    <div className="flex flex-1 items-center text-[#FFF] gap-[4px]">
                        EXOPAD 平台币 <span className="text-[#569F8C]">$EXO</span> 空投火热进行中
                    </div>
                    <div className="text-[#569F8C] cursor-pointer">詳情</div>
                </div>
                <div className="relative flex flex-col items-center pt-[16px]">
                    <Image src="/banner.png" width={160} height={160} alt="logo" />
                    <div className="text-[18px] font-medium text-[#FFF] text-center">
                        在 Plasma 构建超越边界的<br />代币 Launchpad
                    </div>
                </div>
                <div className="w-full px-[16px] mt-[24px] md:mt-[32px] flex justify-center gap-[12px]">
                    <Button className="h-[48px] border-[0.5px] border-solid border-[#F3F3F3] w-[150px] md:w-[180px] bg-[#101010] text-[#FFF] f600" radius="none"
                        onPress={() => { window.open("https://x.com/okbrodotfun/status/1962110458611249274?s=46&t=sKCMgE2u8cDlKJdlNM2zWQ", "_blank") }}
                    >
                        运行机制
                    </Button>
                    <Button
                        as={Link}
                        href="/create"
                        className="h-[48px] opacity-100 bg-[#FFF] text-[#101010] w-[150px] md:w-[180px]"
                        radius="none"
                    >
                        创建代币
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Home;
