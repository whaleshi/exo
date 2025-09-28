'use client'

import { useEffect, useState } from 'react'
import { fetchTokenMetadata, getImageUrl } from '../../utils/tokenMetadata'

interface TokenAvatarProps {
  uri: string
  name?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function TokenAvatar({ uri, name, size = 'md', className = '' }: TokenAvatarProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16'
  }

  const borderClass = 'border border-[#f3f3f3]'

  useEffect(() => {
    const loadMetadata = async () => {
      if (!uri) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(false)
        const metadata = await fetchTokenMetadata(uri)
        const imgUrl = getImageUrl(metadata)
        setImageUrl(imgUrl)
      } catch (err) {
        console.error('Failed to load token metadata:', err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    loadMetadata()
  }, [uri])

  if (loading) {
    return (
      <img
        src="/default.png"
        alt="Loading..."
        className={`${sizeClasses[size]} ${borderClass} object-cover ${className}`}
      />
    )
  }

  if (error || !imageUrl) {
    return (
      <div className={`${sizeClasses[size]} ${borderClass} bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-semibold ${className}`}>
        {name ? name.charAt(0).toUpperCase() : '?'}
      </div>
    )
  }

  return (
    <img
      src={imageUrl}
      alt={name || 'Token'}
      className={`${sizeClasses[size]} ${borderClass} object-cover ${className}`}
      onError={() => setError(true)}
    />
  )
}