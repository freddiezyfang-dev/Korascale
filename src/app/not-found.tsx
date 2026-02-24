import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-4xl md:text-6xl font-heading text-gray-900 mb-2">404</h1>
      <p className="text-lg text-gray-600 mb-8 max-w-md">
        页面未找到。请检查地址或通过下方链接继续浏览。
      </p>
      <nav className="flex flex-wrap gap-4 justify-center">
        <Link
          href="/journeys"
          className="px-6 py-3 bg-[#1e3b32] text-white rounded-md hover:opacity-90 transition-opacity"
        >
          旅程
        </Link>
        <Link
          href="/admin"
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          后台
        </Link>
        <Link
          href="/destinations"
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          目的地
        </Link>
      </nav>
    </div>
  );
}
