import { WorkspaceClient } from './workspace-client'

export default async function InvestigationPage({
  params,
}: {
  params: Promise<{ investigationId: string }>
}) {
  const { investigationId } = await params

  return (
    <WorkspaceClient investigationId={investigationId} />
  )
}
