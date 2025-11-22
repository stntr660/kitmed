import * as React from "react";
import { cn } from "@/lib/utils";
import { getStableId } from "@/lib/hydration-utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'medical';
  error?: boolean;
  helperText?: string;
  label?: string;
  required?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type, 
    variant = 'default',
    error = false,
    helperText,
    label,
    required = false,
    id,
    ...props 
  }, ref) => {
    const inputId = getStableId(id, 'input');
    const helperTextId = helperText ? `${inputId}-helper` : undefined;
    
    const inputElement = (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          {
            'medical-input': variant === 'medical',
            'border-destructive focus-visible:ring-destructive': error,
          },
          className
        )}
        ref={ref}
        id={inputId}
        aria-invalid={error}
        aria-describedby={helperTextId}
        aria-required={required}
        {...props}
      />
    );

    // If no label or helper text, return just the input
    if (!label && !helperText) {
      return inputElement;
    }

    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={inputId}
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
        {inputElement}
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
);

Input.displayName = "Input";

export { Input };