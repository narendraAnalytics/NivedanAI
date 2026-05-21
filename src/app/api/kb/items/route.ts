import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { knowledgeBaseItems, companyProfiles } from '@/db/schema'
import { getOrCreateUser } from '@/lib/auth'
import { GoogleGenAI } from '@google/genai'
import { PDFParse } from 'pdf-parse'

const VALID_TYPES = ['past_proposal', 'case_study', 'certification', 'team_bio', 'technology', 'testimonial'] as const
type KbType = typeof VALID_TYPES[number]

async function getOrCreateProfile(userId: string) {
  const [existing] = await db
    .select({ id: companyProfiles.id })
    .from(companyProfiles)
    .where(eq(companyProfiles.userId, userId))
    .limit(1)
  if (existing) return existing
  const [created] = await db
    .insert(companyProfiles)
    .values({ userId, companyName: 'My Company' })
    .returning({ id: companyProfiles.id })
  return created
}

async function extractFromPdf(fileUrl: string, hintType?: string) {
  const res = await fetch(fileUrl)
  const buffer = Buffer.from(await res.arrayBuffer())
  const parser = new PDFParse({ data: buffer })
  const [textResult] = await Promise.all([parser.getText()])
  const text = textResult.pages.map((p: { text: string }) => p.text).join('\n').slice(0, 6000)
  await parser.destroy()

  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY!, apiVersion: 'v1alpha' })
  const model = ai.models
  const prompt = `You are extracting metadata from a business document for an AI proposal system.

Document text (first 6000 chars):
${text}

Extract and return ONLY valid JSON (no markdown):
{
  "title": "concise document title (max 80 chars)",
  "description": "2-sentence summary of what this document demonstrates or proves",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "type": "one of: past_proposal | case_study | certification | team_bio | technology | testimonial"
}

${hintType ? `Hint: the user selected type "${hintType}" — prefer it unless clearly wrong.` : ''}`

  const result = await model.generateContent({
    model: 'gemini-3.1-flash-lite',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: { temperature: 0.2 },
  })
  const raw = result.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'
  const cleaned = raw.replace(/```json\n?|```/g, '').trim()
  return JSON.parse(cleaned) as { title: string; description: string; tags: string[]; type: string }
}

export async function GET() {
  const user = await getOrCreateUser()
  const profile = await getOrCreateProfile(user.id)
  const items = await db
    .select()
    .from(knowledgeBaseItems)
    .where(eq(knowledgeBaseItems.companyProfileId, profile.id))
    .orderBy(knowledgeBaseItems.createdAt)
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const user = await getOrCreateUser()
  const profile = await getOrCreateProfile(user.id)
  const body = await req.json()

  let title: string = body.title ?? ''
  let description: string = body.description ?? ''
  let tags: string[] = body.tags ?? []
  let type: KbType = VALID_TYPES.includes(body.type) ? body.type : 'past_proposal'

  if (body.fileUrl && !body.title) {
    const extracted = await extractFromPdf(body.fileUrl, body.type)
    title = extracted.title || title
    description = extracted.description || description
    tags = extracted.tags?.length ? extracted.tags : tags
    if (VALID_TYPES.includes(extracted.type as KbType)) type = extracted.type as KbType
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
      fileUrl: body.fileUrl ?? null,
      isActive: true,
    })
    .returning()

  return NextResponse.json(item, { status: 201 })
}
