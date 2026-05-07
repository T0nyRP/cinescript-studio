import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0f] text-white">
      <h1 className="text-6xl font-bold text-white/20 mb-4">404</h1>
      <p className="text-white/50 mb-8">Page not found</p>
      <Link href="/" className="text-orange-400 hover:text-orange-300 transition-colors">
        Return home
      </Link>
    </div>
  );
}
