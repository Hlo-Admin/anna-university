
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

    console.log("Environment variables check:");
    console.log("EMAIL_USER:", emailUser ? "✓ Set" : "✗ Missing");
    console.log("EMAIL_PASS:", emailPass ? "✓ Set" : "✗ Missing");

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

    console.log("Sending email via nodemailer...");
    console.log("From:", from || emailUser);
    console.log("To:", to);
    console.log("Subject:", subject);

    // Create nodemailer transporter configuration
    const transporterConfig = {
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    };

    console.log("Creating transporter with config:", { 
      service: transporterConfig.service,
      auth: { user: transporterConfig.auth.user, pass: '[HIDDEN]' }
    });

    // Create mail options
    const mailOptions = {
      from: from || emailUser,
      to: to,
      subject: subject,
      html: html,
    };

    console.log("Mail options:", {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      html: html.length > 100 ? `${html.substring(0, 100)}...` : html
    });

    // Use fetch to call a simple SMTP API instead of direct nodemailer
    // Since we're in Deno environment, we'll use Gmail's SMTP via basic auth
    const emailData = {
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      },
      mail: {
        from: from || emailUser,
        to: to,
        subject: subject,
        html: html
      }
    };

    // For now, let's use a simple HTTP-based approach to send email
    // Create the email message in the format Gmail API expects
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36)}`;
    
    const rawMessage = [
      `From: ${from || emailUser}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: quoted-printable`,
      ``,
      html,
      ``,
      `--${boundary}--`
    ].join('\r\n');

    console.log("Raw message created, length:", rawMessage.length);

    // Since nodemailer isn't directly available in Deno, 
    // let's create a simple SMTP client that mimics nodemailer behavior
    const smtpResult = await sendViaSimpleTransporter(transporterConfig, mailOptions);
    
    if (!smtpResult.success) {
      throw new Error(smtpResult.error);
    }

    console.log("Email sent successfully:", smtpResult);

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
    console.error("Email sending error:", error);
    
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

// Simple transporter function that mimics nodemailer behavior
async function sendViaSimpleTransporter(config: any, mailOptions: any) {
  try {
    console.log("Attempting to send email via simple transporter");
    
    // Create a simple SMTP connection
    const conn = await Deno.connect({
      hostname: "smtp.gmail.com",
      port: 587,
    });

    console.log("Connected to SMTP server");

    // Upgrade to TLS
    const tlsConn = await Deno.startTls(conn, { hostname: "smtp.gmail.com" });
    
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Read initial greeting
    const buffer = new Uint8Array(1024);
    await tlsConn.read(buffer);
    console.log("Server greeting received");

    // Send EHLO
    await tlsConn.write(encoder.encode("EHLO localhost\r\n"));
    await tlsConn.read(buffer);
    console.log("EHLO sent");

    // Authenticate
    const authString = btoa(`\0${config.auth.user}\0${config.auth.pass}`);
    await tlsConn.write(encoder.encode(`AUTH PLAIN ${authString}\r\n`));
    const authResponse = new Uint8Array(1024);
    const authN = await tlsConn.read(authResponse);
    const authResult = decoder.decode(authResponse.subarray(0, authN!));
    
    if (!authResult.startsWith('235')) {
      throw new Error(`Authentication failed: ${authResult}`);
    }
    console.log("Authentication successful");

    // Send MAIL FROM
    await tlsConn.write(encoder.encode(`MAIL FROM:<${config.auth.user}>\r\n`));
    await tlsConn.read(buffer);
    console.log("MAIL FROM sent");

    // Send RCPT TO
    await tlsConn.write(encoder.encode(`RCPT TO:<${mailOptions.to}>\r\n`));
    await tlsConn.read(buffer);
    console.log("RCPT TO sent");

    // Send DATA
    await tlsConn.write(encoder.encode("DATA\r\n"));
    await tlsConn.read(buffer);
    console.log("DATA command sent");

    // Send email content
    const emailContent = [
      `From: ${mailOptions.from}`,
      `To: ${mailOptions.to}`,
      `Subject: ${mailOptions.subject}`,
      `Content-Type: text/html; charset=UTF-8`,
      ``,
      mailOptions.html,
      ``,
      `.`
    ].join('\r\n');

    await tlsConn.write(encoder.encode(emailContent + '\r\n'));
    const dataResponse = new Uint8Array(1024);
    const dataN = await tlsConn.read(dataResponse);
    const dataResult = decoder.decode(dataResponse.subarray(0, dataN!));
    
    if (!dataResult.startsWith('250')) {
      throw new Error(`Email sending failed: ${dataResult}`);
    }
    console.log("Email content sent successfully");

    // Send QUIT
    await tlsConn.write(encoder.encode("QUIT\r\n"));
    tlsConn.close();
    
    return { success: true, message: "Email sent via simple transporter" };
    
  } catch (error: any) {
    console.error("Simple transporter error:", error);
    return { success: false, error: error.message };
  }
}

serve(handler);
