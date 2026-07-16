import React, { useState, useEffect } from "react";

export default function Typewriter({ text, delay = 0, speed = 35, className = "" }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let interval;
    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        setCount((c) => {
          if (c >= text.length) { clearInterval(interval); return c; }
          return c + 1;
        });
      }, speed);
    }, delay);
    return () => { clearTimeout(timeout); clearInterval(interval); };
  }, [text, delay, speed]);

  return (
    <span className={className}>
      {text.slice(0, count)}
      {count < text.length && <span className="animate-pulse">▮</span>}
    </span>
  );
}