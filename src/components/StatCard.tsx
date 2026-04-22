import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  trend?: number; // percentage
  icon?: ReactNode;
  accent?: "default" | "success" | "danger" | "primary";
  className?: string;
}

export const StatCard = ({ label, value, hint, trend, icon, accent = "default", className }: StatCardProps) => {
  const accentClass = {
    default: "bg-muted text-muted-foreground",
    success: "bg-success-soft text-success",
    danger: "bg-danger-soft text-danger",
    primary: "bg-primary-soft text-primary",
  }[accent];

  return (
    <div className={cn("surface-card p-5 animate-fade-in", className)}>
      <div className="flex items-start justify-between">
        <span className="stat-label">{label}</span>
        {icon && <div className={cn("flex h-8 w-8 items-center justify-center rounded-md", accentClass)}>{icon}</div>}
      </div>
      <div className="mt-3 font-display text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      {(hint || trend !== undefined) && (
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          {trend !== undefined && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium tabular-nums",
                trend >= 0 ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
              )}
            >
              {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(trend).toFixed(1)}%
            </span>
          )}
          {hint && <span>{hint}</span>}
        </div>
      )}
    </div>
  );
};
