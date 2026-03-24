import Twilio from 'twilio'
import { config } from '../config.js'

export interface InitiateCallParams {
  requestId: string
  destination: string
  conversationSummary?: string
}

export interface CallResult {
  success: boolean
  callSid?: string
  error?: string
}

function getTwilioClient() {
  if (!config.twilioAccountSid || !config.twilioAuthToken) {
    throw new Error('Twilio is not configured — set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN')
  }
  return Twilio(config.twilioAccountSid, config.twilioAuthToken)
}

export async function initiateTransferCall(params: InitiateCallParams): Promise<CallResult> {
  try {
    if (!config.twilioPhoneNumber || !config.publicBaseUrl) {
      return { success: false, error: 'Twilio is not configured — set TWILIO_PHONE_NUMBER and PUBLIC_BASE_URL' }
    }

    const client = getTwilioClient()
    const call = await client.calls.create({
      to: params.destination,
      from: config.twilioPhoneNumber,
      url: `${config.publicBaseUrl}/api/twilio/twiml/${params.requestId}`,
      statusCallback: `${config.publicBaseUrl}/api/twilio/status/${params.requestId}`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST',
      timeout: 30,
    })

    return { success: true, callSid: call.sid }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown Twilio error'
    return { success: false, error: message }
  }
}
