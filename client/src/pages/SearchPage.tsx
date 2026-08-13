import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Search, Globe2, Moon, Sun, Star, UserRound } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SearchPage() {
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLang } = useLanguage();
  const [q, setQ] = useState("");
  const search = trpc.catalog.searchAll.useQuery({ q: q.trim(), limit: 40 }, { enabled: q.trim().length > 0 });
  const t = (en: string, ar: string) => lang === "ar" ? ar : en;
  const works = search.data?.works || [];
  const characters = search.data?.characters || [];
  const hasQuery = q.trim().length > 0;

  return <div dir={lang === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-background">
    <header className="border-b border-border/60"><div className="container flex h-20 items-center justify-between"><Link href="/" className="font-display text-xl font-bold">Visual Works <span className="text-primary">/</span> {t("Search", "البحث")}</Link><div className="flex gap-2"><Button variant="ghost" size="icon" onClick={toggleLang}><Globe2 size={18}/></Button><Button variant="ghost" size="icon" onClick={toggleTheme}>{theme === "dark" ? <Sun size={18}/> : <Moon size={18}/>}</Button></div></div></header>
    <main className="container py-12">
      <button onClick={() => navigate("/")} className="mb-7 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16}/>{t("Back home", "العودة للرئيسية")}</button>
      <div className="mb-8 max-w-3xl"><p className="eyebrow">CATALOG / 04</p><h1 className="section-title">{t("Search the archive", "ابحث في الأرشيف")}</h1><p className="mt-4 text-muted-foreground">{t("Type any part of a work or character name. Results update instantly.", "اكتب أي جزء من اسم العمل أو الشخصية وستتحدث النتائج فوراً.")}</p></div>
      <div className="relative mb-10 max-w-3xl"><Search className="absolute start-4 top-3.5 text-muted-foreground" size={19}/><Input autoFocus value={q} onChange={event => setQ(event.target.value)} placeholder={t("Search by work or character name...", "ابحث باسم العمل أو الشخصية...")} className="h-12 ps-11 text-base" /></div>
      {!hasQuery ? <div className="rounded-2xl border border-dashed border-border py-20 text-center"><Search className="mx-auto mb-4 text-muted-foreground" size={32}/><h3 className="font-display text-xl font-bold">{t("Start with a name", "ابدأ بكتابة اسم")}</h3><p className="mt-2 text-sm text-muted-foreground">{t("Full names and partial names are supported.", "يمكنك كتابة الاسم كاملاً أو جزءاً منه.")}</p></div> : search.isLoading ? <div className="rounded-2xl border border-border py-20 text-center text-muted-foreground">{t("Searching the archive...", "جارٍ البحث في الأرشيف...")}</div> : search.isError ? <div className="rounded-2xl border border-dashed border-destructive/40 py-20 text-center text-destructive">{t("Search is temporarily unavailable.", "البحث غير متاح مؤقتاً.")}</div> : !works.length && !characters.length ? <div className="rounded-2xl border border-dashed border-border py-20 text-center"><h3 className="font-display text-xl font-bold">{t("No matches found", "لم يتم العثور على نتائج")}</h3><p className="mt-2 text-sm text-muted-foreground">{t("Try another part of the name.", "جرّب جزءاً آخر من الاسم.")}</p></div> : <div className="space-y-10">
        {works.length > 0 && <section><div className="mb-4 flex items-center justify-between"><h2 className="font-display text-2xl font-bold">{t("Works", "الأعمال")}</h2><Badge variant="outline">{works.length}</Badge></div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{works.map(work => <Link key={work.id} href={`/work/${work.id}`} className="group"><Card className="media-card overflow-hidden"><div className="relative aspect-[4/5] overflow-hidden bg-muted"><div className="absolute inset-0 z-10 bg-gradient-to-t from-black/75 to-transparent"/><img src={work.coverImageUrl || "https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&w=700&q=80"} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/><div className="absolute bottom-4 start-4 z-20 text-white"><div className="font-display text-xl font-bold">{lang === "ar" ? (work.titleAr || work.title) : work.title}</div><div className="mt-1 text-xs text-white/70">{work.releaseYear || "—"} · {work.studio || t("Independent", "مستقل")}</div></div><div className="absolute end-3 top-3 z-20 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-xs text-white"><Star size={12} className="fill-amber-400 text-amber-400"/>{work.score || "—"}</div></div></Card></Link>)}</div></section>}
        {characters.length > 0 && <section><div className="mb-4 flex items-center justify-between"><h2 className="font-display text-2xl font-bold">{t("Characters", "الشخصيات")}</h2><Badge variant="outline">{characters.length}</Badge></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{characters.map(character => <Link key={character.id} href={`/entity/${character.id}`}><Card className="flex items-center gap-4 p-4 transition hover:border-primary/50"><div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted"><img src={character.imageUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80"} alt="" className="h-full w-full object-cover"/></div><div className="min-w-0"><div className="flex items-center gap-2 font-semibold"><UserRound size={15} className="text-primary"/>{lang === "ar" ? (character.nameAr || character.name) : character.name}</div><p className="mt-1 text-xs text-muted-foreground line-clamp-2">{character.description || t("Character profile", "ملف شخصية")}</p></div></Card></Link>)}</div></section>}
      </div>}
    </main>
  </div>;
}
