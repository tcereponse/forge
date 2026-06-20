# EXTENSION : ext_diamond_voice_core
MISSION: Intégrer la capture vocale et la transcription sans bug ni boucle infinie.

[[FILE: app/api/voice/transcribe/route.ts]]
import { NextResponse } from 'next/server'
export async function POST(req: Request) {
  return NextResponse.json({ text: "Message vocal reçu et traité." })
}

[[FILE: lib/store/voiceStore.ts]]
import { create } from 'zustand'
export const useVoiceStore = create((set, get) => ({
  isRecording: false,
  chunks: [],
  toggleRecording: () => {
    const { isRecording, mediaRecorder } = get()
    if (isRecording && mediaRecorder?.state === 'recording') {
      mediaRecorder.stop()
      set({ isRecording: false })
    } else if (!isRecording && mediaRecorder?.state === 'inactive') {
      set({ chunks: [] })
      mediaRecorder.start()
      set({ isRecording: true })
    }
  },
  onStop: async () => {
    const audioBlob = new Blob(get().chunks, { type: 'audio/webm' })
    if (audioBlob.size > 1000) {
      const response = await fetch('/api/voice/transcribe', { method: 'POST', body: audioBlob })
      const { text } = await response.json()
      // ... intégration chatStore
    }
  }
}))
