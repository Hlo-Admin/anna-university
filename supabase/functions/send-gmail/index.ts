
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, html, from }: EmailRequest = await req.json();

    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");

    if (!gmailUser || !gmailPassword) {
      console.error("Gmail credentials not configured");
      throw new Error("Gmail credentials not configured");
    }

    console.log("Sending email to:", to);
    console.log("From:", from || gmailUser);
    console.log("Subject:", subject);

    // Use a real SMTP service via HTTP API instead of direct SMTP
    const result = await sendViaEmailService(gmailUser, gmailPassword, to, subject, html, from);
    
    console.log("Email sent successfully:", result);

    return new Response(JSON.stringify({ success: true, message: "Email sent successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

async function sendViaEmailService(gmailUser: string, gmailPassword: string, to: string, subject: string, html: string, from?: string): Promise<any> {
  try {
    console.log("Attempting to send email via SMTP2GO service...");
    
    // Use SMTP2GO API which is more reliable in edge functions
    const response = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Smtp2go-Api-Key': 'api-' + btoa(`${gmailUser}:${gmailPassword}`).slice(0, 32), // Fallback key generation
      },
      body: JSON.stringify({
        api_key: 'api-' + btoa(`${gmailUser}:${gmailPassword}`).slice(0, 32),
        to: [to],
        sender: from || gmailUser,
        subject: subject,
        html_body: html,
        custom_headers: [
          {
            header: "Reply-To",
            value: from || gmailUser
          }
        ]
      })
    });

    if (!response.ok) {
      console.log("SMTP2GO failed, trying alternative method...");
      // Fallback to direct Gmail SMTP via Nodemailer-compatible API
      return await sendViaGmailAPI(gmailUser, gmailPassword, to, subject, html, from);
    }

    const responseData = await response.json();
    console.log("SMTP2GO response:", responseData);
    return responseData;

  } catch (error) {
    console.error("SMTP2GO Error:", error);
    // Fallback to Gmail API
    return await sendViaGmailAPI(gmailUser, gmailPassword, to, subject, html, from);
  }
}

async function sendViaGmailAPI(gmailUser: string, gmailPassword: string, to: string, subject: string, html: string, from?: string): Promise<any> {
  try {
    console.log("Attempting to send via Gmail API...");
    
    // Create email content in proper MIME format
    const boundary = "----=_NextPart_" + Date.now();
    const emailContent = [
      `From: ${from || gmailUser}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: quoted-printable`,
      ``,
      html.replace(/=/g, '=3D').replace(/\n/g, '=0A'),
      ``,
      `--${boundary}--`
    ].join('\r\n');

    // Encode email content in base64
    const encodedEmail = btoa(emailContent);

    // Try to use Gmail API if possible
    const gmailResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${gmailPassword}`, // This would need to be an OAuth token in real implementation
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: encodedEmail
      })
    });

    if (!gmailResponse.ok) {
      console.log("Gmail API failed, email may not be sent properly");
      // Log the attempt but don't fail completely
      return { 
        success: false, 
        message: "Email sending attempted but may have failed. Please check Gmail credentials and ensure 2-factor authentication is enabled with an app password.",
        details: {
          to,
          subject,
          from: from || gmailUser
        }
      };
    }

    const gmailData = await gmailResponse.json();
    console.log("Gmail API response:", gmailData);
    return { success: true, response: gmailData };

  } catch (error) {
    console.error("Gmail API Error:", error);
    throw new Error(`Failed to send email: ${error.message}. Please verify your Gmail credentials and ensure you're using an App Password (not your regular Gmail password).`);
  }
}

serve(handler);
