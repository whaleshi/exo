'use client'
import {
    Navbar as HeroUINavbar,
    NavbarContent,
    NavbarMenu,
    NavbarMenuToggle,
    NavbarBrand,
    NavbarItem,
    NavbarMenuItem,
} from "@heroui/navbar";
import { Kbd, Button, Link, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { link as linkStyles } from "@heroui/theme";
import NextLink from "next/link";
import { shortenAddress } from "@/utils";
import Image from "next/image";
import { siteConfig } from "@/config/site";

import { useAppKit, useAppKitAccount, useDisconnect, useAppKitProvider } from "@reown/appkit/react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ethers } from "ethers";
import { DEFAULT_CHAIN_CONFIG } from "@/config/chains";
import useClipboard from '@/hooks/useClipboard';

export const Navbar = () => {
    const { open, close } = useAppKit();
    const { address, isConnected, caipAddress, status, embeddedWalletInfo } = useAppKitAccount();
    const { disconnect } = useDisconnect();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [type, setType] = useState(1);
    const { copy, isCopied } = useClipboard();

    // 获取钱包余额，3秒刷新一次
    const { data: walletBalance, isLoading: balanceLoading } = useQuery({
        queryKey: ['walletBalance', address],
        queryFn: async () => {
            if (!isConnected || !address) {
                return '0';
            }

            try {
                const provider = new ethers.JsonRpcProvider(DEFAULT_CHAIN_CONFIG.rpcUrl);
                const balance = await provider.getBalance(address);
                console.log(balance)
                // 返回格式化的余额（18位小数）
                return ethers.formatEther(balance);
            } catch (error) {
                console.error('获取钱包余额失败:', error);
                return '0';
            }
        },
        enabled: !!(isConnected && address), // 只有在钱包连接且有地址时才执行查询
        refetchInterval: 10000, // 每3秒刷新一次余额
        staleTime: 8000, // 2秒内的数据认为是新鲜的
        retry: 2, // 失败时重试2次
    });

    // 格式化余额显示
    const formatBalance = (balance: string) => {
        const num = parseFloat(balance);
        if (num === 0) return '0 XPL';
        if (num < 0.001) return '<0.001 XPL';
        if (num < 1) return `${num.toFixed(3)} XPL`;
        if (num < 1000) return `${num.toFixed(2)} XPL`;
        return `${(num / 1000).toFixed(2)}K XPL`;
    };

    const toDisconnect = () => {
        disconnect();
        setIsMenuOpen(false);
    }

    return (
        <HeroUINavbar classNames={{ wrapper: "px-4" }} maxWidth="xl" position="static" height="56px" className="!bg-[#101010] !px-0 fixed top-0 left-0 right-0 z-50 bg-white" isMenuOpen={isMenuOpen} onMenuOpenChange={setIsMenuOpen}>
            <NavbarContent className="basis-1/5 sm:basis-full !px-0" justify="start">
                <NavbarBrand as="li" className="gap-[4px] max-w-fit">
                    <NextLink className="flex justify-start items-center gap-[4px]" href="/">
                        <img src="/headerLogo.png" alt="logo" width="40" height="40" className="w-[40px] h-[40px] rounded-[0px]" />
                        <p className="font-bold text-[#FFF]">EXOPAD</p>
                    </NextLink>
                </NavbarBrand>
            </NavbarContent>


            <NavbarContent className="flex basis-1 pl-4 gap-[10px]" justify="end">
                {
                    isConnected ? <div
                        onClick={() => {
                            setIsMenuOpen(!isMenuOpen);
                            setType(1);
                        }}
                        className="h-[36px] px-[12px] border-1 border-[#F3F3F3] flex items-center justify-center text-[#FFF] text-[13px]">
                        {shortenAddress(address!)}
                    </div> : <Button
                        isExternal
                        as={Link}
                        radius="none"
                        className="h-[36px] text-sm font-normal text-[13px] text-[#101010] bg-[#FFF]"
                        variant="flat"
                        onPress={() => { open(); }}
                    >
                        Connect
                    </Button>
                }
                <div className="w-[36px] h-[36px] border-1 border-[#F3F3F3] flex items-center justify-center bg-[#101010]">
                    <NavbarMenuToggle className="text-[#FFF] cursor-pointer w-6 h-6 scale-75" onClick={() => { setIsMenuOpen(!isMenuOpen); setType(2); }} />
                </div>
            </NavbarContent>
            <NavbarMenu className={`px-[16px] ${type === 1 ? 'bg-[#FFF]' : 'bg-[#101010]'}`}>
                <div className="w-full max-w-[450px] mx-auto">
                    {
                        isConnected && type === 1 && <div>
                            <div className="w-full bg-[#F8F8F8] h-[76px] px-[16px] flex justify-between items-center mt-[10px]">
                                <div className="flex flex-col justify-center h-full">
                                    <div className="text-[11px] text-[#AAA]">Balance</div>
                                    <div className="text-[18px] text-[#101010] font-semibold">
                                        {balanceLoading ? '0' : formatBalance(walletBalance || '0')}
                                    </div>
                                </div>
                                <div
                                    onClick={() => { toDisconnect() }}
                                    className="px-[14px] h-[32px] flex items-center justify-center bg-[#FFF] text-[11px] text-[#101010] cursor-pointer"
                                >
                                    Disconnect
                                </div>
                            </div>
                            <div className="h-[48px] w-full bg-[#F8F8F8] flex items-center px-[16px] gap-[4px] mt-[12px]">
                                <div className="text-[11px] text-[#101010] w-full">Wallet Address</div>
                                <div className="text-[11px] text-[#101010] underline cursor-pointer">{shortenAddress(address!)}</div>
                                <div className="text-[11px] text-[#999] cursor-pointer" onClick={() => copy(address!)}>Copy</div>
                            </div>
                        </div>
                    }
                    {
                        type === 2 && <>
                            <div className="flex flex-col items-start w-full gap-[20px] mt-[10px]">
                                <Link className="text-[24px] text-[#fff]" href="/airdrop" onPress={() => setIsMenuOpen(false)}>$EXO Airdrop</Link>
                                <Link className="text-[24px] text-[#fff]" href="/create" onPress={() => setIsMenuOpen(false)}>Launch a token</Link>
                                <Link className="text-[24px] text-[#fff]" isExternal aria-label="work" href={siteConfig.links.work}>How it works?</Link>
                                <Link className="text-[24px] text-[#fff]" isExternal aria-label="x" href={siteConfig.links.x}>Follow us on X</Link>
                                <Link className="text-[24px] text-[#fff]" isExternal aria-label="tg" href={siteConfig.links.tg}>Join Community</Link>
                                <Button
                                    isExternal
                                    as={Link}
                                    radius="none"
                                    className="h-[48px] text-sm font-normal text-[#333] bg-[#fff] border-1 border-[#F3F3F3] text-[14px]"
                                    variant="flat"
                                    onPress={() => { window.open("https://app.plasma.to/", "_blank") }}
                                >
                                    Buy $XPL
                                </Button>
                            </div>
                        </>
                    }
                </div>
            </NavbarMenu>
        </HeroUINavbar>
    );
};
