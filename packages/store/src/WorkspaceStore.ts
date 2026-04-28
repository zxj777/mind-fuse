import type { AISuggestion, AISuggestionStatus } from '@mind-fuse/ai-sdk'

export interface WorkspaceViewport {
  x: number
  y: number
  zoom: number
}

export interface WorkspaceState {
  selectedEntityId?: string
  activeSnapshotId?: string
  viewport: WorkspaceViewport
  suggestions: AISuggestion[]
}

type Listener = () => void

export class WorkspaceStore {
  private state: WorkspaceState
  private readonly listeners = new Set<Listener>()

  public constructor(initial?: Partial<WorkspaceState>) {
    this.state = {
      viewport: {
        x: 0,
        y: 0,
        zoom: 1,
      },
      suggestions: [],
      ...initial,
    }
  }

  public getState(): WorkspaceState {
    return this.state
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  public setSelectedEntityId(entityId?: string): void {
    this.patch({ selectedEntityId: entityId })
  }

  public setActiveSnapshotId(snapshotId?: string): void {
    this.patch({ activeSnapshotId: snapshotId })
  }

  public setViewport(viewport: Partial<WorkspaceViewport>): void {
    this.patch({
      viewport: {
        ...this.state.viewport,
        ...viewport,
      },
    })
  }

  public setSuggestions(suggestions: AISuggestion[]): void {
    this.patch({ suggestions })
  }

  public updateSuggestionStatus(id: string, status: AISuggestionStatus): void {
    this.patch({
      suggestions: this.state.suggestions.map(suggestion =>
        suggestion.id === id ? { ...suggestion, status } : suggestion,
      ),
    })
  }

  private patch(patch: Partial<WorkspaceState>): void {
    this.state = {
      ...this.state,
      ...patch,
    }
    for (const listener of this.listeners) {
      listener()
    }
  }
}

export function createWorkspaceStore(initial?: Partial<WorkspaceState>): WorkspaceStore {
  return new WorkspaceStore(initial)
}
