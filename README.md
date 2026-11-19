# AI 万岁山 / Wansuishan

一个可以走着逛的主题公园小游戏：玩家是一个小人，走进一座每个角落都在演出的园子，走到喜欢的地方就能停下来看。

A walkable theme-park toy. The player is a little avatar who wanders grounds where a show is always running in every corner, and can stop wherever something looks interesting.

这是一座**原创**园子，只借用「每天到处都在演」这个想法。与任何现实中的主题公园没有从属关系，不使用官方地图、商标或素材。

This is an original, unofficial scene inspired by that idea. It is not affiliated with any real theme park, and it does not use official maps, trademarks, or brand art.

## Run / 运行

在仓库根目录用 HTTP 提供文件。ES module 不能用 `file://` 打开。

From the repository root. ES modules do not run from a `file://` URL.

```bash
python3 -m http.server 8888 --bind 127.0.0.1
```

然后打开 `http://127.0.0.1:8888`。

Then open `http://127.0.0.1:8888`.

Three.js **0.160.0** 从 unpkg 的 import map 加载，不需要构建步骤。不要提交 token、API key 或 `.env`。演出全部是离线剧本，没有付费接口。

Three.js **0.160.0** loads from the unpkg import map. There is no build step. Do not commit tokens, API keys, or `.env`. Every show is an offline script. There is no paid API.

## Controls / 操作

默认中文，可用右上角按钮或 `L` 切换英文。语言记在 `localStorage`。

The UI defaults to Chinese. Switch with the corner button or `L`. The choice is stored in `localStorage`.

| 操作 | 键 |
| --- | --- |
| 移动 | `WASD` 或方向键，`Shift` 跑步 |
| 转向 | 按住鼠标拖动，或 `Q` / `R` |
| 观看 | 站进金色圈子，按 `E`。镜头会缓到看席 |
| 离开 | `E` 或 `Esc` |
| 节目单 | 点「前往」，或数字键 `1`–`7`。`M` 收起 |
| 帮助 | `H`，或第一次进入时的卡片。`Esc` 关掉 |
| 静音 | 顶栏按钮。自动化测试可调用 `__wansui.setMuted(true)` |

走近一场演出就能看见动作、听见较轻的声音；按 `E` 才进入观看镜头。不会把玩家锁死。

Walking close already shows the acting and a quieter mix. `E` eases into a designed seat. Leave is always available.

## Corners / 四个角

四场演出各自按绝对时间循环，玩家在别处时它们也在演。

Four shows loop on one shared clock, even when the player is elsewhere.

1. **广场闲谈 / Plaza Talk** — 西广场四人对话，一次只一个人说话。观众会点头、笑、鼓掌。
2. **灯与月 / Lamp and Moon** — 戏台双人短剧，关节人偶，座位上有观众。观看镜头在看席前方。
3. **路边杂耍 / Street Juggler** — 东市抛球，地上有帽子，围观的人跟着拍。镜头更近。
4. **花车巡游 / Lantern Parade** — 北路椭圆巡回，鼓手、旗、花旦和一辆花车。观看时是偏高的宽镜头，跟着队伍。
5. **说书 / Story Booth** — 西北棚，说书人坐在凳上，听众挨着坐。镜头贴近。
6. **皮影 / Shadow Play** — 西棚幕布上两个人影，讲幕人在前面说。
7. **把式 / Martial Ring** — 东南场两人过招，圈子外有人看。镜头把整个场子框进来。

园门旁有一块立体节目单（画布文字，使用已安装的 Noto Sans CJK），HUD 里有同一份列表和小地图。点列表或小地图可以过去。

A board by the gate and the HUD list the same schedule. The minimap can also teleport.

## Hook

`window.__wansui`：

- `getState()` — 位置、朝向、正在看的演出、语言、附近演出、fps
- `listShows()` — id、中英标题、种类、位置、此刻与下一档
- `goTo(id | {x, z})` — 传到演出看点或某个坐标，站在地上
- `watch(id, { snap })` / `leave()`
- `setLang('zh' | 'en')`
- `setMuted(true | false)`
- `advance(ms)` / `setTime(ms)` — 推动或设定演出时间
- `setQuality('auto' | 'low' | 'high')` / `dismissHelp()`

## Attribution / 来源

本仓库是 MIT。下面这些做法来自同一位作者的公开试验，只取了需要的结构，没有把别的项目整仓嵌进来，也没有拷贝 `node_modules` 或受版权保护的模型：

- [c-c-3-english-sim](https://github.com/ssttmkkw-hue/c-c-3-english-sim) — 行走、跟随镜头、键鼠、一人说话的场面调度、小地图和节目单的想法
- [c-c-5-ai-theater](https://github.com/ssttmkkw-hue/c-c-5-ai-theater) — 带关节的程序化小人、说话和反应姿势
- [c-c-6-live-theater](https://github.com/ssttmkkw-hue/c-c-6-live-theater) — 观看镜头（看席、中近景、宽景）和安静的合成声
- [c-c-7-codex-live-theater](https://github.com/ssttmkkw-hue/c-c-7-codex-live-theater) — 一眼能看懂的舞台调度
- [c-c-4-farm-days](https://github.com/ssttmkkw-hue/c-c-4-farm-days) — 园里散步的游客只借用了「人在干活」的气氛，动作是这里重写的

台词都是原创的。没有莎士比亚摘录，也没有外部音频文件。

Lines are original. There is no excerpted play text and no recorded audio.

## Status / 状态

七场演出都在循环，观众会看、会鼓掌。手机操作和进一步的性能还在后面。说明见 `docs/ROUND_1.md` 和 `docs/ROUND_2.md`。

Seven shows loop, with crowds that look and clap. Phone controls and a deeper performance pass come next. See `docs/ROUND_1.md` and `docs/ROUND_2.md`.

## License / 许可

MIT. See [LICENSE](LICENSE).
