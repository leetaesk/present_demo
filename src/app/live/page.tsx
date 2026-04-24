"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { startAudioPipeline, type AudioPipeline } from "@/lib/audio/worklet";
import { resumeAudioContext } from "@/lib/audio/context";
import { DeepgramClient } from "@/lib/stt/deepgramClient";
import { FillerDetector } from "@/lib/analyzer/fillerDetector";
import { SpeedCalculator } from "@/lib/analyzer/speedCalculator";
import { PauseDetector } from "@/lib/analyzer/pauseDetector";
import { SectionTimer } from "@/lib/timer/sectionTimer";
import { loadSettings } from "@/lib/storage/settings";
import { saveSession } from "@/lib/storage/sessions";
import { useLiveStore } from "@/store/liveStore";
import LiveDashboard from "@/components/LiveDashboard";

export default function LivePage() {
    const [running, setRunning] = useState(false);
    const router = useRouter();

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
        try {
            await navigator.wakeLock?.request("screen");
        } catch {
            /* non-critical */
        }

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

        const fillerSet = new Set(settings.fillerWords);

        const client = new DeepgramClient({
            onTranscript: (t) => {
                if (t.is_final) {
                    filler.check(t.words);
                    speed.update(t.words);
                    useLiveStore.getState().addTranscriptLine(
                        t.words.map((w) => ({
                            text: w.punctuated_word ?? w.word,
                            isFiller: fillerSet.has(w.word),
                        })),
                    );
                }
            },
            onSpeechStart: () => pause.onStart(),
            onUtteranceEnd: () => pause.onEnd(),
            onError: (err) => console.error("[live] deepgram error", err),
        });

        try {
            await client.connect();
            clientRef.current = client;

            const pipeline = await startAudioPipeline((buf) =>
                client.send(buf),
            );
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
                duration: Math.round(
                    (Date.now() - sessionStartRef.current) / 1000,
                ),
                fillerCounts: state.fillerCounts,
                speedHistory: state.speedHistory,
                pauseCount: state.pauseCount,
                sections: settingsRef.current.sections,
            });
        } catch (err) {
            console.error("[live] saveSession failed", err);
        }

        router.push("/summary");
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
        <PreStartScreen settings={settingsRef.current} onStart={handleStart} />
    );
}

import type { AppSettings } from "@/lib/storage/settings";
import Link from "next/link";

function PreStartScreen({
    settings,
    onStart,
}: {
    settings: AppSettings;
    onStart: () => void;
}) {
    const { sections } = settings;
    const totalDuration = sections.reduce((a, s) => a + s.duration, 0);

    return (
        <div className="h-screen bg-black text-white flex overflow-hidden">

            {/* 왼쪽: 고정 사이드바 */}
            <div className="w-72 shrink-0 flex flex-col justify-between border-r border-zinc-800 px-8 py-8">
                <div>
                    <Link href="/prepare" className="text-zinc-600 text-xs hover:text-zinc-400">← 준비로 돌아가기</Link>
                    <h1 className="text-2xl font-bold mt-6 mb-1">PRESENT<br />:AI-ON</h1>
                    <p className="text-zinc-500 text-sm">발표 준비가 됐나요?</p>
                </div>

                {sections.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                        <div className="text-xs text-zinc-600">섹션</div>
                        {sections.map((s, i) => (
                            <div key={i} className="flex justify-between text-sm">
                                <span className="text-zinc-400 truncate">{s.name || `섹션 ${i + 1}`}</span>
                                <span className="text-zinc-600 ml-2 shrink-0">{s.duration}초</span>
                            </div>
                        ))}
                        <div className="text-xs text-zinc-600 mt-1 pt-2 border-t border-zinc-800">
                            총 {Math.floor(totalDuration / 60)}분 {totalDuration % 60}초
                        </div>
                    </div>
                )}

                <button
                    onClick={onStart}
                    className="w-full py-4 rounded-2xl bg-green-600 hover:bg-green-500 active:scale-95 text-white text-lg font-bold transition-transform"
                >
                    발표 시작
                </button>
            </div>

            {/* 오른쪽: 스크롤 대본 */}
            <div className="flex-1 overflow-y-auto px-8 py-8">
                {sections.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
                        <p className="text-zinc-500">설정된 대본이 없습니다.</p>
                        <Link href="/prepare/script" className="text-sm text-zinc-400 underline underline-offset-2">
                            대본 & 섹션 설정하기
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        <div className="text-xs text-zinc-600 uppercase tracking-widest">대본</div>
                        {sections.map((s, i) => (
                            <div key={i} className="flex gap-4">
                                <div className="flex flex-col items-center pt-1">
                                    <div className="w-2 h-2 rounded-full bg-zinc-600 shrink-0" />
                                    {i < sections.length - 1 && <div className="w-px flex-1 bg-zinc-800 mt-1" />}
                                </div>
                                <div className="flex-1 pb-6">
                                    <div className="flex items-baseline gap-2 mb-2">
                                        <span className="font-semibold">{s.name || `섹션 ${i + 1}`}</span>
                                        <span className="text-xs text-zinc-600">{s.duration}초</span>
                                        {s.keyword && (
                                            <span className="text-xs text-blue-400 bg-blue-900/30 px-2 py-0.5 rounded-full ml-auto">→ {s.keyword}</span>
                                        )}
                                    </div>
                                    {s.script
                                        ? <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">{s.script}</p>
                                        : <p className="text-sm text-zinc-700 italic">대본 없음</p>
                                    }
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
