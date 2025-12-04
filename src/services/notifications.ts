
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
        return { success: false, sentCount: 0, error: "No users with phone numbers found." };
    }

    const sendPromises = phoneNumbers.map(number => sendSms(number, message));
    
    const results = await Promise.allSettled(sendPromises);

    let successfulSends = 0;
    let firstError: string | undefined;

    results.forEach(result => {
        if (result.status === 'fulfilled' && result.value.success) {
            successfulSends++;
        } else if (result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success)) {
            if (!firstError) {
                 const reason = result.status === 'rejected' ? result.reason : result.value.data.error;
                 firstError = typeof reason === 'string' ? reason : (reason as Error)?.message || 'An unknown error occurred during SMS sending.';
            }
        }
    });

    if (successfulSends === 0 && firstError) {
        throw new Error(firstError);
    }

    console.log(`Successfully sent ${successfulSends} out of ${phoneNumbers.length} messages.`);

    return { success: true, sentCount: successfulSends };
  } catch (error: any) {
    console.error('Error sending bulk SMS:', error);
    return { success: false, sentCount: 0, error: error.message };
  }
}
