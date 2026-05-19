"use server";

import { revalidatePath } from "next/cache";
import { adminAuth } from "@/lib/firebase-admin";
import { isAdminEmail } from "@/lib/admin-emails";
import {
  isModel,
  isVoice,
  type ModelId,
  type VoiceId,
} from "@/lib/agent-options";
import {
  activatePrompt,
  createPrompt,
  deletePrompt,
  getActivePromptId,
  getPrompt,
  listPrompts,
  updatePrompt,
  type PromptDoc,
} from "@/lib/prompts";

async function requireAdmin(idToken: string): Promise<void> {
  const decoded = await adminAuth().verifyIdToken(idToken);
  if (!isAdminEmail(decoded.email) || !decoded.email_verified) {
    throw new Error("Forbidden");
  }
}

function validateBody(body: {
  name: string;
  prompt: string;
  voice: string;
  model: string;
}): { name: string; prompt: string; voice: VoiceId; model: ModelId } {
  const name = body.name.trim();
  const prompt = body.prompt.trim();
  if (!name) throw new Error("Name is required");
  if (!prompt) throw new Error("Prompt is required");
  if (!isVoice(body.voice)) throw new Error(`Invalid voice: ${body.voice}`);
  if (!isModel(body.model)) throw new Error(`Invalid model: ${body.model}`);
  return { name, prompt, voice: body.voice, model: body.model };
}

export async function createPromptAction(args: {
  idToken: string;
  name: string;
  prompt: string;
  voice: string;
  model: string;
}): Promise<{ id: string }> {
  await requireAdmin(args.idToken);
  const fields = validateBody(args);
  const doc = await createPrompt(fields);
  revalidatePath("/admin/prompts");
  return { id: doc.id };
}

export async function updatePromptAction(args: {
  idToken: string;
  id: string;
  name: string;
  prompt: string;
  voice: string;
  model: string;
}): Promise<{ ok: true }> {
  await requireAdmin(args.idToken);
  const fields = validateBody(args);
  await updatePrompt(args.id, fields);
  revalidatePath("/admin/prompts");
  revalidatePath(`/admin/prompts/${args.id}`);
  return { ok: true };
}

export async function activatePromptAction(args: {
  idToken: string;
  id: string;
}): Promise<{ ok: true }> {
  await requireAdmin(args.idToken);
  await activatePrompt(args.id);
  revalidatePath("/admin/prompts");
  revalidatePath(`/admin/prompts/${args.id}`);
  return { ok: true };
}

export async function deletePromptAction(args: {
  idToken: string;
  id: string;
}): Promise<{ ok: true }> {
  await requireAdmin(args.idToken);
  await deletePrompt(args.id);
  revalidatePath("/admin/prompts");
  return { ok: true };
}

export async function fetchPromptsAction(args: {
  idToken: string;
}): Promise<{ prompts: PromptDoc[]; activePromptId: string | null }> {
  await requireAdmin(args.idToken);
  const [prompts, activePromptId] = await Promise.all([
    listPrompts(),
    getActivePromptId(),
  ]);
  return { prompts, activePromptId };
}

export async function fetchPromptAction(args: {
  idToken: string;
  id: string;
}): Promise<{ prompt: PromptDoc | null; activePromptId: string | null }> {
  await requireAdmin(args.idToken);
  const [prompt, activePromptId] = await Promise.all([
    getPrompt(args.id),
    getActivePromptId(),
  ]);
  return { prompt, activePromptId };
}
