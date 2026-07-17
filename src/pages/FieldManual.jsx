import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Search, ScrollText, Compass, FileText } from "lucide-react";
import { RULES, LORE } from "@/lib/fieldManual";
import ManualBlock from "@/components/manual/ManualBlock";

// /field-manual — the in-game codex. Two books (Field Regulations / Ground
// Almanac), a searchable chapter index, and scroll-spy nav. Display only,
// sourced from docs/GAME_RULES.md + docs/LORE.md.

const BOOK_META = {
  rules: { book: RULES, icon: ScrollText, label: "Field Regulations" },
  lore: { book: LORE, icon: BookOpen, label: "Ground Almanac" },
};

// Flatten a chapter's text for search matching.
function chapterText(ch) {
  const parts = [ch.title, ch.tag || ""];
  for (const b of ch.blocks) {
    if (b.p) parts.push(b.p);
    if (b.h) parts.push(b.h);
    if (b.lead) parts.push(b.lead);
    if (b.note) parts.push(b.note);
    if (b.quote) parts.push(b.quote);
    if (b.list) parts.push(b.list.join(" "));
    if (b.table) parts.push(b.table.head.join(" "), b.table.rows.flat().join(" "));
  }
  return parts.join(" ").toLowerCase();
}

export default function FieldManual() {
  const [bookKey, setBookKey] = useState("rules");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(null);
  const refs = useRef({});
  const spyLock = useRef(false);

  const { book } = BOOK_META[bookKey];

  const chapters = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return book.chapters;
    return book.chapters.filter((ch) => chapterText(ch).includes(q));
  }, [book, query]);

  // Reset view when switching books.
  useEffect(() => {
    setActive(book.chapters[0]?.id || null);
    window.scrollTo({ top: 0 });
  }, [bookKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll-spy: highlight the chapter nearest the top of the viewport.
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        if (spyLock.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.dataset.chapter);
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );
    chapters.forEach((ch) => {
      const el = refs.current[ch.id];
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [chapters]);

  const jump = (id) => {
    setActive(id);
    spyLock.current = true;
    refs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => (spyLock.current = false), 600);
  };

  return (
    <div className="max-w-6xl mx-auto pb-16">
      {/* masthead */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="cq-panel relative overflow-hidden mb-6"
      >
        <div className="cq-hazard" />
        <div className="cq-scanlines absolute inset-0 pointer-events-none opacity-40" />
        <div className="relative p-6 sm:p-8">
          <div className="cq-label mb-2 flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5" /> War Ministry · Directorate of Instruction
          </div>
          <h1 className="cq-display text-5xl sm:text-6xl leading-none">The Field Manual</h1>
          <p className="text-muted-foreground font-heading tracking-wide mt-2 max-w-2xl">
            Everything a commanding officer must know — the regulations of the war, and the almanac of the world it is
            fought over. Issue to all officers of the March.
          </p>
        </div>
      </motion.div>

      {/* book tabs + search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="flex gap-2">
          {Object.entries(BOOK_META).map(([key, meta]) => (
            <button
              key={key}
              onClick={() => {
                setBookKey(key);
                setQuery("");
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-sm font-heading uppercase tracking-[0.15em] text-sm transition-colors ${
                bookKey === key ? "cq-metal text-brass-bright" : "text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              <meta.icon className="w-4 h-4" /> {meta.label}
            </button>
          ))}
        </div>
        <div className="sm:ml-auto relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search the ${BOOK_META[bookKey].label.toLowerCase()}…`}
            className="bg-secondary/40 border border-border rounded-sm pl-8 pr-3 py-2 text-sm w-full sm:w-72 focus:outline-none focus:border-brass/60"
          />
        </div>
      </div>

      <div className="flex gap-6 items-start">
        {/* chapter index */}
        <nav className="hidden lg:block w-56 shrink-0 sticky top-20">
          <div className="cq-label mb-2">Contents</div>
          <ul className="space-y-0.5">
            {book.chapters.map((ch) => {
              const dimmed = query && !chapters.includes(ch);
              return (
                <li key={ch.id}>
                  <button
                    onClick={() => jump(ch.id)}
                    className={`w-full text-left px-2 py-1.5 rounded-sm text-xs font-heading tracking-wide transition-colors border-l-2 ${
                      active === ch.id
                        ? "border-brass text-brass-bright bg-brass/10"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    } ${dimmed ? "opacity-30" : ""}`}
                  >
                    {ch.title}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* content */}
        <div className="flex-1 min-w-0">
          {chapters.length === 0 && (
            <div className="cq-panel p-8 text-center text-muted-foreground italic">
              No entry in the {BOOK_META[bookKey].label} matches “{query}”.
            </div>
          )}

          {chapters.map((ch, i) => (
            <motion.section
              key={ch.id}
              ref={(el) => (refs.current[ch.id] = el)}
              data-chapter={ch.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4 }}
              className="cq-panel relative overflow-hidden mb-5 scroll-mt-20"
            >
              <div className="cq-hazard" />
              <div className="p-5 sm:p-6">
                <div className="flex items-baseline justify-between gap-3 mb-3 border-b border-border/40 pb-3">
                  <h2 className="cq-display text-3xl leading-none">{ch.title}</h2>
                  {ch.tag && <span className="cq-tag text-[10px] shrink-0">{ch.tag}</span>}
                </div>
                {ch.blocks.map((b, bi) => (
                  <ManualBlock key={bi} block={b} />
                ))}
              </div>
            </motion.section>
          ))}

          {/* footer cross-links */}
          <div className="mt-6 border-t border-border/40 pt-5 flex flex-wrap gap-3">
            <Link
              to="/roadmap"
              className="inline-flex items-center gap-2 cq-metal px-3 py-1.5 text-xs font-heading uppercase tracking-[0.2em] text-brass hover:text-brass-bright"
            >
              <Compass className="w-3.5 h-3.5" /> Forward Doctrine
            </Link>
            <Link
              to="/patch-notes"
              className="inline-flex items-center gap-2 cq-metal px-3 py-1.5 text-xs font-heading uppercase tracking-[0.2em] text-brass hover:text-brass-bright"
            >
              <FileText className="w-3.5 h-3.5" /> Field Amendments
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
