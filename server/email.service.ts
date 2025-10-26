// Complete updated server/email.service.ts

import nodemailer from 'nodemailer';

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Generate unique claim code
export function generateClaimCode(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`.toUpperCase();
}

// Send claim request submitted email
export async function sendClaimRequestEmail(
  email: string | undefined,
  userName: string,
  foodItemName: string,
  canteenName: string
) {
  // Skip email if no email address provided
  if (!email) {
    console.log('No email provided, skipping claim request email');
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Food Claim Request Submitted - Pending Approval',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d5016;">Claim Request Submitted</h2>
        <p>Hi ${userName},</p>
        <p>Your food claim request has been submitted successfully and is pending admin approval.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Claim Details:</h3>
          <p><strong>Food Item:</strong> ${foodItemName}</p>
          <p><strong>Canteen:</strong> ${canteenName}</p>
          <p><strong>Status:</strong> Pending Approval</p>
        </div>
        
        <p>You will receive another email once your request is approved with your unique claim code.</p>
        <p>Thank you for helping reduce food waste!</p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Claim request email sent successfully to:', email);
  } catch (error) {
    console.error('Error sending claim request email:', error);
    throw error;
  }
}

// Send claim approved email with claim code
export async function sendClaimApprovedEmail(
  email: string | undefined,
  userName: string,
  foodItemName: string,
  canteenName: string,
  claimCode: string,
  expiresAt: Date
) {
  // Skip email if no email address provided
  if (!email) {
    console.log('No email provided, skipping claim approved email');
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Food Claim Approved - Your Claim Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d5016;">🎉 Your Claim Has Been Approved!</h2>
        <p>Hi ${userName},</p>
        <p>Great news! Your food claim request has been approved by the admin.</p>
        
        <div style="background-color: #e8f5e9; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
          <h3 style="margin-top: 0; color: #2d5016;">Your Claim Code</h3>
          <div style="background-color: white; padding: 15px; border-radius: 5px; font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #2d5016;">
            ${claimCode}
          </div>
        </div>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Claim Details:</h3>
          <p><strong>Food Item:</strong> ${foodItemName}</p>
          <p><strong>Canteen:</strong> ${canteenName}</p>
          <p><strong>Expires:</strong> ${new Date(expiresAt).toLocaleString()}</p>
        </div>
        
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>⚠️ Important:</strong> Present this code at the canteen to collect your meal before it expires.</p>
        </div>
        
        <p>Thank you for helping reduce food waste!</p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Claim approved email sent successfully to:', email);
  } catch (error) {
    console.error('Error sending claim approved email:', error);
    throw error;
  }
}

// Send claim rejected email
export async function sendClaimRejectedEmail(
  email: string | undefined,
  userName: string,
  foodItemName: string,
  canteenName: string,
  reason?: string
) {
  // Skip email if no email address provided
  if (!email) {
    console.log('No email provided, skipping claim rejected email');
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Food Claim Request - Update',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #c62828;">Claim Request Update</h2>
        <p>Hi ${userName},</p>
        <p>We regret to inform you that your food claim request could not be approved at this time.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Claim Details:</h3>
          <p><strong>Food Item:</strong> ${foodItemName}</p>
          <p><strong>Canteen:</strong> ${canteenName}</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        </div>
        
        <p>Please feel free to browse other available meals on the platform.</p>
        <p>Thank you for your understanding!</p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Claim rejected email sent successfully to:', email);
  } catch (error) {
    console.error('Error sending claim rejected email:', error);
    throw error;
  }
}