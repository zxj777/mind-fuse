# 前端避免强制同步布局与 Layout Thrashing

> 适用于理解浏览器渲染管线、性能瓶颈，以及日常前端开发中的布局优化问题。

---

## 目录

- [什么是强制同步布局](#什么是强制同步布局)
- [为什么修改样式后不要立刻读取布局](#为什么修改样式后不要立刻读取布局)
- [这样做到底有什么影响](#这样做到底有什么影响)
- [什么是 Layout Thrashing](#什么是-layout-thrashing)
- [典型坏例子](#典型坏例子)
- [推荐优化方式](#推荐优化方式)
- [常见会触发读取布局的 API](#常见会触发读取布局的-api)
- [常见会让布局变脏的写操作](#常见会让布局变脏的写操作)
- [React 中的常见场景](#react-中的常见场景)
- [如何用 DevTools 排查](#如何用-devtools-排查)
- [性能优化实践清单](#性能优化实践清单)

---

## 什么是强制同步布局

浏览器渲染页面时，通常会尽量把一批 DOM 和样式变更合并起来，再统一执行后续计算流程，而不是每改一次就立刻重算一次。

一个简化后的流程可以理解为：

1. JavaScript 修改 DOM / class / style
2. 浏览器把相关节点标记为“脏”
3. 在合适的时机统一进行：
   - 样式计算（Recalculate Style）
   - 布局计算（Layout / Reflow）
   - 绘制（Paint）
   - 合成（Composite）

所谓**强制同步布局**，就是浏览器本来想“稍后再统一计算”，但因为 JavaScript 代码立刻去读取某些几何信息，浏览器只能马上停下手头的事情，先同步把布局结果算出来。

这类现象也常被称为：

- forced reflow
- forced layout
- synchronous layout

---

## 为什么修改样式后不要立刻读取布局

因为这通常会打断浏览器原本的批处理优化。

例如：

```js
el.style.width = '200px'
const width = el.offsetWidth
```

这里先发生了一次“写”：

```js
el.style.width = '200px'
```

浏览器会认为布局可能已经失效，但它不一定马上重算。

紧接着又发生了一次“读”：

```js
el.offsetWidth
```

而 `offsetWidth` 需要的是**此刻准确的最终几何结果**。于是浏览器不能再拖延，只能立刻同步执行样式计算和布局计算，把最新结果算出来再返回。

所以重点不是“读布局本身有问题”，而是：

**在导致布局失效的写操作之后，立刻做依赖几何结果的读取，会迫使浏览器立即刷新布局。**

---

## 这样做到底有什么影响

### 1. 阻塞主线程

布局计算通常发生在主线程上。JavaScript 执行到读取布局的那一刻，会被迫等待浏览器把布局算完。

这意味着：

- 当前 JS 逻辑会被卡住
- 用户输入、滚动、动画也可能被拖慢

### 2. 可能牵连更大范围

布局不是只算当前元素自己。

一个元素的尺寸变化，可能影响：

- 父元素尺寸
- 兄弟元素位置
- 换行结果
- 滚动区域
- 整个子树的排版

因此一次看似简单的读取，背后可能触发的是一个较大范围的布局计算。

### 3. 容易超出一帧预算

浏览器如果要保持 60fps，每一帧大约只有 `16.7ms` 的预算。

如果 JavaScript、样式计算、布局、绘制加起来超时，就容易出现：

- 滚动卡顿
- 动画掉帧
- 拖拽不跟手
- 交互延迟

### 4. 会造成重复劳动

本来浏览器可以把多次 DOM 更新合并成一次布局计算。

如果你在中间不断插入“立刻读布局”的操作，就会把原本一次性的工作拆成多次重复计算，浪费性能。

---

## 什么是 Layout Thrashing

`layout thrashing` 的本质是：

**在同一个任务或同一帧内，反复执行“写布局相关属性 -> 立刻读取布局 -> 再写 -> 再读”的模式，导致浏览器反复被迫同步布局。**

可以把它理解为：

- 正常情况：`写写写 -> 浏览器统一算一次`
- Thrashing：`写 -> 算 -> 写 -> 算 -> 写 -> 算`

后者会让布局系统不断“被拍醒”。

---

## 典型坏例子

### 例 1：循环里写后立刻读

```js
for (const el of items) {
  el.style.width = '200px'
  console.log(el.offsetWidth)
}
```

每次循环都可能触发：

1. 修改样式，布局变脏
2. 读取 `offsetWidth`
3. 浏览器强制同步布局

如果 `items` 很多，性能开销会迅速变大。

### 例 2：交错读写

```js
for (const el of items) {
  el.style.height = `${someValue}px`
  const rect = el.getBoundingClientRect()

  if (rect.width > 300) {
    el.style.color = 'red'
  }
}
```

这里的问题不只是读一次，而是把读写交错在一起，导致浏览器很难合并优化。

---

## 推荐优化方式

核心原则是：**读写分离，批量处理。**

### 先统一读，再统一写

```js
const rects = items.map(el => el.getBoundingClientRect())

items.forEach((el, i) => {
  el.style.height = `${someValue}px`

  if (rects[i].width > 300) {
    el.style.color = 'red'
  }
})
```

这样浏览器更容易把读取阶段和写入阶段分别优化。

### 批量改 class / style

不要零碎地改多个样式并穿插测量，尽量：

- 先收集状态
- 再统一设置 class
- 或统一提交样式变更

### 动画优先使用 `transform` 和 `opacity`

相比改这些属性：

- `width`
- `height`
- `top`
- `left`

通常更推荐动画这些属性：

- `transform`
- `opacity`

因为后者往往不需要重新布局，代价更低。

### 把视觉更新放进 `requestAnimationFrame`

适合把一批视觉相关更新放到同一帧里执行，减少无序的中间状态。

### 缓存测量结果

如果尺寸或位置不是每次都变，不要每次都重新测。

可以：

- 缓存上一次结果
- 在明确失效时再更新
- 用观察器而不是轮询

---

## 常见会触发读取布局的 API

以下 API 往往容易触发样式计算或布局计算，尤其是在前面刚做过写操作时：

- `offsetWidth`
- `offsetHeight`
- `offsetTop`
- `offsetLeft`
- `clientWidth`
- `clientHeight`
- `scrollTop`
- `scrollLeft`
- `scrollHeight`
- `scrollWidth`
- `getBoundingClientRect()`
- `getComputedStyle()`

要注意的是：

- 不是所有读取都会触发布局
- 不是所有读取都同样昂贵
- 但几何信息、滚动信息、计算样式通常都值得重点警惕

---

## 常见会让布局变脏的写操作

以下操作通常会让浏览器认为布局结果可能已经失效：

- 修改元素尺寸，如 `width`、`height`
- 修改定位相关属性，如 `top`、`left`
- 修改字体、文本内容
- 增删 DOM 节点
- 增删 class
- 改变会影响文档流的样式

相对来说，下面这些属性通常更便宜：

- `transform`
- `opacity`

它们往往更接近合成层更新，不一定需要重新布局。

---

## React 中的常见场景

React 不会消灭 forced layout。它只是帮你管理状态和渲染；一旦你的组件逻辑里包含“改 DOM / 改 class / 改 state 后马上测量布局”，同样会遇到 layout thrashing。

### 场景 1：在 `useLayoutEffect` 里既写又读

`useLayoutEffect` 会在 DOM 提交后、浏览器绘制前执行。它非常适合做同步测量，但也因此更容易把读写混在一起。

例如：

```tsx
useLayoutEffect(() => {
  elementRef.current!.style.width = `${nextWidth}px`
  const rect = elementRef.current!.getBoundingClientRect()
  setMeasuredWidth(rect.width)
}, [nextWidth])
```

这里的问题是：

1. 先写 DOM
2. 再立刻读布局
3. React 这次提交还没画出去，浏览器就被迫同步算布局

如果这个逻辑在很多组件里反复发生，开销会很明显。

更好的思路是：

- 能只读就只读
- 能只写就只写
- 把“测量”和“应用样式”拆开
- 优先从数据推导 UI，而不是先改 DOM 再回头测

### 场景 2：测量后立刻 `setState`，触发二次渲染

例如：

```tsx
useLayoutEffect(() => {
  const rect = elementRef.current!.getBoundingClientRect()
  setTooltipPosition({
    x: rect.left,
    y: rect.bottom,
  })
}, [open])
```

这类代码不一定是错的，很多浮层、tooltip、弹出菜单都需要测量后定位。

但要意识到它的代价通常是：

1. React 先渲染一次
2. `useLayoutEffect` 里读取布局
3. 调用 `setState`
4. React 立刻再渲染一次
5. 浏览器继续等待，直到这些同步工作都完成

如果组件层级深、依赖多，或者同一批浮层同时打开，就容易卡顿。

优化方向：

- 尽量减少测量后再 `setState` 的次数
- 把位置计算收敛到单个父层或定位系统里
- 能用 CSS 解决的定位优先用 CSS
- 对高频变化场景考虑缓存或节流

### 场景 3：在列表中给每个子项单独测量

例如：

```tsx
useLayoutEffect(() => {
  itemRefs.current.forEach((node) => {
    if (!node)
      return

    const rect = node.getBoundingClientRect()
    node.style.height = `${Math.max(rect.width, 40)}px`
  })
}, [items])
```

这里非常容易退化成：

- 遍历很多节点
- 每个节点都读一次
- 再写一次
- 下一个节点继续读写

这就是 React 版本的 layout thrashing。

更推荐：

- 先批量读取所有需要的数据
- 在内存里完成计算
- 再统一提交样式或状态

例如：

```tsx
useLayoutEffect(() => {
  const heights = itemRefs.current.map((node) => {
    if (!node)
      return null

    return Math.max(node.getBoundingClientRect().width, 40)
  })

  itemRefs.current.forEach((node, index) => {
    if (!node || heights[index] == null)
      return

    node.style.height = `${heights[index]}px`
  })
}, [items])
```

虽然仍然有布局读取，但至少避免了最坏的读写交错。

### 场景 4：把布局信息放进 state，导致高频重渲染

例如滚动、拖拽、缩放时不断做：

```tsx
const rect = node.getBoundingClientRect()
setRect(rect)
```

问题在于：

- 读取布局本身有成本
- `setState` 会触发 React 更新
- 更新后下一轮又继续测量

于是就形成“测量 -> 更新 -> 再测量”的高频闭环。

更好的做法通常是区分两类数据：

- **驱动渲染的数据**：真的需要进 React state
- **过程中的瞬时数据**：用 `ref` 保存，避免每次都触发重渲染

例如拖拽过程中的实时位移、临时矩形、指针位置，很多时候更适合存在 `ref` 或外部 store 里，而不是每一帧都塞进组件本地 state。

### 场景 5：错误依赖导致 effect 重复测量

例如：

```tsx
useLayoutEffect(() => {
  const rect = nodeRef.current!.getBoundingClientRect()
  setSize({ width: rect.width, height: rect.height })
}, [size])
```

这类依赖关系很危险：

1. effect 读取布局
2. `setSize`
3. state 变化
4. effect 再跑一次

如果没有做好比较和收敛，轻则重复渲染，重则形成更新循环。

更稳妥的方式是：

- 仅在真正影响尺寸的依赖变化时测量
- 更新 state 前先比较新旧值
- 对持续尺寸变化使用 `ResizeObserver`

### React 中的实用建议

#### 1. 不是所有测量都要放进 `useLayoutEffect`

如果不是必须“在绘制前同步拿到结果”，优先考虑：

- `useEffect`
- `ResizeObserver`
- `IntersectionObserver`

`useLayoutEffect` 的同步特性很强，但也更容易阻塞渲染。

#### 2. 尽量从数据推导布局，而不是从 DOM 反推状态

更推荐：

```tsx
const width = isExpanded ? 240 : 120
return <div style={{ width }} />
```

而不是：

```tsx
useLayoutEffect(() => {
  const width = ref.current!.offsetWidth
  setWidth(width)
})
```

前者是数据驱动，后者是“先渲染，再测量，再反推状态”，成本更高。

#### 3. 高频交互少用 React state 做逐帧布局同步

在拖拽、画布缩放、节点移动这类高频交互中，优先考虑：

- `ref`
- 外部 store
- `requestAnimationFrame`
- `transform`

目标是减少“每一帧都触发 React render + DOM 测量”的组合成本。

#### 4. 对必须测量的场景做收敛

像 tooltip、popover、虚拟列表、自动尺寸容器，确实经常离不开测量。这时重点不是“完全不用测量”，而是：

- 集中测量入口
- 缓存结果
- 避免重复测量
- 避免在列表里逐项交错读写
- 测量后只有在值真的变化时再更新 state

---

## 如何用 DevTools 排查

理解概念之后，更重要的是能在真实页面里把问题抓出来。对于 forced layout 和 layout thrashing，最常用的还是 Chrome DevTools 的 Performance 面板。

### 1. 先用 Performance 录一段真实交互

推荐录制这些最容易暴露问题的操作：

- 页面初次打开
- 列表展开 / 收起
- Tooltip / Popover 打开
- 拖拽
- 滚动
- 缩放
- 输入联想或动态布局变化

步骤通常是：

1. 打开 DevTools
2. 进入 `Performance`
3. 点击录制
4. 执行一次可复现卡顿的交互
5. 停止录制

不要只录空闲页面，尽量录“用户真的感觉卡”的那段操作。

### 2. 先看 Main 线程有没有长任务

进入录制结果后，优先看 `Main` 线程。

如果某一段时间里主线程被长时间占满，并且其中出现了：

- `Recalculate Style`
- `Layout`
- `Paint`

就说明这段交互里确实有渲染成本。

如果 `Layout` 很频繁，或者一个交互里出现很多小块连续的 `Layout`，就要怀疑是 forced layout 或 layout thrashing。

### 3. 看 `Layout` 前面是谁在触发它

定位问题最关键的，不是只看到 `Layout`，而是看：

**到底是哪段 JavaScript 让浏览器不得不在这里同步布局。**

一般排查方法是：

1. 在 Performance 时间轴里点开某个 `Layout`
2. 看它前后的调用栈和事件
3. 找到对应的 JS 函数、事件处理器或组件逻辑

你通常会看到类似链路：

- click / pointermove / scroll 回调
- 某个 React commit
- 某段 effect 或事件函数
- 然后出现 `Recalculate Style` / `Layout`

如果布局事件紧跟在一段读取 `getBoundingClientRect()`、`offsetWidth`、`scrollHeight` 的代码之后，基本就能确认方向了。

### 4. 识别“很多次小 layout”还是“一次大 layout”

这两种问题处理思路不一样。

#### 一次大 layout

特点：

- 单次 `Layout` 很重
- 往往说明影响范围很大

常见原因：

- DOM 树太大
- 一次改动影响整个页面流式布局
- 大量节点同时参与重排

优化方向：

- 缩小更新范围
- 用 `contain`
- 虚拟列表
- 减少深层联动布局

#### 很多次小 layout

特点：

- 每次 `Layout` 不一定大
- 但一帧里重复很多次

这更像典型的 layout thrashing，常见原因是：

- 循环中交错读写
- `useLayoutEffect` 中反复测量
- 多个组件各自独立测量并立刻更新

优化方向：

- 读写分离
- 批量测量
- 合并更新
- 减少 effect 中的同步测量次数

### 5. 在 React 页面里重点看 commit 后发生了什么

React 页面里，很多 forced layout 都发生在这些时机：

- render 后
- commit 后
- `useLayoutEffect` 期间
- 事件处理器调用 `setState` 之后

排查时可以重点问自己：

- 这次 React 更新后，谁在测量 DOM？
- 测量之后是不是立刻又 `setState` 了？
- 是不是多个组件都在各自测量相似信息？
- 有没有在列表里对子节点逐个 `getBoundingClientRect()`？

如果看到“React commit -> layout effect -> layout -> second render”这种链条，就很值得重点检查。

### 6. 用 React DevTools 配合看重渲染

如果你怀疑问题不只是布局本身，还包括 React 重渲染过多，可以结合 React DevTools。

重点不是只看“哪个组件渲染了”，而是看：

- 哪些组件频繁重渲染
- 这些重渲染后是否伴随 DOM 测量
- 有没有“测量 -> setState -> 再渲染 -> 再测量”的闭环

也就是说：

- `Performance` 负责看浏览器层面的 `Layout`
- React DevTools 负责看组件层面的 re-render

两者结合起来，最容易定位根因。

### 7. 用代码搜索快速验证怀疑点

当你从性能录制里怀疑某个页面有强制同步布局时，可以快速在代码里搜这些关键字：

- `getBoundingClientRect`
- `offsetWidth`
- `offsetHeight`
- `scrollHeight`
- `scrollWidth`
- `getComputedStyle`
- `useLayoutEffect`

如果这些调用又出现在：

- 列表循环里
- 拖拽 / 滚动 / resize 回调里
- 测量后立刻 `setState` 的逻辑里

那通常就是优先排查对象。

### 8. 关注“用户体感最差”的交互

不是所有 forced layout 都值得优先优化。

更应该优先处理的是这些地方：

- 拖拽不跟手
- 滚动卡顿
- 展开动画掉帧
- 输入时延迟
- 浮层打开明显顿一下

因为这些问题最直接影响用户感受。

### 一个实用排查顺序

可以按下面这个顺序来：

1. 先复现卡顿交互
2. 用 `Performance` 录制
3. 看 `Main` 线程是否有频繁 `Layout`
4. 点开 `Layout` 找前面的 JS 调用链
5. 回代码里搜相关测量 API 和 `useLayoutEffect`
6. 判断是“一次大 layout”还是“多次小 layout”
7. 采用对应优化策略：缩范围，或消除读写交错

---

## 性能优化实践清单

### 1. 避免读写交错

不要：

```js
write()
read()
write()
read()
```

更推荐：

```js
read()
read()
read()
write()
write()
write()
```

### 2. 优先批量更新 DOM

把多个样式改动合并处理，而不是细碎地逐个穿插执行。

### 3. 动画避免直接改布局属性

优先用：

- `transform`
- `opacity`

### 4. 降低影响范围

减少不必要的 DOM 深度和联动范围。大型列表可考虑虚拟列表；复杂区域可考虑 `contain` 等隔离手段。

### 5. 用观察器替代频繁主动测量

例如：

- `ResizeObserver`
- `IntersectionObserver`

它们通常比你手动高频读取尺寸/位置更合理。

### 6. 用 Performance 面板定位问题

在浏览器 DevTools 的 Performance 面板中，如果看到：

- `Recalculate Style`
- `Layout`

紧跟在某段 JavaScript 后频繁出现，就要怀疑是否存在 forced layout 或 layout thrashing。

---

## 一句话总结

**Layout thrashing 不是“读取布局”本身导致的问题，而是“在让布局失效的写操作之后，又频繁、交错地强制读取布局结果”导致浏览器重复同步计算。**

优化的核心就是：

**少读布局，避免读写交错，批量更新，优先使用更便宜的渲染属性。**
