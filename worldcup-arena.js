/* ============================================================================
   世界杯 2026 — 模型擂台（多市场竞猜 · 纯盘口玩法）
   单场 7 个市场（均由模型预测的【全场比分 + 半场比分】派生）：
     胜平负 x2 +2 / 让球 hc +4 / 大小2.5 ou +2 / 双方进球 bt +2 /
     进球单双 oe +1 / 半全场 ht +3 / 预测比分 cs +2（数据键仍叫"正确比分"）
   全局彩池（球队/赛果类，无球员）：
     夺冠 +25 / 进决赛(2队)每队 +10 / 四强(4队)每队 +4 /
     夺冠大洲 +5 / 总进球大小 +4 / 小组头名(12组)每组 +5
   预测全部「球队实力 + 模型性格」确定式推导。真实结果在文件末尾更新。
   ========================================================================== */
(function () {
  var MODELS = [
    { key: "claude", name: "Claude" }, { key: "gpt", name: "GPT" }, { key: "gemini", name: "Gemini" },
    { key: "kimi", name: "Kimi" }, { key: "glm", name: "GLM" }, { key: "seed", name: "Seed" }
  ];

  var MARKETS = [
    { key: "x2", zh: "全场胜平负", en: "1X2 (full-time)", pts: 2,
      zhExp: "猜 90 分钟全场结果：主队赢＝主胜，打平＝平，客队赢＝客胜",
      enExp: "Pick the full-time result: home win / draw / away win" },
    { key: "hc", zh: "让球胜负", en: "Handicap", pts: 4 },  /* 名称与解释按本场盘口动态生成，见 ui 的 hcLabel / hcExplain */
    { key: "ou", zh: "总进球大小 2.5", en: "Over/Under 2.5 goals", pts: 2,
      zhExp: "猜两队全场总进球数：3 球及以上＝大，2 球及以下＝小",
      enExp: "Total goals by both teams: 3 or more = Over, 2 or fewer = Under" },
    { key: "bt", zh: "双方是否都进球", en: "Both teams to score", pts: 2,
      zhExp: "都进＝两队各至少进 1 球；零封＝至少有一队 0 进球",
      enExp: "Yes = both sides score at least once; No = at least one side fails to score" },
    { key: "oe", zh: "总进球单双", en: "Total goals odd/even", pts: 1,
      zhExp: "猜全场总进球数是单数还是双数（0 球算双数）",
      enExp: "Is the total goal count odd or even? 0 counts as even" },
    { key: "ht", zh: "半全场（半场/全场）", en: "HT / FT result", pts: 3,
      zhExp: "一注同时猜「半场结果/全场结果」，如主/主＝半场主队领先且全场主队赢，两段都对才算中",
      enExp: "Call the half-time AND full-time result (e.g. H/H) — both legs must be right" },
    { key: "cs", zh: "预测比分", en: "Correct score", pts: 2,
      zhExp: "直接预测最终比分，和赛果一模一样才算中",
      enExp: "Predict the exact final score — must match exactly" }
  ];
  var GLOBAL = [
    { key: "champ", zh: "夺冠", en: "Champion", pts: 25, kind: "one" },
    { key: "final", zh: "进决赛", en: "Finalists", pts: 10, kind: "set", n: 2 },
    { key: "semi", zh: "四强", en: "Semi-finalists", pts: 4, kind: "set", n: 4 },
    { key: "conf", zh: "夺冠大洲", en: "Winning region", pts: 5, kind: "opt" },
    { key: "goals", zh: "总进球", en: "Total goals", pts: 4, kind: "opt" }
  ];

  var LBL = {
    x2: { H: { zh: "主胜", en: "Home", t: "warm" }, D: { zh: "平", en: "Draw", t: "neutral" }, A: { zh: "客胜", en: "Away", t: "cool" } },
    hc: { H: { zh: "主", en: "Home", t: "warm" }, P: { zh: "走盘", en: "Push", t: "neutral" }, A: { zh: "客", en: "Away", t: "cool" } },
    ou: { O: { zh: "大", en: "Over", t: "warm" }, U: { zh: "小", en: "Under", t: "cool" } },
    bt: { Y: { zh: "都进", en: "Yes", t: "warm" }, N: { zh: "零封", en: "No", t: "cool" } },
    oe: { ODD: { zh: "单", en: "Odd", t: "warm" }, EVN: { zh: "双", en: "Even", t: "cool" } },
    conf: { UEFA: { zh: "欧洲", en: "Europe", t: "warm" }, CONMEBOL: { zh: "南美", en: "S. America", t: "cool" }, OTHER: { zh: "其他", en: "Other", t: "neutral" } },
    goals: { O: { zh: "大", en: "Over", t: "warm" }, U: { zh: "小", en: "Under", t: "cool" } }
  };
  var OUT = { H: { zh: "主", en: "H" }, D: { zh: "平", en: "D" }, A: { zh: "客", en: "A" } };

  var GBH = [0.18, -0.12, 0.0, 0.30, -0.06, 0.12], GBA = [-0.04, 0.12, 0.0, 0.24, -0.12, 0.06];
  function frand(a, b) { var x = Math.sin((a + 1) * 12.9898 + (b + 1) * 78.233) * 43758.5453; return x - Math.floor(x); }
  function cl(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function sgn(d) { return d > 0 ? "H" : (d < 0 ? "A" : "D"); }

  /* 让球线：给主队的让球数（主队被看好为负）。0=平手盘 */
  var HCP = {
    "MEX_vs_RSA": -1.0,
    "KOR_vs_CZE": -0.5,
    "CAN_vs_BIH": -0.5,
    "USA_vs_PAR": -0.5,
    "BRA_vs_MAR": -0.5,
    "QAT_vs_SUI": 1.0,
    "HAI_vs_SCO": 0.5,
    "AUS_vs_TUR": 0.5,
    "GER_vs_CUW": -2.5,
    "CIV_vs_ECU": 0.5,
    "NED_vs_JPN": -0.5,
    "SWE_vs_TUN": -0.5,
    "KSA_vs_URU": 1.0,
    "ESP_vs_CPV": -2.0,
    "IRN_vs_NZL": -0.5,
    "BEL_vs_EGY": -0.5,
    "FRA_vs_SEN": -1.5,
    "IRQ_vs_NOR": 1.5,
    "ARG_vs_ALG": -1.0,
    "AUT_vs_JOR": -1.5,
    "POR_vs_COD": -1.5,
    "ENG_vs_CRO": -1.0,
    "GHA_vs_PAN": -0.5,
    "UZB_vs_COL": 1.0,
    "CZE_vs_RSA": -0.5,
    "SUI_vs_BIH": -0.5,
    "CAN_vs_QAT": -1.0,
    "MEX_vs_KOR": -0.5,
    "BRA_vs_HAI": -2.0,
    "SCO_vs_MAR": 0.5,
    "TUR_vs_PAR": -0.5,
    "USA_vs_AUS": -0.5,
    "GER_vs_CIV": -1.0,
    "ECU_vs_CUW": -2.0,
    "NED_vs_SWE": -0.5,
    "TUN_vs_JPN": 0.5,
    "ESP_vs_KSA": -2.0,
    "BEL_vs_IRN": -1.0,
    "URU_vs_CPV": -1.0,
    "NZL_vs_EGY": 0.5,
    "NOR_vs_SEN": -0.5,
    "FRA_vs_IRQ": -1.5,
    "ARG_vs_AUT": -1.0,
    "JOR_vs_ALG": 0.5,
    "ENG_vs_GHA": -1.5,
    "PAN_vs_CRO": 0.5,
    "POR_vs_UZB": -1.5,
    "COL_vs_COD": -0.5,
    "SCO_vs_BRA": 1.5,
    "MAR_vs_HAI": -1.5,
    "SUI_vs_CAN": -0.5,
    "BIH_vs_QAT": -1.0,
    "CZE_vs_MEX": 0.5,
    "RSA_vs_KOR": 0.5,
    "TUR_vs_USA": 0.0,
    "PAR_vs_AUS": -0.5,
    "CUW_vs_CIV": 1.0,
    "ECU_vs_GER": 0.5,
    "JPN_vs_SWE": -0.5,
    "TUN_vs_NED": 1.5,
    "NOR_vs_FRA": 1.0,
    "SEN_vs_IRQ": -1.5,
    "EGY_vs_IRN": -0.5,
    "NZL_vs_BEL": 2.0,
    "CPV_vs_KSA": -0.5,
    "URU_vs_ESP": 1.0,
    "PAN_vs_ENG": 2.5,
    "CRO_vs_GHA": -0.5,
    "ALG_vs_AUT": 0.5,
    "JOR_vs_ARG": 2.0,
    "COL_vs_POR": 0.5,
    "COD_vs_UZB": -0.5,
    "RSA_vs_CAN": 1.0,
    "BRA_vs_JPN": -0.5,
    "GER_vs_PAR": -1.5,
    "NED_vs_MAR": -0.5,
    "FRA_vs_SWE": -1.5,
    "CIV_vs_NOR": 0.5,
    "MEX_vs_ECU": -0.5,
    "ENG_vs_COD": -1.5,
    "USA_vs_BIH": -0.5,
    "BEL_vs_SEN": -0.5,
    "POR_vs_CRO": -0.5,
    "ESP_vs_AUT": -1.5,
    "SUI_vs_ALG": -0.5,
    "ARG_vs_CPV": -2.0,
    "COL_vs_GHA": -1.0,
    "AUS_vs_EGY": 0.25,
    "CAN_vs_MAR": 0.5,
    "PAR_vs_FRA": 1.5,
    "BRA_vs_NOR": -0.75,
    "MEX_vs_ENG": 0.25,
    "POR_vs_ESP": 0.5,
    "USA_vs_BEL": 0.25,
    "ARG_vs_EGY": -1.0,
    "SUI_vs_COL": 0.25,
    "MAR_vs_FRA": 0.5,
    "ESP_vs_BEL": -0.5,
    "NOR_vs_ENG": 0.5,
    "ARG_vs_SUI": -0.75,
    "FRA_vs_ESP": -0.25
  };   // 固定真实盘口(主队让球数,负=主让;多方赔率核对)
  function handLine(home, away) {
    var WC = window.__WC, k = WC.flag(home) + "_vs_" + WC.flag(away); if (HCP[k] != null) return HCP[k];
    var d = WC.rate(home) - WC.rate(away), ad = Math.abs(d);
    var line = ad >= 320 ? 2 : ad >= 150 ? 1 : ad >= 45 ? 0.5 : 0;
    return d > 0 ? -line : line;
  }
  function hcRes(fh, fa, line) { var m = (fh - fa) + line; return m > 0.001 ? "H" : (m < -0.001 ? "A" : "P"); }

  /* 由 全场(fh,fa) + 半场(hh,ha) + 让球线 派生所有市场 */
  function fromScore(fh, fa, hh, ha, line) {
    return {
      x2: sgn(fh - fa),
      hc: hcRes(fh, fa, line),
      ou: (fh + fa) >= 3 ? "O" : "U",
      bt: (fh > 0 && fa > 0) ? "Y" : "N",
      oe: ((fh + fa) % 2 === 0) ? "EVN" : "ODD",
      ht: (hh == null || ha == null) ? null : (sgn(hh - ha) + "-" + sgn(fh - fa)),
      cs: fh + ":" + fa
    };
  }

  function predict(home, away, mi, idx) {
    var WC = window.__WC; if (!WC) return { goals: [1, 0] };
    var d = (WC.rate(home) - WC.rate(away)) / 130;
    var lamH = 1.45 + d * 0.62 + GBH[mi], lamA = 1.12 - d * 0.62 + GBA[mi];
    var fh = Math.round(cl(lamH + (frand(mi * 5 + 1, idx) - 0.5) * 1.7, 0, 5));
    var fa = Math.round(cl(lamA + (frand(mi * 5 + 3, idx) - 0.5) * 1.7, 0, 5));
    var hh = Math.round(cl(fh * (0.35 + 0.22 * frand(mi * 7 + 1, idx)), 0, fh));
    var ha = Math.round(cl(fa * (0.35 + 0.22 * frand(mi * 7 + 2, idx)), 0, fa));
    var m = fromScore(fh, fa, hh, ha, handLine(home, away));
    m.goals = [fh, fa]; m.half = [hh, ha];
    return m;
  }

  /* ---- 全局彩池：确定式推导 ---- */
  function byRating() { var WC = window.__WC; return Object.keys(WC.T).sort(function (a, b) { return WC.rate(b) - WC.rate(a); }); }
  function pickN(pool, n, mi, salt) {
    var s = pool.map(function (t, k) { return { t: t, s: k + (frand(mi * 11 + salt, k) - 0.5) * 5 }; });
    s.sort(function (a, b) { return a.s - b.s; });
    return s.slice(0, n).map(function (x) { return x.t; });
  }
  function poolPick(mi) {
    var WC = window.__WC; if (!WC) return {};
    var top = byRating();
    var champ = pickN(top.slice(0, 6), 1, mi, 1)[0];
    var final = pickN(top.slice(0, 8), 2, mi, 2);
    var semi = pickN(top.slice(0, 11), 4, mi, 3);
    var c = WC.conf(champ); var conf = (c === "UEFA" || c === "CONMEBOL") ? c : "UEFA";
    var goals = (GBH[mi] + GBA[mi] + (frand(mi, 71) - 0.5)) >= 0 ? "O" : "U";
    var G = WC.groups(), groups = {};
    Object.keys(G).forEach(function (g) {
      var arr = G[g] || []; if (!arr.length) return;
      var up = arr.length > 1 && frand(mi * 13, g.charCodeAt(0)) > 0.80;
      groups[g] = up ? arr[1] : arr[0];
    });
    return { champ: champ, final: final, semi: semi, conf: conf, goals: goals, groups: groups };
  }

  window.__WC_ARENA = {
    MODELS: MODELS, MARKETS: MARKETS, GLOBAL: GLOBAL, LBL: LBL, OUT: OUT,
    predict: predict, fromScore: fromScore, handLine: handLine, poolPick: poolPick,
    GOALS_LINE: 285.5,
    GW_PTS: 5,

    /* ========================================================================
       预测“产出截止日”—— 只显示日期 ≤ 此值的比赛的预测，之后的显示“待产出”。
       逐日产出：每产出新一天，把这里改成那天即可（格式与赛程日期键一致，如 "6.12"）。
       例：当前只放出 6/11 揭幕日两场 → "6.11"
       ====================================================================== */
    REVEAL_THROUGH: "7.14",

    /* ========================================================================
       赛后在这里更新真实结果 —— 页面自动结算并刷新积分榜。
       单场:   RESULTS[场序(0起)] = "全场比分"  或  "全场/半场"（半场可选）
               例: 0:"2:0"        只结算除半全场外 6 个市场
                   0:"2:0/1:0"    含半场 → 半全场也结算
       全局:   CHAMPION "Spain" / FINALISTS [2队] / SEMIS [4队]
               WINNER_CONF "UEFA"|"CONMEBOL" / TOTAL_GOALS 数字(对比 GOALS_LINE)
               GROUP_WINNERS { A:"Mexico", B:"...", ... }
       ====================================================================== */
    RESULTS: {"0": "2:0/1:0", "1": "2:1/0:0", "2": "1:1/0:1", "3": "4:1/3:0", "4": "1:1/0:1", "5": "1:1/1:1", "6": "0:1/0:1", "7": "2:0/1:0", "8": "7:1/3:1", "9": "2:2/0:0", "10": "1:0/0:0", "11": "5:1/2:1", "12": "0:0/0:0", "13": "1:1/0:1", "14": "1:1/1:0", "15": "2:2/1:1", "16": "3:1/0:0", "17": "1:4/1:2", "18": "3:0/1:0", "19": "2:1/1:0", "20": "1:1/1:1", "21": "4:2/2:2", "22": "1:0/0:0", "23": "1:3/0:1", "24": "1:1/1:0", "25": "4:1/0:0", "26": "6:0/3:0", "27": "1:0/0:0", "28": "2:0/2:0", "29": "0:1/0:1", "30": "3:0/3:0", "31": "0:1/0:1", "32": "5:1/2:0", "33": "2:1/0:1", "34": "0:0/0:0", "35": "0:4/0:2", "36": "4:0/3:0", "37": "0:0/0:0", "38": "2:2/2:1", "39": "1:3/1:0", "40": "2:0/1:0", "41": "3:0/1:0", "42": "3:2/1:0", "43": "1:2/1:0", "44": "5:0/3:0", "45": "0:0/0:0", "46": "0:1/0:0", "47": "1:0/0:0", "48": "2:1/0:0", "49": "3:1/2:1", "50": "0:3/0:2", "51": "4:2/2:2", "52": "0:3/0:0", "53": "1:0/0:0", "54": "0:2", "55": "2:1", "56": "1:1", "57": "1:3", "58": "3:2", "59": "0:0", "60": "1:4/1:3", "61": "5:0/1:0", "62": "0:0/0:0", "63": "0:1/0:1", "64": "1:1/1:1", "65": "1:5/0:1", "66": "0:2/0:0", "67": "2:1/1:0", "68": "0:0/0:0", "69": "3:1/0:1", "70": "3:3/1:1", "71": "1:3/0:2", "72": "0:1/0:0", "73": "1:1", "74": "1:1", "75": "2:1", "76": "3:0", "77": "1:2", "78": "2:0", "79": "2:1", "80": "2:0", "81": "3:2", "82": "2:1", "83": "3:0", "84": "2:0", "85": "3:2", "86": "1:0", "87": "1:1", "88": "0:3", "89": "0:1", "90": "1:2", "91": "2:3", "92": "0:1/0:0", "93": "1:4/1:2", "94": "3:2/0:1", "95": "0:0/0:0", "96": "0:2/0:0", "97": "2:1/1:1", "98": "1:1/1:1", "99": "1:1/1:0"},
    CHAMPION: "", FINALISTS: [], SEMIS: [], WINNER_CONF: "", TOTAL_GOALS: null, GROUP_WINNERS: {"A": "Mexico", "B": "Switzerland", "C": "Brazil", "D": "USA", "E": "Germany", "F": "Netherlands", "G": "Belgium", "H": "Spain", "I": "France", "J": "Argentina", "K": "Colombia", "L": "England"}
  };
})();
