import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

// Cooldown period in milliseconds (3 seconds)
const REFRESH_COOLDOWN = 10000;

interface PageHeaderProps {
  title: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isLoading?: boolean;
  className?: string;
  children?: React.ReactNode;
  // Optional custom cooldown period in milliseconds
  refreshCooldown?: number;
}

export function PageHeader({
  title,
  onRefresh,
  isRefreshing = false,
  isLoading = false,
  className = '',
  children,
  refreshCooldown = REFRESH_COOLDOWN,
}: PageHeaderProps) {
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  const [cooldownActive, setCooldownActive] = useState<boolean>(false);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  // Handle cooldown timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (cooldownActive && cooldownRemaining > 0) {
      timer = setTimeout(() => {
        setCooldownRemaining(prev => {
          const newValue = prev - 100;
          if (newValue <= 0) {
            setCooldownActive(false);
            return 0;
          }
          return newValue;
        });
      }, 100);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [cooldownActive, cooldownRemaining]);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTime;
    
    // Check if cooldown period has passed
    if (timeSinceLastRefresh < refreshCooldown) {
      const remainingTime = Math.ceil((refreshCooldown - timeSinceLastRefresh) / 1000);
      toast.info(`Please wait ${remainingTime} seconds before refreshing again`);
      return;
    }
    
    // Update last refresh time and start cooldown
    setLastRefreshTime(now);
    setCooldownActive(true);
    setCooldownRemaining(refreshCooldown);
    
    // Execute the refresh function
    await onRefresh();
  };

  // Calculate if the button should be disabled
  const isDisabled = isRefreshing || isLoading || cooldownActive;

  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      <div className="flex items-center">
        <h1 className="text-2xl font-bold">{title}</h1>
        {onRefresh && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isDisabled}
            className="ml-2"
            title={cooldownActive ? `Refresh (${Math.ceil(cooldownRemaining / 1000)}s)` : "Refresh"}
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        )}
      </div>
      {children && <div className="flex items-center">{children}</div>}
    </div>
  );
} 