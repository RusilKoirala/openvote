"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLinksProps {
  links: { href: string; label: string }[];
}

export function NavLinks({ links }: NavLinksProps) {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-0.5">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
            pathname === link.href
              ? "font-semibold text-foreground bg-muted"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
