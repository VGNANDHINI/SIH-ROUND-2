
'use server';

import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { app } from '@/firebase/config';
import type { UserProfile, Complaint } from '@/lib/data';

const db = getFirestore(app);

// A simple parser to extract issue type and address from the SMS body.
// Example format: "LEAKAGE at Near the market - water has been flowing for 2 hours"
const parseSmsBody = (body: string): { issueType: Complaint['issueType']; address: string, description: string } => {
    const defaultIssue: Complaint['issueType'] = 'Others';
    
    // Keywords for different issue types
    const issueKeywords: Record<string, Complaint['issueType']> = {
        'LEAK': 'Leakage',
        'LEAKAGE': 'Leakage',
        'NO WATER': 'No water',
        'LOW PRESSURE': 'Low pressure',
        'DIRTY': 'Dirty water',
        'MOTOR': 'Motor off',
    };

    const bodyUpper = body.toUpperCase();
    let issueType: Complaint['issueType'] = defaultIssue;
    
    for (const keyword in issueKeywords) {
        if (bodyUpper.includes(keyword)) {
            issueType = issueKeywords[keyword];
            break;
        }
    }

    const atIndex = body.toLowerCase().indexOf(' at ');
    let address = 'Location not specified';
    let description = body;

    if (atIndex !== -1) {
        const afterAtIndex = body.substring(atIndex + 4);
        const separatorIndex = afterAtIndex.indexOf(' - ');

        if (separatorIndex !== -1) {
            address = afterAtIndex.substring(0, separatorIndex).trim();
            description = afterAtIndex.substring(separatorIndex + 3).trim();
        } else {
            address = afterAtIndex.trim();
            description = `${issueType} reported.`;
        }
    }

    return { issueType, address, description };
};


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

    // 2. Parse the SMS body for details
    const { issueType, address, description } = parseSmsBody(body);

    if (description.length < 10) {
        return { success: false, data: { error: 'Complaint description is too short. Please provide more detail.' } };
    }

    // 3. Create a new complaint document
    const complaintData: Omit<Complaint, 'id'> = {
      issueType: issueType,
      address: address,
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

    return { success: true, data: { complaintId: docRef.id, issueType: issueType } };

  } catch (error: any) {
    console.error('Error creating complaint from SMS:', error);
    return { success: false, data: { error: error.message || 'An unknown server error occurred.' } };
  }
}
