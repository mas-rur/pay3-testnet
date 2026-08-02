import type { SVGProps } from "react";

/**
 * Small inline icon set, semi-bold stroke weight to match the reference
 * sidebar. Deliberately dependency-free (no icon package) -- every icon is
 * a plain SVG so there's nothing extra to install.
 */
type IconProps = SVGProps<SVGSVGElement>;

const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.85,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconOverview(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.75" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.75" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.75" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.75" />
    </svg>
  );
}

export function IconExplorer(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M20 20l-4.6-4.6" />
    </svg>
  );
}

export function IconFaucet(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3v10" />
      <path d="M7.5 9L12 13.5L16.5 9" />
      <path d="M4.5 16.5h15" />
      <path d="M4.5 16.5L6 20.5h12l1.5-4" />
    </svg>
  );
}

export function IconWallet(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7.5A2.5 2.5 0 016.5 5H17a2 2 0 012 2v1" />
      <rect x="3" y="7.5" width="18" height="12.5" rx="2.25" />
      <path d="M16.25 13.5a1.25 1.25 0 100 2.5 1.25 1.25 0 000-2.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconMenu(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 6.5h16" />
      <path d="M4 12h16" />
      <path d="M4 17.5h16" />
    </svg>
  );
}

export function IconClose(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 5l14 14" />
      <path d="M19 5L5 19" />
    </svg>
  );
}

export function IconChevronLeft(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M14.5 5.5L8 12l6.5 6.5" />
    </svg>
  );
}

export function IconChevronRight(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9.5 5.5L16 12l-6.5 6.5" />
    </svg>
  );
}

export function IconCopy(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="8.5" y="8.5" width="11.5" height="11.5" rx="2" />
      <path d="M15.5 8.5V6.25A1.75 1.75 0 0013.75 4.5H5.75A1.75 1.75 0 004 6.25v8A1.75 1.75 0 005.75 16h2.75" />
    </svg>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 12.5l5 5L19.5 7" />
    </svg>
  );
}

export function IconEye(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="2.75" />
    </svg>
  );
}

export function IconEyeOff(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3.5 3.5l17 17" />
      <path d="M10.6 5.66A10.3 10.3 0 0112 5.5c6 0 9.5 6.5 9.5 6.5a15.6 15.6 0 01-3.3 4.1M6.4 6.9C4 8.6 2.5 12 2.5 12s3.5 6.5 9.5 6.5a9.6 9.6 0 004.1-.9" />
      <path d="M9.9 10.1a2.75 2.75 0 003.9 3.9" />
    </svg>
  );
}

export function IconPlus(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 4.5v15" />
      <path d="M4.5 12h15" />
    </svg>
  );
}

export function IconTrash(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 7h15" />
      <path d="M9 7V5.25A1.25 1.25 0 0110.25 4h3.5A1.25 1.25 0 0115 5.25V7" />
      <path d="M6.5 7l.75 12A2 2 0 009.24 21h5.52a2 2 0 001.99-1.83L17.5 7" />
    </svg>
  );
}

export function IconDownload(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5v11" />
      <path d="M7.5 10L12 14.5L16.5 10" />
      <path d="M4.5 18.5h15" />
    </svg>
  );
}

export function IconArrowUpRight(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 17L17 7" />
      <path d="M8.5 7H17v8.5" />
    </svg>
  );
}

export function IconArrowDownLeft(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M17 7L7 17" />
      <path d="M15.5 17H7V8.5" />
    </svg>
  );
}

export function IconRefresh(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M20 12a8 8 0 10-2.7 6" />
      <path d="M20 6.5V12h-5.5" />
    </svg>
  );
}
