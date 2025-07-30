
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

    const emailUser = Deno.env.get("EMAIL_USER");
    const emailPass = Deno.env.get("EMAIL_PASS");
    const smtpHost = Deno.env.get("SMTP_HOST") || "smtp.gmail.com";
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");

    console.log("Environment variables check:");
    console.log("EMAIL_USER:", emailUser ? "✓ Set" : "✗ Missing");
    console.log("EMAIL_PASS:", emailPass ? "✓ Set" : "✗ Missing");
    console.log("SMTP_HOST:", smtpHost);
    console.log("SMTP_PORT:", smtpPort);

    if (!emailUser || !emailPass) {
      console.error("Email credentials not configured");
      return new Response(
        JSON.stringify({ 
          success: false,
          message: "Email credentials not configured",
          error: "Missing EMAIL_USER or EMAIL_PASS environment variables"
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Sending email via SMTP...");
    console.log("From:", from || emailUser);
    console.log("To:", to);
    console.log("Subject:", subject);

    // Create the email message
    const boundary = "----=_NextPart_" + Math.random().toString(36).substring(2);
    
    const emailMessage = [
      `From: ${from || emailUser}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset=utf-8`,
      `Content-Transfer-Encoding: 7bit`,
      ``,
      html,
      ``,
      `--${boundary}--`,
      ``
    ].join('\r\n');

    // Encode credentials
    const credentials = btoa(`${emailUser}:${emailPass}`);

    // Connect to SMTP server using raw TCP
    const conn = await Deno.connect({
      hostname: smtpHost,
      port: smtpPort,
    });

    // Start TLS connection
    const tlsConn = await Deno.startTls(conn, { hostname: smtpHost });
    
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Helper function to send command and read response
    const sendCommand = async (command: string) => {
      console.log("Sending:", command.replace(/AUTH PLAIN.*/, "AUTH PLAIN [credentials hidden]"));
      await tlsConn.write(encoder.encode(command + '\r\n'));
      
      const buffer = new Uint8Array(1024);
      const n = await tlsConn.read(buffer);
      const response = decoder.decode(buffer.subarray(0, n!));
      console.log("Received:", response.trim());
      return response;
    };

    try {
      // SMTP conversation
      let response = await sendCommand('EHLO localhost');
      if (!response.startsWith('250')) throw new Error(`EHLO failed: ${response}`);

      response = await sendCommand(`AUTH PLAIN ${btoa(`\0${emailUser}\0${emailPass}`)}`);
      if (!response.startsWith('235')) throw new Error(`AUTH failed: ${response}`);

      response = await sendCommand(`MAIL FROM:<${emailUser}>`);
      if (!response.startsWith('250')) throw new Error(`MAIL FROM failed: ${response}`);

      response = await sendCommand(`RCPT TO:<${to}>`);
      if (!response.startsWith('250')) throw new Error(`RCPT TO failed: ${response}`);

      response = await sendCommand('DATA');
      if (!response.startsWith('354')) throw new Error(`DATA failed: ${response}`);

      // Send the email content
      await tlsConn.write(encoder.encode(emailMessage + '\r\n.\r\n'));
      
      const dataBuffer = new Uint8Array(1024);
      const dataN = await tlsConn.read(dataBuffer);
      const dataResponse = decoder.decode(dataBuffer.subarray(0, dataN!));
      console.log("Data response:", dataResponse.trim());
      
      if (!dataResponse.startsWith('250')) throw new Error(`Email sending failed: ${dataResponse}`);

      await sendCommand('QUIT');
      
    } finally {
      tlsConn.close();
    }

    console.log("Email sent successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email sent successfully",
        details: {
          to: to,
          subject: subject,
          from: from || emailUser
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("SMTP sending error:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        message: "Failed to send email",
        error: error.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
