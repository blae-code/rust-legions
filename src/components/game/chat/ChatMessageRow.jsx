import React from "react";

// One wire transmission — own messages align right in signal red
export default function ChatMessageRow({ msg, mine }) {
  const time = new Date(msg.created_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <div className={mine ? "text-right" : "text-left"}>
      <p className="font-mono text-[8px] text-muted-foreground tracking-widest">
        {mine ? `YOU · ${time}` : `${(msg.authorName || "COMMANDER").toUpperCase()} · ${time}`}
      </p>
      <p className={`inline-block max-w-[85%] text-xs px-2 py-1 rounded-sm border mt-0.5 break-words ${
        mine ? "border-rust/50 bg-rust/10 text-foreground" : "border-border bg-secondary/40 text-secondary-foreground"
      }`}>
        {msg.text}
      </p>
    </div>
  );
}