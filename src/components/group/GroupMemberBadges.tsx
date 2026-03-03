/**
 * Phase 3: Reputation badges for group members
 * Computed client-side from existing data
 */

interface Settlement {
  id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  created_at: string;
  status?: string;
  confirmed_at?: string | null;
}

interface Balance {
  user_id: string;
  amount_paid: number;
  net_balance: number;
}

interface BadgeResult {
  userId: string;
  badge: { emoji: string; label: string } | null;
}

export const computeMemberBadges = (
  memberIds: string[],
  balances: Balance[],
  settlements: Settlement[],
  messageCounts: Record<string, number>,
): Record<string, { emoji: string; label: string }> => {
  if (memberIds.length < 2) return {};

  const badges: Record<string, { emoji: string; label: string }> = {};

  // 1. 💰 أكثر مساهمة — highest amount_paid
  let topPayer: { id: string; amount: number } | null = null;
  for (const b of balances) {
    if (!topPayer || b.amount_paid > topPayer.amount) {
      topPayer = { id: b.user_id, amount: b.amount_paid };
    }
  }
  if (topPayer && topPayer.amount > 0) {
    badges[topPayer.id] = { emoji: "💰", label: "أكثر مساهمة" };
  }

  // 2. 🟢 سريع السداد — fastest average confirmation time
  const confirmTimes: Record<string, number[]> = {};
  for (const s of settlements) {
    if (s.status === "confirmed" && s.confirmed_at) {
      const created = new Date(s.created_at).getTime();
      const confirmed = new Date(s.confirmed_at).getTime();
      const diff = confirmed - created;
      if (diff >= 0) {
        if (!confirmTimes[s.from_user_id]) confirmTimes[s.from_user_id] = [];
        confirmTimes[s.from_user_id].push(diff);
      }
    }
  }
  let fastestPayer: { id: string; avg: number } | null = null;
  for (const [uid, times] of Object.entries(confirmTimes)) {
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    if (!fastestPayer || avg < fastestPayer.avg) {
      fastestPayer = { id: uid, avg };
    }
  }
  if (fastestPayer && !badges[fastestPayer.id]) {
    badges[fastestPayer.id] = { emoji: "🟢", label: "سريع السداد" };
  }

  // 3. 🎯 روح المجموعة — most messages
  let topChatter: { id: string; count: number } | null = null;
  for (const [uid, count] of Object.entries(messageCounts)) {
    if (!topChatter || count > topChatter.count) {
      topChatter = { id: uid, count };
    }
  }
  if (topChatter && topChatter.count > 0 && !badges[topChatter.id]) {
    badges[topChatter.id] = { emoji: "🎯", label: "روح المجموعة" };
  }

  return badges;
};

/** Small inline badge component */
export const MemberBadge = ({ badge }: { badge: { emoji: string; label: string } }) => (
  <span className="inline-flex items-center gap-0.5 text-[10px] bg-accent/10 text-accent rounded-full px-1.5 py-0.5 font-medium">
    <span>{badge.emoji}</span>
    <span>{badge.label}</span>
  </span>
);
