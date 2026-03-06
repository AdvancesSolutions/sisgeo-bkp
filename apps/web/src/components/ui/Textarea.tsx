import type { TextareaHTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, fullWidth, className, id, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s/g, "-");
    return (
      <div className={cn("flex flex-col gap-1", fullWidth && "w-full")}>
        {label && (
          <label htmlFor={textareaId} className="text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={!!error}
          aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
          className={cn(
            "w-full rounded-lg border px-3 py-2 text-text-primary bg-background-paper min-h-[80px]",
            "border-grey-200 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
            "placeholder:text-text-secondary disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-error focus:border-error focus:ring-error",
            className,
          )}
          {...props}
        />
        {error && (
          <p id={`${textareaId}-error`} className="text-sm text-error" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${textareaId}-helper`} className="text-sm text-text-secondary">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";

export default Textarea;
