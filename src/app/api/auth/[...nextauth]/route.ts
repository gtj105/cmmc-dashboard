import NextAuth from 'next-auth'
import { getAuthOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

async function handler(req: Request, context: unknown) {
  return NextAuth(getAuthOptions())(req, context as never)
}

export { handler as GET, handler as POST }
