export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function formatBabyAge(dob: string): string {
  const birth = new Date(dob);
  const now = new Date();
  const diffMs = now.getTime() - birth.getTime();
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (totalDays < 0) {
    const dueDays = Math.abs(totalDays);
    const weeks = Math.floor(dueDays / 7);
    return weeks > 0 ? `${weeks} week${weeks !== 1 ? "s" : ""} until due date` : `${dueDays} day${dueDays !== 1 ? "s" : ""} until due date`;
  }

  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;

  if (weeks < 12) {
    const parts: string[] = [];
    if (weeks > 0) parts.push(`${weeks} week${weeks !== 1 ? "s" : ""}`);
    if (days > 0 || weeks === 0) parts.push(`${days} day${days !== 1 ? "s" : ""}`);
    return parts.join(", ");
  }

  const months = Math.floor(totalDays / 30.44);
  return `${months} month${months !== 1 ? "s" : ""}`;
}
