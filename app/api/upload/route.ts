import { put } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Upload to Vercel Blob - public access for image analysis
    const blob = await put(`oscaller/${Date.now()}-${file.name}`, file, {
      access: 'public',
    })

    console.log('[v0] File uploaded to Blob:', blob.url)

    return NextResponse.json({ url: blob.url, pathname: blob.pathname })
  } catch (error) {
    console.error('[v0] Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
