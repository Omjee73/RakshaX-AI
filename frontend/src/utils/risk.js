export function getRiskLabel(score) {
  if (score >= 75) return "High";
  if (score >= 45) return "Medium";
  return "Low";
}

export function getRiskColor(score) {
  if (score >= 75) return "text-alert-high";
  if (score >= 45) return "text-alert-medium";
  return "text-alert-low";
}
