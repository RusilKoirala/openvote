"use client";

import Link from "next/link";
import { ArrowLeft, Menu, X } from "lucide-react";
import { NavLinks } from "@/components/NavLinks";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { usePathname } from "next/navigation";

export const NAV_LINKS = [
  { href: "/", label: "Results" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/sources", label: "Sources" },
];

interface SiteNavProps {
  backLabel?: string;
  breadcrumbTitle?: string;
}

export function SiteNav({ backLabel, breadcrumbTitle }: SiteNavProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-background/95 border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-lg sm:text-xl font-bold tracking-tight">
            🇳🇵 <span className="text-red-600">२०८२</span>
          </span>
          <span className="hidden sm:inline text-sm text-muted-foreground font-medium">Nepal Election Results</span>
        </Link>

        {backLabel ? (
          <>
            <div className="flex items-center gap-2 min-w-0 text-sm flex-1">
              <Link
                href="/"
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">{backLabel}</span>
              </Link>
              {breadcrumbTitle && (
                <>
                  <span className="text-muted-foreground">/</span>
                  <span className="font-medium truncate">{breadcrumbTitle}</span>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Desktop nav */}
            <div className="hidden sm:flex flex-1">
              <NavLinks links={NAV_LINKS} />
            </div>

            {/* Spacer on mobile */}
            <div className="flex-1 sm:hidden" />

            {/* Mobile hamburger */}
            <Sheet>
              <SheetTrigger
                className="sm:hidden inline-flex items-center justify-center p-2 -mr-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </SheetTrigger>
              <SheetContent side="right" className="w-65 p-0" showCloseButton={false}>
                <div className="flex items-center justify-between px-4 h-14 border-b">
                  <Link href="/" className="flex items-center gap-2">
                    <span className="text-lg font-bold">
                      🇳🇵 <span className="text-red-600">२०८२</span>
                    </span>
                  </Link>
                  <SheetClose className="p-2 rounded-md hover:bg-muted transition-colors">
                    <X className="w-4 h-4" />
                    <span className="sr-only">Close</span>
                  </SheetClose>
                </div>
                <nav className="flex flex-col px-2 py-3 gap-0.5">
                  {NAV_LINKS.map((link) => (
                    <SheetClose key={link.href} asChild>
                      <Link
                        href={link.href}
                        className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          pathname === link.href
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        }`}
                      >
                        {link.label}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </>
        )}
      </div>
    </header>
  );
}
