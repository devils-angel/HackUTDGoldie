const STATUS_CONFIG = {
  APPROVED: {
    label: "APPROVED",
    bg: "var(--status-approve-bg)",
    text: "var(--status-approve-text)",
    border: "var(--status-approve-border)",
    panel: "var(--model-approve-panel)",
    bar: "var(--status-approve-bar)",
  },
  REJECTED: {
    label: "REJECTED",
    bg: "var(--status-reject-bg)",
    text: "var(--status-reject-text)",
    border: "var(--status-reject-border)",
    panel: "var(--model-reject-panel)",
    bar: "var(--status-reject-bar)",
  },
  PENDING: {
    label: "PENDING",
    bg: "var(--status-pending-bg)",
    text: "var(--status-pending-text)",
    border: "var(--status-pending-border)",
    panel: "var(--model-pending-panel)",
    bar: "var(--status-pending-bar)",
  },
};

const normalizeStatus = (value) => {
  const upper = (value || "PENDING").toUpperCase();
  return STATUS_CONFIG[upper] ? upper : "PENDING";
};

export const getStatusChipStyles = (status) => {
  const key = normalizeStatus(status);
  const config = STATUS_CONFIG[key];
  return {
    label: config.label,
    style: {
      backgroundColor: config.bg,
      color: config.text,
      borderColor: config.border,
    },
  };
};

export const getModelVerdictStyles = (decision) => {
  const normalizedDecision =
    decision && decision.toUpperCase() === "MODEL_APPROVE"
      ? "APPROVED"
      : decision && decision.toUpperCase() === "MODEL_REJECT"
      ? "REJECTED"
      : "PENDING";
  const config = STATUS_CONFIG[normalizedDecision];
  return {
    badge: {
      backgroundColor: config.bg,
      color: config.text,
      borderColor: config.border,
    },
    container: {
      backgroundColor: config.panel,
      color: config.text,
      borderColor: config.border,
    },
    barColor: config.bar,
  };
};
