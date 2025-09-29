import React, { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import Image from "next/image";
import Link from "next/link";
import { ethers } from "ethers";
import { useAppKit, useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { useQuery } from "@tanstack/react-query";
import { CONTRACT_CONFIG, DEFAULT_CHAIN_CONFIG } from "@/config/chains";
import AirdropABIData from "@/constant/pEXOAirdrop.abi.json";
import { toast } from "sonner";

const AirdropABI = AirdropABIData;

const AirTrade = () => {
    const [stakeAmount, setStakeAmount] = useState("2.00");
    const [isStaking, setIsStaking] = useState(false);
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [countdown, setCountdown] = useState("--");
    const [progress, setProgress] = useState(0);

    const { open } = useAppKit();
    const { address, isConnected } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider('eip155');

    // React Query for staking data
    const { data: stakingData, refetch } = useQuery({
        queryKey: ['stakingData', address, isConnected],
        queryFn: async () => {
            try {
                const provider = new ethers.JsonRpcProvider(DEFAULT_CHAIN_CONFIG.rpcUrl);
                const airdropAddr = CONTRACT_CONFIG.pEXOAirdrop;
                const airdropContract = new ethers.Contract(airdropAddr, AirdropABI, provider);

                // 获取总体质押信息
                const stakingInfo = await airdropContract.getStakingInfo();
                console.log(stakingInfo)

                const result: any = {
                    stakingInfo: {
                        startTime: Number(stakingInfo[0]),
                        endTime: Number(stakingInfo[1]),
                        totalStaked: ethers.formatEther(stakingInfo[2]),
                        participants: stakingInfo[3].toString()
                    }
                };

                // 如果钱包已连接，获取用户质押信息
                if (isConnected && address) {
                    const userStakeData = await airdropContract.getUserStakeInfo(address);
                    const userAllocation = await airdropContract.getUserPEXOAllocation(address);
                    console.log(userStakeData)
                    console.log('User PEXO Allocation:', userAllocation)
                    result.userStakeInfo = {
                        stakedAmount: ethers.formatEther(userStakeData[0]),
                        withdrawnPexo: ethers.formatEther(userStakeData[1]),
                        stakeTime: Number(userStakeData[2]),
                        hasWithdrawn: Boolean(userStakeData[3]), // 第四个参数：是否已提现
                        expectedReward: ethers.formatEther(userAllocation)
                    };
                } else {
                    result.userStakeInfo = {
                        stakedAmount: "0",
                        withdrawnPexo: "0",
                        stakeTime: 0,
                        hasWithdrawn: false,
                        expectedReward: "0"
                    };
                }

                return result;
            } catch (error) {
                console.error("获取质押数据失败:", error);
                throw error;
            }
        },
        refetchInterval: 3000, // 3秒刷新一次
        staleTime: 0, // 数据立即过期，确保每次都重新获取
    });

    // 解构数据，提供默认值
    const stakingInfo = stakingData?.stakingInfo || {
        startTime: 0,
        endTime: 0,
        totalStaked: "0",
        participants: "0"
    };

    const userStakeInfo = stakingData?.userStakeInfo || {
        stakedAmount: "0",
        withdrawnPexo: "0",
        stakeTime: 0,
        hasWithdrawn: false,
        expectedReward: "0"
    };

    // 计算进度百分比（倒计时：从100%减到0%）
    const calculateProgress = () => {
        if (stakingInfo.startTime === 0 || stakingInfo.endTime === 0) {
            return 100; // 默认值为100%
        }

        const now = Math.floor(Date.now() / 1000);
        const totalDuration = stakingInfo.endTime - stakingInfo.startTime;
        const timeLeft = stakingInfo.endTime - now;

        if (now <= stakingInfo.startTime) {
            return 100; // 还未开始，显示100%
        }
        if (now >= stakingInfo.endTime) {
            return 0; // 已结束，显示0%
        }

        // 计算剩余时间的百分比（从100%递减到0%）
        return Math.floor((timeLeft / totalDuration) * 100);
    };

    // 计算倒计时
    const calculateCountdown = (endTime: number) => {
        const now = Math.floor(Date.now() / 1000);
        const timeLeft = endTime - now;

        if (timeLeft <= 0) {
            return "Ended";
        }

        const days = Math.floor(timeLeft / (24 * 60 * 60));
        const hours = Math.floor((timeLeft % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((timeLeft % (60 * 60)) / 60);
        const seconds = timeLeft % 60;

        return `Ends in ${days}d ${hours}h ${minutes}m ${seconds}s`;
    };

    // 执行质押
    const handleStake = async () => {
        if (!isConnected) {
            open();
            return;
        }

        if (!address || !walletProvider) {
            toast.error('Please connect the wallet first', { icon: null });
            return;
        }

        // 检查活动是否已结束
        const now = Math.floor(Date.now() / 1000);
        if (now >= stakingInfo.endTime) {
            toast.error('Staking period has ended', { icon: null });
            return;
        }

        const amount = parseFloat(stakeAmount);
        if (isNaN(amount) || amount < 2) {
            toast.error('The minimum stake amount is 2 XPL', { icon: null });
            return;
        }

        try {
            setIsStaking(true);

            // 创建provider和signer
            const ethersProvider = new ethers.BrowserProvider(walletProvider as any);
            const signer = await ethersProvider.getSigner();

            // 检查余额
            const balance = await ethersProvider.getBalance(address);
            const stakeAmountWei = ethers.parseEther(stakeAmount);

            if (balance < stakeAmountWei) {
                toast.error('Insufficient balance', { icon: null });
                return;
            }

            // 创建合约实例
            const airdropAddr = CONTRACT_CONFIG.pEXOAirdrop;
            const airdropContract = new ethers.Contract(airdropAddr, AirdropABI, signer);

            // 估算 gas
            let gasLimit;
            try {
                const estimatedGas = await airdropContract["deposit(uint256)"].estimateGas(
                    stakeAmountWei,
                    { value: stakeAmountWei }
                );
                gasLimit = estimatedGas + (estimatedGas * BigInt(20)) / BigInt(100); // +20% buffer
                console.log("估算的gas:", estimatedGas.toString(), "缓冲后:", gasLimit.toString());
            } catch (e) {
                console.log("Gas估算失败，使用默认值:", e);
                gasLimit = undefined;
            }

            // 获取 gas price（+5%）
            const feeData = await ethersProvider.getFeeData();
            const gasPrice = feeData.gasPrice;
            const newGasPrice = gasPrice ? gasPrice + (gasPrice * BigInt(5)) / BigInt(100) : null; // +5%

            // 统一交易选项
            const txOptions: any = {};
            if (gasLimit) txOptions.gasLimit = gasLimit;
            if (newGasPrice) txOptions.gasPrice = newGasPrice;
            txOptions.value = stakeAmountWei;

            // 调用deposit函数 - 使用带参数版本，传递质押金额
            const tx = await airdropContract["deposit(uint256)"](stakeAmountWei, txOptions);

            toast.success('The pledge transaction has been submitted and is awaiting confirmation...', { icon: null });
            console.log("质押交易哈希:", tx.hash);

            // 等待交易确认
            const receipt = await tx.wait();
            console.log("质押交易确认:", receipt);

            toast.success('Pledge successful ✌️', { icon: null });

            // 刷新数据
            refetch();

        } catch (error: any) {
            toast.error('Pledge failed, please try again 😭', { icon: null });
        } finally {
            setIsStaking(false);
        }
    };

    // 执行提取
    const handleWithdraw = async () => {
        if (!isConnected) {
            open();
            return;
        }

        if (!address || !walletProvider) {
            toast.error('Please connect the wallet first', { icon: null });
            return;
        }

        // 检查是否已提现
        if (userStakeInfo.hasWithdrawn) {
            toast.error('You have already withdrawn your stake', { icon: null });
            return;
        }

        // 检查是否已质押
        if (parseFloat(userStakeInfo.stakedAmount) <= 0) {
            toast.error("You haven't staked any tokens yet", { icon: null });
            return;
        }

        // 检查是否到了可提取时间
        const now = Math.floor(Date.now() / 1000);
        if (now < stakingInfo.endTime) {
            toast.error('The pledge period has not ended yet and cannot be withdrawn', { icon: null });
            return;
        }

        try {
            setIsWithdrawing(true);

            // 创建provider和signer
            const ethersProvider = new ethers.BrowserProvider(walletProvider as any);
            const signer = await ethersProvider.getSigner();

            // 创建合约实例
            const airdropAddr = CONTRACT_CONFIG.pEXOAirdrop;
            const airdropContract = new ethers.Contract(airdropAddr, AirdropABI, signer);

            // 估算 gas
            let gasLimit;
            try {
                const estimatedGas = await airdropContract.withdraw.estimateGas();
                gasLimit = estimatedGas + (estimatedGas * BigInt(20)) / BigInt(100); // +20% buffer
                console.log("提取估算的gas:", estimatedGas.toString(), "缓冲后:", gasLimit.toString());
            } catch (e) {
                console.log("Gas估算失败，使用默认值:", e);
                gasLimit = undefined;
            }

            // 获取 gas price（+5%）
            const feeData = await ethersProvider.getFeeData();
            const gasPrice = feeData.gasPrice;
            const newGasPrice = gasPrice ? gasPrice + (gasPrice * BigInt(5)) / BigInt(100) : null; // +5%

            // 统一交易选项
            const txOptions: any = {};
            if (gasLimit) txOptions.gasLimit = gasLimit;
            if (newGasPrice) txOptions.gasPrice = newGasPrice;

            // 调用withdraw函数
            console.log("准备调用withdraw函数...");
            const tx = await airdropContract.withdraw(txOptions);

            toast.success('Withdrawal transaction submitted, awaiting confirmation...', { icon: null });
            console.log("提取交易哈希:", tx.hash);

            // 等待交易确认
            const receipt = await tx.wait();
            console.log("提取交易确认:", receipt);

            toast.success('Extraction successful ✌️', { icon: null });

            // 刷新数据
            refetch();

        } catch (error: any) {
            toast.error('Extraction failed, please try again 😭', { icon: null });
        } finally {
            setIsWithdrawing(false);
        }
    };

    // 倒计时定时器
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (stakingInfo.endTime > 0) {
            // 立即计算一次
            setCountdown(calculateCountdown(stakingInfo.endTime));
            setProgress(calculateProgress());

            // 每秒更新倒计时和进度条
            interval = setInterval(() => {
                setCountdown(calculateCountdown(stakingInfo.endTime));
                setProgress(calculateProgress());
            }, 1000);
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [stakingInfo.endTime, stakingInfo.startTime]); // 依赖于开始和结束时间
    return (
        <div className="max-w-[450px] mx-auto w-full px-[16px]">
            <div className="text-[16px] text-[#101010] mt-[20px]">Stake XPL to Get pEXO Airdrop</div>
            <div className="flex items-center mt-[20px]">
                <img src="/headerLogo.png" alt="logo" className="w-[48px] h-[48px]" />
                <div className="pl-[10px]">
                    <div className="text-[14px] text-[#333]">pEXO</div>
                    <div className="text-[12px] text-[#999]">pEXO is the Only Redemption Proof for EXO</div>
                </div>
            </div>
            {/* 顶部倒计时条 */}
            <div className="w-full flex items-center h-[40px] bg-[#DDEFEA] mt-[16px] relative">
                <div className="h-full bg-[#569F8C]" style={{ width: `${progress}%` }}></div>
                <div className="text-center text-[#101010] text-[12px] font-medium absolute w-full">{countdown}</div>
            </div>
            {/* 四个统计卡片 */}
            <div className="grid grid-cols-2 gap-[12px] mt-[12px]">
                <div className="bg-[#F8F8F8] rounded-[2px] h-[54px] flex flex-col items-center justify-center">
                    <div className="text-[12px] text-[#333] font-medium">100M</div>
                    <div className="text-[10px] text-[#999]">Total Supply</div>
                </div>
                <div className="bg-[#F8F8F8] rounded-[2px] h-[54px] flex flex-col items-center justify-center">
                    <div className="text-[12px] text-[#333] font-medium">100M</div>
                    <div className="text-[10px] text-[#999] mt-[2px]">Total Airdrop</div>
                </div>
                <div className="bg-[#F8F8F8] rounded-[2px] h-[54px] flex flex-col items-center justify-center">
                    <div className="text-[12px] text-[#333] font-medium">{parseFloat(stakingInfo.totalStaked).toFixed(2)} XPL</div>
                    <div className="text-[10px] text-[#999] mt-[2px]">Total Staked</div>
                </div>
                <div className="bg-[#F8F8F8] rounded-[2px] h-[54px] flex flex-col items-center justify-center">
                    <div className="text-[12px] text-[#333] font-medium">{stakingInfo.participants}</div>
                    <div className="text-[10px] text-[#999] mt-[2px]">Participants</div>
                </div>
            </div>
            {/* 我的质押标题 */}
            <div className="text-[14px] text-[#101010] font-medium mt-[24px]">My Stake</div>
            {/* 质押输入框区块 */}
            <div className="w-full flex items-center bg-[#F8F8F8] rounded-[2px] h-[52px] px-[18px] mt-[12px]">
                <input
                    type="text"
                    className="flex-1 bg-transparent outline-none text-[14px] text-[#333] font-medium"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder="2.00"
                />
                <span className="text-[14px] text-[#101010] ml-[8px]">XPL</span>
            </div>
            {/* 主按钮区块 */}
            <button
                className="w-full h-[48px] bg-[#569F8C] text-[#FFF] text-[12px] font-medium rounded-none mt-[16px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleStake}
                disabled={isStaking || (Date.now() / 1000 >= stakingInfo.endTime)}
            >
                {isStaking ? 'Staking...' : 
                 !isConnected ? 'Connect Wallet' : 
                 (Date.now() / 1000 >= stakingInfo.endTime) ? 'Stake Ended' : 
                 'Stake Now'}
                <div className="text-[10px] text-[#FFF] opacity-80 font-normal">
                    {(Date.now() / 1000 >= stakingInfo.endTime) ? 'Staking period has ended' : 'Minimum Stake 2 XPL'}
                </div>
            </button>
            {/* 已经质押/预计奖励区块 */}
            <div className="grid grid-cols-2 gap-[12px] mt-[16px]">
                <div className="bg-[#F8F8F8] h-[54px] flex flex-col items-center justify-center">
                    <div className="text-[12px] text-[#333] font-medium">{parseFloat(userStakeInfo.stakedAmount).toFixed(2)} XPL</div>
                    <div className="text-[10px] text-[#999] mt-[2px]">Staked Already</div>
                </div>
                <div className="bg-[#F8F8F8] h-[54px] flex flex-col items-center justify-center">
                    <div className="text-[12px] text-[#333] font-medium">{parseFloat(userStakeInfo.expectedReward).toFixed(2)} pEXO</div>
                    <div className="text-[10px] text-[#999] mt-[2px]">Expected Reward</div>
                </div>
            </div>
            {/* 底部操作区块 */}
            <div className="w-full flex gap-[12px] mt-[16px]">
                <div className="flex-1">
                    <button
                        className={`w-full h-[48px] text-[#FFF] text-[12px] font-medium rounded-none ${!isConnected || parseFloat(userStakeInfo.stakedAmount) <= 0 || Date.now() / 1000 < stakingInfo.endTime || userStakeInfo.hasWithdrawn
                            ? 'bg-[#E99A9A] cursor-not-allowed'
                            : 'bg-[#EB4B6D] cursor-pointer'
                            }`}
                        disabled={isWithdrawing || !isConnected || parseFloat(userStakeInfo.stakedAmount) <= 0 || Date.now() / 1000 < stakingInfo.endTime || userStakeInfo.hasWithdrawn}
                        onClick={handleWithdraw}
                    >
                        {!isConnected ? 'Connect Wallet' :
                            parseFloat(userStakeInfo.stakedAmount) <= 0 ? 'No Stakes' :
                                userStakeInfo.hasWithdrawn ? 'Already Withdrawn' :
                                    Date.now() / 1000 < stakingInfo.endTime ? 'Redeem All' :
                                        isWithdrawing ? 'Withdrawing...' : 'Redeem All'}
                        <div className="text-[10px] mt-[2px] text-[#FFF] opacity-80 font-normal">
                            {userStakeInfo.hasWithdrawn ? 'You have withdrawn' :
                                Date.now() / 1000 < stakingInfo.endTime ? countdown : 'Available Now'}
                        </div>
                    </button>
                </div>
                <div className="flex-1">
                    <button
                        className="w-full h-[48px] bg-[#A3C6B8] text-[#FFF] text-[12px] font-medium rounded-none"
                        disabled
                        style={{ cursor: 'not-allowed' }}
                    >
                        Claim Rewards
                        <div className="text-[10px] mt-[2px] text-[#FFF] opacity-80 font-normal">
                            Coming Soon
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AirTrade;