// Made-up messages for testing the scam check. Scams are the kind a parent in Canada might get.
// "scam": must be red or yellow. "normal": must never be red.
export type TestMessage = { id: string; kind: 'scam' | 'normal'; text: string };

export const TEST_MESSAGES: TestMessage[] = [
  // Scams
  { id: 'scam-01', kind: 'scam', text: "Grandma it's me. I'm in trouble and need $900 in gift cards today. Please don't tell Mom." },
  { id: 'scam-02', kind: 'scam', text: 'CRA: You have an unclaimed tax refund of $1,280. Confirm your details within 24 hours at cra-refund-secure.info' },
  { id: 'scam-03', kind: 'scam', text: 'Amazon Security: A $649.99 purchase was charged to your card 4111 1111 1111 1111. If this was not you, cancel immediately at amzn-refund-help.info' },
  { id: 'scam-04', kind: 'scam', text: 'RBC Alert: Unusual sign-in to your account. Verify now or it will be locked: rbc-secure-login.xyz' },
  { id: 'scam-05', kind: 'scam', text: 'This is Constable Davis of the RCMP. A warrant was issued for your arrest for unpaid fines. Call 604-555-0199 today to avoid arrest.' },
  { id: 'scam-06', kind: 'scam', text: 'Service Canada: Your SIN has been suspended due to suspicious activity. Call us right away at 1-800-555-0100.' },
  { id: 'scam-07', kind: 'scam', text: 'Canada Post: A parcel is waiting. Pay the $2.99 redelivery fee within 48 hours: canadapost-track-pay.top' },
  { id: 'scam-08', kind: 'scam', text: 'Netflix: Your payment failed. Update your billing details to keep watching: netflix-billing-help.click' },
  { id: 'scam-09', kind: 'scam', text: 'Apple Support: Your Apple ID was used to sign in from a new device. Confirm your identity or your account will be closed.' },
  { id: 'scam-10', kind: 'scam', text: 'Hi, this is Daniel from the investment club. Double your money in 7 days with bitcoin. Reply now to join.' },
  { id: 'scam-11', kind: 'scam', text: "My darling, I've been thinking about you. I need to pay the customs fee for my gold shipment. Can you wire $3,000? Don't tell your children, they wouldn't understand." },
  { id: 'scam-12', kind: 'scam', text: "Hi Mom, I'm in a meeting and can't talk. Please send an e-transfer of $500 to this email right away. Thanks." },
  { id: 'scam-13', kind: 'scam', text: 'CONGRATULATIONS! You have won $850,000 in the Canada Lottery. To claim your prize, send a processing fee by Western Union within 3 days.' },
  { id: 'scam-14', kind: 'scam', text: 'Great news! You are hired as a remote assistant. Send us your SIN and banking details today so we can set up payroll.' },
  { id: 'scam-15', kind: 'scam', text: 'Microsoft Warning: Your computer has a virus. Call Microsoft Support now at 1-888-555-0123 and do not restart your computer.' },
  { id: 'scam-16', kind: 'scam', text: 'Hydro Bill Notice: Your power will be disconnected tonight unless you pay $420 now by gift card or Interac at hydro-payment-canada.info.' },
  { id: 'scam-17', kind: 'scam', text: 'FedEx: We could not deliver your package. Click here to reschedule: https://bit.ly/3xYz9' },
  { id: 'scam-18', kind: 'scam', text: 'PayPal: We sent you a refund of $299. Please confirm your account details at paypa1-support.online' },
  { id: 'scam-19', kind: 'scam', text: "Mom, I was in a car accident and I'm at the police station. Please don't call Dad. I need $2,000 bail money sent today." },
  { id: 'scam-20', kind: 'scam', text: 'Canada Immigration: Your visa will be cancelled. Pay the fine of $1,500 by e-transfer within 24 hours to avoid deportation.' },

  // Normal messages
  { id: 'normal-01', kind: 'normal', text: 'Kingsway Pharmacy: your prescription is ready for pickup. Questions? Call us at the store.' },
  { id: 'normal-02', kind: 'normal', text: 'Reminder: your dentist appointment is on Tuesday, November 11 at 10:30 a.m. Reply C to cancel.' },
  { id: 'normal-03', kind: 'normal', text: 'Your Save-On-Foods order #55821 has been delivered. Thank you for shopping with us.' },
  { id: 'normal-04', kind: 'normal', text: 'Dinner at our place today at 6? Bring the dessert! Love, Sam' },
  { id: 'normal-05', kind: 'normal', text: 'RBC: Your monthly statement is ready. Sign in to the RBC app to view it.' },
  { id: 'normal-06', kind: 'normal', text: 'Hi Galina, the book club moves to Thursday this month. See you then!' },
  { id: 'normal-07', kind: 'normal', text: 'City of Burnaby: Your garbage pickup is on Wednesday as usual. No action needed.' },
  { id: 'normal-08', kind: 'normal', text: 'Your Interac e-Transfer from Alex for $40.00 was deposited. Thanks for using your bank.' },
  { id: 'normal-09', kind: 'normal', text: 'Happy birthday, Mom! Hope you have a wonderful day. Call me when you can. Love, Alex' },
  { id: 'normal-10', kind: 'normal', text: 'Your Canada Post parcel was delivered to your front door at 2:15 p.m. Track it at canadapost.ca' },
];
