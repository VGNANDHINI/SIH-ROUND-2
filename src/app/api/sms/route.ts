
import { NextRequest, NextResponse } from 'next/server';
import { twilio } from 'twilio';
import { createComplaintFromSms } from '@/services/sms-complaint';

// This is your Twilio webhook handler.
// You need to configure this URL in your Twilio console for your phone number.
// e.g., https://your-app-url.com/api/sms

const MessagingResponse = twilio.twiml.MessagingResponse;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const body = (formData.get('Body') as string) || '';
    const from = (formData.get('From') as string) || '';
    
    console.log(`Incoming SMS from ${from}: ${body}`);

    // Process the SMS to create a complaint
    const result = await createComplaintFromSms(from, body);

    const twiml = new MessagingResponse();

    if (result.success) {
      twiml.message('Thank you! Your complaint has been registered.');
    } else {
      const errorMessage = result.data.error || 'There was an error processing your request.';
      twiml.message(`We could not process your complaint. Error: ${errorMessage}`);
    }

    return new NextResponse(twiml.toString(), {
      headers: {
        'Content-Type': 'text/xml',
      },
    });

  } catch (error: any) {
    console.error('Error in Twilio webhook:', error);
    const twiml = new MessagingResponse();
    twiml.message('An internal error occurred. Please try again later.');

    return new NextResponse(twiml.toString(), {
      status: 500,
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  }
}
