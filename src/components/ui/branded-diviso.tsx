import { cn } from "@/lib/utils";

interface BrandedDivisoProps {
  className?: string;
}

export const BrandedDiviso = ({ className }: BrandedDivisoProps) => (
  <span className={cn("text-primary font-semibold", className)}>
    Diviso
  </span>
);
