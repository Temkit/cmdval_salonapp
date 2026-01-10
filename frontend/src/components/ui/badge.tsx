import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground border-border",
        success:
          "border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
        warning:
          "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
        info:
          "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
        muted:
          "border-transparent bg-muted text-muted-foreground",
      },
      size: {
        default: "px-3 py-1 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-4 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, size, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span className={cn(
          "mr-1.5 h-1.5 w-1.5 rounded-full",
          variant === "success" && "bg-green-600 dark:bg-green-400",
          variant === "warning" && "bg-amber-600 dark:bg-amber-400",
          variant === "destructive" && "bg-red-600 dark:bg-red-400",
          variant === "info" && "bg-blue-600 dark:bg-blue-400",
          (!variant || variant === "default") && "bg-primary-foreground",
          variant === "secondary" && "bg-secondary-foreground",
          variant === "outline" && "bg-foreground",
          variant === "muted" && "bg-muted-foreground"
        )} />
      )}
      {children}
    </div>
  );
}

// Status badge with predefined states
interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled' | 'warning';
}

const statusConfig = {
  active: { variant: 'success' as const, label: 'Actif' },
  inactive: { variant: 'muted' as const, label: 'Inactif' },
  pending: { variant: 'warning' as const, label: 'En attente' },
  completed: { variant: 'success' as const, label: 'Terminé' },
  cancelled: { variant: 'destructive' as const, label: 'Annulé' },
  warning: { variant: 'warning' as const, label: 'Attention' },
};

function StatusBadge({ status, children, ...props }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant={config.variant} dot {...props}>
      {children || config.label}
    </Badge>
  );
}

export { Badge, StatusBadge, badgeVariants };
