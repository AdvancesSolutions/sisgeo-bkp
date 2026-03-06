import { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
  showCloseButton?: boolean;
  "aria-label"?: string;
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

export default function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "md",
  showCloseButton = true,
  "aria-label": ariaLabel,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose],
  );

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement as HTMLElement | null;
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      aria-label={ariaLabel}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/50"
        onClick={handleOverlayClick}
        aria-hidden
      />
      <div
        className={cn(
          "relative w-full rounded-xl bg-background-paper shadow-xl",
          maxWidthClasses[maxWidth],
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between border-b border-grey-100 px-6 py-4">
            {title && (
              <h2 id="modal-title" className="text-lg font-semibold text-text-primary">
                {title}
              </h2>
            )}
            <div className={title ? "" : "ml-auto"} />
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1 text-text-secondary hover:bg-grey-100 hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

export function ModalActions({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center justify-end gap-2 px-6 py-4 border-t border-grey-100", className)}
      {...props}
    >
      {children}
    </div>
  );
}
