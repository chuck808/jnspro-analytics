import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const DEVICE_INGEST_SECRET = Deno.env.get('DEVICE_INGEST_SECRET') ?? ''
const VERCEL_URL = 'https://jnspro-analytics.vercel.app'

// Deno global is provided by the Supabase Edge Runtime
declare const Deno: {
    serve: (handler: (req: Request) => Response | Promise<Response>) => void
    env: {
        get: (key: string) => string | undefined
    }
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { status: 200 })
    }

    try {
        const payload = await req.json()

        // Database webhook payload structure
        const record = payload?.record
        if (!record) {
            console.log('No record in payload — ignoring')
            return new Response('ok', { status: 200 })
        }

        // Only process device-uploads bucket
        if (record.bucket_id !== 'device-uploads') {
            console.log('Wrong bucket — ignoring')
            return new Response('ok', { status: 200 })
        }

        // Only process JSON session files
        const storagePath: string = record.name ?? ''
        if (!storagePath.endsWith('.json')) {
            console.log('Not a JSON file — ignoring:', storagePath)
            return new Response('ok', { status: 200 })
        }

        console.log('Processing upload:', storagePath)

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { persistSession: false } }
        )

        // Look up device_uploads row to get user_id
        // Match on storage_path suffix since Edge Function prepends timestamp
        const { data: uploadRecord, error: uploadError } = await supabase
            .from('device_uploads')
            .select('id, user_id, status')
            .eq('storage_path', storagePath)
            .eq('status', 'signed_url_issued')
            .maybeSingle()

        if (uploadError || !uploadRecord) {
            console.log('No matching device_uploads row — may be RLS test insert, ignoring')
            return new Response('ok', { status: 200 })
        }

        const { id: uploadId, user_id: userId } = uploadRecord
        console.log('Found device_uploads row:', uploadId, 'user:', userId)

        // Download file from Storage
        const { data: fileData, error: downloadError } = await supabase
            .storage
            .from('device-uploads')
            .download(storagePath)

        if (downloadError || !fileData) {
            console.error('Failed to download file:', downloadError)
            await supabase
                .from('device_uploads')
                .update({ status: 'failed' })
                .eq('id', uploadId)
            return new Response('download failed', { status: 500 })
        }

        // Parse JSON
        let sessionData: unknown
        try {
            const text = await fileData.text()
            sessionData = JSON.parse(text)
        } catch (parseErr) {
            console.error('Failed to parse JSON:', parseErr)
            await supabase
                .from('device_uploads')
                .update({ status: 'failed' })
                .eq('id', uploadId)
            return new Response('parse failed', { status: 500 })
        }

        // POST to SvelteKit device ingest endpoint
        const ingestResponse = await fetch(`${VERCEL_URL}/api/device-ingest`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-device-ingest-secret': DEVICE_INGEST_SECRET,
            },
            body: JSON.stringify({
                userId,
                fileData: sessionData,
            }),
        })

        const ingestResult = await ingestResponse.json()
        console.log('Ingest result:', ingestResponse.status, JSON.stringify(ingestResult))

        if (ingestResponse.ok && ingestResult.success) {
            // Update device_uploads status and link to created session
            await supabase
                .from('device_uploads')
                .update({
                    status: 'uploaded',
                    completed_at: new Date().toISOString(),
                    session_id: ingestResult.session_id ?? null,  // Link to session for cascade deletion
                })
                .eq('id', uploadId)

            console.log('Successfully processed:', storagePath, 'session:', ingestResult.session_id)
            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            })
        } else {
            console.error('Ingest failed:', ingestResult)
            await supabase
                .from('device_uploads')
                .update({ status: 'failed' })
                .eq('id', uploadId)
            return new Response('ingest failed', { status: 500 })
        }

    } catch (err) {
        console.error('Unexpected error:', err)
        return new Response('internal error', { status: 500 })
    }
})
