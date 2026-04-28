'use client'

import { InvestigationWorkspace } from '@mind-fuse/editor'

export function WorkspaceClient({ investigationId }: { investigationId: string }) {
  return (
    <InvestigationWorkspace
      investigationId={investigationId}
      title="Technical investigation workspace"
    />
  )
}
