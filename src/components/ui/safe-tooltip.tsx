/**
 * Safe Tooltip Component with Local Provider
 * 
 * Each tooltip has its own provider to avoid React context issues
 */

import { Tooltip as RadixTooltip, TooltipContent as RadixTooltipContent, TooltipTrigger as RadixTooltipTrigger, TooltipProvider } from "./tooltip";
import { ReactNode } from "react";

// Wrapper that includes provider for each tooltip
export const Tooltip = ({ children, ...props }: { children: ReactNode }) => (
  <TooltipProvider>
    <RadixTooltip {...props}>{children}</RadixTooltip>
  </TooltipProvider>
);

export const TooltipContent = RadixTooltipContent;
export const TooltipTrigger = RadixTooltipTrigger;
