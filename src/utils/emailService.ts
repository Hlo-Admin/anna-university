
import { supabase } from "@/integrations/supabase/client";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export const sendEmail = async ({ to, subject, html, from }: SendEmailParams) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-gmail', {
      body: {
        to,
        subject,
        html,
        from
      }
    });

    if (error) {
      console.error('Email sending error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
};

// Email templates
export const createStatusUpdateEmail = (reviewerName: string, paperTitle: string, newStatus: string) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Paper Status Update</h2>
      <p>Dear ${reviewerName},</p>
      <p>The status of your assigned paper has been updated:</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin: 0; color: #2563eb;">${paperTitle}</h3>
        <p style="margin: 10px 0 0 0;"><strong>New Status:</strong> <span style="text-transform: uppercase; font-weight: bold; color: #059669;">${newStatus}</span></p>
      </div>
      <p>Please log in to your reviewer dashboard for more details.</p>
      <p style="margin-top: 30px;">Best regards,<br>Admin Team</p>
    </div>
  `;
};

export const createAssignmentEmail = (reviewerName: string, paperTitle: string, authorName: string) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">New Paper Assignment</h2>
      <p>Dear ${reviewerName},</p>
      <p>A new paper has been assigned to you for review:</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin: 0; color: #2563eb;">${paperTitle}</h3>
        <p style="margin: 10px 0 0 0;"><strong>Author:</strong> ${authorName}</p>
      </div>
      <p>Please log in to your reviewer dashboard to view the paper details and begin your review.</p>
      <p style="margin-top: 30px;">Best regards,<br>Admin Team</p>
    </div>
  `;
};
