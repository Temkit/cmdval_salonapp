"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { Button } from "./button";
import { Spinner } from "./spinner";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  /** Name of the item being acted upon (e.g., "Jean Dupont") */
  itemName?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  isLoading?: boolean;
  variant?: "danger" | "warning" | "default";
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  itemName,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  onConfirm,
  isLoading = false,
  variant = "danger",
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
  };

  const variantStyles = {
    danger: "destructive",
    warning: "warning",
    default: "default",
  } as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-start gap-4">
            {variant === "danger" && (
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-left">{title}</DialogTitle>
              <DialogDescription className="text-left mt-2">
                {description}
                {itemName && (
                  <span className="block mt-2 font-medium text-foreground">
                    « {itemName} »
                  </span>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variantStyles[variant]}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Suppression...
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
