# AI 万岁山 / Wansuishan

A walkable theme-park toy: the player is a little avatar who wanders grounds where a show is always running in every corner, and can stop wherever something looks interesting.

一个可以走着逛的主题公园小游戏：玩家是一个小人，走进一座每个角落都在演出的园子，走到喜欢的地方就能停下来看。

This is an original, unofficial homage to the idea of a park with thousands of daily performances. It is not affiliated with any real theme park.

本项目只是借用「园里到处都在演」这个想法，做成原创场景。与任何现实中的主题公园都没有从属关系。

The park reuses ideas and some code from the owner's other public experiments (Plaza English, the AI theater projects, and Farm Days). Those sources are listed below once the first playable version lands.

公园会借鉴并适量复用作者其他公开试验项目（广场英语、几个 AI 舞台剧、牧场日常）的做法和代码。可玩的第一版就绪后，会在下面列出具体来源。

## Run / 运行

From the repository root, serve the files over HTTP. ES modules do not run from a `file://` URL.

在仓库根目录用 HTTP 把文件提供出来。ES module 不能用 `file://` 打开。

```bash
python3 -m http.server 8888 --bind 127.0.0.1
```

Then open `http://127.0.0.1:8888`.

然后打开 `http://127.0.0.1:8888`。

## Status / 状态

Scaffold only. The first playable park is being built.

目前只是仓库架子。可玩的第一版正在做。

## License / 许可

MIT. Do not commit tokens, API keys, or `.env` files. This repository is public.

MIT 许可。不要提交 token、API 密钥或 `.env`。本仓库是公开的。
