import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  console.log('=== EMAIL SEND ATTEMPT ===');
  console.log('To:', to);
  console.log('Subject:', subject);
  console.log('API Key configured:', !!process.env.RESEND_API_KEY);
  console.log('API Key starts with re_123:', process.env.RESEND_API_KEY?.startsWith('re_123'));
  
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith('re_123')) {
    console.log('❌ Resend API Key not configured or is placeholder. Skipping email.');
    console.log(`To: ${to}, Subject: ${subject}`);
    return;
  }

  try {
    console.log('📧 Attempting to send email via Resend...');
    const data = await resend.emails.send({
      from: 'JMB Idaman Kota Puteri <noreply@whispererwolf.site>',
      to,
      subject,
      html,
    });
    console.log('✅ Email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    // Don't throw error to prevent blocking the main flow
    return null;
  }
}

export const EMAIL_TEMPLATES = {
  billCreated: (unitNumber: string, amount: number, month: number, year: number) => `
    <h1>Invois Baharu Dicipta</h1>
    <p>Salam Sejahtera,</p>
    <p>Invois baharu telah dijana untuk unit <strong>${unitNumber}</strong>.</p>
    <ul>
      <li>Bulan: ${month}/${year}</li>
      <li>Jumlah: RM ${amount.toFixed(2)}</li>
    </ul>
    <p>Sila log masuk ke portal penduduk untuk membuat pembayaran.</p>
    <p>Terima kasih.</p>
    <p><strong>JMB Idaman Kota Puteri</strong></p>
  `,
  complaintStatusUpdated: (complaintId: string, status: string, remarks?: string) => `
    <h1>Status Aduan Dikemaskini</h1>
    <p>Salam Sejahtera,</p>
    <p>Status aduan anda (ID: <strong>${complaintId}</strong>) telah dikemaskini kepada <strong>${status}</strong>.</p>
    ${remarks ? `<p>Catatan: ${remarks}</p>` : ''}
    <p>Sila log masuk ke portal untuk maklumat lanjut.</p>
    <p>Terima kasih.</p>
    <p><strong>JMB Idaman Kota Puteri</strong></p>
  `,
  activityApproved: (
    activityTitle: string,
    activityDate: Date,
    location?: string | null
  ) => {
    const dateStr = activityDate.toLocaleDateString('ms-MY');
    return `
      <h1>Permohonan Aktiviti Diluluskan</h1>
      <p>Salam Sejahtera,</p>
      <p>Permohonan aktiviti/majlis anda telah <strong>DILULUSKAN</strong>.</p>
      <ul>
        <li>Aktiviti: <strong>${activityTitle}</strong></li>
        <li>Tarikh: ${dateStr}</li>
        <li>Lokasi: ${location || '-'}</li>
      </ul>
      <p>Sila pastikan pematuhan kepada peraturan JMB Idaman Kota Puteri dan menjaga kebersihan kawasan.</p>
      <p>Terima kasih.</p>
      <p><strong>JMB Idaman Kota Puteri</strong></p>
    `;
  }
};
