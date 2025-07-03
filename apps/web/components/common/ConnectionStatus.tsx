"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  Loader2
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ConnectionStatus as ConnectionStatusType } from "@repo/types";
import { cn } from "@/lib/utils";

interface ConnectionStatusProps {
  status?: ConnectionStatusType;
  onReconnect?: () => void;
  className?: string;
  showLabel?: boolean;
}

export const ConnectionStatus = ({ 
  status = "disconnected", 
  onReconnect,
  className,
  showLabel = false
}: ConnectionStatusProps) => {
  const getStatusConfig = (status: ConnectionStatusType) => {
    switch (status) {
      case "connected":
        return {
          icon: CheckCircle,
          label: "Connected",
          color: "text-green-600",
          bgColor: "bg-green-100",
          variant: "default" as const,
          description: "Real-time connection active"
        };
      case "connecting":
        return {
          icon: Loader2,
          label: "Connecting",
          color: "text-yellow-600",
          bgColor: "bg-yellow-100",
          variant: "secondary" as const,
          description: "Establishing connection..."
        };
      case "disconnected":
        return {
          icon: WifiOff,
          label: "Disconnected",
          color: "text-red-600",
          bgColor: "bg-red-100",
          variant: "destructive" as const,
          description: "No real-time connection"
        };
      case "error":
        return {
          icon: AlertCircle,
          label: "Error",
          color: "text-red-600",
          bgColor: "bg-red-100",
          variant: "destructive" as const,
          description: "Connection error occurred"
        };
      default:
        return {
          icon: WifiOff,
          label: "Unknown",
          color: "text-gray-600",
          bgColor: "bg-gray-100",
          variant: "secondary" as const,
          description: "Unknown connection state"
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;
  const isConnecting = status === "connecting";
  const canReconnect = status === "disconnected" || status === "error";

  if (showLabel) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Badge 
          variant={config.variant}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1",
            config.bgColor,
            config.color
          )}
        >
          <Icon 
            className={cn(
              "h-3 w-3",
              isConnecting && "animate-spin"
            )} 
          />
          <span className="text-xs font-medium">{config.label}</span>
        </Badge>
        
        {canReconnect && onReconnect && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={onReconnect}
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reconnect</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  }

  // Compact version (icon only)
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center gap-1", className)}>
            <div
              className={cn(
                "flex items-center justify-center w-6 h-6 rounded-full",
                config.bgColor
              )}
            >
              <Icon 
                className={cn(
                  "h-3 w-3",
                  config.color,
                  isConnecting && "animate-spin"
                )} 
              />
            </div>
            
            {canReconnect && onReconnect && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                onClick={onReconnect}
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p className="font-medium">{config.label}</p>
            <p className="text-xs text-muted-foreground">{config.description}</p>
            {canReconnect && onReconnect && (
              <p className="text-xs text-muted-foreground mt-1">
                Click to reconnect
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/**
 * Simple connection indicator for headers/navigation
 */
export const ConnectionIndicator = ({ 
  status = "disconnected",
  className 
}: { 
  status?: ConnectionStatusType;
  className?: string;
}) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div 
        className={cn(
          "h-2 w-2 rounded-full",
          status === "connected" ? "bg-green-400 animate-pulse" : 
          status === "connecting" ? "bg-yellow-400 animate-pulse" : "bg-red-400"
        )}
      />
      <span className="text-xs text-muted-foreground">
        {status === "connected" ? "Live" : 
         status === "connecting" ? "Connecting..." : "Offline"}
      </span>
    </div>
  );
}; 