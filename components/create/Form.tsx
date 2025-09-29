import React, { useEffect, useMemo, useState } from "react";
import { Form, Input, Button, Textarea, useDisclosure, Image } from "@heroui/react";
import { useRouter } from "next/navigation";
import ResponsiveDialog from "../common/ResponsiveDialog";
import pinFileToIPFS from "@/utils/pinata";
import { toast } from "sonner";
import { ethers } from "ethers";
import { useAppKit, useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import FactoryABIData from "@/constant/TokenManager.abi.json";
const FactoryABI = FactoryABIData;
import { CONTRACT_CONFIG, DEFAULT_CHAIN_CONFIG } from "@/config/chains";
import { randomBytes } from "crypto";

type Beneficiary = {
    id: string;
    label: string;
    percent: number;
};

const MAX_AVATAR_MB = 5;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

/** 与 HeroUI Input 保持一致的错误样式 */
function FieldError({ message }: { message?: string | null }) {
    if (!message) return null;
    return <p className="text-[12px] text-danger mt-1 leading-[1.1]">{message}</p>;
}

/** 头像字段：用“代理校验输入”确保优先校验头像 */
function AvatarField({
    valueUrl,
    onPick,
    onClear,
    required,
    name = "avatar",
    maxMB = MAX_AVATAR_MB,
    loading = false,
}: {
    valueUrl: string | null;
    onPick: (file?: File) => void;
    onClear: () => void;
    required?: boolean;
    name?: string;
    maxMB?: number;
    loading?: boolean;
}) {
    const inputId = "avatar-upload-input";
    const labelId = "avatar-upload-label";
    const wrapperRef = React.useRef<HTMLDivElement>(null);
    const [errorText, setErrorText] = React.useState<string | null>(null);

    const setError = (msg: string | null) => {
        setErrorText(msg);
        if (msg) wrapperRef.current?.classList.add("border-[#f31260]");
        else wrapperRef.current?.classList.remove("border-[#f31260]");
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!ACCEPTED_TYPES.includes(file.type)) {
                e.target.value = "";
                onPick(undefined);
                return;
            }
            const sizeMB = file.size / (1024 * 1024);
            if (sizeMB > maxMB) {
                e.target.value = "";
                onPick(undefined);
                return;
            }
        }
        setError(null);
        onPick(file);
    };

    return (
        <div className="w-full">
            {/* 代理校验输入：保持在最上方，DOM 参与 required 校验（不要 display:none） */}
            <input
                // 这个输入不提交业务数据，仅用于 required 校验顺序
                tabIndex={-1}
                aria-hidden="true"
                className="sr-only absolute h-0 w-0 p-0 m-0"
                required={!!required}
                // 有头像则通过，无头像则为空触发 invalid
                value={valueUrl ? "1" : ""}
                onChange={() => { }}
                // 提示与样式同步
                onInvalid={(e) => {
                    e.preventDefault();
                }}
            />

            <div className="flex items-center justify-between pb-[8px]">
                <label
                    id={labelId}
                    htmlFor={inputId}
                    className={["text-[14px] text-[#666] font-normal", errorText && "text-[#f31260]"].join(" ")}
                >
                    Icon
                    {required ? <span className="text-[#f31260] ml-[2px]">*</span> : null}
                </label>
            </div>

            <div className="flex items-center" aria-labelledby={labelId}>
                <div
                    ref={wrapperRef}
                    className={[
                        "relative w-[80px] h-[80px] shrink-0 overflow-hidden",
                    ].join(" ")}
                >
                    <Image
                        src={valueUrl || "/default.png"}
                        alt="avatar"
                        className="w-[80px] h-[80px] border-1 border-[#F3F3F3] rounded-[0px] object-cover"
                    />
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-[#569F8C] border-t-transparent animate-spin rounded-full"></div>
                        </div>
                    )}
                    {/* 真正的文件选择输入：不再 required，让代理来控制校验顺序 */}
                    <input
                        id={inputId}
                        name={name}
                        type="file"
                        accept={ACCEPTED_TYPES.join(",")}
                        className="opacity-0 w-full h-full absolute top-0 left-0 z-10 cursor-pointer"
                        aria-label='uploadAvatar'
                        onChange={handleChange}
                        onInput={() => setError(null)}
                        disabled={loading}
                    />
                </div>
            </div>

            <FieldError message={errorText} />
        </div>
    );
}

export default function CreateForm() {
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const router = useRouter();
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    // AppKit hooks
    const { open } = useAppKit();
    const { address, isConnected } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider('eip155');
    const [ticker, setTicker] = useState("");
    const [nameVal, setNameVal] = useState("");

    // 头像
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>("/default.png");
    const [avatarError, setAvatarError] = useState<string | null>(null);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [ipfsHash, setIpfsHash] = useState<string | null>(null);
    const [createLoading, setCreateLoading] = useState(false);
    const [descriptionVal, setDescriptionVal] = useState("");
    const [websiteVal, setWebsiteVal] = useState("");
    const [xVal, setXVal] = useState("");
    const [telegramVal, setTelegramVal] = useState("");
    const [preBuyVal, setPreBuyVal] = useState("");
    const [createdTokenAddress, setCreatedTokenAddress] = useState<string | null>("");
    const factoryAddr = CONTRACT_CONFIG.TokenManager;











    // 切换网络
    const switchNetwork = async () => {

    };


    useEffect(() => {
        if (!avatarFile) {
            setAvatarUrl(null);
            return;
        }
        const url = URL.createObjectURL(avatarFile);
        setAvatarUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [avatarFile]);

    const onPickAvatar = async (file?: File) => {
        setAvatarError(null);
        if (!file) return;

        if (!ACCEPTED_TYPES.includes(file.type)) {
            return;
        }
        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > MAX_AVATAR_MB) {
            return;
        }

        // 上传到 IPFS
        try {
            setUploadLoading(true);
            const res = await pinFileToIPFS(file);
            if (res) {
                setIpfsHash(res);
                setAvatarFile(file);
            }
        } catch (error) {
            console.error("IPFS upload error:", error);
        } finally {
            setUploadLoading(false);
        }
    };

    const onClearAvatar = () => {
        setAvatarFile(null);
        setAvatarUrl(null);
        setAvatarError(null);
        setIpfsHash(null);
    };

    // 满足必填：头像、Name、Ticker 均存在，钱包已连接时需要完整校验
    const requiredValid = !!avatarUrl && nameVal.trim().length > 0 && ticker.trim().length > 0;
    const readyToSubmit = !isConnected || requiredValid;



    // 上传最终的 JSON 元数据到 IPFS
    const uploadFile = async () => {
        try {
            const params = {
                name: nameVal,
                symbol: ticker,
                image: ipfsHash,
                description: descriptionVal,
                website: websiteVal,
                x: xVal,
                telegram: telegramVal
            };
            const res = await pinFileToIPFS(params, "json");
            if (!res) {
                setCreateLoading(false);
                return false;
            }
            return res;
        } catch (error) {
            setCreateLoading(false);
            return false;
        }
    };

    // 创建代币合约调用
    const createToken = async (metadataHash: string) => {
        try {
            if (!isConnected || !address || !walletProvider) {
                throw new Error('請先連接戰壕');
            }

            // 创建provider和signer
            console.log(DEFAULT_CHAIN_CONFIG.rpcUrl)
            const provider = new ethers.JsonRpcProvider(DEFAULT_CHAIN_CONFIG.rpcUrl);


            // 确保 walletProvider 是有效的 EIP-1193 provider
            if (!walletProvider || typeof (walletProvider as any).request !== 'function') {
                throw new Error('請先連接戰壕');
            }

            const ethersProvider = new ethers.BrowserProvider(walletProvider as any);
            const signer = await ethersProvider.getSigner();

            console.log("使用地址:", address);

            // 检查余额 - 使用JsonRpcProvider确保连接正确的网络
            const balance = await provider.getBalance(address);
            console.log("账户余额:", ethers.formatEther(balance), "ETH");

            if (balance === BigInt(0)) {
                toast.error('Insufficient balance', { icon: null });
                return null;
            }

            const salt = randomBytes(32).toString("hex");
            const factoryContract = new ethers.Contract(factoryAddr, FactoryABI, signer);

            // 检查是否有提前购买金额
            const hasPreBuy = preBuyVal && parseFloat(preBuyVal) > 0;
            const preBuyAmount = hasPreBuy ? ethers.parseEther(preBuyVal) : BigInt(0);

            // 估算 gas
            let gasLimit;
            try {
                let estimatedGas;
                if (hasPreBuy) {
                    estimatedGas = await factoryContract.createTokenAndBuy.estimateGas(
                        nameVal, ticker, metadataHash, salt, preBuyAmount,
                        { value: preBuyAmount }
                    );
                } else {
                    estimatedGas = await factoryContract.createToken.estimateGas(nameVal, ticker, metadataHash, salt);
                }
                gasLimit = estimatedGas + (estimatedGas * BigInt(20)) / BigInt(100); // +20% buffer
            } catch (e) {
                gasLimit = undefined;
            }

            // 获取 gas price（+5%）并强制使用 Legacy 交易类型
            const feeData = await ethersProvider.getFeeData();
            const gasPrice = feeData.gasPrice;
            const newGasPrice = gasPrice ? gasPrice + (gasPrice * BigInt(5)) / BigInt(100) : null; // +5%

            // 统一交易选项
            const txOptions: any = {
                // type: 0, // 强制使用 Legacy 交易类型
            };
            if (gasLimit) txOptions.gasLimit = gasLimit;
            if (newGasPrice) txOptions.gasPrice = newGasPrice;
            if (hasPreBuy) txOptions.value = preBuyAmount;

            let tx;
            try {
                console.log("合约地址:", factoryAddr);
                console.log("Signer address:", await signer.getAddress());
                console.log("网络信息:", await ethersProvider.getNetwork());

                if (hasPreBuy) {
                    console.log("调用 createTokenAndBuy");
                    console.log("参数:", { nameVal, ticker, metadataHash, salt, preBuyAmount: preBuyAmount.toString(), txOptions });
                    tx = await factoryContract.createTokenAndBuy(
                        nameVal,
                        ticker,
                        metadataHash,
                        salt,
                        preBuyAmount,
                        txOptions
                    );
                } else {
                    console.log("调用 createToken");
                    console.log("参数:", { nameVal, ticker, metadataHash, salt, txOptions });
                    tx = await factoryContract.createToken(
                        nameVal,
                        ticker,
                        metadataHash,
                        salt,
                        txOptions
                    );
                }
                console.log("交易已提交:", tx.hash);
            } catch (error: any) {
                console.error("合约调用失败:", error);
                console.error("错误消息:", error.message);
                console.error("错误代码:", error.code);
                if (error.data) {
                    console.error("错误数据:", error.data);
                }
                throw error;
            }

            // 等待交易确认
            const receipt = await tx.wait();

            // 计算新创建的代币地址
            const readOnlyContract = new ethers.Contract(factoryAddr, FactoryABI, provider);
            const tokenAddress = await readOnlyContract.predictTokenAddress(salt);

            return tokenAddress;
        } catch (error: any) {
            throw error;
        }
    };

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;

        // 统一触发一次原生校验（遵循 DOM 顺序，先校验头像代理）
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // 检查钱包连接状态
        if (!isConnected) {
            open();
            return;
        }

        // 检查是否有头像的 IPFS hash
        if (!ipfsHash) {
            toast.error('Icon upload failed. Please try again.', { icon: null });
            return;
        }

        try {
            setCreateLoading(true);


            // 1. 上传最终的 JSON 元数据到 IPFS
            const metadataHash = await uploadFile();
            if (!metadataHash) {
                return; // uploadFile 内部已经处理了错误
            }

            // 2. 调用合约创建代币
            const tokenAddress = await createToken(metadataHash);
            if (!tokenAddress) {
                return; // createToken 内部已经处理了错误提示
            }

            setCreatedTokenAddress(tokenAddress as string);
            onOpen();
            toast.success('Created Successfully', { icon: null });
        } catch (error: any) {
            console.error("Create error:", error);

            toast.error('Creation Failed, Please Retry', { icon: null })
        } finally {
            setCreateLoading(false);
        }
    };

    return (
        <>
            <Form className="w-full gap-[24px] mt-[16px]" onSubmit={onSubmit}>
                {/* 头像（必填，统一提示样式） */}
                <AvatarField
                    valueUrl={avatarUrl}
                    onPick={onPickAvatar}
                    onClear={onClearAvatar}
                    required
                    loading={uploadLoading}
                />

                {/* 基本信息 */}
                <Input
                    classNames={{
                        inputWrapper: "h-[48px] border-[#F3F3F3]  border-1",
                        input: "f600 text-[14px] text-[#101010] placeholder:text-[#999]",
                    }}
                    isRequired
                    errorMessage='Please Enter Name'
                    label={<span className="text-[14px] text-[#666]">Name</span>}
                    labelPlacement="outside-top"
                    name="name"
                    placeholder='Please Enter Name'
                    variant="bordered"
                    value={nameVal}
                    onChange={(e) => setNameVal(e.target.value)}
                    maxLength={20}
                    radius="none"
                />

                {/* Ticker：强制大写 + 字距 */}
                <Input
                    classNames={{
                        inputWrapper: "h-[48px] border-[#F3F3F3]  border-1",
                        input: "f600 text-[14px] text-[#101010] placeholder:text-[#999] tracking-[-0.07px]",
                    }}
                    isRequired
                    errorMessage='Please Enter Ticker'
                    label={<span className="text-[14px] text-[#666]">Ticker</span>}
                    labelPlacement="outside-top"
                    name="ticker"
                    placeholder="Please Enter Ticker"
                    variant="bordered"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value.toUpperCase())}
                    aria-label='ticker'
                    maxLength={20}
                    radius="none"
                />

                <Textarea
                    classNames={{
                        inputWrapper: "border-[#F3F3F3]  border-1",
                        input: "f600 text-[14px] text-[#101010] placeholder:text-[#999]",
                        label: "pb-[8px]",
                    }}
                    label={
                        <div className="flex items-center">
                            <span className="text-[14px] text-[#666]">Description</span>
                            <span className="text-[#999]">（Optional）</span>
                        </div>
                    }
                    labelPlacement="outside"
                    placeholder="Please Enter Description"
                    variant="bordered"
                    name="description"
                    aria-label="Please Enter Description"
                    value={descriptionVal}
                    onChange={(e) => setDescriptionVal(e.target.value)}
                    maxLength={200}
                    radius="none"
                />

                {/* 提前买入 */}
                <Input
                    classNames={{
                        inputWrapper: "h-[48px] border-[#F3F3F3]  border-1",
                        input: "f600 text-[14px] text-[#101010] placeholder:text-[#999] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                    }}
                    label={
                        <div className="flex items-center">
                            <span className="text-[14px] text-[#666]">Early Buy</span>
                            <span className="text-[#999]">（Optional）</span>
                        </div>
                    }
                    labelPlacement="outside-top"
                    name="preBuy"
                    placeholder="Please Enter Amount"
                    variant="bordered"
                    type="text"
                    inputMode="decimal"
                    aria-label="Early Buy"
                    value={preBuyVal}
                    onChange={(e) => {
                        const value = e.target.value;
                        // 只允许数字和小数点
                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                            const numValue = parseFloat(value);
                            // 限制最大值为1，NaN表示空字符串或无效输入
                            setPreBuyVal(value);
                        }
                    }}
                    onKeyDown={(e) => {
                        // 阻止上下箭头键
                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                            e.preventDefault();
                        }
                    }}
                    radius="none"
                    endContent={
                        <span className="text-[14px] font-medium text-[#101010]">XPL</span>
                    }
                />
                {/* 社交链接 */}
                <Input
                    classNames={{
                        inputWrapper: "h-[48px] border-[#F3F3F3]  border-1",
                        input: "f600 text-[14px] text-[#101010] placeholder:text-[#999]",
                    }}
                    label={
                        <div className="flex items-center">
                            <span className="text-[14px] text-[#666]">Website</span>
                            <span className="text-[#999]">（Optional）</span>
                        </div>
                    }
                    labelPlacement="outside-top"
                    name="website"
                    placeholder="Please Enter Website"
                    variant="bordered"
                    type="url"
                    aria-label="Please Enter Website"
                    value={websiteVal}
                    onChange={(e) => setWebsiteVal(e.target.value)}
                    radius="none"
                />
                <Input
                    classNames={{
                        inputWrapper: "h-[48px] border-[#F3F3F3]  border-1",
                        input: "f600 text-[14px] text-[#101010] placeholder:text-[#999]",
                    }}
                    label={
                        <div className="flex items-center">
                            <span className="text-[14px] text-[#666]">X</span>
                            <span className="text-[#999]">（Optional）</span>
                        </div>
                    }
                    labelPlacement="outside-top"
                    name="x"
                    placeholder="Please Enter X"
                    variant="bordered"
                    type="url"
                    aria-label="Please Enter X"
                    value={xVal}
                    onChange={(e) => setXVal(e.target.value)}
                    radius="none"
                />
                <Input
                    classNames={{
                        inputWrapper: "h-[48px] border-[#F3F3F3]  border-1",
                        input: "f600 text-[14px] text-[#101010] placeholder:text-[#999]",
                    }}
                    label={
                        <div className="flex items-center">
                            <span className="text-[14px] text-[#666]">Telegram</span>
                            <span className="text-[#999]">（Optional）</span>
                        </div>
                    }
                    labelPlacement="outside-top"
                    name="telegram"
                    placeholder='Please Enter Telegram'
                    variant="bordered"
                    type="url"
                    aria-label='Please Enter Telegram'
                    value={telegramVal}
                    onChange={(e) => setTelegramVal(e.target.value)}
                    radius="none"
                />
                <Button
                    className={[
                        "w-full h-[44px] text-[14px] mb-[50px] f600 full",
                        readyToSubmit ? "bg-[#101010] text-[#FFF]" : "bg-[#999] text-[#FFF]",
                    ].join(" ")}
                    type="submit"
                    aria-label='btn'
                    isLoading={createLoading}
                    disabled={createLoading || !readyToSubmit}
                    radius="none"
                >
                    {!isConnected ? "Connect Wallet" : "Create Now"}
                </Button>
                {/* <div className="" onClick={() => { onOpen() }}>1</div> */}
            </Form>
            <ResponsiveDialog
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                title='Created Successfully'
                maxVH={70}
                size="md"
                classNames={{ body: "text-[#fff]" }}
            >
                <div className="flex flex-col items-center pt-[0px]">
                    <Image
                        src={avatarUrl || "/default.png"}
                        alt='tokenAvatar'
                        className="w-[60px] h-[60px] border-1 border-[#F3F3F3] rounded-[0px] object-cover"
                        width={60}
                        height={60}
                    />
                    <div className="text-[20px] text-[#101010] mt-[14px] font-bold">${ticker}</div>
                    <div className="text-[16px] text-[#666] mt-[8px]">{nameVal}</div>
                    <Button
                        fullWidth
                        radius="none"
                        className="text-[14px] text-[#101010] bg-[#F3F3F3] h-[48px] mt-[22px]"
                        onPress={() => {
                            if (createdTokenAddress) {
                                router.push(`/meme/${createdTokenAddress}`);
                            }
                        }}
                    >
                        View Details
                    </Button>
                    <Button
                        fullWidth
                        radius="none"
                        className="text-[14px] bg-[#101010] text-[#FFF] h-[48px] my-[12px]"
                        onPress={() => {
                            const text = `I found $${ticker} on @ExoPadFun, come trade together 🪐 Link`
                            const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
                            window.open(url, "_blank");
                        }}
                    >
                        Share to X
                    </Button>
                </div>
            </ResponsiveDialog>
        </>
    );
}
