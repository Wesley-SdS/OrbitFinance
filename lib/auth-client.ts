"use client"

import { createAuthClient } from "better-auth/react"

// Use same-origin relative requests to avoid cross-origin latency/misconfig
export const authClient = createAuthClient({})

export const { signIn, signUp, signOut, useSession } = authClient
