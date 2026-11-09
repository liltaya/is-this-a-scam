/** @type {import('next').NextConfig} */
const testRun = process.env.PIEZAS_TEST_RUN === '1';
const nextConfig = {
  output: 'standalone',
  devIndicators: false,
  ...(testRun ? { distDir: `.next-test-${process.env.PIEZAS_TEST_PORT || '3100'}` } : {}),
};
export default nextConfig;
