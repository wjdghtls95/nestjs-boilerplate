export type ParsedSseEvent = {
  type?: string;
  text?: string;
  id?: string;
  name?: string;
  input?: unknown;
};

/** SSE raw line에서 JSON 파싱. [DONE]이거나 파싱 실패면 null 반환 */
export function parseSseLine(rawLine: string): ParsedSseEvent | null {
  const payload = rawLine.replace(/^data:\s*/, '').trim();

  if (payload === '[DONE]') return null;

  try {
    return JSON.parse(payload) as ParsedSseEvent;
  } catch {
    return null;
  }
}
