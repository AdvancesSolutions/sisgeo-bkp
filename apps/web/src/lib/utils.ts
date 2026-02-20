import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const isPathMatch = (pathname: string, href: string): boolean => {
  const cleanPath = pathname.replace(/\/$/, "");
  const cleanHref = href.replace(/\/$/, "");

  if (cleanPath === cleanHref) return true;

  if (!cleanPath.startsWith(cleanHref)) return false;

  const pathParts = cleanPath.split("/");
  const menuParts = cleanHref.split("/");

  return pathParts.slice(0, menuParts.length).join("/") === cleanHref;
};

/** Filtra itens do menu por canAccess. Filho sem canAccess herda do pai. */
export function filterMenuByRole<T extends { canAccess?: string[]; children?: T[]; href?: string }>(
  items: T[],
  userRole: string,
  parentCanAccess?: string[],
): T[] {
  return items
    .filter((item) => {
      const allowed = item.canAccess ?? parentCanAccess;
      const canView = !allowed || allowed.includes(userRole);
      if (!canView) return false;
      if (item.children?.length) {
        const filtered = filterMenuByRole(item.children, userRole, item.canAccess ?? parentCanAccess);
        if (filtered.length === 0 && !item.href) return false;
      }
      return true;
    })
    .map((item) => {
      if (!item.children?.length) return item;
      const filtered = filterMenuByRole(item.children, userRole, item.canAccess ?? parentCanAccess);
      return { ...item, children: filtered };
    });
}
