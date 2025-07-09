// supabase/functions/file-type-check/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // This is needed for CORS preflight requests.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { record } = await req.json();

    // Check if there's an image URL to validate
    if (!record.image_url) {
      // If no image, it's not a file upload, so it's valid
      return new Response(JSON.stringify({}), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // List of allowed image extensions
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
    const url = new URL(record.image_url);
    const fileExtension = url.pathname.substring(url.pathname.lastIndexOf('.')).toLowerCase();

    if (allowedExtensions.includes(fileExtension)) {
      // If the extension is allowed, return the original record to proceed with the insert
      return new Response(JSON.stringify(record), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } else {
      // If the extension is NOT allowed, throw an error to stop the insert
      throw new Error('Invalid file type. Only images are allowed.');
    }

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})