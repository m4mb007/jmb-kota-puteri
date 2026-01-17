
/**
 * WhatsApp Notification Service
 * 
 * Currently acts as a placeholder. To enable real WhatsApp notifications,
 * you need to integrate with a provider like Twilio, Wati, or Meta Cloud API.
 */

export async function sendWhatsAppNotification(to: string, message: string) {
  // Validate phone number (basic check)
  if (!to || to.length < 10) {
    console.warn('[WhatsApp] Invalid phone number:', to);
    return false;
  }

  // TODO: Replace this with actual API call
  // Example with Twilio:
  // await client.messages.create({
  //   body: message,
  //   from: 'whatsapp:+14155238886',
  //   to: `whatsapp:${to}`
  // });

  console.log(`[WhatsApp] Sending to ${to}: ${message}`);
  return true;
}

export const WA_TEMPLATES = {
  billCreated: (unitNumber: string, amount: number, month: number, year: number) => 
    `*Invois Baharu - JMB Idaman Kota Puteri*\n\nUnit: ${unitNumber}\nJumlah: RM ${amount.toFixed(2)}\nBulan: ${month}/${year}\n\nSila buat pembayaran segera. Terima kasih.\n\nJMB Idaman Kota Puteri`,
    
  paymentReceived: (unitNumber: string, amount: number, receiptId: string) =>
    `*Terima Kasih - JMB Idaman Kota Puteri*\n\nPembayaran RM ${amount.toFixed(2)} untuk Unit ${unitNumber} telah diterima. (Resit: ${receiptId})\n\nJMB Idaman Kota Puteri`,

  paymentReminder: (unitNumber: string, amount: number, month: number, year: number) =>
    `*Peringatan Pembayaran - JMB Idaman Kota Puteri*\n\nUnit: ${unitNumber}\nBulan: ${month}/${year}\nBaki Tertunggak: RM ${amount.toFixed(2)}\n\nSila jelaskan bayaran sebelum akhir bulan ini untuk mengelakkan denda. Terima kasih.\n\nJMB Idaman Kota Puteri`
  ,
  activityApproved: (activityTitle: string, date: Date, location?: string | null) => {
    const dateStr = date.toLocaleDateString('ms-MY');
    const locationText = location || '-';
    return `*Aktiviti Diluluskan - JMB Idaman Kota Puteri*\n\nAktiviti: ${activityTitle}\nTarikh: ${dateStr}\nLokasi: ${locationText}\n\nSila patuhi peraturan JMB Idaman Kota Puteri dan jaga kebersihan kawasan.\n\nJMB Idaman Kota Puteri`;
  }
};
