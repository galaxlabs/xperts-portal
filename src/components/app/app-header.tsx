import { Menu, Moon, Sun, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AppHeader({
  title,
  search,
  onSearchChange,
  showSearch = true,
  onRefresh,
  onToggleDark,
  dark,
  onOpenMobile,
  actions,
}: {
  title: string;
  search?: string;
  onSearchChange?: (v: string) => void;
  showSearch?: boolean;
  onRefresh?: () => void;
  onToggleDark?: () => void;
  dark?: boolean;
  onOpenMobile?: () => void;
  actions?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <div className="flex h-14 items-center gap-3 px-4 md:px-6">
        <Button variant="ghost" size="icon-sm" className="rounded-lg md:hidden" onClick={onOpenMobile}>
          <Menu className="size-4" />
        </Button>
        <h1 className="text-base font-semibold tracking-tight truncate">{title}</h1>
        <div className="ms-auto flex items-center gap-2">
          {showSearch && (
            <Input
              value={search || ""}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search..."
              className="hidden w-56 rounded-lg md:flex"
            />
          )}
          {actions}
          {onRefresh && (
            <Button variant="ghost" size="icon-sm" className="rounded-lg" onClick={onRefresh}>
              <RefreshCw className="size-4" />
            </Button>
          )}
          {onToggleDark && (
            <Button variant="ghost" size="icon-sm" className="rounded-lg" onClick={onToggleDark}>
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
