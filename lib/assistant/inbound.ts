import { NextRequest, NextResponse } from 'next/server'
import { parseIntent, normalizePhone } from './nlu'
import { LogTransaction } from './usecases/log-transaction'
import { GenerateReport } from './usecases/generate-report'
import { CreateTask, ListTasks, CompleteTask } from './usecases/tasks'
import { AgendaSummary, CreateEvent } from './usecases/agenda'
import { ScheduleReminder } from './usecases/schedule-reminder'
import { PrismaMessageLogRepo, PrismaUserRepo, PrismaAttachmentRepo } from './repositories'
import { ReplyService } from './replies'
import { Dispatcher } from './dispatcher'
import type { WhatsAppProvider } from './providers/whatsapp'
import type { MetaWhatsAppProvider } from './providers/meta-whatsapp'
import { DiskStorageProvider } from './providers/storage'
import { getOcrProvider } from './providers/ocr'
import { getSttProvider } from './providers/stt'
import { getEvolutionConfig, getMetaWhatsAppConfig, getWhatsAppProvider } from './config'

export type InboundMessage = {
  id?: string
  from: string
  type: 'TEXT' | 'IMAGE' | 'AUDIO' | 'DOCUMENT'
  text?: string
  mediaUrl?: string
  mime?: string
}

export class InboundRouter {
  private readonly log = new PrismaMessageLogRepo()
  private readonly users = new PrismaUserRepo()
  private readonly replies = new ReplyService()
  private readonly dispatcher = new Dispatcher()
  private readonly attachments = new PrismaAttachmentRepo()

  async handle(msg: InboundMessage, provider?: WhatsAppProvider) {
    const phone = normalizePhone(msg.from)
    let user = await this.users.getByPhone(phone)
    
    if (!user) {
      return { ok: true as const, message: 'Número não vinculado. Conecte seu WhatsApp no dashboard.' }
    }

    if (msg.id && (await this.log.existsProviderId(msg.id))) {
      return { ok: true as const, message: 'duplicated' }
    }
    await this.log.logInbound({ userId: user.id, providerId: msg.id, type: msg.type, content: msg.text })

    if (msg.type === 'IMAGE' && provider && msg.mediaUrl) {
      // Try OCR flow
      try {
        const { buffer, mime } = await provider.getMedia(msg.mediaUrl)
        const storage = new DiskStorageProvider()
        const url = await storage.put('images', buffer, mime)
        const ocr = getOcrProvider()
        const text = await ocr.extractText(buffer, mime)
        if (text && text.trim().length > 0) {
          const logTx = new LogTransaction()
          const resExec = await logTx.execute({ phone, text, type: 'EXPENSE' })
          if (resExec.ok && resExec.id) {
            await this.attachments.create({ transactionId: resExec.id, url, kind: 'IMAGE', providerId: msg.id ?? null })
          }
          await this.log.logOutbound({ userId: user.id, type: 'TEXT', content: resExec.message })
          try { await this.dispatcher.sendText(phone, resExec.message) } catch {}
          return this.replies.sendTextPlaceholder(phone, resExec.message)
        }
        const info = 'Cupom recebido. Não consegui ler automaticamente; anotei o anexo.'
        await this.log.logOutbound({ userId: user.id, type: 'TEXT', content: info })
        try { await this.dispatcher.sendText(phone, info) } catch {}
        return this.replies.sendTextPlaceholder(phone, info)
      } catch {
        const info = 'Imagem recebida.'
        await this.log.logOutbound({ userId: user.id, type: 'TEXT', content: info })
        try { await this.dispatcher.sendText(phone, info) } catch {}
        return this.replies.sendTextPlaceholder(phone, info)
      }
    }

    if (msg.type === 'AUDIO' && provider && msg.mediaUrl) {
      try {
        const { buffer, mime } = await provider.getMedia(msg.mediaUrl)
        const storage = new DiskStorageProvider()
        const url = await storage.put('audio', buffer, mime)
        const stt = getSttProvider()
        const text = await stt.transcribe(buffer, mime)
        if (text && text.trim().length > 0) {
          const type = parseIntent(text).kind === 'LOG_INCOME' ? 'INCOME' : 'EXPENSE'
          const res = await new LogTransaction().execute({ phone, text, type })
          if (res.ok && res.id) {
            await this.attachments.create({ transactionId: res.id, url, kind: 'AUDIO', providerId: msg.id ?? null })
          }
          await this.log.logOutbound({ userId: user.id, type: 'TEXT', content: res.message })
          try { await this.dispatcher.sendText(phone, res.message) } catch {}
          return this.replies.sendTextPlaceholder(phone, res.message)
        }
        const info = 'Áudio recebido. Transcrição pendente; anotei o anexo.'
        await this.log.logOutbound({ userId: user.id, type: 'TEXT', content: info })
        try { await this.dispatcher.sendText(phone, info) } catch {}
        return this.replies.sendTextPlaceholder(phone, info)
      } catch {
        const info = 'Áudio recebido.'
        await this.log.logOutbound({ userId: user.id, type: 'TEXT', content: info })
        try { await this.dispatcher.sendText(phone, info) } catch {}
        return this.replies.sendTextPlaceholder(phone, info)
      }
    }

    const text = msg.text ?? ''
    const intent = parseIntent(text)
    let reply = 'ok'
    switch (intent.kind) {
      case 'LOG_EXPENSE': {
        const res = await new LogTransaction().execute({ phone, text, type: 'EXPENSE' })
        reply = res.message
        break
      }
      case 'LOG_INCOME': {
        const res = await new LogTransaction().execute({ phone, text, type: 'INCOME' })
        reply = res.message
        break
      }
      case 'REPORT': {
        const res = await new GenerateReport().execute({ phone, text })
        reply = res.message
        break
      }
      case 'TASK_CREATE': {
        const res = await new CreateTask().execute({ phone, text })
        reply = res.message
        break
      }
      case 'TASK_LIST': {
        const res = await new ListTasks().execute({ phone })
        reply = res.message
        break
      }
      case 'TASK_COMPLETE': {
        const res = await new CompleteTask().execute({ phone, text })
        reply = res.message
        break
      }
      case 'AGENDA_SUMMARY': {
        const res = await new AgendaSummary().execute({ phone, text })
        reply = res.message
        break
      }
      case 'AGENDA_CREATE': {
        const res = await new CreateEvent().execute({ phone, text })
        reply = res.message
        break
      }
      case 'REMINDER_CREATE': {
        const res = await new ScheduleReminder().execute({ phone, text })
        reply = res.message
        break
      }
      default:
        reply = ReplyService.help()
    }
    await this.log.logOutbound({ userId: user.id, providerId: undefined, type: 'TEXT', content: reply })
    // Try to send via provider when configured; always return a JSON response for HTTP
    try { await this.dispatcher.sendText(phone, reply) } catch {}
    return this.replies.sendTextPlaceholder(phone, reply)
  }
}
