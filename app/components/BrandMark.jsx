import Link from "next/link";

export function BrandMark({ className = "" }) {
  return (
    <img
      src="/globtrek-mark.png"
      alt=""
      width="70"
      height="40"
      className={`brand-mark block h-9 w-[63px] shrink-0 object-contain sm:h-10 sm:w-[70px] ${className}`}
      aria-hidden="true"
    />
  );
}

export function BrandWordmark({ className = "" }) {
  return (
    <Link
      href="/"
      className={`group inline-flex items-center gap-2.5 ${className}`}
      aria-label="GlobTrek home"
    >
      <span>globtrek</span>
      <BrandMark className="transition-transform duration-500 ease-out group-hover:translate-x-0.5" />
    </Link>
  );
}
