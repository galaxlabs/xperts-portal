import { Badge } from "@/components/ui/badge";

const STATUS_MAP: Record<string, "success" | "warning" | "destructive" | "info" | "secondary" | "default"> = {
  "Pending Review": "warning",
  Approved: "success",
  Rejected: "destructive",
  Signed: "success",
  "Signed Rejected": "warning",
  Installed: "info",
  Converted: "success",
  Live: "success",
  Cancelled: "destructive",
  Draft: "secondary",
  Submitted: "info",
};

export function StatusBadge({ status, className }: { status?: string; className?: string }) {
  if (!status) return null;
  const variant = STATUS_MAP[status] || "secondary";
  return <Badge variant={variant} className={className}>{status}</Badge>;
}
