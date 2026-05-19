// Firestore-backed prompt store. The active prompt is the single source of
// truth for what the agent says, sounds like, and which model it runs on.
// Anything that affects agent behavior must come from here — nothing lives in
// code outside of the typed VoiceId / ModelId unions in agent-options.

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "./firebase-admin";
import {
  isModel,
  isVoice,
  type ModelId,
  type VoiceId,
} from "./agent-options";

export interface PromptDoc {
  id: string;
  name: string;
  prompt: string;
  voice: VoiceId;
  model: ModelId;
  createdAt: number; // ms
  updatedAt: number; // ms
}

export interface PromptSnapshot {
  id: string;
  name: string;
  prompt: string;
  voice: VoiceId;
  model: ModelId;
}

function tsToMs(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  return 0;
}

function rowToDoc(id: string, data: Record<string, unknown>): PromptDoc {
  const voice = data.voice;
  const model = data.model;
  if (!isVoice(voice)) {
    throw new Error(`prompts/${id}: invalid voice value`);
  }
  if (!isModel(model)) {
    throw new Error(`prompts/${id}: invalid model value`);
  }
  return {
    id,
    name: typeof data.name === "string" ? data.name : "",
    prompt: typeof data.prompt === "string" ? data.prompt : "",
    voice,
    model,
    createdAt: tsToMs(data.createdAt),
    updatedAt: tsToMs(data.updatedAt),
  };
}

export function toSnapshot(doc: PromptDoc): PromptSnapshot {
  return {
    id: doc.id,
    name: doc.name,
    prompt: doc.prompt,
    voice: doc.voice,
    model: doc.model,
  };
}

export async function listPrompts(): Promise<PromptDoc[]> {
  const snap = await adminDb()
    .collection("prompts")
    .orderBy("createdAt", "asc")
    .get();
  return snap.docs.map((d) => rowToDoc(d.id, d.data()));
}

export async function getPrompt(id: string): Promise<PromptDoc | null> {
  const snap = await adminDb().collection("prompts").doc(id).get();
  if (!snap.exists) return null;
  return rowToDoc(snap.id, snap.data() as Record<string, unknown>);
}

export async function getActivePromptId(): Promise<string | null> {
  const snap = await adminDb().collection("config").doc("global").get();
  const id = snap.data()?.activePromptId;
  return typeof id === "string" && id.length > 0 ? id : null;
}

export async function getActivePrompt(): Promise<PromptDoc | null> {
  const id = await getActivePromptId();
  if (!id) return null;
  return getPrompt(id);
}

export interface PromptInput {
  name: string;
  prompt: string;
  voice: VoiceId;
  model: ModelId;
}

export async function createPrompt(input: PromptInput): Promise<PromptDoc> {
  const ref = adminDb().collection("prompts").doc();
  await ref.set({
    name: input.name,
    prompt: input.prompt,
    voice: input.voice,
    model: input.model,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  const fresh = await getPrompt(ref.id);
  if (!fresh) throw new Error("createPrompt: doc disappeared after write");
  return fresh;
}

export async function updatePrompt(
  id: string,
  patch: Partial<PromptInput>,
): Promise<void> {
  if (patch.voice !== undefined && !isVoice(patch.voice)) {
    throw new Error(`updatePrompt: invalid voice ${String(patch.voice)}`);
  }
  if (patch.model !== undefined && !isModel(patch.model)) {
    throw new Error(`updatePrompt: invalid model ${String(patch.model)}`);
  }
  await adminDb().collection("prompts").doc(id).update({
    ...patch,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function activatePrompt(id: string): Promise<void> {
  const exists = await getPrompt(id);
  if (!exists) throw new Error(`activatePrompt: prompts/${id} not found`);
  await adminDb()
    .collection("config")
    .doc("global")
    .set(
      { activePromptId: id, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
}

export async function deletePrompt(id: string): Promise<void> {
  const activeId = await getActivePromptId();
  if (activeId === id) {
    throw new Error(
      "deletePrompt: cannot delete the active prompt — activate another first",
    );
  }
  await adminDb().collection("prompts").doc(id).delete();
}
