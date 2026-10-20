import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#080C14] text-white flex flex-col items-center justify-center p-4">
      <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
      <p className="text-gray-400 text-sm mb-4">The requested aviation resource could not be located.</p>
      <Link href="/" className="px-4 py-2 bg-[#C9A052] text-[#0F1420] rounded-lg font-bold text-xs">
        Return to Flight Operations
      </Link>
    </div>
  );
}
