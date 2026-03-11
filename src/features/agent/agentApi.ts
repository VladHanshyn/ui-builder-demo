/**
 * UI Builder - API Wrappers
 * Mock implementation with in-memory storage
 */

import type {
  CreateSessionResponse,
  GenerateRequest,
  GenerateResponse,
  ArtifactsListResponse,
  Artifact,
} from "./types";
import { generateUiSpec, validateSpec } from "./agentMock";

/**
 * Generate a unique ID (UUID v4)
 */
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// In-memory artifact storage (per session)
const sessionArtifacts: Map<string, Artifact[]> = new Map();

/**
 * Create a new session
 */
export async function createSession(): Promise<CreateSessionResponse> {
  await delay(200);
  
  const sessionId = generateUUID();
  sessionArtifacts.set(sessionId, []);
  
  return { sessionId };
}

/**
 * Generate UI spec from prompt
 */
export async function generateSpec(
  request: GenerateRequest
): Promise<GenerateResponse> {
  const { sessionId, prompt } = request;

  // Simulate generation delay
  await delay(1200);

  const artifactId = generateUUID();
  const createdAt = new Date().toISOString();

  // Generate spec from prompt
  const spec = generateUiSpec(prompt);
  
  // Validate spec
  const errors = validateSpec(spec);
  const status = errors.length === 0 ? "DONE" : "FAILED";

  const response: GenerateResponse = {
    status,
    artifactId,
    spec: status === "DONE" ? spec : null,
    errors,
    createdAt,
  };

  // Store artifact in session
  const artifacts = sessionArtifacts.get(sessionId) || [];
  artifacts.unshift({
    artifactId,
    title: spec.page.title,
    status,
    spec: spec,
    errors,
    createdAt,
  });
  sessionArtifacts.set(sessionId, artifacts);

  return response;
}

/**
 * Get artifacts for a session
 */
export async function getArtifacts(
  sessionId: string
): Promise<ArtifactsListResponse> {
  await delay(100);
  
  const artifacts = sessionArtifacts.get(sessionId) || [];
  
  return { artifacts };
}

/**
 * API object for easy imports
 */
export const agentApi = {
  createSession,
  generateSpec,
  getArtifacts,
};
