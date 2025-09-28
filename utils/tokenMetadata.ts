// Token 元数据相关工具函数
export interface TokenMetadata {
  name?: string
  description?: string
  image?: string
  external_url?: string
  [key: string]: any
}

// 从 URI 获取 token 元数据
export const fetchTokenMetadata = async (uri: string): Promise<TokenMetadata | null> => {
  if (!uri || !uri.trim()) return null
  
  try {
    // 处理 IPFS 链接
    let fetchUrl = uri
    if (uri.startsWith('ipfs://')) {
      fetchUrl = uri.replace('ipfs://', 'https://ipfs.io/ipfs/')
    }
    
    const response = await fetch(fetchUrl)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const metadata: TokenMetadata = await response.json()
    return metadata
  } catch (error) {
    console.error('Failed to fetch token metadata:', error)
    return null
  }
}

// 从元数据获取图片 URL
export const getImageUrl = (metadata: TokenMetadata | null): string | null => {
  if (!metadata?.image) return null
  
  let imageUrl = metadata.image
  // 处理 IPFS 图片链接
  if (imageUrl.startsWith('ipfs://')) {
    imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/')
  }
  
  return imageUrl
}