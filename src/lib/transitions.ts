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
      { action: "send_agreement", label: "Send Agreement", icon: "file-signature", to_status: "Agreement Sent" },
      { action: "reject", label: "Reject", icon: "thumbs-down", to_status: "Rejected" },
    ],
  },
  "Agreement Sent": {
    role: "owner",
    actions: [
      { action: "request_signature", label: "Request Signature", icon: "file-signature", to_status: "Pending Sign" },
      { action: "reject", label: "Reject", icon: "thumbs-down", to_status: "Rejected" },
    ],
  },
  "Pending Sign": {
    role: "owner",
    actions: [
      { action: "sign", label: "Mark Signed", icon: "file-signature", to_status: "Signed" },
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
      { action: "go_live", label: "Go Live", icon: "zap", to_status: "Live" },
    ],
  },
  Rejected: {
    role: "owner",
    actions: [
      { action: "resubmit", label: "Re-Submit", icon: "rotate-ccw", to_status: "Pending Review" },
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
