
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
      throw new Error("Gmail credentials not configured");
    }

    // Create the email content
    const emailContent = `To: ${to}\r\nFrom: ${from || gmailUser}\r\nSubject: ${subject}\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n${html}`;
    
    // Base64 encode the email content
    const encodedEmail = btoa(emailContent).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    // Use Gmail API to send email
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${gmailPassword}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: encodedEmail
      })
    });

    if (!response.ok) {
      // Fallback to SMTP if Gmail API fails
      const smtpResponse = await sendViaGmailSMTP(gmailUser, gmailPassword, to, subject, html, from);
      return new Response(JSON.stringify(smtpResponse), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const result = await response.json();
    console.log("Email sent successfully via Gmail API:", result);

    return new Response(JSON.stringify({ success: true, messageId: result.id }), {
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

async function sendViaGmailSMTP(gmailUser: string, gmailPassword: string, to: string, subject: string, html: string, from?: string): Promise<any> {
  // Simple SMTP implementation for Gmail
  const smtpHost = "smtp.gmail.com";
  const smtpPort = 587;
  
  try {
    const conn = await Deno.connect({
      hostname: smtpHost,
      port: smtpPort,
    });

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // SMTP conversation
    const commands = [
      `EHLO ${smtpHost}`,
      `STARTTLS`,
      `AUTH LOGIN`,
      btoa(gmailUser),
      btoa(gmailPassword),
      `MAIL FROM:<${from || gmailUser}>`,
      `RCPT TO:<${to}>`,
      `DATA`,
      `From: ${from || gmailUser}\r\nTo: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n${html}\r\n.`,
      `QUIT`
    ];

    for (const command of commands) {
      await conn.write(encoder.encode(command + "\r\n"));
      const response = new Uint8Array(1024);
      await conn.read(response);
      console.log("SMTP Response:", decoder.decode(response));
    }

    conn.close();
    return { success: true, message: "Email sent via SMTP" };
  } catch (error) {
    console.error("SMTP Error:", error);
    throw error;
  }
}

serve(handler);
