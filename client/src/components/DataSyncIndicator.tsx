import { useEffect, useState } from "react";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { Loader2, Wifi, WifiOff, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataSyncIndicatorProps {
  className?: string;
  showLabel?: boolean;
}

type SyncStatus = 'idle' | 'fetching' | 'mutating' | 'success' | 'error' | 'offline';

export function DataSyncIndicator({ className, showLabel = true }: DataSyncIndicatorProps) {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Determine sync status based on query states
  useEffect(() => {
    if (!isOnline) {
      setSyncStatus('offline');
      return;
    }

    if (isMutating > 0) {
      setSyncStatus('mutating');
    } else if (isFetching > 0) {
      setSyncStatus('fetching');
    } else {
      setSyncStatus('success');
      setLastSyncTime(new Date());
    }
  }, [isFetching, isMutating, isOnline]);

  const getStatusConfig = () => {
    switch (syncStatus) {
      case 'fetching':
        return {
          icon: Loader2,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50 dark:bg-blue-950/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          label: 'Daten laden...',
          animate: true
        };
      case 'mutating':
        return {
          icon: Loader2,
          color: 'text-orange-500',
          bgColor: 'bg-orange-50 dark:bg-orange-950/20',
          borderColor: 'border-orange-200 dark:border-orange-800',
          label: 'Speichern...',
          animate: true
        };
      case 'success':
        return {
          icon: CheckCircle2,
          color: 'text-green-500',
          bgColor: 'bg-green-50 dark:bg-green-950/20',
          borderColor: 'border-green-200 dark:border-green-800',
          label: 'Synchronisiert',
          animate: false
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-50 dark:bg-red-950/20',
          borderColor: 'border-red-200 dark:border-red-800',
          label: 'Fehler',
          animate: false
        };
      case 'offline':
        return {
          icon: WifiOff,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50 dark:bg-gray-950/20',
          borderColor: 'border-gray-200 dark:border-gray-800',
          label: 'Offline',
          animate: false
        };
      default:
        return {
          icon: Wifi,
          color: 'text-gray-400',
          bgColor: 'bg-gray-50 dark:bg-gray-950/20',
          borderColor: 'border-gray-200 dark:border-gray-800',
          label: 'Bereit',
          animate: false
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const formatLastSync = () => {
    if (!lastSyncTime) return '';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - lastSyncTime.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'gerade eben';
    if (diffInSeconds < 3600) return `vor ${Math.floor(diffInSeconds / 60)} Min.`;
    return `vor ${Math.floor(diffInSeconds / 3600)} Std.`;
  };

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300",
      config.bgColor,
      config.borderColor,
      "hover:shadow-sm",
      className
    )}>
      <Icon 
        className={cn(
          "h-4 w-4 transition-colors duration-300",
          config.color,
          config.animate && "animate-spin"
        )} 
      />
      
      {showLabel && (
        <div className="flex flex-col">
          <span className={cn(
            "text-xs font-medium transition-colors duration-300",
            config.color
          )}>
            {config.label}
          </span>
          
          {syncStatus === 'success' && lastSyncTime && (
            <span className="text-xs text-muted-foreground">
              {formatLastSync()}
            </span>
          )}
        </div>
      )}

      {/* Progress bar for active operations */}
      {(syncStatus === 'fetching' || syncStatus === 'mutating') && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full animate-pulse rounded-full",
              syncStatus === 'fetching' ? 'bg-blue-500' : 'bg-orange-500'
            )}
            style={{
              width: '100%',
              animation: 'progress 2s ease-in-out infinite'
            }}
          />
        </div>
      )}
    </div>
  );
}

// Compact version for header
export function DataSyncIndicatorCompact({ className }: { className?: string }) {
  return (
    <DataSyncIndicator 
      className={cn("px-2 py-1", className)}
      showLabel={false}
    />
  );
}