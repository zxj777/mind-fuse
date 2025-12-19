import { ShapeId } from "./ids"


export interface BaseShape<Type extends string, Props extends object> {
  id: ShapeId
  type: Type
  parentId: ShapeId | null
  index: string
  x: number
  y: number
  rotation: number
  isLocked: boolean
  props: Props
}

export interface LineShape extends BaseShape<'line', {
  endX: number
  endY: number
  stroke: string
  strokeWidth: number
}> {
}

export interface RectShape extends BaseShape<'rect', {
  width: number
  height: number
  fill: string
  stroke: string
  strokeWidth: number
}> {
}

export interface GroupShape extends BaseShape<'group', {

}> {

}

export type Shape = GroupShape | RectShape | LineShape
