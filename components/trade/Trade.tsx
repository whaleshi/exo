"use client";
import React, { useState, useEffect } from "react";
import { Input, Button, useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import { useAppKit } from "@reown/appkit/react";
import Slippage from "@/components/trade/Slippage";
import { useTokenTrading } from "@/hooks/useTokenTrading";
import ResponsiveDialog from "../common/ResponsiveDialog";
import { formatBigNumber } from '@/utils/formatBigNumber';
import _bignumber from "bignumber.js";
import { useSlippageStore } from "@/stores/useSlippageStore";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { ethers } from "ethers";
import { DEFAULT_CHAIN_CONFIG, CONTRACT_CONFIG } from "@/config/chains";

interface TradeProps {
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    initialMode?: boolean; // true for buy, false for sell
    tokenAddress?: string; // token address for trading
    balances?: any; // user's token balance
    metaData?: any; // token metadata
}

export default function Trade({ isOpen = false, onOpenChange, initialMode = true, tokenAddress, balances, metaData }: TradeProps) {
    const [isBuy, setIsBuy] = useState(initialMode);
    const [isSlippageOpen, setIsSlippageOpen] = useState(false);
    const [inputAmount, setInputAmount] = useState("");
    const [outputAmount, setOutputAmount] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // AppKit hooks
    const { open } = useAppKit();
    const queryClient = useQueryClient();

    // 使用自定义trading hooks
    const { handleBuy, handleSell, isConnected, address } = useTokenTrading();
    const { slippage } = useSlippageStore();

    // 预估输出金额 - 当输入框有值时每3秒调用一次
    const { data: estimatedOutput } = useQuery({
        queryKey: ['estimateOutput', tokenAddress, inputAmount, isBuy, address],
        queryFn: async () => {
            if (!inputAmount || !tokenAddress || !isConnected || !address || parseFloat(inputAmount) <= 0) {
                return '0';
            }

            try {
                const contractABI = (await import('@/constant/abi.json')).default;
                const provider = new ethers.JsonRpcProvider(DEFAULT_CHAIN_CONFIG.rpcUrl);
                const readOnlyContract = new ethers.Contract(CONTRACT_CONFIG.TokenManager, contractABI, provider);

                if (isBuy) {
                    // 调用 tryBuy 获取预期代币输出
                    const result = await readOnlyContract.tryBuy(tokenAddress, ethers.parseEther(inputAmount));
                    const tokenAmountOut = result[0];
                    return ethers.formatEther(tokenAmountOut);
                } else {
                    // 调用 trySell 获取预期ETH输出
                    const sellAmount = ethers.parseEther(inputAmount);
                    const result = await readOnlyContract.trySell(tokenAddress, sellAmount);
                    return ethers.formatEther(result);
                }
            } catch (error) {
                console.error('预估输出失败:', error);
                return '0';
            }
        },
        enabled: !!(inputAmount && tokenAddress && isConnected && address && parseFloat(inputAmount) > 0),
        refetchInterval: 3000, // 每3秒刷新一次
        staleTime: 2000,
        retry: 1,
    });

    const buyAmounts = [
        { label: "50 XPL", value: 50 },
        { label: "100 XPL", value: 100 },
        { label: "300 XPL", value: 300 },
        { label: "500 XPL", value: 500 }
    ];

    const sellAmounts = [
        { label: "25%", value: 0.25 },
        { label: "50%", value: 0.5 },
        { label: "75%", value: 0.75 },
        { label: "100%", value: 1.0 }
    ];

    const tabs = [
        { id: true, label: "Buy" },
        { id: false, label: "Sell" }
    ];

    // 监听initialMode变化，在弹窗打开时设置对应的模式
    useEffect(() => {
        if (isOpen) {
            setIsBuy(initialMode);
            setInputAmount(""); // 清空输入框
        }
    }, [isOpen, initialMode]);

    // 监听买入/卖出模式切换，清空输入框
    useEffect(() => {
        setInputAmount("");
        setOutputAmount("");
    }, [isBuy]);

    // 监听预估输出变化，更新输出框
    useEffect(() => {
        if (estimatedOutput) {
            // 格式化输出，去除多余的小数位
            const formatted = parseFloat(estimatedOutput).toFixed(6).replace(/\.?0+$/, '');
            setOutputAmount(formatted);
        } else {
            setOutputAmount("");
        }
    }, [estimatedOutput]);

    const handleAmountClick = (amount: { label: string; value: number | null }) => {
        if (isLoading) return; // 加载中禁用点击

        if (amount.value === null) {
            // 处理"更多"按钮逻辑
            return;
        }

        if (isBuy) {
            // 买入时直接设置金额，确保不超过1
            const finalAmount = amount.value;
            setInputAmount(finalAmount.toString());
        } else {
            // 卖出时按百分比计算，基于实际的token余额，使用bignumber确保精度
            if (balances?.tokenBalance && _bignumber(balances?.tokenBalance).gt(0)) {
                try {
                    const userBalance = _bignumber(balances?.tokenBalance);
                    const percentage = _bignumber(amount.value);
                    const sellAmount = userBalance.times(percentage);

                    // 格式化结果，去除尾随零
                    const formattedAmount = sellAmount.dp(18, _bignumber.ROUND_DOWN).toFixed();
                    setInputAmount(formattedAmount.replace(/\.?0+$/, ''));
                } catch (error) {
                    console.error('計算賣出金額失敗:', error);
                    setInputAmount('0');
                }
            } else {
                // 如果没有余额，设置为0
                setInputAmount('0');
            }
        }
    };


    const handleTradeSubmit = async () => {
        if (!isConnected) {
            open();
            return;
        }

        // 验证输入金额
        if (!inputAmount || parseFloat(inputAmount) <= 0) {
            toast.error('Please Enter Amount', { icon: null });
            return;
        }

        setIsLoading(true);

        try {
            // 使用传入的tokenAddress，如果没有则使用默认地址
            const currentTokenAddress = tokenAddress as string;

            if (isBuy) {
                const result = await handleBuy(currentTokenAddress, inputAmount);
                toast.success(`Buy Successful ✌️`, { icon: null });
            } else {
                const result = await handleSell(currentTokenAddress, inputAmount);
                toast.success(`Sell Successful ✌️`, { icon: null });
            }

            await queryClient.invalidateQueries({
                queryKey: ['userBalances']
            });
            await queryClient.invalidateQueries({
                queryKey: ['walletBalance']
            });

            // 重置状态
            setInputAmount("");
            setOutputAmount("");
        } catch (error: any) {
            toast.error(`${isBuy ? 'Buy Failed, Please Retry 😭' : 'Sell Failed, Please Retry 😭'}`, { icon: null });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <Slippage isOpen={isSlippageOpen} onOpenChange={setIsSlippageOpen} />
            <ResponsiveDialog
                isOpen={isOpen}
                onOpenChange={onOpenChange ?? (() => { })}
                maxVH={70}
                size="md"
                classNames={{ body: "text-[#fff]", header: "justify-start" }}
                title={
                    <div className="flex gap-[16px] text-[16px]">
                        {tabs.map((tab) => (
                            <div
                                key={String(tab.id)}
                                className={
                                    isBuy === tab.id
                                        ? "text-[#101010] cursor-pointer"
                                        : "cursor-pointer text-[#999]"
                                }
                                onClick={() => setIsBuy(tab.id)}
                            >
                                {tab.label}
                            </div>
                        ))}
                    </div>
                }
            >
                <div>
                    <Input
                        classNames={{
                            inputWrapper:
                                "px-[18px] py-3.5 rounded-none border-0 bg-[#F8F8F8] h-[52]",
                            input: "text-[14px] text-[#101010] placeholder:text-[#999] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                        }}
                        labelPlacement="outside"
                        placeholder="0.00"
                        variant="bordered"
                        type="text"
                        inputMode="decimal"
                        value={inputAmount}
                        onChange={(e) => {
                            const value = e.target.value;
                            // 只允许数字和小数点
                            if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                setInputAmount(value);
                            }
                        }}
                        onKeyDown={(e) => {
                            // 阻止上下箭头键
                            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                e.preventDefault();
                            }
                        }}
                        disabled={isLoading}
                        endContent={
                            <span className="text-sm font-medium text-[#101010]">{!isBuy ? metaData?.symbol : 'XPL'}</span>
                        }
                    />
                </div>
                <div className="flex items-center justify-between gap-[12px]">
                    {(isBuy ? buyAmounts : sellAmounts).map((amount) => (
                        <Button
                            key={amount.label}
                            radius="none"
                            fullWidth
                            className="bg-[#F3F3F3] text-[#101010] text-[12px]"
                            disabled={isLoading}
                            onClick={() => handleAmountClick(amount)}
                        >
                            {amount.label}
                        </Button>
                    ))}
                </div>
                <div className="flex items-center justify-between">
                    <span></span>
                    <span className="text-[#999] text-xs">
                        Balance <i className="text-[#101010]  not-italic">{isConnected ? formatBigNumber(isBuy ? balances?.walletBalance : balances?.tokenBalance) : '-'}</i>
                    </span>
                </div>
                <div>
                    <div className="text-[16px] text-[#101010] mb-[12px]">Expected Amount</div>
                    <Input
                        classNames={{
                            inputWrapper:
                                "px-[18px] py-3.5 rounded-none bg-[#F8F8F8] border-0 h-[52]",
                            input: "text-[14px] text-[#101010] placeholder:text-[#999]",
                        }}
                        labelPlacement="outside"
                        placeholder="0.00"
                        variant="bordered"
                        value={outputAmount}
                        readOnly
                        endContent={
                            <span className="text-sm font-medium text-[#101010]">{isBuy ? metaData?.symbol : 'XPL'}</span>
                        }
                    />
                </div>
                <Button
                    radius="none"
                    className={`text-[#fff] h-[48px] ${isBuy ? "bg-[#569F8C]" : "bg-[#EB4B6D]"
                        }`}
                    disabled={isLoading}
                    isLoading={isLoading}
                    onPress={handleTradeSubmit}
                >
                    {isLoading ? "Trading..." : !isConnected ? "Connect Wallet" : (isBuy ? "Buy" : "Sell")}
                </Button>

                <div className="border p-4 border-solid border-[#F3F3F3] mb-[10px]">
                    <div className="flex items-center justify-between text-[12px]">
                        <span className="text-[#999] ">Slippage</span>
                        <span className="text-[#999]">
                            <span className="underline text-[#101010]">{slippage}%</span>
                            <span
                                className="cursor-pointer hover:text-[#569F8C] ml-[4px]"
                                onClick={() => setIsSlippageOpen(true)}
                            >
                                Setting
                            </span>
                        </span>
                    </div>
                </div>
            </ResponsiveDialog>
        </div>
    );
}

