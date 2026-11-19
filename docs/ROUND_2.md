# 第 2 轮 / Round 2

## English summary

Three more shows bring the park to seven: a seated storyteller, a shadow-puppet screen, and a martial ring. Each has its own crowd, rhythm, and watch camera (close booth, screen-front, wide ring). Listeners look at the speaker, then nod, laugh, or clap. Speaking adds a small head bob. New quiet stingers: a plucked phrase, a wood-block tick, and a low strike. SwiftShader at 1280×800, low quality, stayed in the mid-20s fps after the extra crowds. Phone controls and a real performance pass are still Round 3.

## 做了什么

- 新增 **说书**（西北棚，人坐着讲，三个听众坐在面前）、**皮影**（幕布上两个人影来回动，讲幕人在幕前）、**把式**（两人在圈子里踢、格，周围站一圈人）。
- 原来的四场还在。每场都有人在看：看向说话的人，句子后段点头、笑或鼓掌。说话时头会轻轻点，嘴会张。
- 观看镜头分开：说书贴得很近，皮影对着幕，把式把整个场子框住，花车仍然是高一点的宽景。
- 声音在原来的园子底乐、鼓、短笛、抛球声之外，加了说书的拨弦、皮影的木鱼似的短音、把式的低击。静音按钮继续连着 `__wansui.setMuted`。
- 节目单和园门牌子都能排下七场。数字键 `1`–`7` 可以过去。

## 复用了什么

还是第 1 轮那几份结构：英语广场的一人说话和跟随镜头，剧场项目的关节和姿势，直播剧场的分机位。新的三场没有再搬一整套别的工程，皮影的人影和把式的踢是在同一套小人身上加的姿势。

## 截图

`/workspace/wansuishan-shots/`：

- `c8-r2-gate.png`
- `c8-r2-plaza.png`
- `c8-r2-stage.png`
- `c8-r2-street.png`
- `c8-r2-parade.png`
- `c8-r2-story.png`
- `c8-r2-puppet.png`
- `c8-r2-martial.png`
- `c8-r2-schedule.png`

## 怎么验的

`/workspace/c8-prompts/c8-r2-verify.mjs`。七个 id 都在，皮影可以观看再离开，中文标题没有乱码，英文切换正常，没有页面错误。截图那一轮测到大约 **23–26 fps**（1280×800，低画质，SwiftShader）。人变多之后比第 1 轮的三十多帧低一截。

## 还剩的问题

- 每个人还是独立的网格，观众一多，软件渲染就掉到二十多帧。第 3 轮再合并静止的园子、让远处的人便宜一些。
- 皮影操偶的腿会从幕布底下露出来。
- 说书和广场的看点离得不远，站在两者中间时提示可能偏近的那场。
- 手机摇杆还没启用。
- 人脸仍然简单，远看靠动作和脚下的光斑。
