'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 记录错误到控制台
    console.error('应用错误:', error)
    
    // 客户端错误处理 - 尝试重新加载页面一次
    if (typeof window !== 'undefined') {
      const hasReloaded = sessionStorage.getItem('hasReloaded')
      if (!hasReloaded) {
        sessionStorage.setItem('hasReloaded', 'true')
        window.location.reload()
      } else {
        sessionStorage.removeItem('hasReloaded')
      }
    }
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h2 className="text-2xl font-bold mb-4">糟糕，出现了问题</h2>
      <p className="mb-6 text-gray-600">应用加载时遇到错误，我们正在尝试修复。</p>
      <button
        onClick={() => reset()}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        重试
      </button>
    </div>
  )
} 