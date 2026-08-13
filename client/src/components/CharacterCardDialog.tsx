import { Link } from "wouter";
import React, { useState } from "react";
import { ArrowUpRight, Share2, Shield, Sparkles, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { buildCharacterShareUrl } from "@shared/shareLinks";

export type CharacterCardEntity = {
  id: number;
  kind: string;
  name: string;
  nameAr?: string | null;
  imageUrl?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
  abilities?: string | null;
  relationships?: string | null;
};

type CharacterCardDialogProps = {
  entity: CharacterCardEntity | null;
  role?: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  sharePath?: string;
};

const fallbackImage = "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=700&q=80";

export default function CharacterCardDialog({ entity, role, isOpen, onOpenChange, sharePath }: CharacterCardDialogProps) {
  const { lang } = useLanguage();
  const [shareState, setShareState] = useState<"idle" | "copied" | "error">("idle");
  if (!entity) return null;
  const copyShareLink = async () => {
    const url = buildCharacterShareUrl(window.location.origin, sharePath || window.location.pathname, entity.id, sharePath?.includes("universe=") ? Number(new URLSearchParams(sharePath.split("?")[1]).get("universe")) : undefined);
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url.toString());
      else { const input = document.createElement("textarea"); input.value = url.toString(); input.style.position = "fixed"; input.style.opacity = "0"; document.body.appendChild(input); input.select(); document.execCommand("copy"); input.remove(); }
      setShareState("copied");
      window.setTimeout(() => setShareState("idle"), 1800);
    } catch { setShareState("error"); }
  };
  const title = lang === "ar" ? entity.nameAr || entity.name : entity.name;
  const alternate = lang === "ar" ? entity.name : entity.nameAr;
  const description = lang === "ar" ? entity.descriptionAr || entity.description : entity.description || entity.descriptionAr;
  const kindLabel = entity.kind === "character" ? (lang === "ar" ? "شخصية" : "Character") : entity.kind;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent dir={lang === "ar" ? "rtl" : "ltr"} className="overflow-hidden p-0 sm:max-w-2xl">
        <div className="grid sm:grid-cols-[190px_1fr]">
          <div className="relative min-h-56 bg-muted sm:min-h-full">
            <img src={entity.imageUrl || fallbackImage} alt={title} className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white sm:hidden">
              <Badge variant="secondary">{kindLabel}</Badge>
            </div>
          </div>
          <div className="flex min-h-56 flex-col p-6">
            <DialogHeader className="text-start">
              <div className="mb-3 hidden sm:block"><Badge variant="secondary">{kindLabel}</Badge></div>
              <DialogTitle className="font-display text-2xl">{title}</DialogTitle>
              {alternate && <DialogDescription className="text-base">{alternate}</DialogDescription>}
            </DialogHeader>
            {role && <div className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"><Shield size={14} />{role}</div>}
            <p className="mt-5 line-clamp-5 text-sm leading-7 text-muted-foreground">{description || (lang === "ar" ? "لا يوجد وصف موثق لهذه الشخصية بعد." : "This character profile is awaiting enrichment.")}</p>
            <div className="mt-5 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
              {entity.abilities && <div className="flex items-center gap-2"><Sparkles size={14} className="text-primary" />{lang === "ar" ? "القدرات موثقة" : "Abilities cataloged"}</div>}
              {entity.relationships && <div className="flex items-center gap-2"><Users size={14} className="text-primary" />{lang === "ar" ? "العلاقات موثقة" : "Relationships cataloged"}</div>}
            </div>
            <DialogFooter className="mt-auto pt-6 sm:justify-start">
              <Button asChild><Link href={`/entity/${entity.id}`} onClick={() => onOpenChange(false)}>{lang === "ar" ? "فتح الملف الكامل" : "Open full profile"}<ArrowUpRight size={15} /></Link></Button>
              <Button variant="outline" onClick={copyShareLink}><Share2 size={15} />{shareState === "copied" ? (lang === "ar" ? "تم النسخ" : "Copied") : shareState === "error" ? (lang === "ar" ? "تعذر النسخ" : "Copy failed") : (lang === "ar" ? "مشاركة" : "Share")}</Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>{lang === "ar" ? "إغلاق" : "Close"}</Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
