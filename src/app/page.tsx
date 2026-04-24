import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold">PRESENT:AI-ON</h1>
      <nav className="flex flex-col gap-3 w-full max-w-xs">
        <Link href="/onboarding" className="py-3 text-center rounded-xl bg-zinc-800 hover:bg-zinc-700">온보딩</Link>
        <Link href="/prepare" className="py-3 text-center rounded-xl bg-zinc-800 hover:bg-zinc-700">발표 준비</Link>
        <Link href="/live" className="py-3 text-center rounded-xl bg-green-700 hover:bg-green-600 font-bold">발표 시작</Link>
        <Link href="/summary" className="py-3 text-center rounded-xl bg-zinc-800 hover:bg-zinc-700">세션 요약</Link>
      </nav>
    </div>
  );
}
