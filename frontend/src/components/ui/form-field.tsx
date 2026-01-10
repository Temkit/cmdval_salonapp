"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "./input";
import { Label } from "./label";

export interface FormFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | null;
  touched?: boolean;
  showSuccess?: boolean;
  helperText?: string;
  optional?: boolean;
  inputClassName?: string;
}

const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      label,
      error,
      touched = false,
      showSuccess = false,
      helperText,
      optional = false,
      required = false,
      className,
      inputClassName,
      id,
      onBlur,
      ...props
    },
    ref
  ) => {
    const fieldId = id || props.name || label.toLowerCase().replace(/\s/g, "-");
    const showError = touched && !!error;
    const showValid = touched && !error && showSuccess && props.value;

    return (
      <div className={cn("space-y-2", className)}>
        {/* Label */}
        <Label
          htmlFor={fieldId}
          className={cn(
            "text-base flex items-center gap-1",
            showError && "text-destructive"
          )}
        >
          {label}
          {required && !optional && (
            <span className="text-destructive" aria-hidden="true">
              *
            </span>
          )}
          {optional && (
            <span className="text-muted-foreground text-sm font-normal">
              (optionnel)
            </span>
          )}
        </Label>

        {/* Input with validation indicator */}
        <div className="relative">
          <Input
            ref={ref}
            id={fieldId}
            aria-invalid={showError}
            aria-describedby={
              showError
                ? `${fieldId}-error`
                : helperText
                ? `${fieldId}-helper`
                : undefined
            }
            className={cn(
              "h-14 text-lg pr-12",
              showError && "border-destructive focus-visible:ring-destructive",
              showValid && "border-green-500 focus-visible:ring-green-500",
              inputClassName
            )}
            onBlur={onBlur}
            required={required}
            {...props}
          />

          {/* Validation icon */}
          {(showError || showValid) && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              {showError ? (
                <AlertCircle className="h-5 w-5 text-destructive" aria-hidden="true" />
              ) : showValid ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" aria-hidden="true" />
              ) : null}
            </div>
          )}
        </div>

        {/* Error message */}
        {showError && (
          <p
            id={`${fieldId}-error`}
            className="text-sm text-destructive flex items-center gap-1.5"
            role="alert"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        {/* Helper text */}
        {helperText && !showError && (
          <p
            id={`${fieldId}-helper`}
            className="text-sm text-muted-foreground"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
FormField.displayName = "FormField";

export interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string | null;
  touched?: boolean;
  helperText?: string;
  optional?: boolean;
}

const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  (
    {
      label,
      error,
      touched = false,
      helperText,
      optional = false,
      required = false,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const fieldId = id || props.name || label.toLowerCase().replace(/\s/g, "-");
    const showError = touched && !!error;

    return (
      <div className={cn("space-y-2", className)}>
        <Label
          htmlFor={fieldId}
          className={cn(
            "text-base flex items-center gap-1",
            showError && "text-destructive"
          )}
        >
          {label}
          {required && !optional && (
            <span className="text-destructive" aria-hidden="true">
              *
            </span>
          )}
          {optional && (
            <span className="text-muted-foreground text-sm font-normal">
              (optionnel)
            </span>
          )}
        </Label>

        <textarea
          ref={ref}
          id={fieldId}
          aria-invalid={showError}
          aria-describedby={
            showError
              ? `${fieldId}-error`
              : helperText
              ? `${fieldId}-helper`
              : undefined
          }
          className={cn(
            "w-full rounded-lg border-2 border-input p-4 text-lg resize-none",
            "focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            showError && "border-destructive focus:border-destructive focus:ring-destructive",
            className
          )}
          required={required}
          {...props}
        />

        {showError && (
          <p
            id={`${fieldId}-error`}
            className="text-sm text-destructive flex items-center gap-1.5"
            role="alert"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        {helperText && !showError && (
          <p
            id={`${fieldId}-helper`}
            className="text-sm text-muted-foreground"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
FormTextarea.displayName = "FormTextarea";

export { FormField, FormTextarea };
