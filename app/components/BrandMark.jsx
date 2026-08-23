import Image from "next/image";
import Link from "next/link";
import transparentGMark from "../../public/globtrek-g-transparent.png";

export function BrandMark({ className = "" }) {
  return <Image src={transparentGMark} alt="" sizes="(min-width: 640px) 70px, 63px" className={`block h-9 w-[63px] shrink-0 object-contain sm:h-10 sm:w-[70px] ${className}`} aria-hidden="true" />;
}

export function BrandWordmark({ className = "" }) {
  return <Link href="/" className={`group inline-flex items-center gap-2.5 ${className}`} aria-label="GlobTrek home">
    <span className="globtrek-wordmark">globtrek</span>
    <BrandMark className="transition-opacity duration-300 group-hover:opacity-75" />
  </Link>;
}
