import React, { useEffect } from "react";
import { Button } from "@heroui/button";
import Image from "next/image";
import Link from "next/link";

const AirTrade = () => {
    return (
        <div className="max-w-[450px] mx-auto w-full px-[16px]">
            <div className="text-[16px] text-[#101010] mt-[20px]">质押 XPL 获取 pEXO 空投</div>
            <div className="flex items-center mt-[20px]">
                <img src="/headerLogo.png" alt="logo" className="w-[48px] h-[48px]" />
                <div className="pl-[10px]">
                    <div className="text-[14px] text-[#333]">pEXO</div>
                    <div className="text-[12px] text-[#999]">pEXO 是平台币 EXO 的唯一兑换凭证</div>
                </div>
            </div>
            {/* 顶部倒计时条 */}
            <div className="w-full flex items-center h-[40px] bg-[#DDEFEA] mt-[16px] relative">
                <div className="h-full bg-[#569F8C]" style={{ width: '20%' }}></div>
                <div className="text-center text-[#101010] text-[12px] font-medium absolute w-full">13 d 59 h 59 m 59 s 后结束</div>
            </div>
            {/* 四个统计卡片 */}
            <div className="grid grid-cols-2 gap-[12px] mt-[12px]">
                <div className="bg-[#F8F8F8] rounded-[2px] h-[54px] flex flex-col items-center justify-center">
                    <div className="text-[12px] text-[#333] font-medium">1B</div>
                    <div className="text-[10px] text-[#999]">代币总量</div>
                </div>
                <div className="bg-[#F8F8F8] rounded-[2px] h-[54px] flex flex-col items-center justify-center">
                    <div className="text-[12px] text-[#333] font-medium">1B</div>
                    <div className="text-[10px] text-[#999] mt-[2px]">空投总量</div>
                </div>
                <div className="bg-[#F8F8F8] rounded-[2px] h-[54px] flex flex-col items-center justify-center">
                    <div className="text-[12px] text-[#333] font-medium">18.98K XPL</div>
                    <div className="text-[10px] text-[#999] mt-[2px]">质押总量</div>
                </div>
                <div className="bg-[#F8F8F8] rounded-[2px] h-[54px] flex flex-col items-center justify-center">
                    <div className="text-[12px] text-[#333] font-medium">17856</div>
                    <div className="text-[10px] text-[#999] mt-[2px]">参与人数</div>
                </div>
            </div>
            {/* 我的质押标题 */}
            <div className="text-[14px] text-[#101010] font-medium mt-[24px]">我的质押</div>
            {/* 质押输入框区块 */}
            <div className="w-full flex items-center bg-[#F8F8F8] rounded-[2px] h-[52px] px-[18px] mt-[12px]">
                <input
                    type="text"
                    className="flex-1 bg-transparent outline-none text-[14px] text-[#333] font-medium"
                    value={2.00}
                />
                <span className="text-[14px] text-[#101010] ml-[8px]">XPL</span>
            </div>
            {/* 主按钮区块 */}
            <button className="w-full h-[48px] bg-[#569F8C] text-[#FFF] text-[12px] font-medium rounded-none mt-[16px] cursor-pointer">
                立即质押
                <div className="text-[10px] text-[#FFF] opacity-80 font-normal">至少质押 2 XPL</div>
            </button>
            {/* 已经质押/预计奖励区块 */}
            <div className="grid grid-cols-2 gap-[12px] mt-[16px]">
                <div className="bg-[#F8F8F8] h-[54px] flex flex-col items-center justify-center">
                    <div className="text-[12px] text-[#333] font-medium">0.00 XPL</div>
                    <div className="text-[10px] text-[#999] mt-[2px]">已经质押</div>
                </div>
                <div className="bg-[#F8F8F8] h-[54px] flex flex-col items-center justify-center">
                    <div className="text-[12px] text-[#333] font-medium">0.00 pEXO</div>
                    <div className="text-[10px] text-[#999] mt-[2px]">预计奖励</div>
                </div>
            </div>
            {/* 底部操作区块 */}
            <div className="w-full flex gap-[12px] mt-[16px]">
                <div className="flex-1">
                    <button
                        className="w-full h-[48px] bg-[#E99A9A] text-[#FFF] text-[12px] font-medium rounded-none"
                        disabled
                        style={{ cursor: 'not-allowed' }}
                    >
                        全部赎回
                        <div className="text-[10px] mt-[2px] text-[#FFF] opacity-80 font-normal">
                            13 d 12 h 12 m 12 s 后开放
                        </div>
                    </button>
                </div>
                <div className="flex-1">
                    <button
                        className="w-full h-[48px] bg-[#569F8C] text-[#FFF] text-[12px] font-medium rounded-none"
                        disabled
                        style={{ cursor: 'not-allowed' }}
                    >
                        领取奖励
                        <div className="text-[10px] mt-[2px] text-[#FFF] opacity-80 font-normal">
                            即将开放
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AirTrade;