import pdfParse from "pdf-parse"
import { GoogleGenerativeAI } from "@google/generative-ai"

interface ExtractedTransaction {
  date: string
  description: string
  amount: number
  type: "expense" | "income"
  suggestedCategory: string
}

interface ExtractedStatement {
  bank: string
  period: {
    start: string
    end: string
  }
  transactions: ExtractedTransaction[]
}

const geminiClient = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)

export class PdfExtractorService {
  async extractText(buffer: Buffer): Promise<string> {
    const data = await pdfParse(buffer)
    return data.text
  }

  async extractTransactions(pdfText: string): Promise<ExtractedStatement> {
    const model = geminiClient.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `Você é um especialista em extrair transações de extratos bancários brasileiros.

Analise este texto de PDF e retorne APENAS JSON válido:

${pdfText}

Formato obrigatório:
{
  "bank": "nome do banco",
  "period": { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" },
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "descrição limpa sem códigos",
      "amount": -150.50,
      "type": "expense",
      "suggestedCategory": "alimentação"
    }
  ]
}

Regras:
- Valor negativo = despesa, positivo = receita
- Categorias válidas: alimentação, transporte, moradia, saúde, lazer, educação, renda, outros
- Ignore cabeçalhos, totais, saldos - apenas transações
- Retorne SOMENTE o JSON, sem markdown ou texto adicional
- Se não conseguir identificar período, use data da primeira e última transação`

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    const cleanedText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()

    try {
      const extracted = JSON.parse(cleanedText)
      return this.validateAndNormalize(extracted)
    } catch (error) {
      console.error("Failed to parse Gemini response:", error)
      throw new Error("Failed to extract transactions from PDF. Please check if the PDF is a valid bank statement.")
    }
  }

  private validateAndNormalize(data: any): ExtractedStatement {
    if (!data.bank || !data.period || !Array.isArray(data.transactions)) {
      throw new Error("Invalid statement format from AI extraction")
    }

    return {
      bank: String(data.bank),
      period: {
        start: String(data.period.start),
        end: String(data.period.end),
      },
      transactions: data.transactions.map((t: any) => ({
        date: String(t.date),
        description: String(t.description),
        amount: Number(t.amount),
        type: t.amount < 0 ? "expense" : "income",
        suggestedCategory: String(t.suggestedCategory || "outros"),
      })),
    }
  }

  async extractFromBuffer(buffer: Buffer): Promise<ExtractedStatement> {
    const pdfText = await this.extractText(buffer)
    return await this.extractTransactions(pdfText)
  }
}

export const pdfExtractor = new PdfExtractorService()
