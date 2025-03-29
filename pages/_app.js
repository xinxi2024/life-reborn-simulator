import { useEffect } from 'react';
import '../app/globals.css';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // 添加全局错误处理
    const originalErrorHandler = window.onerror;
    window.onerror = function (message, source, lineno, colno, error) {
      if (source && source.includes('385-')) {
        console.log('处理已知的chunk加载错误，尝试恢复...');
        // 如果是已知的chunk错误，可以尝试重载
        const hasReloaded = sessionStorage.getItem('hasReloaded');
        if (!hasReloaded) {
          sessionStorage.setItem('hasReloaded', 'true');
          window.location.reload();
          return true; // 表示错误已处理
        }
      }
      
      // 调用原始的错误处理程序
      if (originalErrorHandler) {
        return originalErrorHandler(message, source, lineno, colno, error);
      }
      return false;
    };
    
    // 处理unhandledrejection错误
    const handleUnhandledRejection = (event) => {
      // 记录未处理的Promise拒绝错误
      console.error('未处理的Promise拒绝:', event.reason);
    };
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.onerror = originalErrorHandler;
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
  
  return <Component {...pageProps} />;
}

export default MyApp; 