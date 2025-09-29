import Image from "next/image";
import { useParams } from "next/navigation";
import { shortenAddress } from '@/utils/index'
import useClipboard from '@/hooks/useClipboard';
import _bignumber from "bignumber.js";
import useOkxPrice from "@/hooks/useOkxPrice";
import { toast } from "sonner";


const Top = ({ metaData, tokenInfo, progressData }: any) => {
    const params = useParams();
    const tokenAddress = params.addr as string;
    const { copy, isCopied } = useClipboard();
    const { price } = useOkxPrice();

    return (<div className="w-full pt-[16px]">
        <div className="flex gap-[10px] w-full">
            <img src={metaData?.image || "/default.png"} alt="logo" width="48" height="48" className="w-[48px] h-[48px] border-1 border-[#F3F3F3] rounded-[0px] object-cover" />
            <div className="flex-1 flex flex-col justify-center gap-[4px]">
                <div className="text-[14px] text-[#333] font-medium flex justify-between">
                    <div>{metaData?.symbol || shortenAddress(tokenAddress)}</div>
                    <div>$--</div>
                </div>
                <div className="text-[12px] text-[#999] flex justify-between">
                    <div>{metaData?.name || '-'}</div>
                    <div>24H <span className="text-[#569F8C]">--</span></div>{/* EB4B6D */}
                </div>
            </div>
        </div>
        <div className="h-[40px] w-full bg-[#DDEFEA] mt-[24px] relative">
            <div className="h-full bg-[#569F8C]" style={{ width: `${progressData.progress}%` }}></div>
            <div className="w-full h-full absolute left-0 top-0 text-[12px] text-[#333] flex items-center justify-center">Bonding Curve Progress {progressData.progress}%</div>
        </div>
        <div className="flex gap-[12px] h-[54px] mt-[20px]">
            <div className="flex-1 h-full bg-[#F8F8F8] flex items-center flex-col justify-center">
                <div className="text-[12px] text-[#333] font-medium">${_bignumber(tokenInfo?.lastPrice ?? 0).div(1e18).times(1300000000).times(price ?? 0).dp(2).toString() || '--'}</div>
                <div className="text-[10px] text-[#999] font-medium">Market Cap</div>
            </div>
            <div className="flex-1 h-full bg-[#F8F8F8] flex items-center flex-col justify-center cursor-pointer"
            >
                <div className="text-[12px] text-[#333] font-medium">$--</div>
                <div className="text-[10px] text-[#999] font-medium">24H Volume</div>
            </div>
            <div className="flex-1 h-full bg-[#F8F8F8] flex items-center flex-col justify-center cursor-pointer"
            >
                <div className="text-[12px] text-[#333] font-medium">--</div>
                <div className="text-[10px] text-[#999] font-medium">Holders</div>
            </div>
        </div>
        <div className="mt-[40px] text-[#333] text-[16px] text-medium">Token Details</div>
        {
            metaData?.description && <div className="text-[12px] text-[#999] mt-[20px]">{metaData?.description}</div>
        }
        <div className="flex gap-[12px]">
            {
                metaData?.website && <div className="mt-[26px] w-[40px] h-[40px] bg-[#F8F8F8] flex items-center justify-center cursor-pointer"
                    onClick={() => { window.open(metaData?.website, "_blank") }}
                >
                    <img src="/web.png" width="26" height="26" alt="web" className="w-[26px] h-[26px]" />
                </div>
            }
            {
                metaData?.x && <div className="mt-[26px] w-[40px] h-[40px] bg-[#F8F8F8] flex items-center justify-center cursor-pointer"
                    onClick={() => { window.open(metaData?.x, "_blank") }}
                >
                    <img src="/x.png" width="26" height="26" alt="x" className="w-[26px] h-[26px]" />
                </div>
            }
            {
                metaData?.telegram && <div className="mt-[26px] w-[40px] h-[40px] bg-[#F8F8F8] flex items-center justify-center cursor-pointer"
                    onClick={() => { window.open(metaData?.telegram, "_blank") }}
                >
                    <img src="/tg.png" width="26" height="26" alt="tg" className="w-[26px] h-[26px]" />
                </div>
            }
        </div>
        <div className="w-full px-[12px] py-[16px] bg-[#F8F8F8] mt-[20px] text-[12px] text-[#999] flex flex-col gap-[12px]">
            <div className="flex justify-between">
                Total Supply<div className="text-[#101010]">2B</div>
            </div>
            <div className="flex justify-between">
                Bonding Curve<div className="text-[#101010]">1.6B</div>
            </div>
            <div className="flex justify-between">
                Bonding Curve Progress<div className="text-[#101010]">{progressData.progress}%</div>
            </div>
            <div className="flex justify-between">
                Contract Address
                <div className="text-[#101010]">
                    <span className="underline cursor-pointer"
                        onClick={() => { window.open(`https://www.oklink.com/x-layer/address/${tokenAddress}`, "_blank") }}
                    >{shortenAddress(tokenAddress)}</span>
                    <span className="text-[#999] ml-[8px] cursor-pointer" onClick={() => copy(tokenAddress)}>
                        Copy
                    </span>
                </div>
            </div>
            <div className="flex justify-between">
                Creator<div className="text-[#101010] underline cursor-pointer" onClick={() => { window.open(`https://www.oklink.com/x-layer/address/${tokenInfo?.creator}`, "_blank") }}>{shortenAddress(tokenInfo?.creator)}</div>
            </div>
        </div>
    </div>)
}

export default Top;