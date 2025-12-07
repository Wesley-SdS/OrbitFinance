const MAX_FILE_SIZE = 10 * 1024 * 1024

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]

const ALLOWED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/ogg",
  "audio/webm",
]

const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]

export class FileValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "FileValidationError"
  }
}

interface ValidateFileOptions {
  maxSize?: number
  allowedTypes?: string[]
}

export function validateFile(
  file: File,
  options: ValidateFileOptions = {}
): void {
  const { maxSize = MAX_FILE_SIZE, allowedTypes } = options

  if (!file) {
    throw new FileValidationError("No file provided")
  }

  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / 1024 / 1024)
    throw new FileValidationError(
      `File size exceeds ${maxSizeMB}MB. Please upload a smaller file.`
    )
  }

  if (allowedTypes && !allowedTypes.includes(file.type)) {
    throw new FileValidationError(
      `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(", ")}`
    )
  }

  if (file.name.length > 255) {
    throw new FileValidationError("File name is too long (max 255 characters)")
  }

  const dangerousExtensions = [
    ".exe",
    ".bat",
    ".cmd",
    ".com",
    ".pif",
    ".scr",
    ".vbs",
    ".js",
  ]
  const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf("."))

  if (dangerousExtensions.includes(fileExtension)) {
    throw new FileValidationError(
      `File extension ${fileExtension} is not allowed for security reasons`
    )
  }
}

export function validateImageFile(file: File): void {
  validateFile(file, {
    maxSize: 5 * 1024 * 1024,
    allowedTypes: ALLOWED_IMAGE_TYPES,
  })
}

export function validateAudioFile(file: File): void {
  validateFile(file, {
    maxSize: MAX_FILE_SIZE,
    allowedTypes: ALLOWED_AUDIO_TYPES,
  })
}

export function validateDocumentFile(file: File): void {
  validateFile(file, {
    maxSize: MAX_FILE_SIZE,
    allowedTypes: ALLOWED_DOCUMENT_TYPES,
  })
}

export async function getFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}
