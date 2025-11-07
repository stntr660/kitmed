import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: 'default' | 'medical';
  error?: boolean;
  helperText?: string;
  label?: string;
  required?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className, 
    variant = 'default',
    error = false,
    helperText,
    label,
    required = false,
    id,
    ...props 
  }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const helperTextId = helperText ? `${textareaId}-helper` : undefined;
    
    const textareaElement = (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          {
            'medical-input': variant === 'medical',
            'border-destructive focus-visible:ring-destructive': error,
          },
          className
        )}
        ref={ref}
        id={textareaId}
        aria-invalid={error}
        aria-describedby={helperTextId}
        aria-required={required}
        {...props}
      />
    );

    // If no label or helper text, return just the textarea
    if (!label && !helperText) {
      return textareaElement;
    }

    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={textareaId}
            className={cn(
              "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
              error && "text-destructive"
            )}
          >
            {label}
            {required && (
              <span className="ml-1 text-destructive" aria-label="required">
                *
              </span>
            )}
          </label>
        )}
        {textareaElement}
        {helperText && (
          <p
            id={helperTextId}
            className={cn(
              "text-sm",
              error ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
)
Textarea.displayName = "Textarea"

export { Textarea }