# 从 setTimeout 到 Web Worker：前端动画、调度与大任务拆分

前端里经常会听到一句话：

> 做动画不要用 `setTimeout`，要用 `requestAnimationFrame`。

这句话大家都知道，但很多时候只是停留在“经验结论”上。更进一步的问题是：

- 为什么 `setTimeout` 容易丢帧？
- 什么叫时间漂移？
- 把重任务拆到 `requestAnimationFrame` 里到底有没有用？
- React 里的 `startTransition`、`useDeferredValue` 又是在解决什么问题？
- 如果是几十万条数据搜索，到底该分片还是上 `Web Worker`？

这篇文章就把这些问题串起来讲清楚。

---

## 一、为什么 `setTimeout` 容易丢帧？

先说结论：

- `setTimeout` 是基于时间的调度
- `requestAnimationFrame` 是基于浏览器绘制时机的调度

这两者最大的区别在于：它们是否和浏览器的渲染节奏同步。

### `setTimeout` 的问题

很多人会这样写动画：

```js
setTimeout(fn, 16)
```

因为屏幕 60Hz 时，一帧大约是 `16.7ms`，所以看起来 `16ms` 好像刚好对应一帧。

但问题在于，`setTimeout(fn, 16)` 的真正含义并不是：

> 16ms 后准时执行

而是：

> 最早在 16ms 之后，把这个回调放进任务队列，等待主线程有空时再执行

这就意味着：

- 它和屏幕刷新并不同步
- 它不保证准时执行
- 主线程一忙，就会延后
- 延后还可能不断累计

于是动画就很容易出现：

- 忽快忽慢
- 掉帧
- 不连贯
- 多个动画不同步

---

## 二、什么是时间漂移？

时间漂移可以理解成：

> 你以为任务会每隔固定时间执行一次，但实际上每轮都会多出一点误差，最后这些误差会不断累积。

看一个例子：

```js
function loop() {
  update() // 假设执行耗时 8ms
  setTimeout(loop, 16)
}

loop()
```

如果理想情况是每 `16ms` 执行一次，那么时间线应该是：

- 0ms
- 16ms
- 32ms
- 48ms

但现实中，这段代码的执行往往更像这样：

- 0ms 开始执行
- `update()` 花了 8ms
- 然后才开始 `setTimeout(loop, 16)`

也就是说，下一次最早触发时间其实变成了：

- 8ms + 16ms = 24ms

于是后续时间线会变成：

- 0ms
- 24ms
- 48ms
- 72ms

你本来想跑 60fps，结果实际节奏已经被拖慢了。

如果中间主线程再被别的任务阻塞，比如本来应该在 48ms 执行的一轮，拖到 55ms 才有机会执行，那么后续偏差还会继续滚雪球。

这就是所谓的时间漂移。

---

## 三、为什么 `requestAnimationFrame` 更适合动画？

`requestAnimationFrame` 的设计目标和 `setTimeout` 完全不同。

它的语义不是“过多久执行”，而是：

> 浏览器下一次准备重绘之前，调用你

也就是说，它天然站在渲染流程里。

### 它的优势在于：

- 和屏幕刷新节奏同步
- 浏览器会在合适的绘制时机调用它
- 60Hz、120Hz 等不同刷新率都能自动适配
- 更容易和布局、样式计算、绘制配合起来

所以对动画来说，`requestAnimationFrame` 通常更平滑、更稳定。

不过这里也要强调一句：

> `requestAnimationFrame` 并不是“不会掉帧”，而是“更不容易因为调度方式而掉帧”。

如果你在 `requestAnimationFrame` 回调里做了特别重的计算，超过一帧预算，它照样会掉帧。

---

## 四、在 `requestAnimationFrame` 里拆成微任务，真的有用吗？

很多人会想到一个方案：

既然一帧里任务太重，那我能不能在 `requestAnimationFrame` 回调里，再把它拆成很多微任务，比如：

- `Promise.then(...)`
- `queueMicrotask(...)`

听起来像是在“切小任务”，但这里有一个关键事实：

> 微任务会在当前任务结束后、渲染前被清空。

而 `requestAnimationFrame` 回调本来就发生在浏览器准备绘制之前。

所以如果你在 `rAF` 里塞了很多微任务，浏览器通常还是会：

1. 执行 `rAF` 回调
2. 清空你塞进去的微任务
3. 然后才去绘制

这意味着：

**你并没有真正把时间让给渲染。**

换句话说：

> 把重任务拆成微任务塞进 `requestAnimationFrame`，通常并不能解决掉帧问题。

---

## 五、真正有效的做法：分帧执行

如果想避免长任务卡住主线程，真正有效的思路是：

> 不是把任务拆成微任务，而是把任务拆到多帧里执行。

示例代码如下：

```js
function workLoop() {
  const start = performance.now()

  while (hasMoreWork() && performance.now() - start < 4) {
    doOneSmallUnit()
  }

  if (hasMoreWork()) {
    requestAnimationFrame(workLoop)
  }
}

requestAnimationFrame(workLoop)
```

这段代码的关键不是 `requestAnimationFrame` 本身，而是它背后的策略：

- 每次只做一小段工作
- 给当前帧设置预算，比如 4ms
- 剩下的工作留到下一帧

这样主线程就不会被一次性占满，浏览器也更有机会去处理：

- 用户输入
- 滚动
- 动画
- 页面绘制

---

## 六、重任务到底该怎么拆？

所谓“拆任务”，不是简单粗暴地切成几段，而是要找到一种可以：

- 中断
- 恢复
- 继续推进

的执行方式。

一般来说，一个任务适合拆分，通常要满足三个条件：

### 1. 能找到天然的最小处理单元

比如：

- 一条数据
- 一个节点
- 一段文本
- 一个图形对象

### 2. 能记录进度

比如：

- 当前处理到第几个元素
- 当前游标位置
- 当前分页位置

### 3. 中断后能从进度继续

也就是下一帧可以接着上次的状态继续跑，而不是必须从头开始。

---

## 七、一个更真实的例子：大数据搜索

在 React 项目里，“主动一条条渲染 DOM”并不是最常见的重任务场景。

更常见的是：

- 大列表搜索
- 大列表过滤
- 排序
- 富文本预处理
- 大表单校验
- 图表数据转换

比如搜索 5 万条数据：

```js
const result = bigList.filter(item => match(item, keyword))
setResult(result)
```

这段代码的问题不是 React 渲染，而是：

> `filter` 这一整段同步计算会长时间占用主线程。

更合理的方式是把遍历拆成很多批：

```js
function chunkFilter(list, keyword, onProgress, onDone) {
  let index = 0
  const result = []

  function run() {
    const start = performance.now()

    while (index < list.length && performance.now() - start < 4) {
      const item = list[index]
      if (match(item, keyword))
        result.push(item)
      index++
    }

    onProgress(result, index)

    if (index < list.length) {
      requestAnimationFrame(run)
    } else {
      onDone(result)
    }
  }

  requestAnimationFrame(run)
}
```

它的拆分逻辑很简单：

- 最小单元：一条 `item`
- 进度：`index`
- 调度：下一帧继续

这种分帧执行，才是“拆重任务”的本质。

---

## 八、`requestIdleCallback` 是什么？

`requestIdleCallback` 可以理解成浏览器提供的一个“空闲时再做”的接口。

它的含义是：

> 主线程现在不忙的话，你再来执行这段任务。

它适合做一些不影响当前交互的非关键工作，比如：

- 日志上报
- 缓存预热
- 后台预计算
- 清理任务
- 非关键数据准备

但是它并不适合关键 UI 逻辑，因为：

- 浏览器不一定给你足够的空闲时间
- 空闲时机并不稳定
- 后台标签页更加不可控
- 兼容性也不如主流 API 稳定

所以它更像一个“捡空做事”的工具，而不是高可靠调度器。

---

## 九、`startTransition`：React 在解决什么问题？

前面一直在讲浏览器层面的任务调度。React 还提供了一套自己的并发调度 API，其中最常见的就是 `startTransition`。

它的作用可以概括成一句话：

> 把某次 state 更新标记为“非紧急”。

例如：

```jsx
const [text, setText] = useState('')
const [list, setList] = useState([])

function onChange(e) {
  const next = e.target.value
  setText(next)

  startTransition(() => {
    setList(expensiveFilter(data, next))
  })
}
```

这里发生了两件事：

- `setText(next)`：输入框内容必须立刻更新，这是高优先级
- `setList(...)`：结果列表可以晚一点更新，这是低优先级

这就让 React 在用户快速输入时，更倾向于优先保证输入流畅，而不是急着去渲染一份可能马上就过时的列表。

### 但要注意

`startTransition` 解决的是：

- React 更新优先级

它并不直接解决：

- 同步计算过重

也就是说，如果 `expensiveFilter(data, next)` 本身就要执行 50ms，那么调用这一行时，主线程还是会卡。

所以 `startTransition` 不是“性能魔法”，它只是让 React 知道：

> 这次更新没那么急，可以晚点，必要时可以打断。

---

## 十、`startTransition` 里的“晚点”到底是晚到什么时候？

这是很多人第一次接触 React 并发 API 时最容易误解的地方。

“晚点”不是指：

- 晚 50ms
- 晚 100ms
- 下一帧执行

它没有固定时间承诺。

更准确地说，它表示的是：

> 这是一项低优先级更新，等高优先级更新先完成，有机会时再处理。

所以如果用户正在快速输入：

- 输入框内容会始终保持最新
- 低优先级更新可能被推迟
- 旧的 transition 更新甚至可能被打断、跳过
- 最终 React 更可能只保留最新那次结果

比如输入：

- `a`
- `ab`
- `abc`

高优先级的输入更新会立刻发生，而低优先级的结果渲染，可能不会把 `a`、`ab` 都完整展示出来，而是直接跳到 `abc`。

这正是它保持交互流畅的关键。

---

## 十一、`useDeferredValue` 又是什么？

如果说 `startTransition` 是“把某次更新标成低优先级”，那么 `useDeferredValue` 更像是：

> 给某个值提供一个可以滞后的版本。

示例：

```jsx
const [query, setQuery] = useState('')
const deferredQuery = useDeferredValue(query)

const result = useMemo(() => {
  return expensiveFilter(data, deferredQuery)
}, [data, deferredQuery])
```

这里：

- `query` 会立刻更新
- `deferredQuery` 可以暂时保持旧值
- React 空下来后，再让它慢慢追上最新值

这就很适合这样的场景：

- 输入值变化很快
- 但依赖这个值的渲染特别重

比如：

- 搜索框
- 大表格筛选
- 图表联动
- 大列表过滤

### 如果频繁触发会怎样？

和 `startTransition` 一样，`useDeferredValue` 也不是每个中间状态都必须呈现。

如果变化过快：

- 原始值始终是最新的
- deferred 值可能落后
- 一些中间值会被跳过
- 最终尽量追到最新值

---

## 十二、这些 API 能代替防抖和节流吗？

答案是：

**不能。**

因为它们解决的根本不是同一个问题。

### 防抖 / 节流解决的是：

- 触发频率控制
- 调用次数控制
- 请求时机控制

例如：

- 减少接口请求次数
- 限制 `scroll` / `resize` 触发频率
- 控制埋点上报密度

### `startTransition` / `useDeferredValue` 解决的是：

- React 渲染优先级
- 用户交互流畅性
- 低优先级更新的可中断调度

所以从“稳定性”和“可预测性”来说：

> 如果你的目标是控制时间和频率，防抖 / 节流通常更稳定。

因为它们能明确地回答这些问题：

- 什么时候执行？
- 最久多久执行一次？
- 最后一次一定会不会执行？

而 React 并发 API 不承诺这些，它只负责“优先级”。

---

## 十三、一个实用决策表

很多时候，真正的问题不是“哪个 API 更高级”，而是：

> 我到底想解决什么问题？

可以用下面这个表快速判断：

| 场景 | 更合适的方案 |
| --- | --- |
| 减少接口请求次数 | `debounce` |
| 限制滚动 / resize 高频触发 | `throttle` |
| 输入框要立刻响应，但列表结果可以晚点更新 | `startTransition` |
| 某个值变化太快，而消费它的渲染很贵 | `useDeferredValue` |
| 纯 CPU 计算很重 | 分片执行 / `Web Worker` |
| 非关键空闲任务 | `requestIdleCallback` |

---

## 十四、如果是几十万条数据搜索，应该分片还是上 `Web Worker`？

这个问题基本可以直接给结论：

> 几十万条数据搜索，优先考虑 `Web Worker`。

### 为什么不是优先 `requestAnimationFrame` 分片？

因为分片虽然能减少单次长任务，但它有一个本质限制：

> 计算仍然在主线程上执行。

也就是说，你只是把“一次很卡”变成了“很多次小卡”。

对于几十万条数据这种量级，哪怕你分帧处理，主线程仍然需要频繁参与搜索逻辑，最终依然可能影响：

- 输入响应
- 滚动
- 动画
- 页面交互

### `Web Worker` 的意义

`Web Worker` 的优势不是“更快”，而是：

> 把重计算从主线程挪出去。

这样主线程就可以专注在：

- 用户输入
- 页面渲染
- 动画
- 交互反馈

对于大量数据搜索，这一点往往比单纯“分片”更关键。

---

## 十五、`Web Worker` 有开销吗？当然有

这是一个很重要的现实问题。

`Web Worker` 的成本主要来自：

- Worker 的创建成本
- 主线程与 Worker 的通信成本
- 数据传输的结构化克隆成本

尤其当你每次都把几十万条完整数据来回传输时，开销会很明显。

但即便如此，在很多大规模搜索场景里，它仍然是更优方案。原因很简单：

> 主线程卡顿的代价，通常比 Worker 的通信成本更难接受。

### 更合理的做法是：

- Worker 提前初始化，不要每次搜索都新建
- 数据尽量只初始化传一次
- 后续只传关键词、过滤条件等轻量参数
- 在 Worker 内部建立索引或缓存
- 主线程只接收结果摘要或 ID 列表

这样就能尽量把通信成本压低。

---

## 十六、最后总结

把整篇文章浓缩成几句话，大概就是：

### 1. 动画优先用 `requestAnimationFrame`

因为它和浏览器绘制时机同步，而 `setTimeout` 是时间驱动的，容易出现延迟和时间漂移。

### 2. 不要指望在 `rAF` 里塞微任务来避免掉帧

微任务通常仍然会在渲染前被清空，所以并不能真正让出绘制机会。

### 3. 真正有效的优化方式是“分帧执行”或“移出主线程”

如果任务可以拆分，就按帧预算切小；如果计算特别重，就考虑 `Web Worker`。

### 4. `startTransition` 和 `useDeferredValue` 解决的是 React 更新优先级问题

它们不是定时器，也不是防抖节流，更不是同步重计算的终极解法。

### 5. 防抖 / 节流解决的是频率控制

如果你关心“多久触发一次”“最后一次一定执行吗”，那它们通常更稳定、更可预测。

### 6. 几十万条数据搜索，优先考虑 `Web Worker`

因为这个量级下，主线程分片往往只是“分很多次卡”，而不是彻底摆脱卡顿。

---

## 结语

前端性能优化里，一个很常见的误区是：总想找一个“万能 API”解决所有卡顿问题。

但实际上，不同工具解决的是不同层面的问题：

- `requestAnimationFrame`：渲染时机
- `requestIdleCallback`：空闲时机
- `startTransition` / `useDeferredValue`：React 更新优先级
- `debounce` / `throttle`：触发频率控制
- `Web Worker`：主线程减压
- 分片执行：长任务拆解

真正有效的优化，往往不是迷信某个 API，而是先搞清楚：

> 你到底是在和谁对抗？

- 是在和浏览器绘制节奏对抗？
- 是在和主线程长任务对抗？
- 是在和 React 更新优先级对抗？
- 还是在和高频触发对抗？

问题看清楚了，工具自然就选对了。
