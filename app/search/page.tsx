'use client'
import React, { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import _bignumber from "bignumber.js";
import { CONTRACT_CONFIG, DEFAULT_CHAIN_CONFIG, MULTICALL3_ADDRESS, MULTICALL3_ABI } from "@/config/chains";
import FactoryABI from "@/constant/abi.json";
import useOkxPrice from "@/hooks/useOkxPrice";

const CloseIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" fill="none">
        <rect x="1.55029" y="0.843262" width="15" height="1" transform="rotate(45 1.55029 0.843262)" fill="#101010" />
        <rect x="11.4497" y="0.843262" width="1" height="15" transform="rotate(45 11.4497 0.843262)" fill="#101010" />
    </svg>
);

const SearchPage = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [tokenList, setTokenList] = useState<any[]>([]);
    const [tokenMetadata, setTokenMetadata] = useState<{ [address: string]: any }>({});
    const fetchedTokens = useRef(new Set<string>());
    const { price } = useOkxPrice();

    // 获取合约数据
    useEffect(() => {
        const fetchTokens = async () => {
            const provider = new ethers.JsonRpcProvider(DEFAULT_CHAIN_CONFIG.rpcUrl);
            const factoryContract = new ethers.Contract(CONTRACT_CONFIG.TokenManager, FactoryABI, provider);
            const factoryInterface = new ethers.Interface(FactoryABI);
            const count = await factoryContract.allTokens();
            const tokenCount = Number(count);
            if (tokenCount === 0) return setTokenList([]);
            const multicallContract = new ethers.Contract(MULTICALL3_ADDRESS, MULTICALL3_ABI, provider);
            const addressCalls = [];
            for (let i = 0; i < tokenCount; i++) {
                addressCalls.push({
                    target: CONTRACT_CONFIG.TokenManager,
                    allowFailure: true,
                    callData: factoryInterface.encodeFunctionData("tokens", [i]),
                });
            }
            let addressResults;
            try {
                addressResults = await multicallContract.aggregate3.staticCall(addressCalls);
            } catch {
                addressResults = await multicallContract.aggregate3(addressCalls);
            }
            const addresses: string[] = [];
            addressResults.forEach((result: any, index: number) => {
                if (result.success) {
                    try {
                        const [tokenAddress] = factoryInterface.decodeFunctionResult("tokens", result.returnData);
                        addresses.push(tokenAddress);
                    } catch {
                        addresses.push("");
                    }
                } else {
                    addresses.push("");
                }
            });
            const validAddresses = addresses.filter(addr => addr && addr !== "");
            if (validAddresses.length === 0) return setTokenList([]);
            // 获取 URI 和 tokensInfo
            const dataCalls = [];
            for (const address of validAddresses) {
                dataCalls.push({
                    target: CONTRACT_CONFIG.TokenManager,
                    allowFailure: true,
                    callData: factoryInterface.encodeFunctionData("uri", [address]),
                });
                dataCalls.push({
                    target: CONTRACT_CONFIG.TokenManager,
                    allowFailure: true,
                    callData: factoryInterface.encodeFunctionData("tokensInfo", [address]),
                });
                // symbol 调用（直接调用 token 合约的 symbol() 方法）
                const symbolSelector = ethers.id("symbol()").slice(0, 10); // 0x95d89b41
                dataCalls.push({
                    target: address,
                    allowFailure: true,
                    callData: symbolSelector,
                });
            }
            let dataResults;
            try {
                dataResults = await multicallContract.aggregate3.staticCall(dataCalls);
            } catch {
                dataResults = await multicallContract.aggregate3(dataCalls);
            }
            const tokens = validAddresses.map((address, index) => {
                const uriIndex = index * 3;
                const infoIndex = index * 3 + 1;
                const symbolIndex = index * 3 + 2;
                let uri = "";
                if (dataResults[uriIndex]?.success) {
                    try {
                        const [tokenUri] = factoryInterface.decodeFunctionResult("uri", dataResults[uriIndex].returnData);
                        uri = tokenUri;
                    } catch { }
                }
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
                    } catch { }
                }
                // 解析symbol
                let symbol = "UNKNOWN";
                if (dataResults[symbolIndex]?.success) {
                    try {
                        const abiCoder = new ethers.AbiCoder();
                        const symbolResult = abiCoder.decode(["string"], dataResults[symbolIndex].returnData);
                        symbol = symbolResult[0];
                    } catch { }
                }
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
                    symbol,
                };
            });
            setTokenList(tokens);
        };
        fetchTokens();
    }, []);

    // 获取metadata
    useEffect(() => {
        const fetchTokenMetadata = async (tokens: any[]) => {
            const BATCH_SIZE = 10;
            const allMetadata: { [address: string]: any } = {};
            for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
                const batch = tokens.slice(i, i + BATCH_SIZE);
                const batchPromises = batch.map(async (token: any) => {
                    if (!token.uri || token.uri === "") {
                        return {
                            address: token.address,
                            metadata: null,
                            name: `Token ${token.address.slice(0, 6)}...${token.address.slice(-4)}`,
                            symbol: "UNKNOWN",
                            description: "",
                            image: null
                        };
                    }
                    try {
                        let fetchUrl = token.uri;
                        if (token.uri.startsWith("Qm") || token.uri.startsWith("bafy")) {
                            fetchUrl = `https://ipfs.io/ipfs/${token.uri}`;
                        } else if (token.uri.startsWith("ipfs://")) {
                            fetchUrl = token.uri.replace("ipfs://", "https://ipfs.io/ipfs/");
                        }
                        const response = await fetch(fetchUrl);
                        if (!response.ok) throw new Error(`HTTP ${response.status}`);
                        const metadata = await response.json();
                        return {
                            address: token.address,
                            metadata,
                            name: metadata.name || `Token ${token.address.slice(0, 6)}...${token.address.slice(-4)}`,
                            symbol: metadata.symbol || "UNKNOWN",
                            description: metadata.description || "",
                            image: metadata.image || null,
                            website: metadata.website || "",
                            x: metadata.x || "",
                            telegram: metadata.telegram || ""
                        };
                    } catch {
                        return {
                            address: token.address,
                            metadata: null,
                            name: `Token ${token.address.slice(0, 6)}...${token.address.slice(-4)}`,
                            symbol: "UNKNOWN",
                            description: "",
                            image: null
                        };
                    }
                });
                const batchResults = await Promise.allSettled(batchPromises);
                batchResults.forEach((result, batchIndex) => {
                    const token = batch[batchIndex];
                    if (result.status === "fulfilled") {
                        allMetadata[token.address] = result.value;
                    } else {
                        allMetadata[token.address] = {
                            address: token.address,
                            metadata: null,
                            name: `Token ${token.address.slice(0, 6)}...${token.address.slice(-4)}`,
                            symbol: "UNKNOWN",
                            description: "",
                            image: null
                        };
                    }
                });
                if (i + BATCH_SIZE < tokens.length) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
            setTokenMetadata(prev => ({ ...prev, ...allMetadata }));
            tokens.forEach(token => {
                fetchedTokens.current.add(token.address);
            });
        };
        const tokensWithUri = tokenList.filter((token: any) => token.uri && token.uri !== "");
        const newTokens = tokensWithUri.filter((token: any) => !fetchedTokens.current.has(token.address));
        if (newTokens.length > 0) fetchTokenMetadata(newTokens);
    }, [tokenList]);

    // 搜索过滤
    const filteredList = searchQuery.trim() === ""
        ? []
        : tokenList.filter(token => token.address && token.address.toLowerCase().includes(searchQuery.toLowerCase().trim()));

    return (
        <div className="w-full max-w-[450px] pb-[32px] mx-auto px-[16px] pt-[16px]">
            <div className="w-full h-[42px] flex items-center gap-[12px] border-[#F3F3F3] border px-[16px] mb-4">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜尋戰壕..."
                    className="h-[42px] flex-1 outline-none text-[16px] text-[#101010] placeholder:text-[#999] bg-transparent"
                    autoFocus
                />
                {searchQuery.trim() !== "" && (
                    <div
                        className="cursor-pointer text-[#999] hover:text-[#101010] text-[20px] font-bold"
                        onClick={() => setSearchQuery("")}
                    >
                        <CloseIcon />
                    </div>
                )}
            </div>
            {searchQuery.trim() !== "" && (
                filteredList.length > 0 ? (
                    filteredList.map((item: any, index: number) => (
                        <Link
                            href={`/meme/${item.id}`}
                            prefetch={true}
                            className="h-[72px] flex items-center cursor-pointer bg-[#F8F8F8] mt-[8px] px-[12px]"
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
                                        戰壕市值{" "}
                                        <i className="not-italic text-[11px]  font-medium text-[#101010]">
                                            ${_bignumber(item?.info?.lastPrice ?? 0).div(1e18).times(1300000000).times(price ?? 0).dp(2).toString() || '--'}
                                        </i>
                                    </span>
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
                ) : (
                    <div className="flex flex-col items-center justify-center py-[60px] pt-[100px]">
                        <img src="/default.png" alt="default" className="w-[120px] h-[120px] opacity-50" />
                        <div className="text-[#999] mt-[16px] text-[14px]">Nothing Here</div>
                    </div>
                )
            )}
        </div>
    );
};

export default SearchPage;
