'use client';

import { useRef, useState } from 'react';
import { startAudioPipeline, type AudioPipeline } from '@/lib/audio/worklet';
import { resumeAudioContext } from '@/lib/audio/context';
import { DeepgramClient } from '@/lib/stt/deepgramClient';
import { FillerDetector } from '@/lib/analyzer/fillerDetector';
import { SpeedCalculator } from '@/lib/analyzer/speedCalculator';
import { PauseDetector } from '@/lib/analyzer/pauseDetector';
import { SectionTimer } from '@/lib/timer/sectionTimer';
import { loadSettings } from '@/lib/storage/settings';
import { saveSession } from '@/lib/storage/sessions';
import { useLiveStore } from '@/store/liveStore';
import LiveDashboard from '@/components/LiveDashboard';

export default function LivePage() {
  const [running, setRunning] = useState(false);

  const pipelineRef = useRef<AudioPipeline | null>(null);
  const clientRef = useRef<DeepgramClient | null>(null);
  const pauseRef = useRef<PauseDetector | null>(null);
  const sectionTimerRef = useRef<SectionTimer | null>(null);
  const settingsRef = useRef(loadSettings());
  const sessionStartRef = useRef<number>(0);

  const handleStart = async () => {
    const settings = loadSettings();
    settingsRef.current = settings;

    await resumeAudioContext();
    try { await navigator.wakeLock?.request('screen'); } catch { /* non-critical */ }

    useLiveStore.getState().reset();
    sessionStartRef.current = Date.now();

    const sectionTimer = new SectionTimer(settings.sections);
    sectionTimerRef.current = sectionTimer;

    const filler = new FillerDetector(settings.fillerWords);
    const speed = new SpeedCalculator(settings.speed);
    const pause = new PauseDetector({
      pauseDuration: settings.pauseDuration,
      getCurrentKeyword: () => sectionTimer.currentKeyword(),
    });
    pauseRef.current = pause;

    const client = new DeepgramClient({
      onTranscript: (t) => {
        if (t.is_final) {
          filler.check(t.words);
          speed.update(t.words);
        }
      },
      onSpeechStart: () => pause.onStart(),
      onUtteranceEnd: () => pause.onEnd(),
      onError: (err) => console.error('[live] deepgram error', err),
    });

    try {
      await client.connect();
      clientRef.current = client;

      const pipeline = await startAudioPipeline((buf) => client.send(buf));
      pipelineRef.current = pipeline;

      sectionTimer.start();
      useLiveStore.getState().startSession();
      setRunning(true);
    } catch (err) {
      client.close();
      alert(`연결 실패: ${String(err)}`);
    }
  };

  const handleStop = async () => {
    pipelineRef.current?.stop();
    clientRef.current?.close();
    pauseRef.current?.destroy();
    sectionTimerRef.current?.stop();
    pipelineRef.current = null;
    clientRef.current = null;

    useLiveStore.getState().endSession();
    setRunning(false);

    const state = useLiveStore.getState();
    try {
      await saveSession({
        timestamp: sessionStartRef.current,
        duration: Math.round((Date.now() - sessionStartRef.current) / 1000),
        fillerCounts: state.fillerCounts,
        speedHistory: state.speedHistory,
        pauseCount: state.pauseCount,
        sections: settingsRef.current.sections,
      });
    } catch (err) {
      console.error('[live] saveSession failed', err);
    }
  };

  if (running) {
    return (
      <LiveDashboard
        sections={settingsRef.current.sections}
        onStop={handleStop}
        onNextSection={() => sectionTimerRef.current?.next()}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
      <h1 className="text-white text-3xl font-bold">PRESENT:AI-ON</h1>
      <p className="text-zinc-500 text-sm">발표를 시작하려면 버튼을 누르세요</p>
      <button
        onClick={handleStart}
        className="mt-6 w-36 h-36 rounded-full bg-green-600 hover:bg-green-500 active:scale-95 text-white text-2xl font-bold transition-transform"
      >
        시작
      </button>
    </div>
  );
}
