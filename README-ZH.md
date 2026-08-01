<div align="center">

# ⚽ WorldCup Arena — Web

前瞻式无泄漏大模型预测基准的前端

六个前沿模型、104 场比赛、每场七个盘口——每一票都在开球前锁定。

[![License](https://img.shields.io/badge/License-MIT-2a78d6?style=flat-square)](LICENSE)
[![Site](https://img.shields.io/badge/Live%20Site-social--ai--2026.github.io-1baf7a?style=flat-square)](https://social-ai-2026.github.io/worldcup2026-web/)
[![Code](https://img.shields.io/badge/GitHub-worldcup2026--codebase-eb6834?style=flat-square&logo=github&logoColor=white)](https://github.com/Social-AI-2026/worldcup2026-codebase)
[![Dataset](https://img.shields.io/badge/%F0%9F%A4%97%20Dataset-WorldCup%20Arena-eda100?style=flat-square)](https://huggingface.co/datasets/Social-AI-2026/worldcup2026)
[![Build](https://img.shields.io/badge/Build-none%20%C2%B7%20static-e87ba4?style=flat-square)](#-tech)

[English](./README.md) | [中文文档](./README-ZH.md)

</div>

## ⚡ 这是什么

展示六个前沿大模型预测 2026 世界杯的网页——一场一问，每次都在开球之前。页面渲染它们的预测卡、全局彩池，以及一张随真实赛果结算的积分榜。

## 📄 页面上有什么

- **模型积分榜** —— 随真实赛果落地实时更新
- **预测卡** —— 逐场，六个模型 × **7 个盘口**（胜平负 · 让球 · 大小 2.5 · 双方进球 · 单双 · 半全场 · 正确比分），带**实际赛果**列
- **全局彩池** —— 冠军 · 决赛双方 · 四强 · 夺冠大洲 · 总进球
- **小组头名** —— 每个模型对 12 个小组的预测
- **赛程** —— 随赛事推进逐日解锁

所有预测在开球前锁定；每个盘口一律按 **90 分钟比分**结算。

## 🛠 技术

纯静态站点——**原生 HTML / CSS / JavaScript，无构建步骤，零依赖**，用 **GitHub Pages** 部署。中英双语通过 `data-en` / `data-zh` 属性 + 顶栏语言开关实现。

## 🗂 文件

| 文件 | 作用 |
|---|---|
| `index.html` | 页面结构 —— 首屏 · 积分榜 · 竞猜区 · 赛程 · 方法 |
| `worldcup.css` · `styles.css` | 样式 —— `worldcup.css` 是本项目的，`styles.css` 是共享基底 |
| `worldcup-data.js` | **预测本体** —— 每个模型的选择（`PRED`）以及标签与映射表 |
| `worldcup-arena.js` | 记分配置 —— 盘口、分值、真实赛果（`RESULTS` · `CHAMPION` · `GROUP_WINNERS`） |
| `worldcup-ui.js` | 渲染 —— 积分榜、预测卡、彩池、导航滚动定位 |
| `worldcup-app.js` · `worldcup-knockout.js` | 球队、赛程、分组、淘汰赛对阵图 |

## 🔄 数据流

页面是生成出来的，不是手写的。在**[流水线仓库](https://github.com/Social-AI-2026/worldcup2026-codebase)**的工作副本里，`wc_eval/predict/update_web.py` 读取预测归档，写进 `worldcup-data.js`（`PRED` 对象）和 `worldcup-arena.js`（`RESULTS`），然后 bump `index.html` 的 `?v=` 缓存戳。

> **不要手工改 `worldcup-data.js`。**它是从归档派生出来的，要改请跑 `update_web.py`。手工改动会被静默覆盖，并且会破坏"页面展示的就是模型真实返回的内容"这个保证。

归档本身不在公开发布范围内：公开的数据集是**简报材料与官方赛果**，不是我们自己的预测。见 [`Social-AI-2026/worldcup2026`](https://huggingface.co/datasets/Social-AI-2026/worldcup2026)。

## 🚀 本地运行

```bash
python3 -m http.server 8000
# 然后打开 http://localhost:8000
```

任何静态服务器都行。没有东西要装，也没有东西要编译。

## ⚖️ 许可

[MIT](LICENSE)。页面上展示的所有预测**均由模型生成，仅供娱乐**，不构成投注建议。
