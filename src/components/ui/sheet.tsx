import * as React from "react"
import { Sheet as SheetPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({ ...props }: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetContent({ className, children, side = "right", ...props }: React.ComponentProps<typeof SheetPrimitive.Content> & { side?: "top" | "bottom" | "left" | "right" }) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-black/10 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "fixed z-50 gap-4 bg-popover p-4 text-popover-foreground shadow-lg transition data-open:animate-in data-closed:animate-out",
          side === "right" && "inset-y-0 right-0 w-full max-w-sm border-l data-open:slide-in-from-right-full data-closed:slide-out-to-right-full",
          side === "left" && "inset-y-0 left-0 w-full max-w-sm border-r data-open:slide-in-from-left-full data-closed:slide-out-to-left-full",
          side === "top" && "inset-x-0 top-0 border-b data-open:slide-in-from-top-full data-closed:slide-out-to-top-full",
          side === "bottom" && "inset-x-0 bottom-0 border-t data-open:slide-in-from-bottom-full data-closed:slide-out-to-bottom-full",
          className
        )}
        {...props}>
        {children}
        <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100">
          <XIcon className="size-4" />
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sheet-header" className={cn("flex flex-col gap-1", className)} {...props} />;
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return <SheetPrimitive.Title data-slot="sheet-title" className={cn("text-base font-medium", className)} {...props} />;
}

function SheetDescription({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return <SheetPrimitive.Description data-slot="sheet-description" className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription }
