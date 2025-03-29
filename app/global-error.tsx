'use client'
 
import { useEffect } from 'react'
 
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 记录严重错误到控制台
    console.error('全局错误:', error)
    
    // 添加全局错误处理
    const originalErrorHandler = window.onerror
    window.onerror = function (message, source, lineno, colno, err) {
      if (source && source.includes('385-')) {
        console.log('处理已知的chunk加载错误，尝试恢复...')
        // 如果是已知的chunk错误，可以尝试重载
        const hasReloaded = sessionStorage.getItem('hasReloaded')
        if (!hasReloaded) {
          sessionStorage.setItem('hasReloaded', 'true')
          window.location.reload()
          return true // 表示错误已处理
        }
      }
      
      // 调用原始的错误处理程序
      if (originalErrorHandler) {
        return originalErrorHandler(message, source, lineno, colno, err)
      }
      return false
    }
    
    // 处理unhandledrejection错误
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // 记录未处理的Promise拒绝错误
      console.error('未处理的Promise拒绝:', event.reason)
    }
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    
    return () => {
      window.onerror = originalErrorHandler
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [error])
 
  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
          <h1 className="text-3xl font-bold mb-4">严重错误</h1>
          <p className="mb-6 text-lg">应用遇到严重错误，无法继续运行。</p>
          <p className="mb-8 text-gray-600">请尝试刷新页面或稍后再试。</p>
          <button
            onClick={() => reset()}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg"
          >
            重试
          </button>
        </div>
      </body>
    </html>
  )
} 