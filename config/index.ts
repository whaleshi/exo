import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { bscTestnet, xLayer, morphHolesky } from "@reown/appkit/networks";
import type { AppKitNetwork } from "@reown/appkit/networks";

// Get projectId from https://cloud.reown.com
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || "cf29fa9397c7812afa53a3e0cdaf5764"; // this is a public projectId only to use on localhost

if (!projectId) {
    throw new Error("Project ID is not defined");
}

// 定义 Localhost 网络
const localhost: AppKitNetwork = {
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
};

const plasma: AppKitNetwork = {
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
};

export const networks = [plasma] as [AppKitNetwork, ...AppKitNetwork[]];

export const ethersAdapter = new EthersAdapter();
