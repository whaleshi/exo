"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Pagination } from "@heroui/react";
import _bignumber from "bignumber.js";
import Link from "next/link";
import { ethers } from "ethers";
import { CONTRACT_CONFIG, DEFAULT_CHAIN_CONFIG, MULTICALL3_ADDRESS, MULTICALL3_ABI } from "@/config/chains";
import FactoryABI from "@/constant/TokenManager.abi.json";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import useOkxPrice from "@/hooks/useOkxPrice";

const List = () => {
    const router = useRouter();
    const [active, setActive] = useState(0);
    const [tokenList, setTokenList] = useState<any[]>([]);
    const [tokenMetadata, setTokenMetadata] = useState<{ [address: string]: any }>({});
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const tabs = [
        { id: 0, label: "Newly" },
        { id: 1, label: "Soaring" },
        { id: 2, label: "Launched" },
    ];

    const [page, setPage] = useState(0);
    const fetchedTokens = useRef(new Set<string>());
    const initialLoadDone = useRef(false);
    const { price } = useOkxPrice();

    const setHomeListPage = () => { };

    // 根据搜索查询过滤代币
    const getFilteredTokenList = (tokens: any[], query: string) => {
        if (!query || query.trim() === '') return tokens;

        return tokens.filter(token =>
            token.address && token.address.toLowerCase().includes(query.toLowerCase().trim())
        );
    };

    // 根据当前tab类型对token列表进行排序
    const getSortedTokenList = (tokens: any[], activeTab: number) => {
        if (!tokens || tokens.length === 0) return tokens;

        const sortedTokens = [...tokens];

        switch (activeTab) {
            case 0: // 新创建 - 倒序 (最新的在前)，过滤掉100%进度的
                return sortedTokens
                    .filter(token => parseFloat(token.progress || '0') < 100)
                    .reverse();

            case 1: // 飙升 - 按进度最高排序，过滤掉100%进度的
                return sortedTokens
                    .filter(token => parseFloat(token.progress || '0') < 100)
                    .sort((a, b) => {
                        const progressA = parseFloat(a.progress || '0');
                        const progressB = parseFloat(b.progress || '0');
                        return progressB - progressA; // 降序
                    });

            case 2: // 新开盘 - 只显示launched=true的token
                const launchedTokens = sortedTokens.filter(token => token.launched === true);
                // 按进度降序排列已启动的token
                return launchedTokens.sort((a, b) => {
                    const progressA = parseFloat(a.progress || '0');
                    const progressB = parseFloat(b.progress || '0');
                    return progressB - progressA;
                });

            case 3: // 热门 - 待定，暂时按进度排序
                return sortedTokens.sort((a, b) => {
                    const progressA = parseFloat(a.progress || '0');
                    const progressB = parseFloat(b.progress || '0');
                    return progressB - progressA;
                });

            default:
                return sortedTokens;
        }
    };

    // 根据URI获取token的metadata信息 - 分批处理避免并发过多
    const fetchTokenMetadata = useCallback(async (tokens: any[]) => {
        try {
            console.log('Fetching token metadata from URIs...');

            // 分批处理，每批10个请求
            const BATCH_SIZE = 10;
            const allMetadata: { [address: string]: any } = {};

            for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
                const batch = tokens.slice(i, i + BATCH_SIZE);
                console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(tokens.length / BATCH_SIZE)}`);

                const batchPromises = batch.map(async (token) => {

                    if (!token.uri || token.uri === '') {
                        return {
                            address: token.address,
                            metadata: null,
                            name: `Token ${token.address.slice(0, 6)}...${token.address.slice(-4)}`,
                            symbol: 'UNKNOWN',
                            description: '',
                            image: null
                        };
                    }

                    try {
                        // 处理IPFS URI
                        let fetchUrl = token.uri;
                        if (token.uri.startsWith('Qm') || token.uri.startsWith('bafy')) {
                            fetchUrl = `https://ipfs.io/ipfs/${token.uri}`;
                        } else if (token.uri.startsWith('ipfs://')) {
                            fetchUrl = token.uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
                        }

                        console.log(`Fetching metadata for token ${token.address}:`, fetchUrl);

                        const response = await fetch(fetchUrl);
                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}`);
                        }

                        const metadata = await response.json();

                        return {
                            address: token.address,
                            metadata,
                            name: metadata.name || `Token ${token.address.slice(0, 6)}...${token.address.slice(-4)}`,
                            symbol: metadata.symbol || 'UNKNOWN',
                            description: metadata.description || '',
                            image: metadata.image || null,
                            website: metadata.website || '',
                            x: metadata.x || '',
                            telegram: metadata.telegram || ''
                        };
                    } catch (error) {
                        console.warn(`Failed to fetch metadata for token ${token.address}:`, error);
                        return {
                            address: token.address,
                            metadata: null,
                            name: `Token ${token.address.slice(0, 6)}...${token.address.slice(-4)}`,
                            symbol: 'UNKNOWN',
                            description: '',
                            image: null
                        };
                    }
                });

                // 等待当前批次完成
                const batchResults = await Promise.allSettled(batchPromises);
                batchResults.forEach((result, batchIndex) => {
                    const token = batch[batchIndex];
                    if (result.status === 'fulfilled') {
                        allMetadata[token.address] = result.value;
                    } else {
                        console.warn(`Failed to process metadata for token ${token.address}:`, result.reason);
                        allMetadata[token.address] = {
                            address: token.address,
                            metadata: null,
                            name: `Token ${token.address.slice(0, 6)}...${token.address.slice(-4)}`,
                            symbol: 'UNKNOWN',
                            description: '',
                            image: null
                        };
                    }
                });

                // 批次间添加小延迟，避免过于频繁的请求
                if (i + BATCH_SIZE < tokens.length) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

            setTokenMetadata(prev => ({ ...prev, ...allMetadata }));
            console.log('Token metadata fetched:', allMetadata);

            // 记录已获取metadata的token
            tokens.forEach(token => {
                fetchedTokens.current.add(token.address);
            });

        } catch (error) {
            console.error('Error fetching token metadata:', error);
        }
    }, [setTokenMetadata]);

    // 使用 useQuery 获取合约数据（动态数据，3秒轮询）
    const { data: contractData, isLoading: contractLoading, isFetching, error } = useQuery({
        queryKey: ['tokenContractData'],
        queryFn: async () => {
            const provider = new ethers.JsonRpcProvider(DEFAULT_CHAIN_CONFIG.rpcUrl);
            const factoryContract = new ethers.Contract(CONTRACT_CONFIG.TokenManager, FactoryABI, provider);
            const factoryInterface = new ethers.Interface(FactoryABI);

            console.log('Calling allTokens method...');
            const count = await factoryContract.allTokens();
            const tokenCount = Number(count);

            console.log('Token count from allTokens:', tokenCount);

            if (tokenCount === 0) {
                return { tokenCount: 0, tokens: [] };
            }

            // 使用 Multicall 批量获取所有代币地址
            const multicallContract = new ethers.Contract(MULTICALL3_ADDRESS, MULTICALL3_ABI, provider);

            // 准备 multicall 调用获取地址
            const addressCalls = [];
            for (let i = 0; i < tokenCount; i++) {
                addressCalls.push({
                    target: CONTRACT_CONFIG.TokenManager,
                    allowFailure: true,
                    callData: factoryInterface.encodeFunctionData("tokens", [i]),
                });
            }

            console.log(`Executing Multicall for ${tokenCount} token addresses...`);
            let addressResults;
            try {
                addressResults = await multicallContract.aggregate3.staticCall(addressCalls);
            } catch (staticCallError) {
                console.log('staticCall failed, trying regular call:', staticCallError);
                addressResults = await multicallContract.aggregate3(addressCalls);
            }

            // 解析地址结果
            const addresses: string[] = [];
            addressResults.forEach((result: any, index: number) => {
                if (result.success) {
                    try {
                        const [tokenAddress] = factoryInterface.decodeFunctionResult("tokens", result.returnData);
                        addresses.push(tokenAddress);
                        console.log(`Token ${index}: ${tokenAddress}`);
                    } catch (error) {
                        console.warn(`Failed to decode token address at index ${index}:`, error);
                        addresses.push('');
                    }
                } else {
                    console.warn(`Failed to get token address at index ${index}`);
                    addresses.push('');
                }
            });

            const validAddresses = addresses.filter(addr => addr && addr !== '');
            if (validAddresses.length === 0) {
                return { tokenCount, tokens: [] };
            }

            // 获取 URI 和 tokensInfo
            const dataCalls = [];
            for (const address of validAddresses) {
                // URI 调用
                dataCalls.push({
                    target: CONTRACT_CONFIG.TokenManager,
                    allowFailure: true,
                    callData: factoryInterface.encodeFunctionData("uri", [address]),
                });
                // tokensInfo 调用
                dataCalls.push({
                    target: CONTRACT_CONFIG.TokenManager,
                    allowFailure: true,
                    callData: factoryInterface.encodeFunctionData("tokensInfo", [address]),
                });
                // symbol 调用（直接调用 token 合约的 symbol() 方法）
                const abiCoder = new ethers.AbiCoder();
                const symbolSelector = ethers.id("symbol()").slice(0, 10); // 0x95d89b41
                dataCalls.push({
                    target: address,
                    allowFailure: true,
                    callData: symbolSelector, // symbol() 无参数
                });
            }

            console.log(`Executing Multicall for ${validAddresses.length} tokens data...`);
            let dataResults;
            try {
                dataResults = await multicallContract.aggregate3.staticCall(dataCalls);
            } catch (staticCallError) {
                console.log('staticCall failed, trying regular call:', staticCallError);
                dataResults = await multicallContract.aggregate3(dataCalls);
            }

            // 解析结果并组合成完整的token数组
            const tokens = validAddresses.map((address, index) => {
                const uriIndex = index * 3;
                const infoIndex = index * 3 + 1;
                const symbolIndex = index * 3 + 2;

                // 解析 URI
                let uri = '';
                if (dataResults[uriIndex]?.success) {
                    try {
                        const [tokenUri] = factoryInterface.decodeFunctionResult("uri", dataResults[uriIndex].returnData);
                        uri = tokenUri;
                    } catch (error) {
                        console.warn(`Failed to decode URI for token ${address}:`, error);
                    }
                }

                // 解析 tokensInfo
                let tokenInfo = null;
                if (dataResults[infoIndex]?.success) {
                    try {
                        const tokenInfoResult = factoryInterface.decodeFunctionResult("tokensInfo", dataResults[infoIndex].returnData);
                        tokenInfo = {
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
                    } catch (error) {
                        console.warn(`Failed to decode tokensInfo for token ${address}:`, error);
                    }
                }

                // 计算进度
                let progress = 0;
                if (tokenInfo && tokenInfo.reserve1 && tokenInfo.target) {
                    const reserve = _bignumber(tokenInfo.reserve1);
                    const target = _bignumber(tokenInfo.target);
                    if (!target.isZero()) {
                        progress = _bignumber(reserve).div(target).times(100).dp(2).toNumber();
                        progress = Math.min(progress, 100);
                    }
                }

                return {
                    id: address,
                    address: address,
                    uri: uri,
                    info: tokenInfo,
                    launched: tokenInfo?.launched || false,
                    progress: progress.toFixed(2),
                    progressPercent: progress,
                    symbol: (() => {
                        if (dataResults[symbolIndex]?.success) {
                            try {
                                const abiCoder = new ethers.AbiCoder();
                                const symbolResult = abiCoder.decode(["string"], dataResults[symbolIndex].returnData);
                                return symbolResult[0];
                            } catch (error) {
                                console.warn(`Failed to decode symbol for token ${address}:`, error);
                                return "UNKNOWN";
                            }
                        }
                        return "UNKNOWN";
                    })(),
                };
            });

            return { tokenCount, tokens };
        },
        refetchInterval: 3000, // 3秒轮询
        staleTime: 0, // 数据立即过期，确保每次都重新获取
        gcTime: 30000, // 30秒后清理缓存，保留更久
        // React Query v5配置：防止数据闪烁
        placeholderData: (previousData) => previousData, // 保持之前的数据，直到新数据获取成功
        retry: 3, // 重试3次
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // 指数退避
        // 网络错误时的优化配置
        networkMode: 'online', // 只在在线时运行
        refetchOnWindowFocus: false, // 窗口聚焦时不重新获取
        refetchOnReconnect: true, // 重新连接时获取
    });
    // 设置数据到原有状态（保持兼容性）
    useEffect(() => {
        if (contractData) {
            setTokenList(contractData.tokens);

            // 获取有URI的tokens的metadata（只有首次或新token时才获取）
            const tokensWithUri = contractData.tokens.filter((token: any) => token.uri && token.uri !== '');
            if (tokensWithUri.length > 0) {
                // 检查是否有新的token需要获取metadata - 使用ref避免状态循环依赖
                const newTokens = tokensWithUri.filter((token: any) => !fetchedTokens.current.has(token.address));
                if (newTokens.length > 0) {
                    console.log('Fetching metadata for new tokens:', newTokens.map(t => t.address));
                    fetchTokenMetadata(newTokens);
                }
            }
        }
    }, [contractData, fetchTokenMetadata]); // 移除tokenMetadata依赖，使用ref追踪

    // 标记首次加载完成，仅用于 skeleton 控制
    useEffect(() => {
        if (!contractLoading) {
            initialLoadDone.current = true;
        }
    }, [contractLoading]);

    return (
        <div className="w-full max-w-[450px] pb-[32px] mx-auto px-[16px]">
            <div className="h-[54px] w-full flex items-center justify-between relative ">
                <div className="flex gap-[24px] text-[16px]">
                    {tabs.map((tab) => (
                        <div
                            key={tab.id}
                            className={
                                active === tab.id
                                    ? "text-[#101010] cursor-pointer"
                                    : "cursor-pointer text-[#999]"
                            }
                            onClick={() => setActive(tab.id)}
                        >
                            {tab.label}
                        </div>
                    ))}
                </div>
                <div
                    className="h-[32px] px-[12px] flex items-center gap-[4px] cursor-pointer bg-[#F8F8F8] text-[#101010] text-[13px]"
                    onClick={() => router.push('/search')}
                >
                    Search
                </div>
            </div>
            {(() => {
                // 首屏加载：仅首次加载前展示 skeleton
                if (!initialLoadDone.current && contractLoading) {
                    return (
                        <div className="mt-[8px] space-y-[8px]">
                            {[0, 1, 2].map((i) => (
                                <div key={i} className="h-[72px] flex items-center bg-[#F8F8F8] px-[16px] animate-pulse">
                                    <div className="w-[48px] h-[48px] bg-[#F3F3F3]" />
                                    <div className="ml-[8px] flex-1">
                                        <div className="h-[16px] w-[120px] bg-[#F3F3F3] mb-[8px]" />
                                        <div className="h-[12px] w-[200px] bg-[#F3F3F3]" />
                                    </div>
                                    <div className="w-[60px] h-[32px] bg-[#F3F3F3]" />
                                </div>
                            ))}
                        </div>
                    );
                }

                // 先根据搜索查询过滤，再根据tab排序
                const filteredList = getFilteredTokenList(tokenList, searchQuery);
                const sortedList = getSortedTokenList(filteredList, active);

                return (sortedList?.length ?? 0) > 0
                    ? sortedList?.map((item: any, index: number) => (
                        <Link
                            href={`/meme/${item?.id}`}
                            prefetch={true}
                            className="h-[72px] flex items-center f5001 cursor-pointer bg-[#F8F8F8] mb-[8px] px-[12px]"
                            key={index}
                        >
                            <img
                                src={tokenMetadata[item.address]?.image || "/default.png"}
                                className="w-[48px] h-[48px] rounded-[0px] bg-[#F8F8F8] shrink-0 object-cover"
                            // alt="token"
                            />
                            <div className="h-[40px] flex flex-col justify-center ml-[8px]">
                                <div className="text-[15px] font-medium text-[#101010]">
                                    {(() => {
                                        const symbol = item?.symbol;
                                        if (symbol && symbol !== 'UNKNOWN') {
                                            return symbol;
                                        }
                                        return item?.address && item.address.length > 15
                                            ? `${item.address.slice(0, 6)}...${item.address.slice(-4)}`
                                            : item?.address;
                                    })()}
                                </div>
                                <div>
                                    <span className="text-[11px] font-medium text-[rgba(170,170,170,1)]">
                                        MC{" "}
                                        <i className="not-italic text-[11px]  font-medium text-[#101010]">
                                            ${_bignumber(item?.info?.lastPrice ?? 0).div(1e18).times(1300000000).times(price ?? 0).dp(2).toString() || '--'}
                                        </i>
                                    </span>
                                    {/* <span className="text-[11px] font-medium text-[rgba(170,170,170,1)] ml-2.5">
                                        24H{" "}
                                        <i className={`not-italic text-[11px] font-medium ${item?.launched ? 'text-[#569F8C]' : 'text-[#999]'}`}>
                                            --
                                        </i>
                                    </span> */}
                                </div>
                            </div>
                            <div className="flex items-center justify-end flex-1">
                                <div className="w-[60px] h-[32px] relative flex items-center justify-center">
                                    <div
                                        className="w-full h-full  flex items-center justify-center"
                                        style={{
                                            background: "#DDEFEA",
                                            backgroundImage:
                                                `linear-gradient(to right, #569F8C ${item?.progressPercent || 0}%, #DDEFEA ${item?.progressPercent || 0}%)`,
                                        }}
                                    >
                                        <span className="text-[12px] text-[#101010]">
                                            {item?.progress || '0.00'}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))
                    : (
                        <div className="flex flex-col items-center justify-center py-[60px] pt-[100px]">
                            <img
                                src="/default.png"
                                alt="default"
                                className="w-[120px] h-[120px] opacity-50"
                                onError={(e) => {
                                    // 如果图片加载失败，使用默认图片或隐藏
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                            <div className="text-[#999] mt-[16px] text-[14px]">
                                {searchQuery ? 'Nothing Here' : 'Nothing Here'}
                            </div>
                        </div>
                    );
            })()}
            {/* {!contractLoading && (tokenList?.length ?? 0) > 0 && (
                <div className="w-full flex justify-center my-[20px]">
                    <Pagination
                        showControls
                        page={page}
                        onChange={setHomeListPage}
                        total={30}
                        color="success"
                        variant="faded"
                        classNames={{
                            item: "bg-white border-[1px] border-[#F3F3F3] rounded-none text-[12px] w-[24px] h-[24px] min-w-[24px] data-[active=true]:bg-[#333] data-[active=true]:text-[#FFF] data-[selected=true]:bg-[#333] data-[selected=true]:text-[#FFF]",
                            cursor: "bg-[#333] text-[#FFF] rounded-none border-[1px] border-[#F3F3F3] text-[12px] w-[24px] h-[24px] min-w-[24px]",
                            prev: "bg-white rounded-none border-[1px] border-[#F3F3F3] text-[12px] w-[24px] h-[24px] min-w-[24px]",
                            next: "bg-white rounded-none border-[1px] border-[#F3F3F3] text-[12px] w-[24px] h-[24px] min-w-[24px]"
                        }}
                    />
                </div>
            )} */}
        </div>
    );
};

export default List;

const CloseIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" fill="none">
        <rect x="1.55029" y="0.843262" width="15" height="1" transform="rotate(45 1.55029 0.843262)" fill="#101010" />
        <rect x="11.4497" y="0.843262" width="1" height="15" transform="rotate(45 11.4497 0.843262)" fill="#101010" />
    </svg>
);
