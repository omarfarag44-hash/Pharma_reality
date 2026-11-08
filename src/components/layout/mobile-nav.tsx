"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import type { Locale } from "@/domain/common";
import type { Dictionary } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SidebarNav } from "./sidebar-nav";
import { BrandMark } from "./brand";

export function MobileNav({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="lg:hidden" aria-label={dict.nav.menu} data-testid="mobile-menu">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-sidebar text-sidebar-foreground p-4" closeLabel={dict.nav.close}>
        <SheetTitle className="sr-only">{dict.nav.menu}</SheetTitle>
        <SheetDescription className="sr-only">{dict.meta.tagline}</SheetDescription>
        <div className="mb-6 pe-8">
          <BrandMark dict={dict} />
        </div>
        <SidebarNav locale={locale} nav={dict.nav} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
