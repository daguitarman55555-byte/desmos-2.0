// Decision 9: local model via Ollama, last priority, entirely optional.
// The app must run fully without it. Nothing outside src/ai/ may import this.
//
// Explicitly NOT used for step-by-step working — steps are rule-traced (see
// core/symbolic/steps.ts). This is for natural-language input only (UPGRADES P4 item 23).

export interface AIProvider {
  readonly available: boolean;
  complete(prompt: string, signal?: AbortSignal): Promise<string>;
}

export function createOllamaProvider(_endpoint?: string, _model?: string): AIProvider {
  throw new Error('TODO: provider.createOllamaProvider — not implemented in milestone 1');
}
