import Link from "next/link";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Fil d'Ariane" className="mb-4 text-sm">
      <ol className="flex flex-wrap items-center gap-1.5 text-white/50">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-1.5">
              {index > 0 && <span aria-hidden="true" className="text-white/30">/</span>}
              {isLast || !item.href ? (
                <span className="text-white" aria-current="page">{item.label}</span>
              ) : (
                <Link href={item.href} className="transition hover:text-white">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
