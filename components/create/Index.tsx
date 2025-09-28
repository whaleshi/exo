import React, { useState } from "react";
import { useRouter } from "next/navigation";
import CreateForm from "./Form";

const Create = () => {
    const router = useRouter();

    return (
        <div className="w-full max-w-[450px]">
            <div className="flex items-center justify-between relative pt-[16px]">
                <div onClick={() => router.push("/")} className="relative z-1 w-[40px] h-[40px] border border-[#F3F3F3] cursor-pointer flex items-center justify-center">
                    <BackIcon />
                </div>
            </div>
            <CreateForm />
        </div>
    );
};

export default Create;

const BackIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" fill="none">
        <rect x="1.55029" y="0.843262" width="15" height="1" transform="rotate(45 1.55029 0.843262)" fill="#101010" />
        <rect x="11.4497" y="0.843262" width="1" height="15" transform="rotate(45 11.4497 0.843262)" fill="#101010" />
    </svg>
);
