import { ethers } from "ethers";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { DEFAULT_CHAIN_CONFIG } from "@/config/chains";
import { useSlippageStore } from "@/stores/useSlippageStore";

export interface BuyResult {
    txHash: string;
    receipt: any;
    tokenAmountOut: string;
    refund: string;
}

export interface SellResult {
    txHash: string;
    receipt: any;
    approveTxHash: string | null;
    ethAmountOut: string;
    tokenBalance: string;
}

export const useTokenTrading = () => {
    const { address, isConnected } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider("eip155");
    const { slippage, getSlippageMultiplier } = useSlippageStore();

    // 买入逻辑封装
    const handleBuy = async (tokenAddress: string, ethAmount: string): Promise<BuyResult> => {
        console.log("=== 买入操作 ===");

        if (!isConnected || !address || !walletProvider) {
            throw new Error("请先连接钱包");
        }

        // 确保 walletProvider 是有效的 EIP-1193 provider
        if (typeof (walletProvider as any).request !== "function") {
            throw new Error("钱包提供者无效");
        }

        const { CONTRACT_CONFIG } = await import("@/config/chains");
        const contractABI = (await import("@/constant/TokenManager.abi.json")).default;

        const provider = new ethers.JsonRpcProvider(DEFAULT_CHAIN_CONFIG.rpcUrl);
        const ethersProvider = new ethers.BrowserProvider(walletProvider as any);
        const signer = await ethersProvider.getSigner();

        console.log("Calling tryBuy with parameters:");
        console.log("Token address:", tokenAddress);
        console.log("Amount:", ethers.parseEther(ethAmount));

        // 1. 调用 tryBuy 获取预期输出
        const readOnlyContract = new ethers.Contract(CONTRACT_CONFIG.TokenManager, contractABI, provider);
        const result = await readOnlyContract.tryBuy(tokenAddress, ethers.parseEther(ethAmount));

        console.log("tryBuy 返回值:", result);
        console.log("Token Amount Out:", result[0]?.toString());
        console.log("Refund:", result[1]?.toString());

        // 2. 计算滑点保护 - 修复滑点计算错误
        const tokenAmountOut = result[0];
        const slippagePercentage = slippage;
        const minAmountOut = (tokenAmountOut * BigInt(Math.floor((100 - slippagePercentage) * 100))) / BigInt(10000);

        console.log(`使用滑点: ${slippage}%`);

        console.log("调用 buyToken 参数:");
        console.log("Token address:", tokenAddress);
        console.log("Amount:", ethers.parseEther(ethAmount));
        console.log(`MinAmountOut (with ${slippage}% slippage):`, minAmountOut.toString());

        // 3. 执行买入交易
        const contract = new ethers.Contract(CONTRACT_CONFIG.TokenManager, contractABI, signer);

        console.log("发送 buyToken 交易...");

        // 估算 gas limit
        let gasLimit;
        try {
            const estimatedGas = await contract.buyToken.estimateGas(tokenAddress, ethers.parseEther(ethAmount), minAmountOut, {
                value: ethers.parseEther(ethAmount),
            });
            gasLimit = estimatedGas + (estimatedGas * BigInt(20)) / BigInt(100); // 修复：正确的+20%
            console.log("预估 Gas Limit:", gasLimit.toString());
        } catch (e) {
            console.warn("Gas 估算失败:", e);
            gasLimit = undefined;
        }

        // 获取 gas price
        const gasPrice = (await ethersProvider.getFeeData()).gasPrice;
        const newGasPrice = gasPrice ? gasPrice + (gasPrice * BigInt(5)) / BigInt(100) : null; // +5%
        console.log("Gas Price:", {
            original: gasPrice?.toString(),
            new: newGasPrice?.toString(),
        });

        const txOptions = {
            value: ethers.parseEther(ethAmount),
            type: 0, // 强制使用 Legacy 交易类型
        } as any;

        if (gasLimit) {
            txOptions.gasLimit = gasLimit;
        }
        if (newGasPrice) {
            txOptions.gasPrice = newGasPrice;
        }

        const buyResult = await contract.buyToken(tokenAddress, ethers.parseEther(ethAmount), minAmountOut, txOptions);

        console.log("buyToken 交易已发送:", buyResult.hash);
        const receipt = await buyResult.wait();
        console.log("buyToken 交易已确认:", receipt);

        return {
            txHash: buyResult.hash,
            receipt,
            tokenAmountOut: result[0]?.toString(),
            refund: result[1]?.toString(),
        };
    };

    // 卖出逻辑封装
    const handleSell = async (tokenAddress: string, tokenAmount: string): Promise<SellResult> => {
        console.log("=== 卖出操作 ===");

        if (!isConnected || !address || !walletProvider) {
            throw new Error("请先连接钱包");
        }

        // 确保 walletProvider 是有效的 EIP-1193 provider
        if (typeof (walletProvider as any).request !== "function") {
            throw new Error("钱包提供者无效");
        }

        const { CONTRACT_CONFIG } = await import("@/config/chains");
        const contractABI = (await import("@/constant/TokenManager.abi.json")).default;

        const provider = new ethers.JsonRpcProvider(DEFAULT_CHAIN_CONFIG.rpcUrl);
        const ethersProvider = new ethers.BrowserProvider(walletProvider as any);
        const signer = await ethersProvider.getSigner();

        // 1. 获取代币余额
        const tokenABI = [
            "function balanceOf(address owner) view returns (uint256)",
            "function approve(address spender, uint256 amount) returns (bool)",
            "function allowance(address owner, address spender) view returns (uint256)",
        ];

        const tokenContract = new ethers.Contract(tokenAddress, tokenABI, signer);
        const balance = await tokenContract.balanceOf(address);

        console.log("代币余额:", balance.toString());
        console.log("要卖出的数量:", tokenAmount);

        if (balance === BigInt(0)) {
            throw new Error("代币余额为0，无法卖出");
        }

        // 转换用户输入的金额为 wei
        const sellAmount = ethers.parseEther(tokenAmount);

        if (sellAmount > balance) {
            throw new Error("卖出数量超过余额");
        }

        // 2. 调用 trySell 获取预期输出
        const readOnlyContract = new ethers.Contract(CONTRACT_CONFIG.TokenManager, contractABI, provider);
        const sellResult = await readOnlyContract.trySell(tokenAddress, sellAmount);

        console.log("trySell 返回值:", sellResult);
        console.log("ETH Amount Out:", sellResult.toString());

        // 3. 计算滑点保护 - 修复滑点计算错误
        const ethAmountOut = sellResult;
        const slippagePercentage = slippage;
        const minEthOut = (ethAmountOut * BigInt(Math.floor((100 - slippagePercentage) * 100))) / BigInt(10000);

        console.log(`使用滑点: ${slippage}%`);
        console.log(`MinEthOut (with ${slippage}% slippage):`, minEthOut.toString());

        // 4. 检查和执行授权
        const factoryContract = new ethers.Contract(CONTRACT_CONFIG.TokenManager, contractABI, signer);
        const allowance = await tokenContract.allowance(address, CONTRACT_CONFIG.TokenManager);

        console.log("当前授权额度:", allowance.toString());

        let approveTxHash = null;
        if (allowance < sellAmount) {
            console.log("需要授权，发送 approve 交易...");
            console.log("授权数量: 无限授权 (uint256 最大值)");

            // 估算 approve 的 gas limit，使用最大值（用户全部余额）
            let approveGasLimit;
            try {
                const estimatedGas = await tokenContract.approve.estimateGas(
                    CONTRACT_CONFIG.TokenManager,
                    ethers.MaxUint256 // 使用最大 uint256 进行无限授权
                );
                approveGasLimit = estimatedGas + (estimatedGas * BigInt(20)) / BigInt(100); // 修复：正确的+20%
                console.log("Approve 预估 Gas Limit:", approveGasLimit.toString());
            } catch (e) {
                console.warn("Approve Gas 估算失败:", e);
                approveGasLimit = undefined;
            }

            // 获取 gas price
            const gasPrice = (await provider.getFeeData()).gasPrice;
            const newGasPrice = gasPrice ? gasPrice + (gasPrice * BigInt(5)) / BigInt(100) : null; // +5%

            const approveTxOptions = {
                type: 0, // 强制使用 Legacy 交易类型
            } as any;

            if (approveGasLimit) {
                approveTxOptions.gasLimit = approveGasLimit;
            }
            if (newGasPrice) {
                approveTxOptions.gasPrice = newGasPrice;
            }

            const approveResult = await tokenContract.approve(
                CONTRACT_CONFIG.TokenManager,
                ethers.MaxUint256, // 无限授权
                approveTxOptions
            );

            console.log("授权交易已发送:", approveResult.hash);
            const approveReceipt = await approveResult.wait();
            console.log("授权交易已确认:", approveReceipt);
            approveTxHash = approveResult.hash;
        }

        // 5. 执行卖出操作
        console.log("发送 sellToken 交易...");
        console.log("卖出参数:");
        console.log("Token address:", tokenAddress);
        console.log("Amount:", sellAmount.toString());
        console.log("MinAmountOut:", minEthOut.toString());

        // 估算 sellToken 的 gas limit
        let sellGasLimit;
        try {
            const estimatedGas = await factoryContract.sellToken.estimateGas(tokenAddress, sellAmount, minEthOut);
            sellGasLimit = estimatedGas + (estimatedGas * BigInt(20)) / BigInt(100); // 修复：正确的+20%
            console.log("SellToken 预估 Gas Limit:", sellGasLimit.toString());
        } catch (e) {
            console.warn("SellToken Gas 估算失败:", e);
            sellGasLimit = undefined;
        }

        // 获取 gas price
        const gasPrice = (await ethersProvider.getFeeData()).gasPrice;
        const newGasPrice = gasPrice ? gasPrice + (gasPrice * BigInt(5)) / BigInt(100) : null; // +5%
        console.log("SellToken Gas Price:", {
            original: gasPrice?.toString(),
            new: newGasPrice?.toString(),
        });

        const sellTxOptions = {
            type: 0, // 强制使用 Legacy 交易类型
        } as any;

        if (sellGasLimit) {
            sellTxOptions.gasLimit = sellGasLimit;
        }
        if (newGasPrice) {
            sellTxOptions.gasPrice = newGasPrice;
        }

        const sellTxResult = await factoryContract.sellToken(tokenAddress, sellAmount, minEthOut, sellTxOptions);

        console.log("sellToken 交易已发送:", sellTxResult.hash);
        const sellReceipt = await sellTxResult.wait();
        console.log("sellToken 交易已确认:", sellReceipt);

        return {
            txHash: sellTxResult.hash,
            receipt: sellReceipt,
            approveTxHash,
            ethAmountOut: ethAmountOut.toString(),
            tokenBalance: sellAmount.toString(),
        };
    };

    // 外盘 Swap 买入功能
    const handleSwapBuy = async (tokenAddress: string, ethAmount: string): Promise<BuyResult> => {
        console.log("=== 外盘 Swap 买入操作 ===");

        if (!isConnected || !address || !walletProvider) {
            throw new Error("请先连接钱包");
        }

        // 验证必要的配置
        const { CONTRACT_CONFIG } = await import("@/config/chains");
        if (!CONTRACT_CONFIG.ROUTER_CONTRACT || !CONTRACT_CONFIG.WETH_ADDRESS) {
            throw new Error("Missing external swap configuration");
        }

        const swapABI = (await import("@/constant/Swap.json")).default;
        const tokenManagerABI = (await import("@/constant/TokenManager.abi.json")).default;

        const provider = new ethers.JsonRpcProvider(DEFAULT_CHAIN_CONFIG.rpcUrl);
        const ethersProvider = new ethers.BrowserProvider(walletProvider as any);
        const signer = await ethersProvider.getSigner();

        const amount = ethers.parseEther(ethAmount);

        console.log("Swap 买入参数:");
        console.log("Token address:", tokenAddress);
        console.log("ETH Amount:", amount);

        // 1. 检查钱包余额
        const walletBalance = await ethersProvider.getBalance(address);

        console.log("钱包余额:", ethers.formatEther(walletBalance), "ETH");
        console.log("购买金额:", ethers.formatEther(amount), "ETH");

        if (walletBalance < amount) {
            throw new Error(
                `余额不足。你有 ${ethers.formatEther(walletBalance)} ETH 但试图花费 ${ethers.formatEther(amount)} ETH`
            );
        }

        // 2. 获取预期输出并计算滑点保护
        const path = [CONTRACT_CONFIG.WETH_ADDRESS, tokenAddress];
        const routerContract = new ethers.Contract(CONTRACT_CONFIG.ROUTER_CONTRACT, swapABI, provider);

        // 调用 getAmountsOut 获取预期输出
        const amounts = await routerContract.getAmountsOut(amount, path);

        const expectedTokenOut = amounts[1]; // 预期的代币输出量
        const slippagePercentage = slippage;
        const amountOutMin = (expectedTokenOut * BigInt(Math.floor((100 - slippagePercentage) * 100))) / BigInt(10000);

        console.log(`使用滑点: ${slippage}%`);
        console.log("预期代币输出:", ethers.formatEther(expectedTokenOut));
        console.log("最小代币输出:", ethers.formatEther(amountOutMin));

        // 3. 设置交易参数
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20分钟后过期

        // 4. 估算 gas
        const routerContractWithSigner = new ethers.Contract(CONTRACT_CONFIG.TokenManager, tokenManagerABI, signer);
        let gasLimit;
        try {
            const estimatedGas = await routerContractWithSigner.swapExactETHForTokens.estimateGas(
                amountOutMin,
                path,
                address,
                deadline,
                { value: amount }
            );
            gasLimit = estimatedGas + (estimatedGas * BigInt(20)) / BigInt(100); // 正确的+20%
            console.log("预估 Gas Limit:", gasLimit.toString());
        } catch (e) {
            console.warn("Gas 估算失败:", e);
            gasLimit = undefined;
        }

        // 5. 获取 gas price
        const gasPrice = (await ethersProvider.getFeeData()).gasPrice;
        const newGasPrice = gasPrice ? gasPrice + (gasPrice * BigInt(5)) / BigInt(100) : null; // +5%

        console.log("Gas Price:", {
            original: gasPrice?.toString(),
            new: newGasPrice?.toString(),
        });

        // 6. 执行 Swap 买入交易
        console.log("发送 swapExactETHForTokens 交易...");

        const txOptions = {
            value: amount,
            type: 0, // 强制使用 Legacy 交易类型
        } as any;

        if (gasLimit) {
            txOptions.gasLimit = gasLimit;
        }
        if (newGasPrice) {
            txOptions.gasPrice = newGasPrice;
        }

        const swapResult = await routerContractWithSigner.swapExactETHForTokens(amountOutMin, path, address, deadline, txOptions);

        console.log("swapExactETHForTokens 交易已发送:", swapResult.hash);
        const receipt = await swapResult.wait();
        console.log("swapExactETHForTokens 交易已确认:", receipt);

        return {
            txHash: swapResult.hash,
            receipt,
            tokenAmountOut: ethers.formatEther(expectedTokenOut),
            refund: "0",
        };
    };

    // 外盘 Swap 卖出功能
    const handleSwapSell = async (tokenAddress: string, tokenAmount: string): Promise<SellResult> => {
        console.log("=== 外盘 Swap 卖出操作 ===");

        if (!isConnected || !address || !walletProvider) {
            throw new Error("请先连接钱包");
        }

        // 验证必要的配置
        const { CONTRACT_CONFIG } = await import("@/config/chains");
        if (!CONTRACT_CONFIG.ROUTER_CONTRACT || !CONTRACT_CONFIG.WETH_ADDRESS) {
            throw new Error("Missing external swap configuration");
        }

        const swapABI = (await import("@/constant/Swap.json")).default;
        const tokenManagerABI = (await import("@/constant/TokenManager.abi.json")).default;

        const provider = new ethers.JsonRpcProvider(DEFAULT_CHAIN_CONFIG.rpcUrl);
        const ethersProvider = new ethers.BrowserProvider(walletProvider as any);
        const signer = await ethersProvider.getSigner();

        const tokenABI = [
            "function balanceOf(address owner) view returns (uint256)",
            "function approve(address spender, uint256 amount) returns (bool)",
            "function allowance(address owner, address spender) view returns (uint256)",
        ];

        // 1. 获取代币余额
        console.log("开始获取代币余额...");
        console.log("代币地址:", tokenAddress);
        console.log("用户地址:", address);

        const tokenContract = new ethers.Contract(tokenAddress, tokenABI, signer);
        let balance: bigint;
        try {
            balance = await tokenContract.balanceOf(address);

            console.log("成功获取代币余额:", balance.toString());
            console.log("要卖出的数量:", tokenAmount);
        } catch (error) {
            console.error("获取代币余额失败:", error);
            throw new Error(`Failed to get token balance: ${error instanceof Error ? error.message : String(error)}`);
        }

        if (balance === BigInt(0)) {
            throw new Error("余额不足");
        }

        const sellAmount = ethers.parseEther(tokenAmount);

        if (sellAmount > balance) {
            throw new Error("余额不足");
        }

        // 2. 获取预期输出并计算滑点保护
        const path = [tokenAddress, CONTRACT_CONFIG.WETH_ADDRESS];
        const routerContract = new ethers.Contract(CONTRACT_CONFIG.ROUTER_CONTRACT, swapABI, provider);

        // 调用 getAmountsOut 获取预期输出
        const amounts = await routerContract.getAmountsOut(sellAmount, path);

        const expectedEthOut = amounts[1]; // 预期的 ETH 输出量
        const slippagePercentage = slippage;
        const amountOutMin = (expectedEthOut * BigInt(Math.floor((100 - slippagePercentage) * 100))) / BigInt(10000);

        console.log(`使用滑点: ${slippage}%`);
        console.log("预期 ETH 输出:", ethers.formatEther(expectedEthOut));
        console.log("最小 ETH 输出:", ethers.formatEther(amountOutMin));

        // 3. 设置交易参数
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20分钟后过期

        // 4. 检查和执行授权
        const allowance = await tokenContract.allowance(address, CONTRACT_CONFIG.TokenManager);
        console.log("当前授权额度:", allowance.toString());

        // 获取 gas price
        const gasPrice = (await ethersProvider.getFeeData()).gasPrice;
        const newGasPrice = gasPrice ? gasPrice + (gasPrice * BigInt(5)) / BigInt(100) : null; // +5%

        console.log("Gas Price:", {
            original: gasPrice?.toString(),
            new: newGasPrice?.toString(),
        });

        let approveTxHash = null;
        if (allowance < sellAmount) {
            console.log("需要授权，发送 approve 交易...");
            console.log("授权数量: 无限授权");

            // 估算 approve 的 gas limit
            let approveGasLimit;
            try {
                const estimatedGas = await tokenContract.approve.estimateGas(CONTRACT_CONFIG.TokenManager, ethers.MaxUint256);
                approveGasLimit = estimatedGas + (estimatedGas * BigInt(20)) / BigInt(100); // 正确的+20%
                console.log("Approve 预估 Gas Limit:", approveGasLimit.toString());
            } catch (e) {
                console.warn("Approve Gas 估算失败:", e);
                approveGasLimit = undefined;
            }

            const approveTxOptions = {
                type: 0, // 强制使用 Legacy 交易类型
            } as any;

            if (approveGasLimit) {
                approveTxOptions.gasLimit = approveGasLimit;
            }
            if (newGasPrice) {
                approveTxOptions.gasPrice = newGasPrice;
            }

            const approveResult = await tokenContract.approve(
                CONTRACT_CONFIG.TokenManager,
                ethers.MaxUint256,
                approveTxOptions
            );

            console.log("授权交易已发送:", approveResult.hash);
            const approveReceipt = await approveResult.wait();
            console.log("授权交易已确认:", approveReceipt);
            approveTxHash = approveResult.hash;
        }

        // 5. 估算 swap 的 gas limit
        const routerContractWithSigner = new ethers.Contract(CONTRACT_CONFIG.TokenManager, tokenManagerABI, signer);
        let swapGasLimit;
        try {
            const estimatedGas = await routerContractWithSigner.swapExactTokensForETH.estimateGas(
                sellAmount,
                amountOutMin,
                path,
                address,
                deadline
            );
            swapGasLimit = estimatedGas + (estimatedGas * BigInt(20)) / BigInt(100); // 正确的+20%
            console.log("Swap 预估 Gas Limit:", swapGasLimit.toString());
        } catch (e) {
            console.warn("Swap Gas 估算失败:", e);
            swapGasLimit = undefined;
        }

        // 6. 执行 Swap 卖出操作
        console.log("发送 swapExactTokensForETH 交易...");
        console.log("Swap 卖出参数:");
        console.log("Token address:", tokenAddress);
        console.log("Amount:", sellAmount.toString());
        console.log("AmountOutMin:", amountOutMin.toString());

        const sellTxOptions = {
            type: 0, // 强制使用 Legacy 交易类型
        } as any;

        if (swapGasLimit) {
            sellTxOptions.gasLimit = swapGasLimit;
        }
        if (newGasPrice) {
            sellTxOptions.gasPrice = newGasPrice;
        }

        const swapTxResult = await routerContractWithSigner.swapExactTokensForETH(
            sellAmount,
            amountOutMin,
            path,
            address,
            deadline,
            sellTxOptions
        );

        console.log("swapExactTokensForETH 交易已发送:", swapTxResult.hash);
        const receipt = await swapTxResult.wait();
        console.log("swapExactTokensForETH 交易已确认:", receipt);

        return {
            txHash: swapTxResult.hash,
            receipt,
            approveTxHash,
            ethAmountOut: ethers.formatEther(expectedEthOut),
            tokenBalance: sellAmount.toString(),
        };
    };

    return {
        handleBuy,
        handleSell,
        handleSwapBuy,
        handleSwapSell,
        isConnected,
        address,
    };
};
