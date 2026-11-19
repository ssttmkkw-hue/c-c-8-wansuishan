# 第 1 轮 / Round 1

## English summary

A walkable original park with a gate, paths, a plaza, a pavilion stage, an east-court juggler, and a north-loop parade. The player uses the English-sim style follow camera (WASD, mouse, Q/R). Each show loops on one clock. E eases into a show camera; E or Esc leaves. Chinese is the default UI, with English on a toggle. The schedule exists as a canvas board by the gate and as a HUD list. Verified in headless Chrome with SwiftShader: no page errors, four shows, teleport, watch/leave, and language toggle. About 34–38 fps at 1280×800 on the low quality path this machine selects automatically.

## 做了什么

- 可走的园子：牌坊式园门、石径、西广场、戏台、东市摊子、水池、灯笼、树、北路花车轨道。围墙和树干有碰撞，镜头会在撞到墙时拉近。
- 玩家是带关节的小人。走路、待机、面向附近的说话人。
- 四场一直在演的节目：广场闲谈、戏台《灯与月》、路边抛球、花车巡游。一次只有一个说话的人。听众会看向说话的人，并在句子后段点头、笑或鼓掌。说话的人略大，脚下有一块暖色光斑。
- 走近能看到字幕（中文为主，另一行是翻译）。站进金色圈子按 E 进入观看：广场是斜前侧，戏台是看席前方，杂耍更近，花车是偏高的宽镜头并跟着队伍。
- 园门边的节目单用画布写中文（字体指定 Noto Sans CJK SC），HUD 和小地图是同一份信息。点「前往」或小地图会过去。
- 第一次进入有帮助卡，关掉后记在 `localStorage`。声音是 Web Audio 里自己写的薄底乐、鼓、短笛和抛球的嘀声，默认开着，可以静音。
- `window.__wansui` 供测试和截图使用。

## 复用了什么

- **c-c-3-english-sim**：相机跟在身后、轴向滑动碰撞、键鼠映射、一人说话、小地图。
- **c-c-5-ai-theater**：骨盆—胸—头—肩—肘—髋—膝的程序化小人，以及说话、指、鞠躬、鼓掌这些姿势。
- **c-c-6-live-theater**：不同演出用不同观看机位；合成的很轻的音效，而不是录音。
- **c-c-7-codex-live-theater**：舞台要一眼能分出谁在说。
- **c-c-4-farm-days**：没有直接拷代码。园路两侧散步的游客是这里写的。

没有把别的仓库做成 submodule，也没有带上模型或 `node_modules`。

## 截图

在 `/workspace/wansuishan-shots/`，不进 git：

- `c8-r1-gate.png`
- `c8-r1-overview.png`
- `c8-r1-plaza.png`
- `c8-r1-stage.png`
- `c8-r1-street.png`
- `c8-r1-parade.png`
- `c8-r1-schedule.png`

## 怎么验的

`python3 -m http.server 8888 --bind 127.0.0.1`，再用 `/workspace/c8-prompts/c8-r1-verify.mjs`。Chrome 打开 SwiftShader。页面没有自己的 console error（驱动的 ReadPixels 性能警告已忽略）。`__wansui` 可用，四场演出都在，传送、观看、离开、中英切换都通过。低画质下测到大约 **34–38 fps**（1280×800）。这块机器没有独立 GPU，自动画质会关掉阴影。

## 还剩的问题

- 自动画质在软件渲染上没有阴影，人靠脚下的圆片落在地上。
- 节目单默认展开，占左边一列。按 M 可以收起。
- 人脸还很简单，远看主要靠体态和光斑，不靠表情。
- 花车的观看镜头会跟着队伍，不是完全固定的路边机位。这样队伍才不会走出画面。
- 手机摇杆还没接上，标记在页面里，默认隐藏。
- 戏台侧墙比较实，从侧面看容易挡住演员，所以观看点放在看席前方。
