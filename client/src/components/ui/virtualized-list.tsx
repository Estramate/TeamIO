// Virtual scrolling for large lists to improve performance
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import { cn } from '@/lib/utils';

interface VirtualizedListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
}

export function VirtualizedList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  className,
  overscan = 5
}: VirtualizedListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan,
  });

  return (
    <div
      ref={parentRef}
      className={cn("overflow-auto", className)}
      style={{ height: `${height}px` }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {renderItem(items[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  );
}

// Specialized component for member lists
interface VirtualizedMemberListProps {
  members: any[];
  onMemberClick?: (member: any) => void;
  height?: number;
  className?: string;
}

export function VirtualizedMemberList({
  members,
  onMemberClick,
  height = 400,
  className
}: VirtualizedMemberListProps) {
  return (
    <VirtualizedList
      items={members}
      height={height}
      itemHeight={80}
      className={className}
      renderItem={(member, index) => (
        <div
          key={member.id}
          className="flex items-center p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => onMemberClick?.(member)}
        >
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
            <span className="text-sm font-medium">
              {member.firstName?.[0]}{member.lastName?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">
              {member.lastName}, {member.firstName}
            </div>
            <div className="text-sm text-muted-foreground truncate">
              {member.email || 'Keine E-Mail'}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {member.status === 'active' ? 'Aktiv' : 'Inaktiv'}
          </div>
        </div>
      )}
    />
  );
}