import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  glowing?: boolean;
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, glowing }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={`relative rounded-xl md:rounded-2xl border bg-card p-2.5 md:p-5 overflow-hidden transition-colors ${
        glowing ? "border-primary/25 glow-primary" : "border-border hover:border-primary/15"
      }`}
    >
      {glowing && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />
      )}

      <div className="flex items-start justify-between relative">
        <div className="space-y-0 md:space-y-1">
          <p className="text-[8px] md:text-[11px] font-medium text-muted-foreground uppercase tracking-widest">{title}</p>
          <p className="text-lg md:text-3xl font-display font-bold text-foreground tracking-tight">{value}</p>
          {subtitle && <p className="text-[10px] md:text-xs text-muted-foreground">{subtitle}</p>}
          {trend && (
            <div className={`inline-flex items-center gap-1 text-[10px] md:text-[11px] font-medium px-1.5 py-0.5 rounded-md ${
              trend.positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
            }`}>
              {trend.positive ? "↑" : "↓"} {trend.value}
            </div>
          )}
        </div>
        <div className={`p-1.5 md:p-3 rounded-lg md:rounded-xl ${glowing ? "bg-primary/10" : "bg-muted/60"}`}>
          <Icon className={`h-3.5 w-3.5 md:h-5 md:w-5 ${glowing ? "text-primary" : "text-muted-foreground"}`} />
        </div>
      </div>
    </motion.div>
  );
}
