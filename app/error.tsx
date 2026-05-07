"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0f] text-white">
      <h2 className="text-2xl font-bold text-white/50 mb-4">Something went wrong</h2>
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-white text-sm transition-colors"
        >
          Try again
        </button>
        <Link href="/" className="px-4 py-2 border border-white/20 hover:border-white/40 rounded-lg text-white/60 hover:text-white text-sm transition-colors">
          Return home
        </Link>
      </div>
    </div>
  );
}
