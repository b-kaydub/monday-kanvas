export function getStatusColor(status: string) {
  const s = status.toLowerCase();

  if (s.includes("done") || s.includes("complete")) {
    return "#00c875";
  }

  if (s.includes("working") || s.includes("progress")) {
    return "#0073ea";
  }

  if (s.includes("stuck") || s.includes("blocked")) {
    return "#e2445c";
  }

  if (s.includes("not") || s.includes("new")) {
    return "#c4c4c4";
  }

  return "#a25ddc";
}