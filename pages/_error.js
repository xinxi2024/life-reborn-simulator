import { useEffect } from 'react';

function ErrorPage({ statusCode }) {
  useEffect(() => {
    // 客户端错误处理 - 尝试重新加载页面一次
    if (typeof window !== 'undefined' && window.location.pathname === '/') {
      const hasReloaded = localStorage.getItem('hasReloaded');
      if (!hasReloaded) {
        localStorage.setItem('hasReloaded', 'true');
        window.location.reload();
      } else {
        localStorage.removeItem('hasReloaded');
      }
    }
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      textAlign: 'center', 
      fontFamily: 'system-ui, sans-serif',
      maxWidth: '600px',
      margin: '0 auto',
      marginTop: '50px' 
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '20px' }}>
        {statusCode ? `服务器错误 ${statusCode}` : '客户端错误'}
      </h1>
      <p style={{ fontSize: '1.2rem', lineHeight: '1.5', marginBottom: '30px' }}>
        页面加载出错，我们正在尝试修复这个问题。
      </p>
      <button 
        onClick={() => window.location.reload()} 
        style={{
          backgroundColor: '#4A90E2',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '1rem',
          cursor: 'pointer'
        }}
      >
        刷新页面
      </button>
    </div>
  );
}

ErrorPage.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default ErrorPage; 