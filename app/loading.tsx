export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <h2 className="text-xl font-medium">正在加载人生重开模拟器...</h2>
        <p className="text-gray-500 mt-2">首次加载可能需要几秒钟，请耐心等待</p>
      </div>
    </div>
  )
} 