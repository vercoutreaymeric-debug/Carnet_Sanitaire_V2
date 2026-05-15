import { prisma } from '@/lib/prisma'
import ContactsClient from './ContactsClient'

export const dynamic = 'force-dynamic'

export default async function ContactsPage() {
  const contacts = await prisma.contact.findMany({ orderBy: { id: 'asc' } }).catch(() => [])
  return <ContactsClient initialData={JSON.parse(JSON.stringify(contacts))} />
}
