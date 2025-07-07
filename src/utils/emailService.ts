import { supabase } from "@/integrations/supabase/client";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export const sendEmail = async ({ to, subject, html, from }: SendEmailParams) => {
  try {
    console.log("Sending email via Supabase function...", { to, subject });
    
    const { data, error } = await supabase.functions.invoke('send-gmail', {
      body: {
        to,
        subject,
        html,
        from
      }
    });

    if (error) {
      console.error('Email sending error details:', error);
      throw new Error(`Failed to send email: ${error.message || 'Unknown error'}`);
    }

    console.log('Email sent successfully:', data);
    return data;
  } catch (error: any) {
    console.error('Failed to send email:', error);
    throw new Error(`Email service error: ${error.message || 'Unknown error'}`);
  }
};

// Enhanced email templates with better formatting
export const createStatusUpdateEmail = (reviewerName: string, paperTitle: string, newStatus: string) => {
  const statusColors = {
    'assigned': '#2563eb',
    'selected': '#059669',
    'rejected': '#dc2626',
    'pending': '#d97706'
  };

  const statusColor = statusColors[newStatus as keyof typeof statusColors] || '#6b7280';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Paper Status Update</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 0;">
        <div style="background-color: #2563eb; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Paper Status Update</h1>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Dear ${reviewerName},</p>
          <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">The status of your assigned paper has been updated:</p>
          
          <div style="background-color: #f3f4f6; padding: 25px; border-radius: 8px; margin: 30px 0; border-left: 4px solid ${statusColor};">
            <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 20px;">${paperTitle}</h2>
            <p style="margin: 0; font-size: 16px;">
              <strong>New Status:</strong> 
              <span style="color: ${statusColor}; font-weight: bold; text-transform: uppercase; background-color: rgba(37, 99, 235, 0.1); padding: 4px 8px; border-radius: 4px;">
                ${newStatus}
              </span>
            </p>
          </div>
          
          <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">Please log in to your reviewer dashboard for more details and to take any necessary actions.</p>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="#" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Open Dashboard
            </a>
          </div>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">Best regards,<br><strong>Admin Team</strong></p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const createAssignmentEmail = (reviewerName: string, paperTitle: string, authorName: string) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Paper Assignment</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 0;">
        <div style="background-color: #059669; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">New Paper Assignment</h1>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Dear ${reviewerName},</p>
          <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">A new paper has been assigned to you for review:</p>
          
          <div style="background-color: #f3f4f6; padding: 25px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #059669;">
            <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 20px;">${paperTitle}</h2>
            <p style="margin: 0; font-size: 16px; color: #374151;">
              <strong>Author:</strong> ${authorName}
            </p>
          </div>
          
          <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">Please log in to your reviewer dashboard to view the paper details and begin your review process.</p>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="#" style="background-color: #059669; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Start Review
            </a>
          </div>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">Best regards,<br><strong>Admin Team</strong></p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Helper function to send emails with toast notifications
export const sendEmailWithNotification = async (emailParams: SendEmailParams, toast: any) => {
  try {
    await sendEmail(emailParams);
    toast({
      title: "Email Sent",
      description: `Email sent successfully to ${emailParams.to}`,
    });
  } catch (error: any) {
    console.error("Email sending failed:", error);
    toast({
      title: "Email Failed",
      description: error.message || "Failed to send email",
      variant: "destructive",
    });
  }
};
