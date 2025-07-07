
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

    const gmailUser = Deno.env.get("GMAIL_USER") || "karthikkishore2603@gmail.com";
    const gmailAppPassword = Deno.env.get("GMAIL_APP_PASSWORD") || "mqhkqevygdbsvsii";

    console.log("Sending email via Gmail SMTP...");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("From:", from || gmailUser);

    // Create email message in RFC 2822 format
    const emailMessage = createEmailMessage({
      from: from || gmailUser,
      to,
      subject,
      html
    });

    // Send via Gmail SMTP using raw TCP connection
    try {
      await sendViaGmailSMTP(emailMessage, gmailUser, gmailAppPassword);
      
      console.log("Email sent successfully via Gmail SMTP");

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Email sent successfully via Gmail SMTP",
          details: {
            to,
            subject,
            from: from || gmailUser
          }
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );

    } catch (smtpError: any) {
      console.error("Gmail SMTP error:", smtpError);
      
      // Log email details for debugging
      console.log("EMAIL CONTENT:");
      console.log("=============");
      console.log("From:", from || gmailUser);
      console.log("To:", to);
      console.log("Subject:", subject);
      console.log("HTML Content:", html);
      console.log("=============");
      
      return new Response(
        JSON.stringify({ 
          success: false,
          message: "Failed to send email via Gmail SMTP",
          error: smtpError.message,
          details: {
            to,
            subject,
            from: from || gmailUser
          }
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

  } catch (error: any) {
    console.error("General error in send-gmail function:", error);
    return new Response(
      JSON.stringify({ 
        error: `Email function error: ${error.message}`,
        details: {
          errorType: error.name || 'GeneralError'
        }
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function createEmailMessage({ from, to, subject, html }: { from: string, to: string, subject: string, html: string }) {
  const boundary = "boundary_" + Math.random().toString(36).substr(2, 9);
  
  return [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    html,
    ``,
    `--${boundary}--`,
    ``
  ].join('\r\n');
}

async function sendViaGmailSMTP(message: string, username: string, password: string) {
  console.log("Connecting to Gmail SMTP server...");
  
  try {
    // Connect to Gmail SMTP server
    const conn = await Deno.connectTls({
      hostname: "smtp.gmail.com",
      port: 465,
    });

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Helper function to send command and read response
    const sendCommand = async (command: string): Promise<string> => {
      console.log("SMTP Command:", command.replace(password, '***'));
      await conn.write(encoder.encode(command + '\r\n'));
      
      const buffer = new Uint8Array(1024);
      const n = await conn.read(buffer);
      const response = decoder.decode(buffer.subarray(0, n || 0));
      console.log("SMTP Response:", response.trim());
      return response;
    };

    // SMTP conversation
    await sendCommand(''); // Wait for server greeting
    await sendCommand('EHLO localhost');
    
    // Authentication
    await sendCommand('AUTH LOGIN');
    await sendCommand(btoa(username)); // Base64 encode username
    await sendCommand(btoa(password)); // Base64 encode password
    
    // Send email
    const fromEmail = message.match(/From: (.+?)$/m)?.[1] || username;
    const toEmail = message.match(/To: (.+?)$/m)?.[1] || '';
    
    await sendCommand(`MAIL FROM:<${fromEmail}>`);
    await sendCommand(`RCPT TO:<${toEmail}>`);
    await sendCommand('DATA');
    await sendCommand(message + '\r\n.');
    await sendCommand('QUIT');
    
    conn.close();
    console.log("Email sent successfully via Gmail SMTP");
    
  } catch (error) {
    console.error("SMTP connection error:", error);
    throw new Error(`SMTP Error: ${error.message}`);
  }
}

serve(handler);
