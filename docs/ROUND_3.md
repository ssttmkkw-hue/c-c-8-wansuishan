# 第 3 轮 / Round 3

## English summary

Phone layout, a faster static park, and a last polish pass. Narrow screens get a left stick, drag-to-look on the view, and a Watch / Leave button. Static walls, paths, roofs, and lanterns are merged by material. Distant crowds hide. On this machine WebGL is SwiftShader, so antialias stays off and quality stays low. A 1280×800 run measured about 48–55 fps. Portrait (390×844) and landscape (844×390) both keep the path in the middle of the screen.

## 做了什么

- 窄屏或触控时出现左下摇杆、右下「观看 / 离开」。在画面上拖动可以转向。摇杆接的是和英语广场同一套位移。
- 顶栏在竖屏上收紧，节目单变矮，小地图缩小，字幕抬到摇杆上面。横屏时「离开」让开摇杆。
- 静止的墙、路、屋顶、灯笼按材质合并成较少的网格。树、鱼、花和节目牌子仍单独动。30 米以外的观众先藏起来，正在看的那场除外。
- 软件渲染关掉抗锯齿。画质仍可选自动 / 低 / 高。小地图上离你最近的那场会多画一圈。
- 皮影的幕布拉高了一点，少露操偶的腿。帮助文字写上了手机操作。

## 复用了什么

手机摇杆的算法来自 **c-c-3-english-sim** 的 `src/input/touch.js`：按住底盘，旋钮跟手指，输出一个单位圆里的向量。镜头拖动仍是那一套指针增量，补上了触摸没有 `movementX` 时用坐标差。

## 截图

`/workspace/wansuishan-shots/`：

- `c8-r3-gate.png`、`c8-r3-plaza.png`、`c8-r3-stage.png`、`c8-r3-street.png`、`c8-r3-parade.png`
- `c8-r3-story.png`、`c8-r3-puppet.png`、`c8-r3-martial.png`、`c8-r3-schedule.png`
- `c8-r3-phone-portrait.png`、`c8-r3-phone-landscape.png`
- 另有一张 `c8-r3-phone-portrait-watch.png`，是竖屏点过「观看」之后

## 怎么验的

`/workspace/c8-prompts/c8-r3-verify.mjs`。七场都在，中文节目单正常，没有页面错误。竖屏确认摇杆层出现，点「观看」进入戏台，横屏再点「离开」能退出。低画质、1280×800、SwiftShader 下大约 **48–55 fps**。

## 还剩的问题

- 人脸还是圆眼睛加鼻子，远看靠动作。
- 自动画质在这块机器上没有实时阴影，人脚下是一块圆片。
- 远处的观众会被藏起来，所以从园门望出去，最远的一圈人会少一些。
- 说书棚和西广场的看点仍然比较近。
- 没有昼夜系统。声音仍是几段很轻的合成音。
