import Link from "next/link";

export function Logo() {
  return (
    <Link
      href="/"
      className="group flex items-center gap-3 text-sm font-black tracking-tight text-white uppercase italic"
      aria-label="BlockYield home"
    >
      <div className="relative w-10 h-10 transition-transform duration-300 group-hover:scale-110">
        <img 
          src="/blockyield-logo.png" 
          alt="BlockYield Logo" 
          className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(249,115,22,0.4)]" 
        />
      </div>
      <span className="leading-tight hidden sm:block">
        <span className="block text-lg tracking-tighter">Block<span className="text-orange-500">Bet</span></span>
        <span className="block text-[10px] font-black text-zinc-500 tracking-widest">
          Predict the Chain
        </span>
      </span>
    </Link>
  );
}
