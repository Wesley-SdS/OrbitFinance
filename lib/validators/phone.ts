/**
 * Phone validation utilities for Brazilian numbers
 */

export class PhoneValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PhoneValidationError"
  }
}

/**
 * Normalizes a phone number by removing all non-digit characters
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "")
}

/**
 * Validates Brazilian phone number format
 * Expected formats:
 * - 5511999999999 (country code + area code + number)
 * - 11999999999 (area code + number)
 * - +55 11 99999-9999 (formatted)
 * - (11) 99999-9999 (formatted without country code)
 */
export function validateBrazilianPhone(phone: string): {
  isValid: boolean
  normalized: string
  error?: string
} {
  const normalized = normalizePhone(phone)

  // Empty check
  if (!normalized) {
    return {
      isValid: false,
      normalized: "",
      error: "Número de telefone é obrigatório",
    }
  }

  // Too short
  if (normalized.length < 10) {
    return {
      isValid: false,
      normalized,
      error: "Número muito curto (mínimo 10 dígitos)",
    }
  }

  // Too long
  if (normalized.length > 13) {
    return {
      isValid: false,
      normalized,
      error: "Número muito longo (máximo 13 dígitos)",
    }
  }

  // Extract components
  let countryCode = ""
  let areaCode = ""
  let number = ""

  if (normalized.length === 13) {
    // Format: 5511999999999 (country + area + number)
    countryCode = normalized.substring(0, 2)
    areaCode = normalized.substring(2, 4)
    number = normalized.substring(4)
  } else if (normalized.length === 12) {
    // Format: 551199999999 (country + area + number 8 digits)
    countryCode = normalized.substring(0, 2)
    areaCode = normalized.substring(2, 4)
    number = normalized.substring(4)
  } else if (normalized.length === 11) {
    // Format: 11999999999 (area + number 9 digits)
    areaCode = normalized.substring(0, 2)
    number = normalized.substring(2)
  } else if (normalized.length === 10) {
    // Format: 1199999999 (area + number 8 digits - landline)
    areaCode = normalized.substring(0, 2)
    number = normalized.substring(2)
  }

  // Validate country code if present (must be 55 for Brazil)
  if (countryCode && countryCode !== "55") {
    return {
      isValid: false,
      normalized,
      error: "Código do país inválido (use +55 para Brasil)",
    }
  }

  // Validate area code (11-99)
  const areaCodeNum = parseInt(areaCode, 10)
  if (areaCodeNum < 11 || areaCodeNum > 99) {
    return {
      isValid: false,
      normalized,
      error: "DDD inválido (deve estar entre 11 e 99)",
    }
  }

  // Validate number length (8 or 9 digits)
  if (number.length !== 8 && number.length !== 9) {
    return {
      isValid: false,
      normalized,
      error: "Número deve ter 8 ou 9 dígitos",
    }
  }

  // For mobile numbers (9 digits), first digit must be 9
  if (number.length === 9 && !number.startsWith("9")) {
    return {
      isValid: false,
      normalized,
      error: "Número de celular deve começar com 9",
    }
  }

  // Build full normalized number with country code
  const fullNormalized = countryCode
    ? normalized
    : `55${areaCode}${number}`

  return {
    isValid: true,
    normalized: fullNormalized,
  }
}

/**
 * Formats a Brazilian phone number for display
 * Input: 5511999999999
 * Output: +55 (11) 99999-9999
 */
export function formatBrazilianPhone(phone: string): string {
  const normalized = normalizePhone(phone)

  if (normalized.length === 13) {
    // 5511999999999 -> +55 (11) 99999-9999
    const country = normalized.substring(0, 2)
    const area = normalized.substring(2, 4)
    const num1 = normalized.substring(4, 9)
    const num2 = normalized.substring(9)
    return `+${country} (${area}) ${num1}-${num2}`
  } else if (normalized.length === 12) {
    // 551199999999 -> +55 (11) 9999-9999
    const country = normalized.substring(0, 2)
    const area = normalized.substring(2, 4)
    const num1 = normalized.substring(4, 8)
    const num2 = normalized.substring(8)
    return `+${country} (${area}) ${num1}-${num2}`
  } else if (normalized.length === 11) {
    // 11999999999 -> (11) 99999-9999
    const area = normalized.substring(0, 2)
    const num1 = normalized.substring(2, 7)
    const num2 = normalized.substring(7)
    return `(${area}) ${num1}-${num2}`
  } else if (normalized.length === 10) {
    // 1199999999 -> (11) 9999-9999
    const area = normalized.substring(0, 2)
    const num1 = normalized.substring(2, 6)
    const num2 = normalized.substring(6)
    return `(${area}) ${num1}-${num2}`
  }

  return normalized
}
