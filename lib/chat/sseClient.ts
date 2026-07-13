export type SSEEvent = { event: string; data: string };

/**
 * Parse an SSE response body (from a POST fetch — EventSource can't POST).
 * Yields one {event, data} per `\n\n`-delimited block. Data is the raw string;
 * the caller JSON.parse()s it per event type.
 */
export async function* parseSSE(response: Response): AsyncGenerator<SSEEvent> {
  if (!response.body) return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf('\n\n')) !== -1) {
      const block = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const evt = parseBlock(block);
      if (evt) yield evt;
    }
  }
}

function parseBlock(block: string): SSEEvent | null {
  let event = 'message';
  const data: string[] = [];
  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
  }
  return data.length ? { event, data: data.join('\n') } : null;
}
