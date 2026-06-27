# PR-J2：025B 之前必须完成的人工审查

025B **不会**自动写入 `hero_image_alt`、`currency`、`price_basis`、`price_on_request` 或 `seo_complete`。  
在运行 `pending/025b_journey_normalization_backfill.sql` 之前，必须完成以下 CSV 审查并在后台确认异常行。

**阻塞规则：** 在 `reviewer_decision` 未填完、价格语义未确认前，**不要**输出 Product Offer / 结构化报价 schema。

---

## 1. Hero alt — `pr-j2-hero-alt-manual-review.csv`

**范围：** 24 条 **active** Journey（已预填 `hero_image_url`；`current_alt` 多为空）。

**打开方式：** 用 `hero_image_url` 打开图片，在 `proposed_alt` 填写 **客观画面描述**（英文，一句，≤125 字符为宜）。

### 好的示例

| Journey | proposed_alt |
|---------|----------------|
| Lhasa tour | Potala Palace in Lhasa beneath a clear blue sky |
| Guilin/Yangshuo | Karst mountains and the Li River near Yangshuo |
| Beijing day tour | Traditional courtyard buildings in Beijing |

### 禁止写法（营销/SEO 堆砌）

- Best China tour
- Luxury China travel package
- Amazing Chinese landscape
- Private China vacation deal

### 填写列

| 列 | 说明 |
|----|------|
| `proposed_alt` | 人工撰写，描述图中可见主体、地点、天气/光线（如 relevant） |
| `reviewer_decision` | `approved` / `needs_rewrite` / `defer` |
| `notes` | 可选：图片来源问题、需换图、中英文文件名提示等 |

**完成标准：** 24 行 active 均有 `proposed_alt` + `reviewer_decision=approved`。  
批准后由编辑在 Admin 写入 `heroAlt`（dual-write 会同步 `hero_image_alt` column），**025B 仍不会 backfill alt**。

---

## 2. 价格 — `pr-j2-price-manual-review.csv`

**范围：** 全部 83 条 Journey（含 inactive/draft；active 24 条优先审）。

每条必须确认并填入：

| 列 | 合法值 / 说明 |
|----|----------------|
| `currency` | `USD` · `CNY` · `EUR`（ISO 4217 子集，见 `constants.ts`） |
| `price_basis` | `per_person` · `per_group` |
| `price_on_request` | `true` · `false` |
| `price_note` | 公开说明（币种、人数基础、是否含旺季/闭馆等）；可保留现有 JSONB `priceDetails` 精华 |

### 每条至少回答（可写在 `notes`）

1. **当前 `current_price` 数字是什么币种？**（例：192 → EUR，不是 USD）
2. **按人还是按团？** → `price_basis`
3. **基于几位旅客？**（例：2 人起价、最多 12 人团）→ 写入 `price_note`
4. **固定公开价还是参考价/起价？** → `price_note` + 是否 `price_on_request`
5. **前台是否应显示 “Price on request”？** → `price_on_request=true` 时前台不展示具体数字

### 已知线索

- `beijing-city-imperial-grandeur…` 的 JSONB 已含 `€192` — 应填 `currency=EUR`，并确认 basis/note。
- 大量 `1000` placeholder 价需逐条核实或改为 `price_on_request=true`。

### 完成标准

| 列 | 值 |
|----|-----|
| `reviewer_decision` | `approved` 或 `price_on_request`（明确选择） |
| `currency` + `price_basis` | 非空（除非 `price_on_request=true` 且无公开价） |

**在确认前：** 不生成 Product Offer JSON-LD / 不启用依赖完整价格的结构化输出。

---

## 3. 异常行 — `e468b842-7c59-4258-8d56-8b585566be82`

| 字段 | 当前值 |
|------|--------|
| id | `e468b842-7c59-4258-8d56-8b585566be82` |
| slug | `/journeys/chengdu-panda-alley-culture-day-tour`（含路径前缀，非法 canonical） |
| status | `inactive` |
| journey_type | **NULL**（column + JSONB 均无） |
| price | 185（currency/basis 未定义） |

**025B 会跳过此 id** — 保持 `MANUAL_REVIEW` 是正确的。

### 后台人工核对清单

在 `/admin/journeys/edit/e468b842-7c59-4258-8d56-8b585566be82` 打开并回答：

- [ ] 是否仍有业务价值？还是历史测试数据？
- [ ] slug 为何带 `/journeys/` 前缀？应改为 `chengdu-panda-alley-culture-day-tour` 还是删除？
- [ ] 是否应 **archived** 或直接删除？
- [ ] 属于哪个 Journey type？（Explore Together / Deep Discovery / …）
- [ ] 若保留：补 journey type + 规范化 slug + 价格 CSV 审查

**决定记录：** 写入 price CSV 该行的 `notes` 或单独 ticket；未决定前 **不要** 纳入 025B 批量 backfill。

---

## 4. 审查顺序建议

```
025A ✅ → dual-write flag ✅ → Admin 写入测试 ✅
    ↓
Hero alt CSV（24 active）
    ↓
Price CSV（24 active 优先 → 其余 59）
    ↓
e468b842 后台决策
    ↓
重新生成 preview / dry-run
    ↓
批准 025B preview → psql pending/025b
```

### 重新生成 CSV（只读 DB）

```bash
npx tsx --tsconfig tsconfig.json scripts/migrations/pr-j2-generate-review-csvs.ts
```

生成后 **不要覆盖** 已填的 `proposed_alt` / `currency` / `reviewer_decision` — 用 diff 合并或只更新新增行。

---

## 5. 与 025B 的边界

| 数据 | 025B 会做什么 | 人工 CSV 负责什么 |
|------|----------------|-------------------|
| `price_from` | 仅 `price → price_from` 复制 | currency / basis / on_request / note |
| `hero_image_alt` | **不写入** | 全部 alt 文案 |
| `seo_complete` | **不自动 true** | 编辑确认后再手动设 |
| `e468b842` | **跳过** | 归档/修复/删除决策 |
