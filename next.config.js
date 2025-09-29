/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
    // 启用静态导出
    // output: 'export',

    // 禁用图片优化（静态导出不支持）
    images: {
        // unoptimized: true,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'exopad.mypinata.cloud',
            },
            {
                protocol: 'https',
                hostname: 'ipfs.io',
            },
            {
                protocol: 'https',
                hostname: 'gateway.pinata.cloud',
            }
        ],
    },

    // // 禁用需要服务器的功能
    // trailingSlash: true,
    // skipTrailingSlashRedirect: true,

    compiler: isProd
        ? {
            // 在生产构建时移除 console 调用（保留 error/warn）
            removeConsole: { exclude: ['error', 'warn'] },
        }
        : undefined,
};

module.exports = nextConfig;