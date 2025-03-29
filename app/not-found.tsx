export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h2 className="text-2xl font-bold mb-4">页面未找到</h2>
      <p className="mb-6 text-gray-600">您访问的页面不存在或已被移除。</p>
      <a
        href="/"
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        返回首页
      </a>
    </div>
  )
} 