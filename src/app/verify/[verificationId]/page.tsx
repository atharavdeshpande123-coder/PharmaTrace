import { Metadata } from 'next'
import { PublicVerifyClient } from './PublicVerifyClient'

export const metadata: Metadata = {
  title: 'PharmaTrace — Public Verification',
  description: 'Verify a pharmaceutical batch record on the PharmaTrace blockchain.',
}

export const dynamic = 'force-dynamic'

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ verificationId: string }>
}) {
  const { verificationId } = await params
  return <PublicVerifyClient verificationId={verificationId} />
}
