import 'dotenv/config'

interface Config {
  apiKey: string
  baseUrl: string
  callsUrl: string
  port: number
  frontendOrigin: string
  twilioAccountSid?: string
  twilioAuthToken?: string
  twilioPhoneNumber?: string
  publicBaseUrl?: string
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export const config: Config = {
  apiKey: requireEnv('REECALL_API_KEY'),
  baseUrl: requireEnv('REECALL_BASE_URL'),
  callsUrl: requireEnv('REECALL_CALLS_URL'),
  port: parseInt(process.env.PORT || '3000', 10),
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,
  publicBaseUrl: process.env.PUBLIC_BASE_URL,
}
