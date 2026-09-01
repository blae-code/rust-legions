import React, { useState } from "react";
import { Star } from "lucide-react";

// Brass star row — display-only by default; pass onRate to make it interactive.
export default function StarRating({ value = 0, onRate, size = "w-4 h-4" }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div className="inline-flex items-center gap-0.5" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onRate}
          onClick={() => onRate?.(n)}
          onMouseEnter={() => onRate && setHover(n)}
          className={onRate ? "cursor-pointer" : "cursor-default"}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          <Star
            className={`${size} transition-colors ${
              n <= shown ? "text-brass-bright fill-brass" : "text-border"
            }`}
          />
        </button>
      ))}
    </div>
  );
}