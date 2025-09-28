import React from "react";

const AirAbout = () => {
    return (
        <div className="max-w-[450px] mx-auto w-full px-[16px] pt-[40px] pb-[32px]">
            <div className="text-[16px] font-medium text-[#101010]">EXO 代币详情</div>
            <div className="flex items-center mt-[20px]">
                <img src="/headerLogo.png" alt="logo" className="w-[48px] h-[48px]" />
                <div className="pl-[10px]">
                    <div className="text-[14px] text-[#333]">pEXO</div>
                    <div className="text-[12px] text-[#999]">pEXO 是平台币 EXO 的唯一兑换凭证</div>
                </div>
            </div>
            <div className="bg-[#F8F8F8] py-[16px] px-[12px] mt-[16px]">
                <div className="flex justify-between text-[12px] text-[#999] mb-[12px]">
                    <span>代币总量</span><span className="text-[#101010] font-medium">10B</span>
                </div>
                <div className="flex justify-between text-[12px] text-[#999] mb-[12px]">
                    <span>社区空投</span><span className="text-[#101010] font-medium">5B</span>
                </div>
                <div className="flex justify-between text-[12px] text-[#999] mb-[12px]">
                    <span>pEXO 兑换池 - 1 年线性解锁</span><span className="text-[#101010] font-medium">2B</span>
                </div>
                <div className="flex justify-between text-[12px] text-[#999] mb-[12px]">
                    <span>IDO - 立即解锁</span><span className="text-[#101010] font-medium">1B</span>
                </div>
                <div className="flex justify-between text-[12px] text-[#999] mb-[12px]">
                    <span>CEX</span><span className="text-[#101010] font-medium">80M</span>
                </div>
                <div className="flex justify-between text-[12px] text-[#999] mb-[12px]">
                    <span>流动性</span><span className="text-[#101010] font-medium">20M</span>
                </div>
                <div className="flex justify-between text-[12px] text-[#999]">
                    <span>团队 - 1 年线性解锁</span><span className="text-[#101010] font-medium">20M</span>
                </div>
            </div>
            <button className="w-full h-[48px] bg-[#A3C6B8] text-[#FFF] text-[12px] font-medium rounded-none mt-[20px]">EXO IDO 即将启动</button>
            <div className="text-[16px] font-medium text-[#101010] mt-[40px]">机制 FAQ</div>
            <div className="mt-[16px]">
                <div className="text-[14px] font-medium text-[#333] mb-[4px]">为什么采用双代币？</div>
                <div className="text-[12px] text-[#999]">pEXO 用于早期激励，持有 pEXO 可免费兑换平台币 EXO，EXO 用于长期治理和价值承载。</div>
            </div>
            <div className="mt-[16px]">
                <div className="text-[14px] font-medium text-[#333] mb-[4px]">团队如何解锁？</div>
                <div className="text-[12px] text-[#999]">团队 10% 12 个月线性释放解锁。</div>
            </div>
            <div className="mt-[16px]">
                <div className="text-[14px] font-medium text-[#333] mb-[4px]">pEXO 如何获取？</div>
                <div className="text-[12px] text-[#999]">通过质押至少 2 XPL 14 天后获得奖励，赎回后线性解锁。</div>
            </div>
            <div className="mt-[16px]">
                <div className="text-[14px] font-medium text-[#333] mb-[4px]">兑换比例会变吗？</div>
                <div className="text-[12px] text-[#999]">初始为 1:2，未来可根据社区治理投票动态调整。</div>
            </div>
        </div>
    );
};

export default AirAbout;
