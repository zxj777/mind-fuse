import { describe, it, expect, beforeEach } from 'vitest'
import SpatialGrid from '../src/SpatialGrid'
import { Point, type ShapeId } from '@mind-fuse/types'

describe('SpatialGrid', () => {
  let grid: SpatialGrid

  beforeEach(() => {
    grid = new SpatialGrid()
  })

  describe('insert and queryPoint', () => {
    it('should find shape after insert', () => {
      const shapeId = 'shape:1' as ShapeId
      grid.insert(shapeId, { x: 100, y: 100, width: 50, height: 50 })

      const result = grid.queryPoint(Point.create(125, 125))
      expect(result).toContain(shapeId)
    })

    it('should not find shape at wrong position', () => {
      const shapeId = 'shape:1' as ShapeId
      grid.insert(shapeId, { x: 100, y: 100, width: 50, height: 50 })

      const result = grid.queryPoint(Point.create(500, 500))
      expect(result).not.toContain(shapeId)
    })
  })

  describe('remove', () => {
    it('should not find shape after remove', () => {
      const shapeId = 'shape:1' as ShapeId
      grid.insert(shapeId, { x: 100, y: 100, width: 50, height: 50 })
      grid.remove(shapeId)

      const result = grid.queryPoint(Point.create(125, 125))
      expect(result).not.toContain(shapeId)
    })
  })

  describe('update', () => {
    it('should find shape at new position after update', () => {
      const shapeId = 'shape:1' as ShapeId
      grid.insert(shapeId, { x: 100, y: 100, width: 50, height: 50 })
      grid.update(shapeId, { x: 500, y: 500, width: 50, height: 50 })

      // Should NOT be at old position
      const oldResult = grid.queryPoint(Point.create(125, 125))
      expect(oldResult).not.toContain(shapeId)

      // Should be at new position
      const newResult = grid.queryPoint(Point.create(525, 525))
      expect(newResult).toContain(shapeId)
    })
  })

  describe('query (range)', () => {
    it('should find shapes in range', () => {
      const shape1 = 'shape:1' as ShapeId
      const shape2 = 'shape:2' as ShapeId
      const shape3 = 'shape:3' as ShapeId

      grid.insert(shape1, { x: 100, y: 100, width: 50, height: 50 })
      grid.insert(shape2, { x: 300, y: 300, width: 50, height: 50 })
      grid.insert(shape3, { x: 1000, y: 1000, width: 50, height: 50 })

      const result = grid.query({ x: 0, y: 0, width: 400, height: 400 })
      expect(result).toContain(shape1)
      expect(result).toContain(shape2)
      expect(result).not.toContain(shape3)
    })

    it('should not return duplicates for shapes spanning multiple cells', () => {
      const shapeId = 'shape:1' as ShapeId
      // Large shape spanning multiple cells (grid size is 200)
      grid.insert(shapeId, { x: 100, y: 100, width: 500, height: 500 })

      const result = grid.query({ x: 0, y: 0, width: 800, height: 800 })
      const count = result.filter((id) => id === shapeId).length
      expect(count).toBe(1)
    })
  })

  describe('negative coordinates', () => {
    it('should handle negative coordinates', () => {
      const shapeId = 'shape:1' as ShapeId
      grid.insert(shapeId, { x: -100, y: -100, width: 50, height: 50 })

      const result = grid.queryPoint(Point.create(-75, -75))
      expect(result).toContain(shapeId)
    })
  })
})
