import { DocumentManager } from '../src/DocumentManager'
import { describe, it, expect, beforeEach } from 'vitest'
import * as Y from 'yjs'

describe('DocumentManager', () => {
  let dm: DocumentManager

  beforeEach(() => {
    dm = new DocumentManager(new Y.Doc())
  })

  describe('Constructor', () => {
    it('should initialize with empty maps', () => {
      expect(dm.getShapes().size).toBe(0)
      expect(dm.getComments().size).toBe(0)
      expect(dm.getBindings().size).toBe(0)
      expect(dm.getGroups().size).toBe(0)
    })
  })
})
