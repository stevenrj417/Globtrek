import Link from "next/link";

export function BrandMark({ className = "" }) {
  return (
    <svg
      viewBox="0 0 92 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`block h-7 w-12 shrink-0 overflow-visible text-current sm:h-8 sm:w-14 ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M59.5 14.1C55.1 8.7 48.4 6 40.5 6 25.4 6 15 16.7 15 31.1 15 45 25.3 52 39 52c8.3 0 15.2-2.5 20.6-7.5V33.2H46.8"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="square"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M5.5 39.2c7.8-8.6 23.7-17.5 43.4-22.4 19.5-4.8 34.8-3.8 37.4 2.5 2.9 7-11.8 19.1-33.9 26.1C29.7 52.6 8.7 52.1 5.1 43.8c-.6-1.3-.4-2.9.4-4.6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function BrandWordmark({ className = "" }) {
  return (
    <Link
      href="/"
      className={`group inline-flex items-center gap-2 ${className}`}
      aria-label="GlobTrek home"
    >
      <span>globtrek</span>
      <BrandMark className="transition-transform duration-500 ease-out group-hover:translate-x-0.5" />
    </Link>
  );
}
