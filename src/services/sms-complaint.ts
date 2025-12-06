
'use server';

import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase-firestore-lite';
import { app } from '@/firebase/config';
import type { UserProfile, Complaint } from '@/lib/data';

const db = getFirestore(app);

/**
 * Parses an SMS message and creates a complaint in Firestore.
 * @param from The phone number the SMS came from.
 * @param body The text of the SMS message.
 * @returns A promise that resolves with the ID of the new complaint or an error object.
 */
export async function createComplaintFromSms(from: string, body: string): Promise<{ success: boolean; data: any }> {
  if (!from || !body) {
    return { success: false, data: { error: 'Missing phone number or message body.' } };
  }

  try {
    // 1. Find the user by their phone number
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('phoneNumber', '==', from));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.warn(`No user found with phone number: ${from}`);
      return { success: false, data: { error: 'User not found. Please register your phone number in the app first.' } };
    }

    const userDoc = querySnapshot.docs[0];
    const userProfile = userDoc.data() as UserProfile;

    // 2. Parse the SMS body
    // We'll use a simple keyword-based parser. E.g., "COMPLAINT: Leakage near market"
    const complaintKeyword = 'COMPLAINT:';
    const keywordIndex = body.toUpperCase().indexOf(complaintKeyword);

    if (keywordIndex === -1) {
        return { success: false, data: { error: `Message must start with '${complaintKeyword}'.` } };
    }

    const description = body.substring(keywordIndex + complaintKeyword.length).trim();

    if (description.length < 10) {
        return { success: false, data: { error: 'Complaint description is too short.' } };
    }

    // 3. Create a new complaint document
    const complaintData: Omit<Complaint, 'id'> = {
      issueType: 'Others', // Default type for SMS complaints
      address: `Complaint from ${from}`, // Use phone number as a fallback address
      description: description,
      contactNumber: from,
      reportedAt: serverTimestamp(),
      status: 'Open',
      userId: userProfile.uid,
      userPanchayat: userProfile.panchayat,
      userBlock: userProfile.block,
      userDistrict: userProfile.district,
      userState: userProfile.state,
    };

    const complaintsCollectionRef = collection(db, 'complaints');
    const docRef = await addDoc(complaintsCollectionRef, complaintData);

    console.log(`New complaint created from SMS with ID: ${docRef.id}`);

    return { success: true, data: { complaintId: docRef.id } };

  } catch (error: any) {
    console.error('Error creating complaint from SMS:', error);
    return { success: false, data: { error: error.message || 'An unknown server error occurred.' } };
  }
}
