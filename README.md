<div align="center">

# ⚽ WorldCup Arena — Web

The front end for a prospective, leakage-free LLM forecasting benchmark

Six frontier models, 104 matches, seven markets each — every pick locked before kickoff.

[![License](https://img.shields.io/badge/License-MIT-2a78d6?style=flat-square)](LICENSE)
[![Site](https://img.shields.io/badge/Live%20Site-social--ai--2026.github.io-1baf7a?style=flat-square)](https://social-ai-2026.github.io/worldcup2026-web/)
[![Code](https://img.shields.io/badge/GitHub-worldcup2026--codebase-eb6834?style=flat-square&logo=github&logoColor=white)](https://github.com/Social-AI-2026/worldcup2026-codebase)
[![Dataset](https://img.shields.io/badge/%F0%9F%A4%97%20Dataset-WorldCup%20Arena-eda100?style=flat-square)](https://huggingface.co/datasets/Social-AI-2026/worldcup2026)
[![Build](https://img.shields.io/badge/Build-none%20%C2%B7%20static-e87ba4?style=flat-square)](#-tech)

[English](./README.md) | [中文文档](./README-ZH.md)

</div>

## ⚡ What this is

The site that showed six frontier LLMs predicting the 2026 World Cup, one match at a time, always
before kickoff. It renders their pick cards, the tournament outright pool, and a leaderboard that
settles against real results.

## 📄 What's on the page

- **Model leaderboard** — updated as real results land
- **Pick cards** — per match, all six models across **7 markets** (1X2 · handicap · O/U 2.5 · BTTS ·
  odd/even · HT-FT · correct score), with an **Actual result** column
- **Outright pool** — champion · finalists · semi-finalists · winning confederation · total goals
- **Group winners** — each model's pick for all 12 groups
- **Fixtures** — revealed day by day as the tournament unfolded

All picks lock before kickoff; every market settles on the **90-minute scoreline**.

## 🛠 Tech

Pure static site — **vanilla HTML / CSS / JavaScript, no build step, zero dependencies**, deployed
via **GitHub Pages**. Bilingual (EN / 中文) through `data-en` / `data-zh` attributes and a language
toggle in the top bar.

## 🗂 Files

| File | What |
|---|---|
| `index.html` | Page structure — hero · leaderboard · arena · schedule · method |
| `worldcup.css` · `styles.css` | Styles — `worldcup.css` is this project, `styles.css` the shared base |
| `worldcup-data.js` | **The predictions** — each model's picks (`PRED`) plus label and mapping tables |
| `worldcup-arena.js` | Scoring config — markets, points, and real results (`RESULTS` · `CHAMPION` · `GROUP_WINNERS`) |
| `worldcup-ui.js` | Rendering — leaderboard, pick cards, pools, nav scrollspy |
| `worldcup-app.js` · `worldcup-knockout.js` | Teams, fixtures, groups, knockout bracket |

## 🔄 Data flow

The page is generated, not hand-written. In a working checkout of the
**[pipeline repository](https://github.com/Social-AI-2026/worldcup2026-codebase)**,
`wc_eval/predict/update_web.py` reads the prediction archive and writes it into
`worldcup-data.js` (the `PRED` object) and `worldcup-arena.js` (`RESULTS`), then bumps the `?v=`
cache-buster in `index.html`.

> **Do not hand-edit `worldcup-data.js`.** It is derived from the archive; run `update_web.py`
> instead. Hand edits are silently overwritten and break the guarantee that what the site shows is
> what the models actually returned.

The archive itself is not part of the public release: the published dataset is the **briefing
material and the official results**, not our own predictions. See
[`Social-AI-2026/worldcup2026`](https://huggingface.co/datasets/Social-AI-2026/worldcup2026).

## 🚀 Run locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Any static server works. There is nothing to install and nothing to compile.

## ⚖️ License

[MIT](LICENSE). All predictions shown are **model-generated, for entertainment only** — not betting
advice.
