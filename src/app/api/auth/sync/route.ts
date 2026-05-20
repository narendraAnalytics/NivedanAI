import { NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/auth'

export async function GET(req: Request) {
  await getOrCreateUser()
  return NextResponse.redirect(new URL('/redirecting?to=', req.url))
}
