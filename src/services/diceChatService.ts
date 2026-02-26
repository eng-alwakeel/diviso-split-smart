import { supabase } from "@/integrations/supabase/client";
import { DiceFace, ACTIVITY_FACES, CUISINE_FACES, FOOD_FACES, getDiceById, getRandomFace } from "@/data/diceData";
import type { Json } from "@/integrations/supabase/types";

export interface DiceDecisionResult {
  faceId: string;
  emoji: string;
  labelAr: string;
  labelEn: string;
}

export interface DiceDecision {
  id: string;
  group_id: string;
  created_by: string;
  dice_type: 'activity' | 'food' | 'cuisine' | 'budget' | 'whopays' | 'task' | 'quick';
  results: DiceDecisionResult[];
  status: 'open' | 'accepted' | 'rerolled' | 'expired';
  votes: string[];
  rerolled_from: string | null;
  created_at: string;
  accepted_at: string | null;
}

// Vote threshold percentage (60%)
const VOTE_THRESHOLD = 0.6;

/**
 * Convert DiceFace to storable result format
 */
export function faceToResult(face: DiceFace): DiceDecisionResult {
  return {
    faceId: face.id,
    emoji: face.emoji,
    labelAr: face.labelAr,
    labelEn: face.labelEn,
  };
}

/**
 * Check if there's already an open decision in the group
 */
export async function hasOpenDecision(groupId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("dice_decisions")
    .select("id")
    .eq("group_id", groupId)
    .eq("status", "open")
    .maybeSingle();

  if (error) {
    console.error("[diceChatService] Error checking open decision:", error);
    return false;
  }

  return !!data;
}

/**
 * Create a new dice decision and post it to chat
 */
export async function createDecision(
  groupId: string,
  diceType: 'activity' | 'food' | 'quick',
  results: DiceDecisionResult[]
): Promise<{ success: boolean; decisionId?: string; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "not_authenticated" };
  }

  // Check for existing open decision
  const hasOpen = await hasOpenDecision(groupId);
  if (hasOpen) {
    return { success: false, error: "open_decision_exists" };
  }

  // Create the decision
  const { data: decision, error: decisionError } = await supabase
    .from("dice_decisions")
    .insert({
      group_id: groupId,
      created_by: user.id,
      dice_type: diceType,
      results: results as unknown as Json,
      status: "open",
      votes: [] as unknown as Json,
    })
    .select()
    .single();

  if (decisionError || !decision) {
    console.error("[diceChatService] Error creating decision:", decisionError);
    return { success: false, error: "create_failed" };
  }

  // Create a message linking to this decision
  const { error: messageError } = await supabase
    .from("messages")
    .insert({
      group_id: groupId,
      sender_id: user.id,
      content: "", // Empty content, the card will show the decision
      message_type: "dice_decision",
      dice_decision_id: decision.id,
    });

  if (messageError) {
    console.error("[diceChatService] Error creating message:", messageError);
    // Still return success since decision was created
  }

  return { success: true, decisionId: decision.id };
}

/**
 * Toggle vote on a decision
 */
export async function toggleVote(
  decisionId: string
): Promise<{ success: boolean; voted: boolean; autoAccepted?: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, voted: false, error: "not_authenticated" };
  }

  // Get current decision
  const { data: decision, error: fetchError } = await supabase
    .from("dice_decisions")
    .select("*, groups!inner(id)")
    .eq("id", decisionId)
    .single();

  if (fetchError || !decision) {
    return { success: false, voted: false, error: "decision_not_found" };
  }

  if (decision.status !== "open") {
    return { success: false, voted: false, error: "decision_closed" };
  }

  // Toggle vote
  const currentVotes = (decision.votes as string[]) || [];
  const hasVoted = currentVotes.includes(user.id);
  const newVotes = hasVoted
    ? currentVotes.filter(id => id !== user.id)
    : [...currentVotes, user.id];

  // Get member count for threshold calculation
  const { count: memberCount } = await supabase
    .from("group_members")
    .select("*", { count: "exact", head: true })
    .eq("group_id", decision.group_id);

  const threshold = Math.ceil((memberCount || 1) * VOTE_THRESHOLD);
  const shouldAutoAccept = newVotes.length >= threshold;

  // Update decision
  const updateData: { votes: Json; status?: string; accepted_at?: string } = {
    votes: newVotes as unknown as Json,
  };

  if (shouldAutoAccept) {
    updateData.status = "accepted";
    updateData.accepted_at = new Date().toISOString();
  }

  const { error: updateError } = await supabase
    .from("dice_decisions")
    .update(updateData)
    .eq("id", decisionId);

  if (updateError) {
    console.error("[diceChatService] Error updating vote:", updateError);
    return { success: false, voted: hasVoted, error: "update_failed" };
  }

  return {
    success: true,
    voted: !hasVoted,
    autoAccepted: shouldAutoAccept,
  };
}

/**
 * Reroll a decision (creates new decision and marks old as rerolled)
 */
export async function rerollDecision(
  decisionId: string
): Promise<{ success: boolean; newDecisionId?: string; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "not_authenticated" };
  }

  // Get current decision
  const { data: decision, error: fetchError } = await supabase
    .from("dice_decisions")
    .select("*")
    .eq("id", decisionId)
    .single();

  if (fetchError || !decision) {
    return { success: false, error: "decision_not_found" };
  }

  if (decision.status !== "open") {
    return { success: false, error: "decision_closed" };
  }

  // Check if this was already rerolled from another decision
  if (decision.rerolled_from) {
    return { success: false, error: "already_rerolled" };
  }

  // Generate new results
  const newResults: DiceDecisionResult[] = [];
  const diceType = decision.dice_type as DiceDecision['dice_type'];

  if (diceType === 'quick') {
    const activityFace = ACTIVITY_FACES[Math.floor(Math.random() * ACTIVITY_FACES.length)];
    const cuisineFace = CUISINE_FACES[Math.floor(Math.random() * CUISINE_FACES.length)];
    newResults.push(faceToResult(activityFace), faceToResult(cuisineFace));
  } else if (diceType === 'activity') {
    const face = ACTIVITY_FACES[Math.floor(Math.random() * ACTIVITY_FACES.length)];
    newResults.push(faceToResult(face));
  } else if (diceType === 'cuisine' || diceType === 'food') {
    const face = CUISINE_FACES[Math.floor(Math.random() * CUISINE_FACES.length)];
    newResults.push(faceToResult(face));
  } else {
    // For budget, whopays, task - use their respective faces from diceData
    const { getDiceById, getRandomFace } = await import('@/data/diceData');
    const dice = getDiceById(diceType);
    if (dice) {
      const face = getRandomFace(dice);
      newResults.push(faceToResult(face));
    } else {
      const face = ACTIVITY_FACES[Math.floor(Math.random() * ACTIVITY_FACES.length)];
      newResults.push(faceToResult(face));
    }
  }

  // Mark old decision as rerolled
  const { error: updateError } = await supabase
    .from("dice_decisions")
    .update({ status: "rerolled" })
    .eq("id", decisionId);

  if (updateError) {
    console.error("[diceChatService] Error marking as rerolled:", updateError);
    return { success: false, error: "update_failed" };
  }

  // Create new decision
  const { data: newDecision, error: createError } = await supabase
    .from("dice_decisions")
    .insert({
      group_id: decision.group_id,
      created_by: user.id,
      dice_type: diceType,
      results: newResults as unknown as Json,
      status: "open",
      votes: [] as unknown as Json,
      rerolled_from: decisionId,
    })
    .select()
    .single();

  if (createError || !newDecision) {
    console.error("[diceChatService] Error creating new decision:", createError);
    return { success: false, error: "create_failed" };
  }

  // Create message for new decision
  await supabase
    .from("messages")
    .insert({
      group_id: decision.group_id,
      sender_id: user.id,
      content: "",
      message_type: "dice_decision",
      dice_decision_id: newDecision.id,
    });

  return { success: true, newDecisionId: newDecision.id };
}

/**
 * Get a decision by ID
 */
export async function getDecision(decisionId: string): Promise<DiceDecision | null> {
  const { data, error } = await supabase
    .from("dice_decisions")
    .select("*")
    .eq("id", decisionId)
    .single();

  if (error || !data) {
    console.error("[diceChatService] Error fetching decision:", error);
    return null;
  }

  return {
    ...data,
    results: data.results as unknown as DiceDecisionResult[],
    votes: data.votes as unknown as string[],
    dice_type: data.dice_type as DiceDecision['dice_type'],
    status: data.status as DiceDecision['status'],
  };
}

/**
 * Calculate vote threshold for a group
 */
export function getVoteThreshold(memberCount: number): number {
  return Math.ceil(memberCount * VOTE_THRESHOLD);
}

/**
 * Generate expense title from dice results
 */
export function generateExpenseTitle(
  results: DiceDecisionResult[],
  lang: 'ar' | 'en' = 'ar'
): string {
  if (results.length === 2) {
    const activity = lang === 'ar' ? results[0].labelAr : results[0].labelEn;
    const food = lang === 'ar' ? results[1].labelAr : results[1].labelEn;
    return `${activity} – ${food}`;
  }
  
  if (results.length === 1) {
    const label = lang === 'ar' ? results[0].labelAr : results[0].labelEn;
    const prefix = lang === 'ar' ? 'طلعة – ' : 'Trip – ';
    return prefix + label;
  }
  
  return lang === 'ar' ? 'مصروف جديد' : 'New Expense';
}
