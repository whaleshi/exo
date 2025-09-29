import React from "react";

const AirAbout = () => {
    return (
        <div className="max-w-[450px] mx-auto w-full px-[16px] pt-[40px] pb-[32px]">
            <div className="text-[16px] font-medium text-[#101010]">EXO Token Details</div>
            <div className="flex items-center mt-[20px]">
                <img src="/exo.png" alt="logo" className="w-[48px] h-[48px]" />
                <div className="pl-[10px]">
                    <div className="text-[14px] text-[#333]">EXO</div>
                    <div className="text-[12px] text-[#999]">EXO is the Governance Token of EXOPAD</div>
                </div>
            </div>
            <div className="bg-[#F8F8F8] py-[16px] px-[12px] mt-[16px]">
                <div className="flex justify-between text-[12px] text-[#999] mb-[12px]">
                    <span>Total Supply</span><span className="text-[#101010] font-medium">1B</span>
                </div>
                <div className="flex justify-between text-[12px] text-[#999] mb-[12px]">
                    <span>Community Airdrop</span><span className="text-[#101010] font-medium">500M</span>
                </div>
                <div className="flex justify-between text-[12px] text-[#999] mb-[12px]">
                    <span>pEXO Redemption Pool - 1 Year Linear Unlock</span><span className="text-[#101010] font-medium">200M</span>
                </div>
                <div className="flex justify-between text-[12px] text-[#999] mb-[12px]">
                    <span>IDO - Immediate Unlock</span><span className="text-[#101010] font-medium">100M</span>
                </div>
                <div className="flex justify-between text-[12px] text-[#999] mb-[12px]">
                    <span>CEX</span><span className="text-[#101010] font-medium">80M</span>
                </div>
                <div className="flex justify-between text-[12px] text-[#999] mb-[12px]">
                    <span>Liquidity</span><span className="text-[#101010] font-medium">20M</span>
                </div>
                <div className="flex justify-between text-[12px] text-[#999]">
                    <span>Team - 1 Year Linear Unlock</span><span className="text-[#101010] font-medium">100M</span>
                </div>
            </div>
            <button className="w-full h-[48px] bg-[#A3C6B8] text-[#FFF] text-[12px] font-medium rounded-none mt-[20px]">EXO IDO Coming Soon</button>
            <div className="text-[16px] font-medium text-[#101010] mt-[40px]">FAQ</div>
            <div className="mt-[16px]">
                <div className="text-[14px] font-medium text-[#333] mb-[4px]">Why Dual Tokens?</div>
                <div className="text-[12px] text-[#999]">pEXO for early incentives, EXO for long-term commitment and value.</div>
            </div>
            <div className="mt-[16px]">
                <div className="text-[14px] font-medium text-[#333] mb-[4px]">How to Get pEXO?</div>
                <div className="text-[12px] text-[#999]">Stake at least 2 XPL for 14 days to earn rewards, redeem for linearly unlocked pEXO airdrop.</div>
            </div>
            <div className="mt-[16px]">
                <div className="text-[14px] font-medium text-[#333] mb-[4px]">Will the Exchange Ratio Change?</div>
                <div className="text-[12px] text-[#999]">Initially 1:2, subject to community governance adjustments.</div>
            </div>
        </div>
    );
};

export default AirAbout;
