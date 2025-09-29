import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import { Link } from "@heroui/link";
import clsx from "clsx";
import { Toaster } from "sonner";

import { Providers } from "./providers";
import ContextProvider from "@/providers/AppKitProvider";

import { siteConfig } from "@/config/site";
import RouteAwareNavbar from "@/components/RouteAwareNavbar";
import RouteAwareMain from "@/components/RouteAwareMain";

export const metadata: Metadata = {
    title: {
        default: siteConfig.name,
        template: `%s - ${siteConfig.name}`,
    },
    description: siteConfig.description,
    icons: {
        icon: "/favicon.ico",
    },
    openGraph: {
        type: "website",
        title: siteConfig.name,
        description: siteConfig.description,
        siteName: siteConfig.name,
        images: [
            {
                url: "https://exopad.mypinata.cloud/ipfs/bafkreiacmwumqnk5pjeobzk3o57walzwy274pttt5lfkixacy7t5oe5khy",
                width: 1200,
                height: 630,
                alt: siteConfig.name,
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: siteConfig.name,
        description: siteConfig.description,
        images: [
            "https://exopad.mypinata.cloud/ipfs/bafkreiacmwumqnk5pjeobzk3o57walzwy274pttt5lfkixacy7t5oe5khy",
        ],
        // 合理默认：官方账号同名
        site: "@ExoPadFun",
        creator: "@ExoPadFun",
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "white" },
        { media: "(prefers-color-scheme: dark)", color: "black" },
    ],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html suppressHydrationWarning lang="en">
            <head />
            <body
                className={clsx(
                    "min-h-screen text-foreground antialiased",
                )}
                style={{ backgroundColor: '#ffffff', touchAction: 'manipulation' }}
            >
                <ContextProvider>
                    <Providers themeProps={{ attribute: "class", defaultTheme: "light" }}>
                        <div className="relative flex flex-col min-h-screen">
                            <RouteAwareNavbar />
                            <RouteAwareMain>
                                {children}
                            </RouteAwareMain>
                        </div>
                        <Toaster
                            position="top-center"
                            toastOptions={{
                                style: {
                                    height: '48px',
                                    fontSize: '13px',
                                    textAlign: 'center',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '0px',
                                },
                                classNames: {
                                    success: 'toast-success',
                                    error: 'toast-error',
                                },
                            }}
                        />
                    </Providers>
                </ContextProvider>
            </body>
        </html>
    );
}
