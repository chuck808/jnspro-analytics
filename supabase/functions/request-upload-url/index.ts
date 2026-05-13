import { createClient } from '@supabase/supabase-js'

// Deno global is provided by the Supabase Edge Runtime
declare const Deno: {
    serve: (handler: (req: Request) => Response | Promise<Response>) => void
    env: {
        get: (key: string) => string | undefined
    }
}

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    if (req.method !== 'POST') {
        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    try {
        // Parse request body
        let body: {
            device_id: string
            device_secret: string
            filename: string
            content_type: string
            firmware_version?: string
            schema_version?: number
        }

        try {
            body = await req.json()
        } catch {
            return new Response(
                JSON.stringify({ error: 'Invalid JSON body' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const { device_id, device_secret, filename, content_type, firmware_version, schema_version } = body

        // Validate required fields
        if (!device_id || !device_secret || !filename || !content_type) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: device_id, device_secret, filename, content_type' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Validate UUID format for device_id
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(device_id)) {
            return new Response(
                JSON.stringify({ error: 'Invalid device_id format. Must be a valid UUID.' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Create service role client
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { persistSession: false } }
        )

        // Look up device and validate secret
        const { data: device, error: deviceError } = await supabase
            .from('devices')
            .select('id, user_id, device_secret')
            .eq('id', device_id)
            .maybeSingle()

        if (deviceError || !device) {
            return new Response(
                JSON.stringify({ error: 'Device not found' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Validate secret — plaintext for now, hash comparison before launch
        if (device.device_secret !== device_secret) {
            return new Response(
                JSON.stringify({ error: 'Invalid device secret' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Build storage path
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const storagePath = `users/${device.user_id}/devices/${device_id}/uploads/${timestamp}_${filename}`

        // Create signed upload URL — valid for 2 hours
        const { data: signedData, error: signedError } = await supabase
            .storage
            .from('device-uploads')
            .createSignedUploadUrl(storagePath)

        if (signedError || !signedData) {
            console.error('Signed URL error:', signedError)
            return new Response(
                JSON.stringify({ error: 'Failed to create upload URL' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Record upload attempt in device_uploads
        // This is CRITICAL - webhook needs this record to process the upload
        const { error: uploadRecordError } = await supabase
            .from('device_uploads')
            .insert({
                device_id: device.id,
                user_id: device.user_id,
                storage_path: storagePath,
                filename: filename,
                schema_version: schema_version ?? null,
                firmware_version: firmware_version ?? null,
                status: 'signed_url_issued',
            })

        if (uploadRecordError) {
            console.error('Upload record error:', uploadRecordError)
            return new Response(
                JSON.stringify({ 
                    error: 'Failed to create upload record',
                    details: uploadRecordError.message 
                }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        return new Response(
            JSON.stringify({
                upload_url: signedData.signedUrl,
                storage_path: storagePath,
                status: 'success',
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (err) {
        console.error('Unexpected error:', err)
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
