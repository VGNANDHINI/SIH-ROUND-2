'use server';

import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { app } from '@/firebase/config';
import { sendSms } from './sms';
import type { userProfile } from '@/docs/backend.json';

type UserProfile = typeof userProfile;

/**
 * Sends a bulk SMS to all users with a phone number.
 * @param message The message to send.
 * @returns An object indicating success or failure.
 */
export async function sendBulkSms(
  message: string
): Promise<{ success: boolean; sentCount: number; error?: string }> {
  const db = getFirestore(app);
  try {
    const usersCollection = collection(db, 'users');
    const userSnapshot = await getDocs(usersCollection);
    
    const users = userSnapshot.docs.map(doc => doc.data() as UserProfile['properties']);
    
    const phoneNumbers = users
      .map(user => user.phoneNumber)
      .filter((phoneNumber): phoneNumber is string => !!phoneNumber && phoneNumber.length > 0);
      
    if (phoneNumbers.length === 0) {
        return { success: true, sentCount: 0, error: "No users with phone numbers found." };
    }

    const sendPromises = phoneNumbers.map(number => sendSms(number, message));
    
    const results = await Promise.allSettled(sendPromises);

    const successfulSends = results.filter(r => r.status === 'fulfilled' && r.value.success).length;

    if (successfulSends === 0) {
        throw new Error('Failed to send SMS to any user. Check Twilio logs.');
    }

    console.log(`Successfully sent ${successfulSends} out of ${phoneNumbers.length} messages.`);

    return { success: true, sentCount: successfulSends };
  } catch (error: any) {
    console.error('Error sending bulk SMS:', error);
    return { success: false, sentCount: 0, error: error.message };
  }
}
