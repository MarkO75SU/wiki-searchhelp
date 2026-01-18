// src/supabase/functions/get-embeddings/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
// Using batchEmbedContents for efficiency
const GOOGLE_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { texts } = await req.json()

    if (!texts || !Array.isArray(texts)) {
      throw new Error('Array of texts is required')
    }

    // Prepare batch request
    const requests = texts.map(text => ({
        model: "models/text-embedding-004",
        content: { parts: [{ text }] }
    }))

    const response = await fetch(`${GOOGLE_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests }),
    })

    const data = await response.json()
    
    // Extract embedding values
    const embeddings = data.embeddings.map((e: any) => e.values)

    return new Response(JSON.stringify({ embeddings }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})