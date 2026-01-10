"use client";

import { useState, useCallback } from "react";

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  phone?: boolean;
  custom?: (value: string) => string | null;
}

export interface FieldValidation {
  rules: ValidationRule;
  message?: string;
}

export interface ValidationErrors {
  [key: string]: string | null;
}

export interface TouchedFields {
  [key: string]: boolean;
}

export interface UseFormValidationReturn<T> {
  errors: ValidationErrors;
  touched: TouchedFields;
  isValid: boolean;
  validateField: (field: keyof T, value: string) => string | null;
  validateAll: (data: T) => boolean;
  setFieldTouched: (field: keyof T) => void;
  clearErrors: () => void;
  getFieldState: (field: keyof T) => {
    error: string | null;
    touched: boolean;
    showError: boolean;
  };
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s\-+()]{8,}$/;

export function useFormValidation<T extends Record<string, any>>(
  validationSchema: Record<keyof T, FieldValidation>
): UseFormValidationReturn<T> {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({});

  const validateField = useCallback(
    (field: keyof T, value: string): string | null => {
      const fieldSchema = validationSchema[field];
      if (!fieldSchema) return null;

      const { rules, message } = fieldSchema;
      const val = value?.toString().trim() || "";

      // Required check
      if (rules.required && !val) {
        return message || "Ce champ est requis";
      }

      // Skip other validations if empty and not required
      if (!val) return null;

      // Min length
      if (rules.minLength && val.length < rules.minLength) {
        return message || `Minimum ${rules.minLength} caractères`;
      }

      // Max length
      if (rules.maxLength && val.length > rules.maxLength) {
        return message || `Maximum ${rules.maxLength} caractères`;
      }

      // Email
      if (rules.email && !EMAIL_REGEX.test(val)) {
        return message || "Email invalide";
      }

      // Phone
      if (rules.phone && !PHONE_REGEX.test(val)) {
        return message || "Numéro de téléphone invalide";
      }

      // Pattern
      if (rules.pattern && !rules.pattern.test(val)) {
        return message || "Format invalide";
      }

      // Custom validation
      if (rules.custom) {
        return rules.custom(val);
      }

      return null;
    },
    [validationSchema]
  );

  const setFieldTouched = useCallback((field: keyof T) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const validateAll = useCallback(
    (data: T): boolean => {
      const newErrors: ValidationErrors = {};
      let isValid = true;

      for (const field in validationSchema) {
        const error = validateField(field as keyof T, data[field]);
        newErrors[field] = error;
        if (error) isValid = false;
      }

      setErrors(newErrors);
      // Mark all fields as touched
      const allTouched: TouchedFields = {};
      for (const field in validationSchema) {
        allTouched[field] = true;
      }
      setTouched(allTouched);

      return isValid;
    },
    [validationSchema, validateField]
  );

  const clearErrors = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  const getFieldState = useCallback(
    (field: keyof T) => {
      const error = errors[field as string] || null;
      const isTouched = touched[field as string] || false;
      return {
        error,
        touched: isTouched,
        showError: isTouched && !!error,
      };
    },
    [errors, touched]
  );

  const isValid = Object.values(errors).every((e) => !e);

  return {
    errors,
    touched,
    isValid,
    validateField,
    validateAll,
    setFieldTouched,
    clearErrors,
    getFieldState,
  };
}
