import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "danger" | "info" | "neutral";
  icon?: string; // Material symbol name
}

export function Badge({
  className = "",
  variant = "neutral",
  icon,
  children,
  ...props
}: BadgeProps) {
  const variants = {
    success:
      "bg-stable-emerald/10 border-stable-emerald/30 text-stable-emerald",
    warning: "bg-warning-amber/10 border-warning-amber/30 text-warning-amber",
    danger: "bg-emergency-red/10 border-emergency-red/30 text-emergency-red",
    info: "bg-command-blue/10 border-command-blue/30 text-command-blue",
    neutral:
      "bg-surface-container-highest border-outline-variant text-on-surface",
  };

  return (
    <span
      className={`px-2 py-1 border font-label-caps text-label-caps rounded flex items-center gap-1 w-fit ${variants[variant]} ${className}`}
      {...props}
    >
      {icon && (
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 14 }}
        >
          {icon}
        </span>
      )}
      {children}
    </span>
  );
}
