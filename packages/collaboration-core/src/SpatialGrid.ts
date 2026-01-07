import { Box, Point, ShapeId } from '@mind-fuse/types'

const GRID_SIZE = 200

class SpatialGrid {
  private cells: Map<string, Set<ShapeId>> = new Map()
  private shapeToCells: Map<ShapeId, Set<string>> = new Map()

  private getCoveredCells(bounds: Box): string[] {
    const startRow = Math.floor(bounds.y / GRID_SIZE)
    const endRow = Math.floor((bounds.y + bounds.height) / GRID_SIZE)
    const startCol = Math.floor(bounds.x / GRID_SIZE)
    const endCol = Math.floor((bounds.x + bounds.width) / GRID_SIZE)
    const cells: string[] = []
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        cells.push(`${row}_${col}`)
      }
    }
    return cells
  }

  public insert(shapeId: ShapeId, bounds: Box): void {
    const cellKeys = this.getCoveredCells(bounds)
    this.shapeToCells.set(shapeId, new Set(cellKeys))
    for (const cell of cellKeys) {
      if (!this.cells.has(cell)) {
        this.cells.set(cell, new Set())
      }
      this.cells.get(cell)?.add(shapeId)
    }
  }

  public remove(shapeId: ShapeId): void {
    const cells = this.shapeToCells.get(shapeId)
    if (!cells) return
    for (const cell of cells) {
      this.cells.get(cell)?.delete(shapeId)

      if (this.cells.get(cell)?.size === 0) {
        this.cells.delete(cell)
      }
    }
    this.shapeToCells.delete(shapeId)
  }

  private isCellsEqual(cells1: Set<string>, cells2: Set<string>): boolean {
    if (cells1.size !== cells2.size) return false
    for (const cell of cells1) {
      if (!cells2.has(cell)) return false
    }
    return true
  }

  public update(shapeId: ShapeId, bounds: Box): void {
    const oldCells = this.shapeToCells.get(shapeId)
    const newCells = new Set(this.getCoveredCells(bounds))

    if (oldCells && this.isCellsEqual(oldCells, newCells)) return

    this.remove(shapeId)
    this.insert(shapeId, bounds)
  }

  public query(bounds: Box): ShapeId[] {
    const cells = this.getCoveredCells(bounds)
    const shapes = new Set<ShapeId>()
    for (const cell of cells) {
      for (const shapeId of this.cells.get(cell) ?? []) {
        shapes.add(shapeId)
      }
    }
    return [...shapes]
  }

  public queryPoint(point: Point): ShapeId[] {
    const key = `${Math.floor(point.y / GRID_SIZE)}_${Math.floor(point.x / GRID_SIZE)}`
    return [...(this.cells.get(key) ?? [])]
  }
}

export default SpatialGrid
