import { Transaction } from "@prisma/client"

interface SimilarityResult {
  isDuplicate: boolean
  similarity: number
  matchedTransaction?: Transaction
}

export class TransactionSimilarityDetector {
  private levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length
    const n = str2.length
    const dp: number[][] = Array(m + 1)
      .fill(null)
      .map(() => Array(n + 1).fill(0))

    for (let i = 0; i <= m; i++) dp[i][0] = i
    for (let j = 0; j <= n; j++) dp[0][j] = j

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1]
        } else {
          dp[i][j] = Math.min(dp[i - 1][j - 1] + 1, dp[i - 1][j] + 1, dp[i][j - 1] + 1)
        }
      }
    }

    return dp[m][n]
  }

  private stringSimilarity(str1: string, str2: string): number {
    const distance = this.levenshteinDistance(str1.toLowerCase(), str2.toLowerCase())
    const maxLength = Math.max(str1.length, str2.length)
    return maxLength === 0 ? 1 : 1 - distance / maxLength
  }

  private datesWithinRange(date1: Date, date2: Date, daysRange = 1): boolean {
    const diffTime = Math.abs(date2.getTime() - date1.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= daysRange
  }

  private amountsMatch(amount1: number, amount2: number): boolean {
    return Math.abs(amount1 - amount2) < 0.01
  }

  checkDuplicate(
    newTransaction: {
      date: Date
      description: string
      amount: number
    },
    existingTransactions: Transaction[]
  ): SimilarityResult {
    for (const existing of existingTransactions) {
      const dateMatch = this.datesWithinRange(newTransaction.date, new Date(existing.date))
      const amountMatch = this.amountsMatch(newTransaction.amount, Number(existing.amount))

      if (dateMatch && amountMatch) {
        const descSimilarity = this.stringSimilarity(
          newTransaction.description,
          existing.description || ""
        )

        if (descSimilarity > 0.75) {
          return {
            isDuplicate: true,
            similarity: descSimilarity,
            matchedTransaction: existing,
          }
        }
      }
    }

    return { isDuplicate: false, similarity: 0 }
  }

  filterDuplicates(
    newTransactions: Array<{
      date: Date
      description: string
      amount: number
    }>,
    existingTransactions: Transaction[]
  ): Array<{
    transaction: { date: Date; description: string; amount: number }
    isDuplicate: boolean
    matchedTransaction?: Transaction
  }> {
    return newTransactions.map((newTx) => {
      const result = this.checkDuplicate(newTx, existingTransactions)
      return {
        transaction: newTx,
        isDuplicate: result.isDuplicate,
        matchedTransaction: result.matchedTransaction,
      }
    })
  }
}

export const similarityDetector = new TransactionSimilarityDetector()
