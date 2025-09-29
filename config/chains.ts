// 网络配置 - 只需要在这里修改，其他地方会自动更新
export const CHAINS_CONFIG = {
    // 默认链 - 修改这里即可切换整个应用的默认网络
    DEFAULT_CHAIN: {
        // id: 196,
        // name: "X Layer Mainnet",
        // nativeCurrency: {
        //     decimals: 18,
        //     name: "OKB",
        //     symbol: "OKB",
        // },
        // rpcUrls: {
        //     default: { http: ["https://rpc.xlayer.tech"] },
        // },
        // blockExplorers: {
        //     default: {
        //         name: "OKLink",
        //         url: "https://www.oklink.com/xlayer",
        //         apiUrl: "https://www.oklink.com/api/v5/explorer/xlayer/api",
        //     },
        // },
        // contracts: {
        //     multicall3: {
        //         address: "0xcA11bde05977b3631167028862bE2a173976CA11",
        //         blockCreated: 47416,
        //     },
        // },
        //
        id: 2810,
        name: "Morph Holesky",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        rpcUrls: {
            default: {
                http: ["https://rpc-holesky.morphl2.io"],
                webSocket: ["wss://rpc-quicknode-holesky.morphl2.io"],
            },
        },
        blockExplorers: {
            default: {
                name: "Morph Holesky Explorer",
                url: "https://explorer-holesky.morphl2.io",
                apiUrl: "https://explorer-api-holesky.morphl2.io/api?",
            },
        },
        testnet: true,
        // id: 9745,
        // name: "Plasma",
        // nativeCurrency: {
        //     decimals: 18,
        //     name: "XPL",
        //     symbol: "XPL",
        // },
        // rpcUrls: {
        //     default: { http: ["https://rpc.plasma.to"] },
        // },
        // blockExplorers: {
        //     default: {
        //         name: "Plasma Explorer",
        //         url: "https://plasmascan.to/",
        //         apiUrl: "https://plasmascan.to/",
        //     },
        // },
        // contracts: {
        //     multicall3: {
        //         address: "0xcA11bde05977b3631167028862bE2a173976CA11",
        //         blockCreated: 0,
        //     },
        // },
    },

    // 支持的链列表 - 按优先级排序
    SUPPORTED_CHAINS: [
        {
            id: 31337,
            name: "Localhost",
            nativeCurrency: {
                decimals: 18,
                name: "ETH",
                symbol: "ETH",
            },
            rpcUrls: {
                default: { http: ["http://72.167.44.157:8545"] },
            },
            blockExplorers: {
                default: {
                    name: "Local Explorer",
                    url: "http://localhost:8888",
                    apiUrl: "http://localhost:8888/api",
                },
            },
            contracts: {
                multicall3: {
                    address: "0xcA11bde05977b3631167028862bE2a173976CA11",
                    blockCreated: 0,
                },
            },
        },
        {
            id: 196,
            name: "X Layer Mainnet",
            nativeCurrency: {
                decimals: 18,
                name: "OKB",
                symbol: "OKB",
            },
            rpcUrls: {
                default: { http: ["https://rpc.xlayer.tech"] },
            },
            blockExplorers: {
                default: {
                    name: "OKLink",
                    url: "https://www.oklink.com/xlayer",
                    apiUrl: "https://www.oklink.com/api/v5/explorer/xlayer/api",
                },
            },
            contracts: {
                multicall3: {
                    address: "0xcA11bde05977b3631167028862bE2a173976CA11",
                    blockCreated: 47416,
                },
            },
        },
        {
            id: 2810,
            name: "Morph Holesky",
            nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
            rpcUrls: {
                default: {
                    http: ["https://rpc-holesky.morphl2.io"],
                    webSocket: ["wss://rpc-quicknode-holesky.morphl2.io"],
                },
            },
            blockExplorers: {
                default: {
                    name: "Morph Holesky Explorer",
                    url: "https://explorer-holesky.morphl2.io",
                    apiUrl: "https://explorer-api-holesky.morphl2.io/api?",
                },
            },
            testnet: true,
        },
        {
            id: 9745,
            name: "Plasma",
            nativeCurrency: {
                decimals: 18,
                name: "XPL",
                symbol: "XPL",
            },
            rpcUrls: {
                default: { http: ["https://rpc.plasma.to"] },
            },
            blockExplorers: {
                default: {
                    name: "Plasma Explorer",
                    url: "https://plasmascan.to/",
                    apiUrl: "https://plasmascan.to/",
                },
            },
            contracts: {
                multicall3: {
                    address: "0xcA11bde05977b3631167028862bE2a173976CA11",
                    blockCreated: 0,
                },
            },
        },
    ],

    // 链相关配置
    CHAIN_CONFIG: {
        [31337]: {
            name: "Localhost",
            symbol: "ETH",
            explorerUrl: "http://localhost:8888",
            rpcUrl: "http://72.167.44.157:8545",
        },
        [196]: {
            name: "X Layer",
            symbol: "OKB",
            explorerUrl: "https://www.oklink.com/x-layer",
            rpcUrl: "https://rpc.xlayer.tech", // 使用默认RPC
        },
        [2810]: {
            name: "Morph Holesky",
            symbol: "ETH",
            explorerUrl: "https://explorer-holesky.morphl2.io",
            rpcUrl: "https://rpc-holesky.morphl2.io",
        },
        [9745]: {
            name: "Plasma",
            symbol: "XPL",
            explorerUrl: "https://plasmascan.to/",
            rpcUrl: "https://rpc.plasma.to",
        },
    },
} as const;

// 导出常用的配置
export const DEFAULT_CHAIN_ID = CHAINS_CONFIG.DEFAULT_CHAIN.id;
export const DEFAULT_CHAIN_CONFIG = CHAINS_CONFIG.CHAIN_CONFIG[DEFAULT_CHAIN_ID];

// 获取当前默认链的配置信息
export const getCurrentChainConfig = () => ({
    chainId: DEFAULT_CHAIN_ID,
    name: DEFAULT_CHAIN_CONFIG.name,
    symbol: DEFAULT_CHAIN_CONFIG.symbol,
    explorerUrl: DEFAULT_CHAIN_CONFIG.explorerUrl,
    rpcUrl: DEFAULT_CHAIN_CONFIG.rpcUrl,
});

// 合约地址配置
export const CONTRACT_CONFIG = {
    // 工厂合约地址 - 用于创建新代币
    TokenManager: "0x4787F0c2cF30868579E32cD4e9B461D5aEef8190" as const,
    pEXOAirdrop: "0x3402978bF3139403843BBF44234b861c8B861b6F" as const,
    // TokenManager: "0x542B50C391DC143F12B538093D24d14c585909DF" as const,
    // pEXOAirdrop: "0x929D6684Bf29502b195ba993a2298A9b9afb09F6" as const,
} as const;

// Multicall3 合约地址 (通用地址，大多数链都支持)
export const MULTICALL3_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11";

// Multicall3 ABI
export const MULTICALL3_ABI = [
    {
        inputs: [
            {
                components: [
                    { internalType: "address", name: "target", type: "address" },
                    { internalType: "bool", name: "allowFailure", type: "bool" },
                    { internalType: "bytes", name: "callData", type: "bytes" },
                ],
                internalType: "struct Multicall3.Call3[]",
                name: "calls",
                type: "tuple[]",
            },
        ],
        name: "aggregate3",
        outputs: [
            {
                components: [
                    { internalType: "bool", name: "success", type: "bool" },
                    { internalType: "bytes", name: "returnData", type: "bytes" },
                ],
                internalType: "struct Multicall3.Result[]",
                name: "returnData",
                type: "tuple[]",
            },
        ],
        stateMutability: "payable",
        type: "function",
    },
];
