# 输入事件、`requestAnimationFrame` 与拖拽性能：为什么“只记状态，不急着改 DOM”

> 适用于理解高频输入事件、拖拽跟手、布局抖动，以及为什么很多前端性能建议总在强调 `requestAnimationFrame`、`transform` 和“读写分离”。

---

## 目录

- [问题从哪里开始：高频输入事件](#问题从哪里开始高频输入事件)
- [为什么输入处理器要尽量短](#为什么输入处理器要尽量短)
- [为什么不要在输入事件里直接做大量 DOM 更新](#为什么不要在输入事件里直接做大量-dom-更新)
- [为什么把视觉更新放到 `requestAnimationFrame` 更合适](#为什么把视觉更新放到-requestanimationframe-更合适)
- [用拖拽来理解：错误流程 vs 正确流程](#用拖拽来理解错误流程-vs-正确流程)
- [浏览器已经有优化了，为什么还要我们自己处理](#浏览器已经有优化了为什么还要我们自己处理)
- [为什么拖拽里通常更推荐 `transform` 而不是 `left/top`](#为什么拖拽里通常更推荐-transform-而不是-lefttop)
- [为什么 `transform` 也不一定完全避免 `paint`](#为什么-transform-也不一定完全避免-paint)
- [为什么很多拖拽库都强调“读布局”和“写样式”分开](#为什么很多拖拽库都强调读布局和写样式分开)
- [一个更合理的拖拽代码骨架](#一个更合理的拖拽代码骨架)
- [实战检查清单](#实战检查清单)

---

## 问题从哪里开始：高频输入事件

浏览器里有一类事件天然就很“密”：

- `pointermove`
- `mousemove`
- `touchmove`
- `scroll`
- `wheel`

这些事件的共同点是：用户一旦持续操作，它们就会在很短时间内触发很多次。

如果每次事件到来时，主线程都要顺手做一整套 UI 工作，比如：

- 改 DOM 样式
- 读布局
- 触发框架状态更新
- 再引发样式计算、布局、绘制

那么高频输入很容易把一帧里的时间预算挤满。

在 60Hz 屏幕上，一帧大约只有 `16.7ms`。这段时间里，浏览器不只要跑你的 JavaScript，还要处理输入、样式、布局、绘制和合成。真正留给事件回调的时间，其实并不宽裕。

所以很多性能问题的起点，并不是某一行代码特别慢，而是：

> 高频事件里，每次都在做本可以合并的 UI 工作。

---

## 为什么输入处理器要尽量短

先说结论：

> 输入处理器的首要目标，不是“立刻把所有事情做完”，而是“不要阻塞交互”。

原因有三层。

### 1. 输入事件本身触发很频繁

比如拖拽时，鼠标或手指一连续移动，浏览器就会持续派发 `pointermove` / `touchmove`。如果每一次都认真做一整轮 UI 更新，这些工作会迅速叠加。

用户这 16ms 内可能产生了 4 次、6 次甚至更多输入，但屏幕最终这一帧通常只显示一个结果，也就是接近“最后那个最新状态”的结果。前面很多中间态，用户根本看不到。

也就是说，如果你对每次输入都立即做重活，常常是在花成本计算“看不见的中间结果”。

### 2. 主线程还要做别的事情

主线程不是专门为你的事件回调服务的。它还要负责：

- 执行其他 JS
- 样式计算
- 布局
- 绘制准备
- 响应其他交互

如果输入处理器过重，就会把这些工作往后挤。结果通常表现为：

- 滚动卡顿
- 拖拽不跟手
- hover 延迟
- 动画掉帧

### 3. 有些输入默认行为本来可以更顺畅

像滚动这类交互，浏览器有时可以让 compositor 更直接地参与处理。但如果主线程上的输入处理逻辑很重，浏览器就更容易被拖慢。即使你的代码没有显式阻止默认行为，过重的输入处理也会降低整体流畅度。

所以这条建议背后的本质是：

> 输入事件里最好只做轻量、必要、不可延后的工作。

---

## 为什么不要在输入事件里直接做大量 DOM 更新

因为“事件触发频率”通常高于“屏幕真正出帧的频率”。

假设用户正在拖拽一个卡片，在一个帧窗口里依次移动到了这些位置：

- `x = 101`
- `x = 104`
- `x = 108`
- `x = 112`

如果你每个 `pointermove` 都立刻更新 DOM，那么你就在一帧内可能做了 4 次视觉更新。但这一帧最终能显示出来的，通常只有接近 `112` 的那个结果。

前 3 次很多时候都是“中间态浪费”。

问题不是“改 DOM 一定错”，而是：

> 在高频输入里，每个事件都立刻驱动 UI，意味着主线程在很短时间内重复做很多本可合并的工作。

这就是为什么“顺手做一遍 UI 工作”很危险。它听起来像只是多改一次样式，实际可能意味着：

1. 执行事件回调
2. 更新 DOM / style / class
3. 让浏览器记录一批样式变化
4. 后续触发样式、布局、绘制相关成本

如果这种事在一帧里发生很多轮，主线程就容易被压满。

---

## 为什么把视觉更新放到 `requestAnimationFrame` 更合适

很多人会把这条建议理解成：

> `requestAnimationFrame` 更快。

这并不准确。更准确的说法是：

> `requestAnimationFrame` 更适合“做视觉更新”。

浏览器出一帧画面时，粗略可以理解为会经过：

1. 处理输入
2. 执行 JS
3. 样式计算
4. 布局
5. 绘制
6. 合成

`requestAnimationFrame` 的回调，正好发生在浏览器准备产出下一帧之前。也就是说，它天生就是一个“下一帧渲染前统一处理视觉更新”的时机。

### 它解决的不是“单次更新慢”，而是“更新太频繁”

高频输入场景里，更合理的模式通常是：

- 事件回调里只记录最新状态
- 到下一次 `requestAnimationFrame` 时，再统一根据最新状态更新 UI

这样带来两个关键收益。

### 收益 1：把多次输入合并成一帧一次更新

比如一帧内来了 5 次 `pointermove`，你并不需要更新 5 次 DOM。只需要：

- 记住最后一次坐标
- 在下一帧用这个最新值更新一次 UI

于是“5 次输入”就被压缩成了“1 次视觉更新”。

### 收益 2：让视觉更新和浏览器渲染节奏对齐

输入事件本来负责的是“告诉你最新状态”。比如：

- 鼠标现在在哪
- 手指现在在哪
- 滚动位置现在是多少

而渲染的职责是“把这个状态显示出来”。

把这两件事拆开后，主线程的工作模型会健康很多：

- 输入阶段：轻量记录状态
- 渲染阶段：按帧统一更新 UI

这其实就是一句话：

> 输入频率可以很高，但视觉更新频率最好和出帧频率对齐。

---

## 用拖拽来理解：错误流程 vs 正确流程

拖拽是最容易看懂这件事的例子。

### 错误流程：每次 `pointermove` 都立刻读写 DOM

```text
一帧开始
│
├─ pointermove #1
│  ├─ 写：更新卡片位置
│  ├─ 读：获取卡片 rect
│  └─ 写：更新占位元素
│
├─ pointermove #2
│  ├─ 写
│  ├─ 读
│  └─ 写
│
├─ pointermove #3
│  ├─ 写
│  ├─ 读
│  └─ 写
│
└─ 浏览器终于开始这一帧的 style/layout/paint/composite
```

问题有两个：

- 一帧内做了多轮视觉更新，但用户最终只看到最后那个结果
- 读写交错，容易触发强制同步布局

### 正确流程：事件里只记状态，`rAF` 里统一更新

```text
一帧开始
│
├─ pointermove #1
│  ├─ latestPoint = p1
│  └─ 安排一个 rAF
│
├─ pointermove #2
│  └─ latestPoint = p2
│
├─ pointermove #3
│  └─ latestPoint = p3
│
├─ requestAnimationFrame
│  ├─ 读：如有必要，先统一读取少量布局
│  ├─ 算：根据最新的 p3 计算最终位置
│  └─ 写：统一更新卡片、占位符、辅助线
│
└─ 浏览器渲染这一帧
```

这时虽然输入来了 3 次，但视觉更新只做了 1 次，而且直接基于“最新状态”。

所以拖拽的性能优化，第一步常常不是优化算法，而是先把时机调对：

> 高频输入只记录状态；真正的 UI 更新收敛到每帧一次。

---

## 浏览器已经有优化了，为什么还要我们自己处理

现代浏览器当然有优化，而且不少：

- 会尽量合并样式和布局计算
- 对 `transform` / `opacity` 这类属性，通常能走更便宜的渲染路径
- 某些输入事件会做 coalescing
- `passive` 监听器能改善一部分滚动场景

但浏览器不能替你“擅自改变 JavaScript 的同步语义”。

原因主要有三点。

### 1. 你的代码可能马上读取布局

如果你刚改完样式，下一行就写：

```js
element.getBoundingClientRect()
```

那么浏览器必须返回当前语义下的最新结果，不能偷偷说“我晚点再算”。

### 2. 你的代码可能依赖同步副作用

DOM 变化后，后面的逻辑、框架层、观察器、其他回调，都可能立刻依赖这个结果。浏览器不能随便把这些行为推迟到下一帧，否则程序语义就变了。

### 3. 不是所有更新都值得自动升格为异步渲染

浏览器可以做渲染层面的优化，但不能自动把“每个输入都同步改 DOM”的代码改写成“按帧合并更新 UI”。那已经不是优化，而是在替你重写交互模型了。

所以更准确的结论是：

> 浏览器会尽量帮你优化渲染成本，但不会替你重写高频交互代码的调度策略。

---

## 为什么拖拽里通常更推荐 `transform` 而不是 `left/top`

原因不是“`left/top` 一定慢”，而是：

> `transform` 往往更不容易牵连布局。

### 改 `left/top` 时通常发生了什么

如果元素参与定位布局，那么改 `left/top` 往往意味着它在布局系统里的几何位置发生了变化。浏览器更可能需要重新判断：

- 元素的新位置
- 周边元素关系
- 滚动区域
- 后续绘制内容

也就是说，`left/top` 更容易连到 layout。

### 改 `transform` 时通常发生了什么

`transform` 更像是在：

> 布局完成之后，再把已经准备好的内容做一次位移、旋转或缩放。

在很多场景下，它不改变元素在布局树里的基本几何关系，只改变最后的显示结果。所以它通常：

- 更容易避免 layout
- 更容易使用 compositor 相关优化
- 更适合连续高频更新

这就是为什么拖拽、平移、缩放、跟手动画，常常优先使用：

```js
element.style.transform = `translate(${x}px, ${y}px)`
```

---

## 为什么 `transform` 也不一定完全避免 `paint`

这是一个很容易被说得过于简单的地方。

很多经验总结会说：

> `transform` 和 `opacity` 只走 composite。

这不是完全错误，但它只是一个“经常成立的简化说法”，不是绝对规则。

更准确的说法是：

> `transform` 更有机会避开 layout，也更有机会只在 composite 阶段处理；但是否真的不需要 `paint`，要看图层、内容复杂度和浏览器策略。

### 情况 1：元素不一定已经在独立图层里

只有元素被浏览器单独提升成适合独立合成的 layer 时，后续的位移才最容易变成“只改合成参数”。

如果这个元素还和其他内容画在同一层里，那么移动它时，浏览器可能要重新处理相关区域的绘制内容，而不是单纯挪一张现成纹理。

### 情况 2：元素内容本身很复杂

即使你只改了 `transform`，如果元素带有这些效果：

- 大量文本
- 大图
- 阴影
- `filter`
- `backdrop-filter`
- `mask`
- `clip-path`

浏览器为了得到正确的视觉结果，仍可能需要重新 rasterize 或重绘相关内容。

### 情况 3：变换本身会改变像素采样方式

像 `scale()`、`rotate()`、3D transform 这类操作，不只是“平移一下位置”，它们还会改变内容如何映射到屏幕像素。浏览器有时可以复用已有结果，有时则需要重新准备更适合当前变换的绘制内容。

### 情况 4：周围区域也可能受到影响

元素从 A 挪到 B 时：

- A 位置原本被遮住的内容要重新显示
- B 位置现在又被新内容覆盖

这意味着就算主角是 `transform`，周围区域也未必完全没有更新成本。

所以最稳妥的理解是：

> `transform` 的优势主要在于更可能避开 layout，并把更多成本压到更便宜的阶段；但它不是“零成本属性”。

---

## 为什么很多拖拽库都强调“读布局”和“写样式”分开

因为最怕的是：**读写交错导致强制同步布局。**

### 什么是“写”

比如这些操作：

```js
card.style.transform = `translate(${x}px, ${y}px)`
card.classList.add('dragging')
card.style.width = '200px'
```

这些都属于“告诉浏览器，界面状态变了”。

### 什么是“读”

比如这些操作：

```js
card.getBoundingClientRect()
card.offsetWidth
container.scrollTop
```

这些都属于“向浏览器要当前准确几何结果”。

### 为什么读写交错会出问题

浏览器通常会尽量把写操作先记下来，等合适时机再统一算样式和布局。

但如果你刚写完，又立刻读布局，浏览器就会被迫说：

> 既然你现在就要最新几何值，那我只能马上把前面的变化全算出来。

于是它会被强制同步布局。

例如：

```js
card.style.transform = `translate(${x}px, ${y}px)` // 写
const rect = card.getBoundingClientRect() // 读
guide.style.transform = `translateX(${rect.left}px)` // 再写
```

这种“写 -> 读 -> 写”在高频拖拽里反复出现，就很容易让浏览器一遍遍被迫提前结算布局。

### 更好的顺序是什么

通常是一帧里这样组织：

1. 先统一读
2. 再做纯 JS 计算
3. 最后统一写

也就是：

```text
read -> compute -> write
```

很多成熟拖拽库都会尽量这么做：

- 拖拽开始时先缓存一批 `rect`
- 拖拽过程中尽量复用缓存
- 真正高频变化的视觉位置用 `transform`
- 需要重新测量时，也尽量集中读完再写

这不是代码风格问题，而是直接影响帧率和跟手感。

---

## 一个更合理的拖拽代码骨架

下面这段代码不是完整的拖拽实现，但它展示了更健康的结构：

```js
const dragState = {
  dragging: false,
  pointerId: null,

  latestPointerX: 0,
  latestPointerY: 0,

  startPointerX: 0,
  startPointerY: 0,

  startTranslateX: 0,
  startTranslateY: 0,

  nextTranslateX: 0,
  nextTranslateY: 0,

  scheduled: false,

  containerRect: null,
  itemRect: null,
}

function onPointerDown(e) {
  dragState.dragging = true
  dragState.pointerId = e.pointerId

  dragState.startPointerX = e.clientX
  dragState.startPointerY = e.clientY

  // 拖拽开始时尽量测量并缓存
  dragState.containerRect = container.getBoundingClientRect()
  dragState.itemRect = item.getBoundingClientRect()

  dragState.startTranslateX = dragState.nextTranslateX
  dragState.startTranslateY = dragState.nextTranslateY

  item.setPointerCapture(e.pointerId)
}

function onPointerMove(e) {
  if (!dragState.dragging || e.pointerId !== dragState.pointerId)
    return

  // 只更新状态，不急着写 DOM
  dragState.latestPointerX = e.clientX
  dragState.latestPointerY = e.clientY

  if (dragState.scheduled)
    return

  dragState.scheduled = true
  requestAnimationFrame(flushDragFrame)
}

function flushDragFrame() {
  dragState.scheduled = false

  if (!dragState.dragging)
    return

  // compute
  const deltaX = dragState.latestPointerX - dragState.startPointerX
  const deltaY = dragState.latestPointerY - dragState.startPointerY

  dragState.nextTranslateX = dragState.startTranslateX + deltaX
  dragState.nextTranslateY = dragState.startTranslateY + deltaY

  // write
  item.style.transform = `translate(${dragState.nextTranslateX}px, ${dragState.nextTranslateY}px)`
}

function onPointerUp(e) {
  if (!dragState.dragging || e.pointerId !== dragState.pointerId)
    return

  dragState.dragging = false
  dragState.pointerId = null

  item.releasePointerCapture(e.pointerId)
}
```

这段结构的重点是：

- `pointermove` 只记录最新状态
- 一帧只安排一次 `requestAnimationFrame`
- 拖拽开始时尽量缓存布局信息
- 高频更新优先使用 `transform`

如果场景更复杂，还可以把 `flushDragFrame()` 再细分成：

```text
read -> compute -> write
```

例如：

- `read`：必要时读取少量布局或滚动信息
- `compute`：计算吸附、排序、命中目标、自动滚动
- `write`：统一更新位移、辅助线、占位状态

---

## 实战检查清单

如果你在做拖拽、滚动联动、跟手吸附、画布操作，可以用下面这份清单快速自查：

### 输入处理器

- 是否在 `pointermove` / `scroll` / `wheel` 里做了太多事？
- 是否能把一部分工作延后到 `requestAnimationFrame`？
- 是否只是记录了“最新状态”，而不是每次输入都立刻更新 UI？

### DOM 更新

- 是否在高频输入中每次都直接改 DOM？
- 是否把多次输入合并成了“一帧一次写入”？
- 是否把真正昂贵的业务状态更新延后到拖拽结束再提交？

### 读取布局

- 是否存在“写完样式立刻读布局”的代码？
- 是否把 `getBoundingClientRect()`、`offsetWidth` 之类的读取放在了高频路径里？
- 是否能在拖拽开始时先缓存一批 `rect`？

### 更新属性

- 连续位移时是否优先用了 `transform`？
- 是否不必要地用了 `top/left/width/height` 做高频动画？
- 元素是否因为阴影、滤镜、大图等原因仍然很贵？

### 调度方式

- 是否把视觉更新放进了 `requestAnimationFrame`？
- 是否避免了一帧里反复“写 -> 读 -> 写 -> 读”？
- 是否尽量按照 `read -> compute -> write` 的顺序组织代码？

---

## 最后的总结

高频输入优化，核心其实不是某个 API，而是一种工作流：

1. 输入事件只负责收集最新状态
2. 视觉更新尽量放到 `requestAnimationFrame`
3. 高频位移优先使用 `transform`
4. 读布局和写样式尽量分开
5. 避免在高频路径里反复触发强制同步布局

如果要把这篇文章压缩成一句话，那就是：

> 拖拽、滚动和跟手交互想流畅，不要让每次输入都直接驱动一整轮 DOM 工作；让输入负责“记录状态”，让渲染在浏览器的帧节奏里统一发生。

---

## 延伸阅读

- `docs/FRONTEND_LAYOUT_THRASHING.md`
- `docs/FRONTEND_SCHEDULING_AND_TASK_SPLITTING.md`
