"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function useClipboard(timeout = 1500) {
    const [isCopied, setIsCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const timerRef = useRef<number | null>(null);

    const clearTimer = () => {
        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };

    useEffect(() => () => clearTimer(), []);

    const copy = useCallback(
        async (text: string) => {
            setError(null);
            try {
                if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(text);
                } else {
                    // Fallback for non-secure context or unsupported browsers
                    const textarea = document.createElement("textarea");
                    textarea.value = text;
                    textarea.style.position = "fixed";
                    textarea.style.opacity = "0";
                    textarea.style.left = "-9999px";
                    document.body.appendChild(textarea);
                    textarea.focus();
                    textarea.select();
                    const successful = document.execCommand("copy");
                    document.body.removeChild(textarea);
                    if (!successful) throw new Error("Copy command failed");
                }
                setIsCopied(true);
                toast.success("Copy Success", { icon: null });
                clearTimer();
                timerRef.current = window.setTimeout(() => setIsCopied(false), timeout);
                return true;
            } catch (e: any) {
                setError(e?.message || "Copy Failed");
                setIsCopied(false);
                toast.error("Copy Failed", { icon: null });
                return false;
            }
        },
        [timeout]
    );

    return { copy, isCopied, error } as const;
}
