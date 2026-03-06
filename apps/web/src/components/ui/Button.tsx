import type { ButtonHTMLAttributes } from "react";
import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-text-contrast hover:bg-primary-dark active:bg-primary-dark focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
  secondary:
    "bg-grey-100 text-text-primary hover:bg-grey-200 active:bg-grey-200 focus-visible:ring-2 focus-visible:ring-grey-400 focus-visible:ring-offset-2",
  ghost:
    "bg-transparent text-text-primary hover:bg-grey-25 active:bg-grey-50 focus-visible:ring-2 focus-visible:ring-grey-300 focus-visible:ring-offset-2",
  danger:
    "bg-error text-text-contrast hover:bg-error-dark active:bg-error-dark focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2",
  outline:
    "border-2 border-grey-300 bg-transparent text-text-primary hover:bg-grey-25 active:bg-grey-50 focus-visible:ring-2 focus-visible:ring-grey-400 focus-visible:ring-offset-2",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm gap-1.5",
  md: "px-4 py-2 text-base gap-2",
  lg: "px-6 py-3 text-lg gap-3",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth,
      startIcon,
      endIcon,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={props.type ?? "button"}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
      ) : (
        startIcon
      )}
      {children}
      {!loading && endIcon}
    </button>
  ),
);

Button.displayName = "Button";

export default Button;
