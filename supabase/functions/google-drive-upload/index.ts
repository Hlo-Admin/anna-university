
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GoogleDriveUploadRequest {
  fileName: string
  fileData: string // base64 encoded file data
  mimeType: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { fileName, fileData, mimeType }: GoogleDriveUploadRequest = await req.json()
    
    console.log('Starting Google Drive upload for:', fileName)
    
    // Get Google service account credentials from Supabase secrets
    const serviceAccountEmail = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL')
    const privateKey = Deno.env.get('GOOGLE_PRIVATE_KEY')
    const projectId = Deno.env.get('GOOGLE_PROJECT_ID')
    
    if (!serviceAccountEmail || !privateKey || !projectId) {
      throw new Error('Missing Google service account credentials')
    }
    
    // Create JWT for Google OAuth
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    }
    
    const now = Math.floor(Date.now() / 1000)
    const payload = {
      iss: serviceAccountEmail,
      scope: 'https://www.googleapis.com/auth/drive.file',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    }
    
    // Convert private key for crypto
    const privateKeyFormatted = privateKey.replace(/\\n/g, '\n')
    const keyData = await crypto.subtle.importKey(
      'pkcs8',
      new TextEncoder().encode(privateKeyFormatted),
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    )
    
    const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    const signatureInput = `${encodedHeader}.${encodedPayload}`
    
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      keyData,
      new TextEncoder().encode(signatureInput)
    )
    
    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    
    const jwt = `${signatureInput}.${encodedSignature}`
    
    // Get access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    })
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token request failed:', errorText)
      throw new Error(`Failed to get access token: ${tokenResponse.status}`)
    }
    
    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token
    
    console.log('Successfully obtained access token')
    
    // Convert base64 to blob
    const base64Data = fileData.split(',')[1] || fileData
    const binaryData = atob(base64Data)
    const bytes = new Uint8Array(binaryData.length)
    for (let i = 0; i < binaryData.length; i++) {
      bytes[i] = binaryData.charCodeAt(i)
    }
    
    // Upload to Google Drive
    const folderId = '15mm6UCZtZHw4nLylj0_-jfJeLZGr0k0W' // Your folder ID
    
    const metadata = {
      name: fileName,
      parents: [folderId]
    }
    
    // Create multipart upload
    const boundary = '-------314159265358979323846'
    const delimiter = `\r\n--${boundary}\r\n`
    const close_delim = `\r\n--${boundary}--`
    
    let body = delimiter
    body += 'Content-Type: application/json\r\n\r\n'
    body += JSON.stringify(metadata) + delimiter
    body += `Content-Type: ${mimeType}\r\n\r\n`
    
    const bodyBytes = new TextEncoder().encode(body)
    const closeBytes = new TextEncoder().encode(close_delim)
    
    const fullBody = new Uint8Array(bodyBytes.length + bytes.length + closeBytes.length)
    fullBody.set(bodyBytes)
    fullBody.set(bytes, bodyBytes.length)
    fullBody.set(closeBytes, bodyBytes.length + bytes.length)
    
    const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: fullBody,
    })
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error('Upload failed:', errorText)
      throw new Error(`Failed to upload to Google Drive: ${uploadResponse.status}`)
    }
    
    const uploadResult = await uploadResponse.json()
    console.log('Successfully uploaded to Google Drive:', uploadResult.id)
    
    // Make the file publicly viewable
    await fetch(`https://www.googleapis.com/drive/v3/files/${uploadResult.id}/permissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone'
      }),
    })
    
    return new Response(JSON.stringify({
      success: true,
      fileId: uploadResult.id,
      fileName: fileName,
      viewUrl: `https://drive.google.com/file/d/${uploadResult.id}/view`,
      downloadUrl: `https://drive.google.com/uc?id=${uploadResult.id}&export=download`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
    
  } catch (error) {
    console.error('Google Drive upload error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
