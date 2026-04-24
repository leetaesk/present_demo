export interface DeepgramWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
  punctuated_word?: string;
  [key: string]: unknown;
}

export interface DeepgramTranscript {
  transcript: string;
  words: DeepgramWord[];
  is_final: boolean;
  speech_final: boolean;
  raw: unknown;
}

export interface DeepgramCallbacks {
  onOpen?: () => void;
  onTranscript?: (t: DeepgramTranscript) => void;
  onSpeechStart?: () => void;
  onUtteranceEnd?: () => void;
  onError?: (err: Event | Error) => void;
  onClose?: (ev: CloseEvent) => void;
  onRawMessage?: (msg: unknown) => void;
}

const DEEPGRAM_PARAMS = {
  model: 'nova-2',
  language: 'ko',
  encoding: 'linear16',
  sample_rate: '16000',
  channels: '1',
  interim_results: 'true',
  words: 'true',
  filler_words: 'true',
  vad_events: 'true',
  utterance_end_ms: '1000',
} as const;

export class DeepgramClient {
  private ws: WebSocket | null = null;
  private callbacks: DeepgramCallbacks;

  constructor(callbacks: DeepgramCallbacks = {}) {
    this.callbacks = callbacks;
  }

  async connect(): Promise<void> {
    const res = await fetch('/api/deepgram-token', { method: 'POST' });
    if (!res.ok) {
      throw new Error(`token fetch failed: HTTP ${res.status}`);
    }
    const data = (await res.json()) as { token?: string; error?: string };
    if (!data.token) {
      throw new Error(`token missing: ${data.error ?? 'unknown'}`);
    }

    const qs = new URLSearchParams(DEEPGRAM_PARAMS as Record<string, string>);
    const url = `wss://api.deepgram.com/v1/listen?${qs.toString()}`;
    const protocols: string[] = ['bearer', data.token];
    console.log('[Deepgram] opening', url);
    console.log(
      `[Deepgram] token len=${data.token.length} head=${data.token.slice(0, 12)}… tail=…${data.token.slice(-8)}`,
    );
    console.log('[Deepgram] protocols=', protocols[0], '+ JWT');
    const ws = new WebSocket(url, protocols);
    this.ws = ws;

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const cleanup = () => {
        ws.removeEventListener('open', onOpen);
        ws.removeEventListener('close', onCloseEarly);
      };
      const onOpen = () => {
        if (settled) return;
        settled = true;
        cleanup();
        this.callbacks.onOpen?.();
        resolve();
      };
      const onCloseEarly = (ev: CloseEvent) => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(
          new Error(
            `websocket closed before open: code=${ev.code} reason="${ev.reason || '(none)'}" wasClean=${ev.wasClean}`,
          ),
        );
      };
      ws.addEventListener('open', onOpen);
      ws.addEventListener('close', onCloseEarly);
    });

    ws.addEventListener('message', (e) => this.handleMessage(e));
    ws.addEventListener('error', (e) => {
      console.error('[Deepgram] ws error event', e);
      this.callbacks.onError?.(e);
    });
    ws.addEventListener('close', (e) => {
      console.log(`[Deepgram] ws closed code=${e.code} reason="${e.reason}"`);
      this.callbacks.onClose?.(e);
      this.ws = null;
    });
  }

  private handleMessage(e: MessageEvent) {
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(e.data as string);
    } catch {
      return;
    }
    this.callbacks.onRawMessage?.(msg);

    const type = msg.type as string | undefined;
    if (type === 'Results') {
      const channel = msg.channel as { alternatives?: Array<Record<string, unknown>> } | undefined;
      const alt = channel?.alternatives?.[0];
      if (!alt) return;
      this.callbacks.onTranscript?.({
        transcript: (alt.transcript as string) ?? '',
        words: (alt.words as DeepgramWord[]) ?? [],
        is_final: Boolean(msg.is_final),
        speech_final: Boolean(msg.speech_final),
        raw: msg,
      });
    } else if (type === 'SpeechStarted') {
      this.callbacks.onSpeechStart?.();
    } else if (type === 'UtteranceEnd') {
      this.callbacks.onUtteranceEnd?.();
    }
  }

  send(data: ArrayBuffer) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    }
  }

  close() {
    const ws = this.ws;
    if (!ws) return;
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({ type: 'CloseStream' }));
      } catch {
        // ignore
      }
    }
    ws.close();
    this.ws = null;
  }

  get isOpen(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
