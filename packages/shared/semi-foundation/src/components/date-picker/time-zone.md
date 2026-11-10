# DatePicker 与 TimePicker 的时区

时区换算都在 foundation 里完成，React、Vue、Solid、Svelte 四个框架包行为相同。边界函数在 `utils/zoned-time.ts`，DatePicker 和 TimePicker 共用。

## 约定

目标时区依次取 `timeZone` prop、ConfigProvider 的 `timeZone`、全局默认值。三者都没有时不做任何换算，进出都是系统时区的普通 `Date`。

设置了目标时区时，使用方只需记住一条：**`Date` 和时间戳是时刻，字符串是目标时区的钟点。**

| 位置                                                                                                                                         | 规则                                                   |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `value`、`defaultValue`、`presets`、`defaultPickerValue` 里的 `Date`、时间戳                                                                 | 时刻，显示为它在目标时区的钟点                         |
| 上面这些位置的字符串                                                                                                                         | 按 `format` 解析为目标时区的钟点，与运行环境的时区无关 |
| 输入框里键入的文字                                                                                                                           | 同字符串                                               |
| 交给使用方的日期：`onChange`、`onConfirm`、`onCancel`、`onPanelChange` 的日期，`disabledDate`、`disabledTime` 的参数，自定义触发器的 `value` | `TZDate`                                               |
| `dateString`（TimePicker 为 `onChange` 的第二个参数）                                                                                        | 目标时区的钟点，等于输入框文字，可原样传回 `value`     |
| 今天的标记、默认面板月份、空输入回落的今天、嵌入输入框自动补的时间                                                                           | 按目标时区取当前时间                                   |

`TZDate` 来自 `@date-fns/tz`，是 `Date` 的子类：`getTime()` 是时刻，可以直接传给后端；`getDay()`、`getHours()` 等 getter 和 date-fns 的 `format`、`startOfDay` 按目标时区计算；`toISOString()` 带偏移，例如 `2023-03-29T10:00:00.000+09:00`。

例如系统时区为 UTC+8、`timeZone` 为 `'Asia/Tokyo'`、`type="dateTime"`：

- 传 `value={new Date('2023-03-29T01:00:00Z')}` 或 `value="2023-03-29 10:00:00"`，输入框都显示 2023-03-29 10:00:00。
- 在面板上选 2023-03-29 10:00:00，`onChange` 收到的 `date.toISOString()` 是 `2023-03-29T10:00:00.000+09:00`，`date.getTime()` 等于 `Date.parse('2023-03-29T01:00:00Z')`，`dateString` 是 `'2023-03-29 10:00:00'`。
- 日历里周日那格调用 `disabledDate` 时，参数的 `getDay()` 是 `0`。

## 内部表示

组件内部的 `state.value` 存墙上时间：用系统时区的 `Date` 表示目标时区的钟点，所以面板可以直接用 `new Date(y, m, d)` 和 date-fns 计算，不必考虑时区。只有 `zoned-time.ts` 的三个函数跨越边界：

- `toWallTime(时刻, timeZone)`：时刻 -> 墙上时间，用于 `value` 等输入和当前时间。
- `fromWallTime(墙上时间, timeZone)`：墙上时间 -> `TZDate`，用于交给使用方的日期。
- `parseReference(timeZone)`：解析字符串时的参照日期。参照日期是 `TZDate` 时，date-fns 把文字读作该时区的钟点，返回的 `TZDate` 再经 `toWallTime` 存入。

`dateString` 直接格式化 `TZDate`，得到的就是目标时区的钟点。

## 切换时区

- 非受控：`state.value` 先用旧时区换回时刻，再换成新时区的墙上时间。时刻不变，显示随时区变化。例如在 `timeZone` 为 `0` 时选了 10:00，切换到 `1` 后输入框显示 11:00。
- 受控：从 `value` 重新读取。`Date` 值的时刻不变；字符串值的钟点不变，因为它表示的是当前时区的钟点。

切换时区不触发 `onChange`。

## `timeZone` 的取值

- IANA 名称（如 `'America/New_York'`）：按该时区的规则换算，包括夏令时。
- 数字（小时，如 `8`、`-3.5`）或 `GMT±HH:MM` 字符串：按固定 UTC 偏移换算，没有夏令时，格式 token `z` 显示偏移。

## 夏令时

- 目标时区里重复的钟点取较早的时刻；目标时区跳过的钟点向后移一个间隔（02:30 变成 03:30），输入框不接受这类钟点。
- 系统时区跳过、目标时区有效的钟点，`utcToZonedTime` 返回 `TZDate`，getter 读到的是目标时区的钟点。这类钟点与一小时后的钟点 `getTime` 相同，面板时间列表里选不到，只能输入。已知限制见 `docs/decisions.md` 的 DatePicker 章节，升级条件是内部表示整体改为目标时区的 `TZDate`。

## 服务端渲染

设置了目标时区时，服务端 HTML 里输入框的文字与运行环境的时区无关：`Date` 值和字符串值都换算成目标时区的钟点，服务端与浏览器输出一致。今天的标记只在 hydration 之后计算。没设置目标时区时，服务端与浏览器的时区不同会让日期文字不一致。

已知限制：服务端 Node 与浏览器的时区数据库版本不同时，刚改过规则的时区两边算出的偏移可能不同（升级条件：出现实际偏差时，由服务端把偏移随页面下发）。

## 换算函数

`utils/date-fns-extra.ts` 导出的两个函数也可以在业务代码里用。

墙上时间 -> 时刻：给定一个墙上时间和它所在的时区，返回对应的时刻。

```javascript
import { zonedTimeToUtc } from '@fibrae/semi-foundation/utils/date-fns-extra';

const utcDate = zonedTimeToUtc(new Date(2014, 5, 25, 10), 'America/Los_Angeles'); // 6 月洛杉矶的 10 时是 UTC 17 时

postToServer(utcDate.toISOString()); // 2014-06-25T17:00:00.000Z
```

时刻 -> 墙上时间：给定一个时刻和目标时区，返回该时刻在目标时区的墙上时间，用系统时区的 `Date` 表示。

```javascript
import { utcToZonedTime } from '@fibrae/semi-foundation/utils/date-fns-extra';

const date = utcToZonedTime('2014-06-25T10:00:00.000Z', 'America/New_York'); // 6 月 UTC 10 时是纽约 6 时（-04:00）

format(date, 'yyyy-MM-dd HH:mm'); // 2014-06-25 06:00
```

组件回调已经给出 `TZDate`，业务代码一般不需要再调这两个函数。
