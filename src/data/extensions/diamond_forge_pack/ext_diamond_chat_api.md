# EXTENSION : ext_diamond_chat_api
MISSION: Implémenter une route API de chat robuste avec streaming.

[[FILE: app/api/chat/route.ts]]
import { OpenAIStream, StreamingTextResponse } from 'ai'
export const runtime = 'edge'
export async function POST(req: Request) {
  const { messages } = await req.json()
  // Logique de streaming simulée ou réelle
  const response = "Connexion Diamond établie. Je suis votre assistant Savage."
  const stream = new ReadableStream({
    async start(controller) {
      const words = response.split(' ')
      for (const word of words) {
        controller.enqueue(word + ' ')
        await new Promise(r => setTimeout(r, 50))
      }
      controller.close()
    }
  })
  return new StreamingTextResponse(stream)
}
