'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PrefetchLinksProps {
  /** 要预加载的路径数组 */
  paths: string[];
  /** 延迟预加载时间（毫秒） */
  delay?: number;
}

/**
 * 预加载组件 - 在空闲时间预加载指定的页面路径
 * 用于优化页面跳转性能，减少用户感知的加载时间
 */
export default function PrefetchLinks({ paths, delay = 2000 }: PrefetchLinksProps) {
  const router = useRouter();

  useEffect(() => {
    // 延迟执行预加载，避免影响首屏加载性能
    const timer = setTimeout(() => {
      // 使用 requestIdleCallback 在浏览器空闲时执行预加载
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => {
          paths.forEach((path) => {
            router.prefetch(path);
          });
        });
      } else {
        // 降级处理：直接预加载
        paths.forEach((path) => {
          router.prefetch(path);
        });
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [paths, delay, router]);

  // 这个组件不渲染任何内容
  return null;
}