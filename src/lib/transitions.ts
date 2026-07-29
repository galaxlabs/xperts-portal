export type ActionDef = {
  action: string;
  label: string;
  icon: string;
  to_status: string;
};

type StatusConfig = {
  role: "manager" | "owner";
  actions: ActionDef[];
};

const LEAD_TRANSITIONS: Record<string, StatusConfig> = {
  "Pending Review": {
    role: "manager",
    actions: [
      { action: "approve", label: "Approve", icon: "thumbs-up", to_status: "Approved" },
      { action: "reject", label: "Reject", icon: "thumbs-down", to_status: "Rejected" },
    ],
  },
  Approved: {
    role: "owner",
    actions: [
      { action: "reject", label: "Reject", icon: "thumbs-down", to_status: "Rejected" },
    ],
  },
  Signed: {
    role: "manager",
    actions: [
      { action: "install", label: "Mark Installed", icon: "wrench", to_status: "Installed" },
      { action: "cancel", label: "Cancel", icon: "x-circle", to_status: "Cancelled" },
    ],
  },
  Installed: {
    role: "manager",
    actions: [
      { action: "convert", label: "Convert", icon: "zap", to_status: "Converted" },
    ],
  },
};

const TRANSITIONS: Record<string, Record<string, StatusConfig>> = {
  "ATM Lead": LEAD_TRANSITIONS,
};

export type { ActionDef };

export function getActions(
  doctype: string,
  status: string,
  isManager: boolean,
  isOwner: boolean,
  isPortalUser?: boolean,
): ActionDef[] {
  const doctypeTransitions = TRANSITIONS[doctype];
  if (!doctypeTransitions) return [];

  const config = doctypeTransitions[status];
  if (!config) return [];

  if (isPortalUser) return config.actions;
  if (config.role === "manager" && !isManager && !isPortalUser) return [];
  if (config.role === "owner" && !isManager && !isOwner) return [];

  return config.actions;
}
