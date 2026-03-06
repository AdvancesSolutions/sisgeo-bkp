import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertVariant = "success" | "error" | "warning" | "info";

const variantStyles: Record<AlertVariant, string> = {
  success: "bg-success/10 text-success-dark border-success/30",
  error: "bg-error/10 text-error-dark border-error/30",
  warning: "bg-warning/10 text-warning-dark border-warning/30",
  info: "bg-info/10 text-info-dark border-info/30",
};

export interface AlertProps {
  severity: AlertVariant;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export default function Alert({ severity, children, onClose, className }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-center gap-3 rounded-lg border px-4 py-3",
        variantStyles[severity],
        className,
      )}
    >
      <div className="flex-1">{children}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-current"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
