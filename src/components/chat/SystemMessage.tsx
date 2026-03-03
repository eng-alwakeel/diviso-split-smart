import React from "react";

interface SystemMessageProps {
  content: string;
  timestamp?: string;
}

export const SystemMessage = React.memo(({ content, timestamp }: SystemMessageProps) => (
  <div className="flex justify-center my-2">
    <div className="bg-muted/50 rounded-full px-3 py-1 w-fit">
      <span className="text-[11px] text-muted-foreground">{content}</span>
      {timestamp && (
        <span className="text-[10px] text-muted-foreground/60 mr-2"> · {timestamp}</span>
      )}
    </div>
  </div>
));

SystemMessage.displayName = "SystemMessage";
