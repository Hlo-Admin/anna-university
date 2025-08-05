
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { fileName, fileData, originalName, fileType } = await req.json()
    
    console.log('Google Drive upload request:', { fileName, originalName, fileType })
    
    // Get environment variables
    const serviceAccountEmail = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL')
    const privateKey = Deno.env.get('GOOGLE_PRIVATE_KEY')
    const projectId = Deno.env.get('GOOGLE_PROJECT_ID')
    
    if (!serviceAccountEmail || !privateKey || !projectId) {
      throw new Error('Missing Google service account credentials')
    }

    // Clean and format the private key
    const cleanPrivateKey = privateKey
      .replace(/\\n/g, '\n')
      .replace(/"/g, '')
      .trim()

    console.log('Service account email:', serviceAccountEmail)
    console.log('Project ID:', projectId)

    // Create JWT for Google API authentication
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

    // Encode header and payload
    const encoder = new TextEncoder()
    const headerB64 = btoa(JSON.stringify(header)).replace(/[+/]/g, c => c === '+' ? '-' : '_').replace(/=/g, '')
    const payloadB64 = btoa(JSON.stringify(payload)).replace(/[+/]/g, c => c === '+' ? '-' : '_').replace(/=/g, '')
    
    const message = `${headerB64}.${payloadB64}`
    
    // Import the private key for signing
    const keyData = cleanPrivateKey
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace(/\s/g, '')
    
    const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0))
    
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      binaryKey,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    )

    // Sign the message
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      encoder.encode(message)
    )

    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/[+/]/g, c => c === '+' ? '-' : '_')
      .replace(/=/g, '')

    const jwt = `${message}.${signatureB64}`

    console.log('JWT created successfully')

    // Get access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    })

    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.text()
      console.error('Token request failed:', tokenError)
      throw new Error('Failed to get access token')
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    console.log('Access token obtained successfully')

    // Convert base64 file data to bytes
    const base64Data = fileData.split(',')[1] || fileData
    const fileBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))

    // Upload file to Google Drive
    const metadata = {
      name: originalName,
      parents: ['15mm6UCZtZHw4nLylj0_-jfJeLZGr0k0W'] // Your folder ID
    }

    const form = new FormData()
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
    form.append('file', new Blob([fileBytes], { type: fileType }))

    const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: form
    })

    if (!uploadResponse.ok) {
      const uploadError = await uploadResponse.text()
      console.error('Upload failed:', uploadError)
      throw new Error('Failed to upload file to Google Drive')
    }

    const uploadResult = await uploadResponse.json()
    console.log('File uploaded successfully:', uploadResult.id)

    // Make the file publicly readable (optional)
    await fetch(`https://www.googleapis.com/drive/v3/files/${uploadResult.id}/permissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone'
      })
    })

    const fileUrl = `https://drive.google.com/file/d/${uploadResult.id}/view`

    return new Response(JSON.stringify({
      success: true,
      fileId: uploadResult.id,
      fileName: originalName,
      fileUrl: fileUrl
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Google Drive upload error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
