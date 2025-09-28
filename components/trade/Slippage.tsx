"use client";
import React, { useState, useEffect } from "react";
import { Input, Button, useDisclosure } from "@heroui/react";
import { toast } from "sonner";

import ResponsiveDialog from "../common/ResponsiveDialog";
import { useSlippageStore } from "@/stores/useSlippageStore";

interface SlippageProps {
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export default function Slippage({ isOpen = false, onOpenChange }: SlippageProps) {
    const { slippage, setSlippage } = useSlippageStore();
    const [activeSlippage, setActiveSlippage] = useState(-1);
    const [customSlippage, setCustomSlippage] = useState("");

    const slippageOptions = [
        { id: 0, label: "1%", value: 1 },
        { id: 1, label: "3%", value: 3 },
        { id: 2, label: "5%", value: 5 }
    ];

    // 初始化当前滑点设置
    useEffect(() => {
        const currentOption = slippageOptions.find(option => option.value === slippage);
        if (currentOption) {
            setActiveSlippage(currentOption.id);
            setCustomSlippage("");
        } else {
            // 自定义滑点
            setActiveSlippage(-1);
            setCustomSlippage(slippage.toString());
        }
    }, [isOpen, slippage]);

    return (
        <ResponsiveDialog
            isOpen={isOpen}
            onOpenChange={onOpenChange ?? (() => { })}
            maxVH={70}
            size="md"
            title="設定"
        >
            <div className="text-base text-[#101010] pb-[5px]">
                Slippage Tolerance
            </div>
            <div className="flex items-center justify-between gap-[12px] mb-[16px]">
                {slippageOptions.map((option) => (
                    <Button
                        key={option.id}
                        radius="none"
                        className={`flex-1 h-[45px] text-[14px] ${activeSlippage === option.id
                            ? "bg-[#DDEFEA] border-[#569F8C] text-[#569F8C]"
                            : "bg-[#F3F3F3] border-[#F3F3F3] text-[#101010]"
                            }`}
                        variant="bordered"
                        onPress={() => {
                            setActiveSlippage(option.id);
                            setCustomSlippage("");
                        }}
                    >
                        {option.label}
                    </Button>
                ))}
            </div>
            <div>
                <Input
                    classNames={{
                        inputWrapper:
                            "px-[18px] py-3.5 rounded-none border-[1px] border-[#F3F3F3] h-[52]",
                        input: "text-[14px] text-[#101010] placeholder:text-[#999] text-center",
                    }}
                    labelPlacement="outside"
                    placeholder="自訂滑點"
                    variant="bordered"
                    value={customSlippage}
                    onChange={(e) => {
                        const value = e.target.value;
                        // 只允许数字和小数点，限制最大值为50%
                        if (value === '' || (/^\d*\.?\d*$/.test(value) && parseFloat(value || '0') <= 50)) {
                            setCustomSlippage(value);
                            setActiveSlippage(-1); // 清除预设选择
                        }
                    }}
                    endContent={
                        <span className="text-[14px] font-medium text-[#101010]">%</span>
                    }
                />
            </div>

            <div className="flex gap-[12px] my-[12px]">
                <Button
                    radius="none"
                    className="flex-1 h-[48px] text-[14px] bg-[#569F8C] text-white"
                    onPress={() => {
                        let newSlippage: number;

                        if (activeSlippage >= 0) {
                            // 使用预设滑点
                            newSlippage = slippageOptions[activeSlippage].value;
                        } else if (customSlippage) {
                            // 使用自定义滑点
                            const customValue = parseFloat(customSlippage);
                            if (isNaN(customValue) || customValue <= 0) {
                                toast.error('請輸入有效的滑點數值', { icon: null });
                                return;
                            }
                            if (customValue > 50) {
                                toast.error('滑點不能超過50%', { icon: null });
                                return;
                            }
                            newSlippage = customValue;
                        } else {
                            toast.error('請選擇或輸入滑點數值', { icon: null });
                            return;
                        }

                        // 保存滑点设置到store
                        setSlippage(newSlippage);
                        toast.success(`滑點已設定為 ${newSlippage}%`, { icon: null });
                        onOpenChange?.(false);
                    }}
                >
                    確認
                </Button>
            </div>
        </ResponsiveDialog>
    );
}