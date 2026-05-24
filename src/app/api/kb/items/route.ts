import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60
import { eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { knowledgeBaseItems, companyProfiles } from '@/db/schema'
import { getOrCreateUser } from '@/lib/auth'
import { GoogleGenAI } from '@google/genai'

const KB_LIMITS: Record<string, number> = { free: 1, plus: 10, pro: Infinity }

const VALID_TYPES = ['past_proposal', 'case_study', 'certification', 'team_bio', 'technology', 'testimonial'] as const
type KbType = typeof VALID_TYPES[number]

async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    try { return await fn() } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (i < attempts - 1 && (msg.includes('fetch failed') || msg.includes('Error connecting'))) {
        await new Promise(r => setTimeout(r, 300))
        continue
      }
      throw err
    }
  }
  throw new Error('unreachable')
}

async function getOrCreateProfile(userId: string) {
  const [existing] = await withRetry(() =>
    db.select({ id: companyProfiles.id })
      .from(companyProfiles)
      .where(eq(companyProfiles.userId, userId))
      .limit(1)
  )
  if (existing) return existing
  const [created] = await withRetry(() =>
    db.insert(companyProfiles)
      .values({ userId, companyName: 'My Company' })
      .returning({ id: companyProfiles.id })
  )
  return created
}

type ExtractedMeta = { title: string; description: string; industry: string; tags: string[]; type: string }

async function extractFromFilename(filename: string, hintType?: string): Promise<ExtractedMeta> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY!, apiVersion: 'v1alpha' })
    const prompt = `Generate professional metadata for a business document uploaded with filename: "${filename}"

Return ONLY valid JSON (no markdown):
{
  "title": "concise document title (max 80 chars)",
  "description": "2-sentence summary of what this document likely demonstrates or proves",
  "industry": "single industry word e.g. banking | fintech | healthcare | government | insurance | retail | logistics | telecom | education | manufacturing",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "type": "one of: past_proposal | case_study | certification | team_bio | technology | testimonial"
}

${hintType ? `Hint: the user selected type "${hintType}" — prefer it unless clearly wrong.` : ''}`

    const result = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { temperature: 0.2, responseMimeType: 'application/json' },
    })
    const raw = result.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'
    const cleaned = raw.replace(/```json\n?|```/g, '').trim()
    try {
      return JSON.parse(cleaned) as ExtractedMeta
    } catch {
      return { title: '', description: '', industry: '', tags: [], type: hintType ?? 'past_proposal' }
    }
  } catch {
    return { title: '', description: '', industry: '', tags: [], type: hintType ?? 'past_proposal' }
  }
}

async function extractFromPDF(fileUrl: string, filename: string, hintType?: string): Promise<ExtractedMeta> {
  try {
    const res = await fetch(fileUrl)
    if (!res.ok) throw new Error('fetch failed')
    const pdfBase64 = Buffer.from(await res.arrayBuffer()).toString('base64')

    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY!, apiVersion: 'v1alpha' })
    const prompt = `You are reading the actual content of a business document. Extract precise metadata from what you read.

Return ONLY valid JSON (no markdown):
{
  "title": "exact document title found in the content, or a specific descriptive title (max 80 chars) — never generic like 'Business Operations Overview'",
  "description": "2-sentence summary of what this document specifically proves or demonstrates — include the company name, domain, and key outcomes if present",
  "industry": "single industry word e.g. banking | fintech | healthcare | government | insurance | retail | logistics | telecom | education | manufacturing",
  "tags": ["5-8 specific domain tags extracted from the actual content — e.g. fraud-detection, AML, UPI, NPCI, ISO27001 — never generic words like strategy or operations"],
  "type": "past_proposal | case_study | certification | team_bio | technology | testimonial"
}

${hintType ? `User-selected type hint: "${hintType}" — use unless clearly wrong.` : ''}`

    const result = await ai.models.generateContent({
      model: 'gemini-3.1-flash',
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { mimeType: 'application/pdf', data: pdfBase64 } },
          { text: prompt },
        ],
      }],
      config: { temperature: 0.1, responseMimeType: 'application/json' },
    })
    const raw = result.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'
    const cleaned = raw.replace(/```json\n?|```/g, '').trim()
    return JSON.parse(cleaned) as ExtractedMeta
  } catch (err) {
    console.error('[extractFromPDF] failed, falling back to filename:', err)
    return extractFromFilename(filename, hintType)
  }
}

export async function GET() {
  try {
    const user = await getOrCreateUser()
    const profile = await getOrCreateProfile(user.id)
    const items = await withRetry(() =>
      db.select()
        .from(knowledgeBaseItems)
        .where(eq(knowledgeBaseItems.companyProfileId, profile.id))
        .orderBy(knowledgeBaseItems.createdAt)
    )
    return NextResponse.json(items)
  } catch (err) {
    console.error('[kb/items GET]', err)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getOrCreateUser()
    const profile = await getOrCreateProfile(user.id)

    const [{ count }] = await withRetry(() =>
      db.select({ count: sql<number>`count(*)::int` })
        .from(knowledgeBaseItems)
        .where(eq(knowledgeBaseItems.companyProfileId, profile.id))
    )
    const limit = KB_LIMITS[user.plan] ?? 1
    if (count >= limit) {
      return NextResponse.json({ error: 'plan_limit', limit, plan: user.plan }, { status: 429 })
    }

    const body = await req.json()

    let title: string = body.title ?? ''
    let description: string = body.description ?? ''
    let tags: string[] = body.tags ?? []
    let type: KbType = VALID_TYPES.includes(body.type) ? body.type : 'past_proposal'
    let industry: string | null = body.industry ?? null

    if (body.fileUrl && !body.title) {
      const filename = (body.filename as string | undefined)
        || (body.fileUrl as string).split('/').pop()
        || 'document.pdf'
      const extracted = await extractFromPDF(body.fileUrl, filename, body.type)
      title = extracted.title || title
      description = extracted.description || description
      tags = extracted.tags?.length ? extracted.tags : tags
      if (extracted.industry) industry = extracted.industry
      if (VALID_TYPES.includes(extracted.type as KbType)) type = extracted.type as KbType
    }

    if (!title && body.fileUrl) {
      const raw = (body.fileUrl as string).split('/').pop() ?? 'document'
      title = raw.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').trim() || 'Uploaded document'
    }
    if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })

    const [item] = await db
      .insert(knowledgeBaseItems)
      .values({
        companyProfileId: profile.id,
        type,
        title,
        description,
        tags,
        industry,
        fileUrl: body.fileUrl ?? null,
        isActive: true,
      })
      .returning()

    return NextResponse.json(item, { status: 201 })
  } catch (err) {
    console.error('[kb/items POST]', err)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
