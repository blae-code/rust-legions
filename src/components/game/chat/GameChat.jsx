import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send } from "lucide-react";
import ChatMessageRow from "@/components/game/chat/ChatMessageRow";

// The Field Wire — live text channel per game, for coordinating between turns
export default function GameChat({ gameId, myName }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [meId, setMeId] = useState(null);
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then((u) => setMeId(u.id));
    base44.entities.ChatMessage.filter({ gameId }, "-created_date", 50).then((m) => setMessages(m.reverse()));
    const unsubscribe = base44.entities.ChatMessage.subscribe((event) => {
      if (event.type !== "create" || event.data?.gameId !== gameId) return;
      setMessages((prev) => (prev.some((x) => x.id === event.data.id) ? prev : [...prev, event.data]));
    });
    return unsubscribe;
  }, [gameId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    setText("");
    const msg = await base44.entities.ChatMessage.create({ gameId, text: t.slice(0, 500), authorName: myName });
    setMessages((prev) => (prev.some((x) => x.id === msg.id) ? prev : [...prev, msg]));
    setSending(false);
  };

  return (
    <div className="cq-panel relative overflow-hidden p-4">
      <div className="cq-hazard absolute top-0 left-0 right-0" />
      <p className="cq-label pt-1 mb-2">Field Wire</p>
      <div className="h-48 overflow-y-auto space-y-2 pr-1">
        {messages.length === 0 && (
          <p className="font-mono text-[9px] text-muted-foreground tracking-widest">THE WIRE IS SILENT — SEND THE FIRST TRANSMISSION.</p>
        )}
        {messages.map((m) => (
          <ChatMessageRow key={m.id} msg={m} mine={m.created_by_id === meId} />
        ))}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="flex gap-1.5 mt-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Transmit to all commanders…"
          maxLength={500}
          className="flex-1 bg-input border border-border rounded-sm text-xs px-2 py-1.5 text-secondary-foreground font-body focus:outline-none focus:border-rust/60"
        />
        <button type="submit" disabled={!text.trim() || sending}
          className="cq-metal px-2.5 rounded-sm border border-border text-muted-foreground hover:text-brass-bright hover:border-brass/60 disabled:opacity-40 transition-colors">
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}