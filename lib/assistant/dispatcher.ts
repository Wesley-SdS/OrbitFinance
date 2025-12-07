import { getEvolutionConfig } from './config'
import { WhatsAppProviderEvolution } from './providers/whatsapp'

export class Dispatcher {
  private readonly provider = (() => {
    const evo = getEvolutionConfig()
    if (evo) return new WhatsAppProviderEvolution(evo)
    return null
  })()

  async sendText(to: string, text: string) {
    if (!this.provider) return
    await this.provider.sendText(to, text)
  }
}

// Export helper function for reminder worker
export async function sendWhatsAppMessage(to: string, text: string): Promise<void> {
  const dispatcher = new Dispatcher()
  await dispatcher.sendText(to, text)
}

