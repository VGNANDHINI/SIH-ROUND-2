
'use server';

import { Twilio } from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !twilioPhoneNumber) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      'Twilio environment variables (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER) are not set. SMS sending will be disabled.'
    );
  }
}

const client =
  accountSid && authToken ? new Twilio(accountSid, authToken) : null;

/**
 * Sends an SMS message to a given phone number.
 * @param to The recipient's phone number (e.g., '+15558675310').
 * @param body The text of the message to send.
 * @returns A promise that resolves with the message SID on success, or an error object on failure.
 */
export async function sendSms(
  to: string,
  body: string
): Promise<{ success: boolean; data: any }> {
  if (!client) {
    const error =
      'Twilio client is not initialized. Check server environment variables.';
    console.error(error);
    return { success: false, data: { error } };
  }

  try {
    const message = await client.messages.create({
      body,
      from: twilioPhoneNumber,
      to,
    });
    console.log(`SMS sent successfully. SID: ${message.sid}`);
    return { success: true, data: { sid: message.sid } };
  } catch (error: any) {
    console.error('Failed to send SMS:', error);
    return { success: false, data: { error: error.message } };
  }
}
