'use client'

import { ethersAdapter, projectId, networks } from '@/config'
import { createAppKit } from '@reown/appkit/react'
import React, { type ReactNode } from 'react'

if (!projectId) {
    throw new Error('Project ID is not defined')
}

// Set up metadata
const metadata = {
    name: 'next-reown-appkit',
    description: 'next-reown-appkit',
    url: 'https://github.com/0xonerb/next-reown-appkit-ssr', // origin must match your domain & subdomain
    icons: ['https://avatars.githubusercontent.com/u/179229932']
}

// Create the modal
export const modal = createAppKit({
    adapters: [ethersAdapter],
    projectId,
    networks,
    defaultNetwork: networks[0],
    metadata,
    themeMode: 'light',
    defaultAccountTypes: { eip155: "eoa" },
    featuredWalletIds: [
        'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
        '971e689d0a5be527bac79629b4ee9b925e82208e5168b733496a09c0faed0709', // OKX
    ],
    // includeWalletIds: [
    // 	'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    // 	'971e689d0a5be527bac79629b4ee9b925e82208e5168b733496a09c0faed0709', // OKX
    // ],
    features: {
        analytics: true, // Optional - defaults to your Cloud configuration
        email: false, // 取消email登录
        socials: [], // 取消所有社交登录（包括谷歌）
        onramp: false, // 取消充值功能
        swaps: false, // 取消交换功能
    },
    allWallets: 'HIDE',
    themeVariables: {
        '--w3m-accent': '#000000',
        '--w3m-border-radius-master': '0px', // 设置圆角为0
        '--w3m-z-index': 99999, // 设置最高层级
    }
})

function ContextProvider({ children }: { children: ReactNode }) {
    return (
        <>{children}</>
    )
}

export default ContextProvider