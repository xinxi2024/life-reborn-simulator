import dynamic from 'next/dynamic';

// 动态导入主组件，禁用SSR以避免hydration错误
const LifeRestartSimulator = dynamic(
  () => import('../app/page').then(mod => ({ default: mod.default })),
  { ssr: false }
);

export default function Home() {
  return <LifeRestartSimulator />;
} 