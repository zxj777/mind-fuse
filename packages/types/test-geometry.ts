/**
 * Manual verification of geometry calculations
 *
 * This file is for manual testing and verification.
 * Run with: npx ts-node test-geometry.ts
 */

import { Box, Point } from './src/geometry'
import { getShapeAABB, getRotatedCorners, isPointInShape, getShapeCenter } from './src/shapes'
import type { RectShape } from './src/shapes'

console.log('=== Geometry Calculation Verification ===\n')

// Test 1: Non-rotated rectangle
console.log('Test 1: Non-rotated rectangle (100x50 at 100,100)')
const rect1: RectShape = {
  id: 'test:1' as any,
  type: 'rect',
  x: 100,
  y: 100,
  rotation: 0,
  index: 'a0',
  isLocked: false,
  props: {
    width: 100,
    height: 50,
    fill: '#000',
    stroke: '#000',
    strokeWidth: 1,
  }
}

const aabb1 = getShapeAABB(rect1)
console.log('AABB:', aabb1)
console.log('Expected: { x: 100, y: 100, width: 100, height: 50 }')
console.log('✓ Correct:', aabb1.x === 100 && aabb1.y === 100 && aabb1.width === 100 && aabb1.height === 50)

const center1 = getShapeCenter(rect1)
console.log('Center:', center1)
console.log('Expected: { x: 150, y: 125 }')
console.log('✓ Correct:', center1.x === 150 && center1.y === 125)

const corners1 = getRotatedCorners(rect1)
console.log('Corners:', corners1)
console.log('Expected: [(100,100), (200,100), (200,150), (100,150)]')

// Test point inside
const pointInside = Point.create(150, 125)
const isInside = isPointInShape(pointInside, rect1)
console.log('Point (150, 125) is inside:', isInside)
console.log('✓ Correct:', isInside === true)

// Test point outside
const pointOutside = Point.create(300, 300)
const isOutside = isPointInShape(pointOutside, rect1)
console.log('Point (300, 300) is inside:', isOutside)
console.log('✓ Correct:', isOutside === false)

console.log('\n---\n')

// Test 2: Rotated rectangle (45 degrees)
console.log('Test 2: Rotated rectangle (100x50 at 100,100, rotated 45°)')
const rect2: RectShape = {
  ...rect1,
  id: 'test:2' as any,
  rotation: Math.PI / 4, // 45 degrees
}

const aabb2 = getShapeAABB(rect2)
console.log('AABB:', aabb2)
// For a 100×50 rectangle rotated 45°:
// Diagonal corners from center: (±50, ±25) rotated by 45°
// Expected AABB width/height ≈ sqrt(50² + 25²) * 2 ≈ 111.8
const expectedWidth = Math.sqrt(50 * 50 + 25 * 25) * 2
console.log('Expected width ≈', expectedWidth.toFixed(2))
console.log('Actual width:', aabb2.width.toFixed(2))
console.log('✓ Width correct:', Math.abs(aabb2.width - expectedWidth) < 0.01)

const center2 = getShapeCenter(rect2)
console.log('Center:', center2)
console.log('Expected: { x: 150, y: 125 } (same as non-rotated)')
console.log('✓ Correct:', center2.x === 150 && center2.y === 125)

const corners2 = getRotatedCorners(rect2)
console.log('Corners (rotated 45°):', corners2)

// Test point at center (should be inside)
const centerPoint = Point.create(150, 125)
const isCenterInside = isPointInShape(centerPoint, rect2)
console.log('Point at center (150, 125) is inside:', isCenterInside)
console.log('✓ Correct:', isCenterInside === true)

// Test point at original corner (should be outside due to rotation)
const cornerPoint = Point.create(100, 100)
const isCornerInside = isPointInShape(cornerPoint, rect2)
console.log('Point at original corner (100, 100) is inside:', isCornerInside)
console.log('Expected: false (corner is outside when rotated)')

console.log('\n---\n')

// Test 3: Box.fromPoints
console.log('Test 3: Box.fromPoints with rotated corners')
const points = [
  Point.create(100, 150),
  Point.create(150, 100),
  Point.create(200, 150),
  Point.create(150, 200),
]
const boxFromPoints = Box.fromPoints(points)
console.log('Box from points:', boxFromPoints)
console.log('Expected: { x: 100, y: 100, width: 100, height: 100 }')
console.log('✓ Correct:',
  boxFromPoints.x === 100 &&
  boxFromPoints.y === 100 &&
  boxFromPoints.width === 100 &&
  boxFromPoints.height === 100
)

console.log('\n---\n')

// Test 4: Box intersection
console.log('Test 4: Box intersection')
const box1 = Box.create(0, 0, 100, 100)
const box2 = Box.create(50, 50, 100, 100)
const box3 = Box.create(200, 200, 100, 100)

const intersects12 = Box.intersects(box1, box2)
const intersects13 = Box.intersects(box1, box3)

console.log('Box1 (0,0,100,100) intersects Box2 (50,50,100,100):', intersects12)
console.log('✓ Correct:', intersects12 === true)

console.log('Box1 (0,0,100,100) intersects Box3 (200,200,100,100):', intersects13)
console.log('✓ Correct:', intersects13 === false)

console.log('\n=== All Tests Complete ===')
