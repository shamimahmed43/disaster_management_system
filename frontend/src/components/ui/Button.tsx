import React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      icon,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 font-bold transition-colors shadow-sm disabled:opacity-50 disabled:pointer-events-none rounded-lg font-body-md";

    const variants = {
      primary: "bg-command-blue text-white hover:bg-blue-700",
      secondary:
        "bg-surface-container-high border border-outline-variant text-on-surface hover:bg-surface-container-highest",
      danger:
        "bg-emergency-red/10 border border-emergency-red text-emergency-red hover:bg-emergency-red hover:text-white",
      ghost:
        "bg-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-variant shadow-none",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-5 py-2.5 text-lg",
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {icon}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
