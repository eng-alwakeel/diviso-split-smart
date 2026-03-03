import { useMemo } from 'react';

interface TypingIndicatorProps {
  typingUserIds: string[];
  profiles: Record<string, any>;
}

export const TypingIndicator = ({ typingUserIds, profiles }: TypingIndicatorProps) => {
  const names = useMemo(() => {
    return typingUserIds.map(id => {
      const p = profiles[id];
      return p?.display_name || p?.name || 'مستخدم';
    });
  }, [typingUserIds, profiles]);

  if (names.length === 0) return null;

  const text = names.length === 1
    ? `${names[0]} يكتب...`
    : names.length === 2
      ? `${names[0]} و ${names[1]} يكتبان...`
      : `${names[0]} و ${names.length - 1} آخرين يكتبون...`;

  return (
    <div className="flex items-center gap-2 px-4 py-1 text-xs text-muted-foreground animate-pulse">
      <div className="flex gap-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>{text}</span>
    </div>
  );
};
