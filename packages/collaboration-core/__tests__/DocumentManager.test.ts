import { DocumentManager } from '../src/DocumentManager'
import { describe, it, expect, beforeEach } from 'vitest'
import { createRectShape, createLineShape, createShapeId, type ShapeId } from '@mind-fuse/types'
import * as Y from 'yjs'

describe('DocumentManager', () => {
  let ydoc: Y.Doc
  let dm: DocumentManager

  beforeEach(() => {
    ydoc = new Y.Doc()
    dm = new DocumentManager(ydoc)
  })

  describe('Constructor', () => {
    it('should initialize with empty maps', () => {
      expect(dm.getShapes().size).toBe(0)
      expect(dm.getComments().size).toBe(0)
      expect(dm.getBindings().size).toBe(0)
      expect(dm.getGroups().size).toBe(0)
    })

    it('should initialize Yjs maps correctly', () => {
      // Verify that Yjs maps are properly set up
      const shapesMap = ydoc.getMap('shapes')
      const commentsMap = ydoc.getMap('comments')
      const bindingsMap = ydoc.getMap('bindings')
      const groupsMap = ydoc.getMap('groups')

      expect(shapesMap.size).toBe(0)
      expect(commentsMap.size).toBe(0)
      expect(bindingsMap.size).toBe(0)
      expect(groupsMap.size).toBe(0)
    })
  })

  describe('addShape', () => {
    it('should add a rect shape to the document', () => {
      const shape = createRectShape({
        id: createShapeId('1'),
        x: 100,
        y: 200,
      })

      dm.addShape(shape)

      expect(dm.getShapes().size).toBe(1)
      expect(dm.getShape(shape.id)).toBe(shape)
    })

    it('should add a line shape to the document', () => {
      const shape = createLineShape({
        id: createShapeId('1'),
        x: 0,
        y: 0,
      })

      dm.addShape(shape)

      expect(dm.getShapes().size).toBe(1)
      expect(dm.getShape(shape.id)).toBe(shape)
    })

    it('should add multiple shapes', () => {
      const rect = createRectShape({ id: createShapeId('1'), x: 0, y: 0 })
      const line = createLineShape({ id: createShapeId('2'), x: 100, y: 100 })

      dm.addShape(rect)
      dm.addShape(line)

      expect(dm.getShapes().size).toBe(2)
      expect(dm.getShape(rect.id)).toBe(rect)
      expect(dm.getShape(line.id)).toBe(line)
    })

    it('should store shape in Yjs map', () => {
      const shape = createRectShape({ id: createShapeId('1'), x: 0, y: 0 })
      dm.addShape(shape)

      const shapesMap = ydoc.getMap('shapes')
      expect(shapesMap.size).toBe(1)
      expect(shapesMap.get('shape:1')).toBe(shape)
    })
  })

  describe('getShape', () => {
    it('should return a shape by id', () => {
      const shape = createRectShape({ id: createShapeId('1'), x: 50, y: 75 })
      dm.addShape(shape)

      const retrieved = dm.getShape(shape.id)
      expect(retrieved).toBe(shape)
      expect(retrieved?.x).toBe(50)
      expect(retrieved?.y).toBe(75)
    })

    it('should return undefined for non-existent shape', () => {
      const nonExistentId = createShapeId('999')
      expect(dm.getShape(nonExistentId)).toBeUndefined()
    })

    it('should return undefined after shape is removed', () => {
      const shape = createRectShape({ id: createShapeId('1'), x: 0, y: 0 })
      dm.addShape(shape)
      dm.removeShape(shape.id)

      expect(dm.getShape(shape.id)).toBeUndefined()
    })
  })

  describe('getShapes', () => {
    it('should return empty map for new document', () => {
      const shapes = dm.getShapes()
      expect(shapes.size).toBe(0)
    })

    it('should return all shapes', () => {
      const rect1 = createRectShape({ id: createShapeId('1'), x: 0, y: 0 })
      const rect2 = createRectShape({ id: createShapeId('2'), x: 100, y: 100 })
      const line = createLineShape({ id: createShapeId('3'), x: 200, y: 200 })

      dm.addShape(rect1)
      dm.addShape(rect2)
      dm.addShape(line)

      const shapes = dm.getShapes()
      expect(shapes.size).toBe(3)
      expect(shapes.get(rect1.id)).toBe(rect1)
      expect(shapes.get(rect2.id)).toBe(rect2)
      expect(shapes.get(line.id)).toBe(line)
    })

    it('should return readonly map', () => {
      const shapes = dm.getShapes()
      expect(shapes).toBeInstanceOf(Map)

      // Verify it's typed as ReadonlyMap in TypeScript
      // (this is compile-time check, but we can verify runtime behavior)
      const rect = createRectShape({ id: createShapeId('1'), x: 0, y: 0 })
      dm.addShape(rect)

      const shapesAfter = dm.getShapes()
      expect(shapesAfter.size).toBe(1)
    })

    it('should reflect updates when called multiple times', () => {
      expect(dm.getShapes().size).toBe(0)

      dm.addShape(createRectShape({ id: createShapeId('1'), x: 0, y: 0 }))
      expect(dm.getShapes().size).toBe(1)

      dm.addShape(createRectShape({ id: createShapeId('2'), x: 0, y: 0 }))
      expect(dm.getShapes().size).toBe(2)
    })
  })

  describe('removeShape', () => {
    it('should remove a shape from the document', () => {
      const shape = createRectShape({ id: createShapeId('1'), x: 0, y: 0 })
      dm.addShape(shape)
      expect(dm.getShapes().size).toBe(1)

      dm.removeShape(shape.id)
      expect(dm.getShapes().size).toBe(0)
      expect(dm.getShape(shape.id)).toBeUndefined()
    })

    it('should remove correct shape when multiple exist', () => {
      const rect1 = createRectShape({ id: createShapeId('1'), x: 0, y: 0 })
      const rect2 = createRectShape({ id: createShapeId('2'), x: 100, y: 100 })
      const rect3 = createRectShape({ id: createShapeId('3'), x: 200, y: 200 })

      dm.addShape(rect1)
      dm.addShape(rect2)
      dm.addShape(rect3)

      dm.removeShape(rect2.id)

      expect(dm.getShapes().size).toBe(2)
      expect(dm.getShape(rect1.id)).toBe(rect1)
      expect(dm.getShape(rect2.id)).toBeUndefined()
      expect(dm.getShape(rect3.id)).toBe(rect3)
    })

    it('should not throw when removing non-existent shape', () => {
      const nonExistentId = createShapeId('999')
      expect(() => dm.removeShape(nonExistentId)).not.toThrow()
      expect(dm.getShapes().size).toBe(0)
    })

    it('should remove shape from Yjs map', () => {
      const shape = createRectShape({ id: createShapeId('1'), x: 0, y: 0 })
      dm.addShape(shape)

      const shapesMap = ydoc.getMap('shapes')
      expect(shapesMap.size).toBe(1)

      dm.removeShape(shape.id)
      expect(shapesMap.size).toBe(0)
      expect(shapesMap.get('shape:1')).toBeUndefined()
    })
  })

  describe('updateShape', () => {
    it('should update shape properties', () => {
      const shape = createRectShape({
        id: createShapeId('1'),
        x: 100,
        y: 200,
      })
      dm.addShape(shape)

      const updatedShape = createRectShape({
        id: shape.id,
        x: 300,
        y: 400,
      })
      dm.updateShape(updatedShape)

      const retrieved = dm.getShape(shape.id)
      expect(retrieved?.x).toBe(300)
      expect(retrieved?.y).toBe(400)
    })

    it('should update shape position', () => {
      const shape = createRectShape({ id: createShapeId('1'), x: 0, y: 0 })
      dm.addShape(shape)

      const updated = { ...shape, x: 500, y: 600 }
      dm.updateShape(updated)

      const retrieved = dm.getShape(shape.id)
      expect(retrieved?.x).toBe(500)
      expect(retrieved?.y).toBe(600)
    })

    it('should update shape rotation', () => {
      const shape = createRectShape({ id: createShapeId('1'), x: 100, y: 100, rotation: 0 })
      dm.addShape(shape)

      const updated = { ...shape, rotation: Math.PI / 4 }
      dm.updateShape(updated)

      const retrieved = dm.getShape(shape.id)
      expect(retrieved?.rotation).toBe(Math.PI / 4)
    })

    it('should maintain shape count after update', () => {
      const shape = createRectShape({ id: createShapeId('1'), x: 0, y: 0 })
      dm.addShape(shape)
      expect(dm.getShapes().size).toBe(1)

      dm.updateShape({ ...shape, x: 100 })
      expect(dm.getShapes().size).toBe(1)
    })

    it('should update shape in Yjs map', () => {
      const shape = createRectShape({ id: createShapeId('1'), x: 100, y: 200 })
      dm.addShape(shape)

      const updated = { ...shape, x: 300, y: 400 }
      dm.updateShape(updated)

      const shapesMap = ydoc.getMap('shapes')
      const storedShape = shapesMap.get('shape:1')
      expect(storedShape?.x).toBe(300)
      expect(storedShape?.y).toBe(400)
    })
  })

  describe('ID type conversion (toYKey/fromYKey)', () => {
    it('should handle ShapeId to Yjs key conversion', () => {
      const shapeId = createShapeId('test-123')
      const shape = createRectShape({ id: shapeId, x: 0, y: 0 })

      dm.addShape(shape)

      // Verify we can retrieve using the ShapeId
      expect(dm.getShape(shapeId)).toBe(shape)

      // Verify Yjs map uses string key
      const shapesMap = ydoc.getMap('shapes')
      expect(shapesMap.get('shape:test-123')).toBe(shape)
    })

    it('should handle multiple shapes with different IDs', () => {
      const ids = ['alpha', 'beta', 'gamma'].map((suffix) => createShapeId(suffix))
      const shapes = ids.map((id) => createRectShape({ id, x: 0, y: 0 }))

      shapes.forEach((shape) => dm.addShape(shape))

      // Verify all shapes are retrievable
      shapes.forEach((shape, i) => {
        expect(dm.getShape(ids[i])).toBe(shape)
      })

      expect(dm.getShapes().size).toBe(3)
    })

    it('should maintain ID type safety through add-get cycle', () => {
      const id1 = createShapeId('1')
      const id2 = createShapeId('2')

      const shape1 = createRectShape({ id: id1, x: 100, y: 100 })
      const shape2 = createRectShape({ id: id2, x: 200, y: 200 })

      dm.addShape(shape1)
      dm.addShape(shape2)

      // Should retrieve correct shapes
      expect(dm.getShape(id1)).toBe(shape1)
      expect(dm.getShape(id2)).toBe(shape2)

      // Should not mix up IDs
      expect(dm.getShape(id1)).not.toBe(shape2)
      expect(dm.getShape(id2)).not.toBe(shape1)
    })

    it('should handle special characters in IDs', () => {
      const specialIds = [
        createShapeId('with-dashes'),
        createShapeId('with_underscores'),
        createShapeId('123-numeric'),
      ]

      specialIds.forEach((id, i) => {
        const shape = createRectShape({ id, x: i * 100, y: i * 100 })
        dm.addShape(shape)
        expect(dm.getShape(id)).toBe(shape)
      })

      expect(dm.getShapes().size).toBe(3)
    })
  })
})
