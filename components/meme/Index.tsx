import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ethers } from "ethers";
import { CONTRACT_CONFIG, DEFAULT_CHAIN_CONFIG } from "@/config/chains";
import FactoryABI from "@/constant/abi.json";
import _bignumber from "bignumber.js";
import Image from "next/image";
import useClipboard from '@/hooks/useClipboard';

import Top from "./Top";
import Trade from "./Trade";
import ResponsiveDialog from "@/components/common/ResponsiveDialog";
import { Button } from "@heroui/button";
import { useDisclosure } from "@heroui/react";

const Details = () => {
    const router = useRouter();
    const params = useParams();
    const tokenAddress = params.addr as string;
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const { copy, isCopied } = useClipboard();

    // 获取代币的 URI 信息
    const { data: tokenUri, isLoading: uriLoading, error: uriError } = useQuery({
        queryKey: ['tokenUri', tokenAddress],
        queryFn: async () => {
            if (!tokenAddress) return null;

            try {
                const provider = new ethers.JsonRpcProvider(DEFAULT_CHAIN_CONFIG.rpcUrl);
                const factoryContract = new ethers.Contract(CONTRACT_CONFIG.FACTORY_CONTRACT, FactoryABI, provider);

                const uri = await factoryContract.uri(tokenAddress);
                console.log('Token URI:', uri);
                return uri;
            } catch (error) {
                console.error('获取 Token URI 失败:', error);
                throw error;
            }
        },
        enabled: !!tokenAddress,
        staleTime: 60000, // 1分钟内缓存
        retry: 2,
    });

    // 获取代币的 tokensInfo 信息
    const { data: tokenInfo, isLoading: infoLoading, error: infoError } = useQuery({
        queryKey: ['tokenInfo', tokenAddress],
        queryFn: async () => {
            if (!tokenAddress) return null;

            try {
                const provider = new ethers.JsonRpcProvider(DEFAULT_CHAIN_CONFIG.rpcUrl);
                const factoryContract = new ethers.Contract(CONTRACT_CONFIG.FACTORY_CONTRACT, FactoryABI, provider);
                const factoryInterface = new ethers.Interface(FactoryABI);

                const tokenInfoResult = await factoryContract.tokensInfo(tokenAddress);

                // 解析 tokensInfo 结果
                const parsedTokenInfo = {
                    base: tokenInfoResult[0],
                    quote: tokenInfoResult[1],
                    reserve0: tokenInfoResult[2],
                    reserve1: tokenInfoResult[3],
                    vReserve0: tokenInfoResult[4],
                    vReserve1: tokenInfoResult[5],
                    maxOffers: tokenInfoResult[6],
                    totalSupply: tokenInfoResult[7],
                    lastPrice: tokenInfoResult[8],
                    target: tokenInfoResult[9],
                    creator: tokenInfoResult[10],
                    launched: tokenInfoResult[11]
                };

                console.log('Token Info:', parsedTokenInfo);
                return parsedTokenInfo;
            } catch (error) {
                console.error('获取 Token Info 失败:', error);
                throw error;
            }
        },
        enabled: !!tokenAddress,
        refetchInterval: 3000, // 每10秒刷新一次动态数据
        staleTime: 3000, // 5秒内缓存
        retry: 2,
    });

    // 获取 IPFS 元数据（基于 URI）
    const { data: tokenMetadata, isLoading: metadataLoading, error: metadataError } = useQuery({
        queryKey: ['tokenMetadata', tokenUri],
        queryFn: async () => {
            if (!tokenUri || tokenUri === '') return null;

            try {
                // 处理IPFS URI
                let fetchUrl = tokenUri;
                if (tokenUri.startsWith('Qm') || tokenUri.startsWith('bafy')) {
                    fetchUrl = `https://ipfs.io/ipfs/${tokenUri}`;
                } else if (tokenUri.startsWith('ipfs://')) {
                    fetchUrl = tokenUri.replace('ipfs://', 'https://ipfs.io/ipfs/');
                }

                console.log('Fetching metadata from:', fetchUrl);
                const response = await fetch(fetchUrl);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const metadata = await response.json();
                console.log('Token Metadata:', metadata);

                return {
                    name: metadata.name || '',
                    symbol: metadata.symbol || '',
                    description: metadata.description || '',
                    image: metadata.image || null,
                    website: metadata.website || '',
                    x: metadata.x || '',
                    telegram: metadata.telegram || ''
                };
            } catch (error) {
                console.error('获取元数据失败:', error);
                return null;
            }
        },
        enabled: !!tokenUri,
        staleTime: 300000, // 5分钟缓存，元数据通常不变
        retry: 2,
    });

    // 计算进度
    const progressData = useMemo(() => {
        if (!tokenInfo || !tokenInfo.reserve1 || !tokenInfo.target) {
            return {
                progress: 0,
                progressPercent: 0,
                progressString: '0.00'
            };
        }

        try {
            const reserve = _bignumber(tokenInfo.reserve1.toString());
            const target = _bignumber(tokenInfo.target.toString());

            if (target.isZero()) {
                return {
                    progress: 0,
                    progressPercent: 0,
                    progressString: '0.00'
                };
            }

            const progressNumber = reserve.div(target).times(100).dp(2).toNumber();
            const finalProgress = Math.min(progressNumber, 100);

            return {
                progress: finalProgress,
                progressPercent: finalProgress,
                progressString: finalProgress.toFixed(2)
            };
        } catch (error) {
            console.error('计算进度失败:', error);
            return {
                progress: 0,
                progressPercent: 0,
                progressString: '0.00'
            };
        }
    }, [tokenInfo]);

    useEffect(() => {
        console.log('Token Address:', params.addr);
        console.log('URI Loading:', uriLoading, 'URI:', tokenUri);
        console.log('Info Loading:', infoLoading, 'Info:', tokenInfo);
        console.log('Metadata Loading:', metadataLoading, 'Metadata:', tokenMetadata);
        console.log('Progress Data:', progressData);
    }, [params.addr, uriLoading, tokenUri, infoLoading, tokenInfo, metadataLoading, tokenMetadata, progressData]);

    return (
        <div className="w-full max-w-[450px] px-[16px] flex flex-col h-full min-h-[calc(100vh-56px)]">
            <div className="flex items-center justify-between relative pt-[16px]">
                <div onClick={() => router.push("/")} className="relative z-1 w-[40px] h-[40px] border border-[#F3F3F3] cursor-pointer flex items-center justify-center">
                    <BackIcon />
                </div>
                <div onClick={() => { onOpen() }} className="relative z-1 w-[40px] h-[40px] border border-[#F3F3F3] cursor-pointer flex items-center justify-center">
                    <img src="/share.png" alt="share" width="18" height="18" className="w-[18px] h-[18px]" />
                </div>
            </div>
            <Top metaData={tokenMetadata} tokenInfo={tokenInfo} progressData={progressData} />
            <div className="flex-1 mt-[30px]"></div>
            <Trade metaData={tokenMetadata} progressData={progressData} />
            <ResponsiveDialog
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                title='分享代幣'
                maxVH={70}
                size="md"
                classNames={{ body: "text-[#fff]" }}
            >
                <div className="flex flex-col items-center pt-[0px]">
                    <Image
                        src={tokenMetadata?.image || "/default.png"}
                        alt='tokenAvatar'
                        className="w-[60px] h-[60px] border-1 border-[#F3F3F3] rounded-[0px] object-cover"
                        width={60}
                        height={60}
                    />
                    <div className="text-[20px] text-[#101010] mt-[14px] font-bold">${tokenMetadata?.symbol}</div>
                    <div className="text-[16px] text-[#666] mt-[8px]">{tokenMetadata?.name}</div>
                    <Button
                        fullWidth
                        radius="none"
                        className="text-[14px] text-[#101010] bg-[#F3F3F3] h-[48px] mt-[22px]"
                        onPress={() => {
                            copy(`https://okbro.fun/meme/${tokenAddress}`);
                        }}
                    >
                        複製連結
                    </Button>
                    <Button
                        fullWidth
                        radius="none"
                        className="text-[14px] bg-[#101010] text-[#FFF] h-[48px] my-[12px]"
                        onPress={() => {
                            const text = `https://okbro.fun/meme/${tokenAddress}`
                            const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
                            window.open(url, "_blank");
                        }}
                    >
                        分享到 X
                    </Button>
                </div>
            </ResponsiveDialog>
        </div>
    );
};

export default Details;

const BackIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" fill="none">
        <rect x="1.55029" y="0.843262" width="15" height="1" transform="rotate(45 1.55029 0.843262)" fill="#101010" />
        <rect x="11.4497" y="0.843262" width="1" height="15" transform="rotate(45 11.4497 0.843262)" fill="#101010" />
    </svg>
);
