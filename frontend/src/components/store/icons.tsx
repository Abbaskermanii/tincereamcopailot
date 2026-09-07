import React from "react";

export type IconProps = React.SVGProps<SVGSVGElement>;

const strokeProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function CartIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...strokeProps} {...props}>
      <circle cx="9.5" cy="20" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="17" cy="20" r="1.3" fill="currentColor" stroke="none" />
      <path d="M3 3.5h2.3l2.4 11.3a1.6 1.6 0 0 0 1.57 1.27h7.53a1.6 1.6 0 0 0 1.56-1.24L20.2 8H6.2" />
    </svg>
  );
}

export function XIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...strokeProps} {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...strokeProps} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function MinusIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...strokeProps} {...props}>
      <path d="M5 12h14" />
    </svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...strokeProps} {...props}>
      <path d="M4 7h16M10 11v6M14 11v6M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7m2.5 0-.7 11.2a1.6 1.6 0 0 1-1.6 1.5H8.8a1.6 1.6 0 0 1-1.6-1.5L6.5 7" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...strokeProps} {...props}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export function TruckIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...strokeProps} {...props}>
      <path d="M2.5 6.5h11v9.5h-11z" />
      <path d="M13.5 10h3.6l3.4 3.6v2.4h-7" />
      <circle cx="7" cy="17.8" r="1.7" />
      <circle cx="17" cy="17.8" r="1.7" />
    </svg>
  );
}

export function ShieldCheckIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...strokeProps} {...props}>
      <path d="M12 3l7 2.4v5.1c0 4.4-2.9 8.4-7 10-4.1-1.6-7-5.6-7-10V5.4L12 3z" />
      <path d="M9 11.8l2.1 2.1L15.4 9.5" />
    </svg>
  );
}

export function PackageIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...strokeProps} {...props}>
      <path d="M12 3l8 3.8v10.4L12 21l-8-3.8V6.8L12 3z" />
      <path d="M4 6.8l8 3.7 8-3.7M12 10.5V21" />
    </svg>
  );
}

export function ChatIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...strokeProps} {...props}>
      <path d="M20.5 11.5a7.5 7.5 0 0 1-7.5 7.5H4.5L6 16.2A7.5 7.5 0 1 1 20.5 11.5z" />
      <path d="M9 11h6M9 14h3.5" />
    </svg>
  );
}

export function StarIcon({ filled = false, ...props }: IconProps & { filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinejoin="round"
      fill={filled ? "currentColor" : "none"}
      {...props}
    >
      <path d="M12 3.6l2.5 5.06 5.6.81-4.05 3.95.96 5.58L12 16.33l-5.01 2.67.96-5.58-4.05-3.95 5.6-.81L12 3.6z" />
    </svg>
  );
}
