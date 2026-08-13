import React, { useEffect, useState } from "react";
import { CalendarDays, Clock3, GitBranch, ListOrdered, Map, Share2, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buildTimelineShareUrl, readTimelineOrder } from "@shared/shareLinks";

type Order = "story" | "release" | "event";
const labels = {
  ar: { title: "الخط الزمني لمارفل", eyebrow: "MARVEL TIMELINE", intro: "استكشف أعمال MCU في ثلاثة مسارات: تسلسل القصة، سنة العرض، أو ترتيب الأحداث الرسمي.", story: "تسلسل القصة", release: "سنة العرض", event: "ترتيب الأحداث", map: "فتح خريطة العوالم", work: "فتح العمل", empty: "لم تتم إضافة أعمال مارفل بعد." },
  en: { title: "Marvel timeline", eyebrow: "MARVEL TIMELINE", intro: "Explore the MCU screen catalog by story sequence, release year, or the official event order.", story: "Story sequence", release: "Release year", event: "Event order", map: "Open universe map", work: "Open work", empty: "No Marvel works have been added yet." },
};

export default function MarvelTimelinePage() {
  const { lang, toggleLang } = useLanguage();
  const copy = labels[lang];
  const [order, setOrder] = useState<Order>(() => typeof window === "undefined" ? "story" : readTimelineOrder(window.location.search));
  const [shareState, setShareState] = useState<"idle" | "copied" | "error">("idle");
  useEffect(() => {
    if (typeof window !== "undefined") window.history.replaceState({}, "", buildTimelineShareUrl(window.location.origin, order));
  }, [order]);
  const copyTimelineLink = async () => {
    const url = buildTimelineShareUrl(window.location.origin, order);
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url);
      else { const input = document.createElement("textarea"); input.value = url; input.style.position = "fixed"; input.style.opacity = "0"; document.body.appendChild(input); input.select(); document.execCommand("copy"); input.remove(); }
      setShareState("copied");
      window.setTimeout(() => setShareState("idle"), 1800);
    } catch { setShareState("error"); }
  };
  const { data, isLoading } = trpc.catalog.marvelTimeline.useQuery({ order });
  const items = data || [];
  const orderButtons: { value: Order; icon: typeof ListOrdered; label: string }[] = [
    { value: "story", icon: Sparkles, label: copy.story },
    { value: "release", icon: CalendarDays, label: copy.release },
    { value: "event", icon: GitBranch, label: copy.event },
  ];
  return <div dir={lang === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-background">
    <header className="border-b border-border/60"><div className="container flex h-20 items-center justify-between gap-4"><Link href="/" className="font-display text-xl font-bold">Visual Works <span className="text-primary">/</span> Archive</Link><div className="flex items-center gap-2"><Button variant="ghost" size="sm" onClick={toggleLang}>{lang === "ar" ? "English" : "العربية"}</Button><Button variant="outline" asChild><Link href="/map"><Map size={16}/>{copy.map}</Link></Button></div></div></header>
    <main className="container py-12"><div className="max-w-3xl"><p className="eyebrow">{copy.eyebrow}</p><h1 className="section-title mt-3 text-4xl sm:text-6xl">{copy.title}</h1><p className="mt-5 text-lg leading-8 text-muted-foreground">{copy.intro}</p></div>
      <div className="mt-8 flex flex-wrap gap-2">{orderButtons.map(({ value, icon: Icon, label }) => <Button key={value} variant={order === value ? "default" : "outline"} onClick={() => setOrder(value)}><Icon size={16}/>{label}</Button>)}<Button variant="outline" onClick={copyTimelineLink}><Share2 size={16}/>{shareState === "copied" ? (lang === "ar" ? "تم نسخ الرابط" : "Link copied") : shareState === "error" ? (lang === "ar" ? "تعذر النسخ" : "Copy failed") : (lang === "ar" ? "مشاركة هذا الترتيب" : "Share this order")}</Button></div>
      {isLoading ? <div className="mt-10 rounded-2xl border border-dashed p-10 text-center text-muted-foreground">Loading timeline…</div> : !items.length ? <div className="mt-10 rounded-2xl border border-dashed p-10 text-center text-muted-foreground">{copy.empty}</div> : <div className="relative mt-10 space-y-4 before:absolute before:inset-y-0 before:start-5 before:w-px before:bg-border/70">{items.map((work, index) => <div key={work.id} className="relative flex gap-5"><div className="z-10 mt-5 flex h-3 w-3 shrink-0 rounded-full bg-primary ring-8 ring-background"/><Card className="w-full border-border/60 transition-colors hover:border-primary/50"><CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"><div className="flex min-w-0 flex-1 items-center gap-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-display font-bold text-primary">{index + 1}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-display text-lg font-bold">{work.title}</h2><Badge variant="secondary">{work.type}</Badge></div><div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><CalendarDays size={13}/>{work.releaseYear || "—"}</span><span className="inline-flex items-center gap-1"><Clock3 size={13}/>{work.canonLabel || "MCU"}</span></div></div></div><Button variant="outline" size="sm" asChild><Link href={`/work/${work.id}`}>{copy.work}</Link></Button></CardContent></Card></div>)}</div>}
    </main>
  </div>;
}
