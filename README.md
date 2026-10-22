# Gaming pSEO demo

独立的 JSON 驱动游戏页面实验。与官网代码、发布流程分离。所有测试、版本和推荐均为虚构示例；页面始终 `noindex`。

## 运行

Node.js 22 或以上，无第三方运行依赖。

```bash
npm run validate
npm test
npm run dev
```

打开 http://127.0.0.1:4173 。修改 JSON 后重启 dev 重新生成页面。

## 维护数据

每款游戏一个 `content/games/<slug>.json` 文件。

| 字段 | 内容 |
|---|---|
| game | 名称、简介、封面、SEO、内容块 |
| game.currentReportByDevice | 每台主机默认展示哪份报告；null 表示未验证 |
| game.settingDefinitions | 游戏专属设置的名称、类型、允许值 |
| reports[].profiles | 完整配置，包含玩法、分辨率和串流条件 |
| reports[].tests | 关联 profile 的采样与数值 |
| reports[].recommendations | 推荐哪个 profile，哪些 tests 支持它 |
| reports[].assessment | 指定环境、测试范围下的运行结论 |
| internalAudit | 内部证据与来源；构建时不公开导出 |

推荐的日常流程：

1. 在飞书维护真实可读报告（本仓库暂不接入飞书，也不包含内部报告）。
2. 在新分支修改 JSON，提 PR。
3. GitHub Actions 校验字段、引用并构建；Vercel Git 连接成功后自动生成分支预览。
4. 检查效果后合并 main，Vercel 自动发布。

新增游戏时复制一份文件，更新 game.id/slug/name、报告归属和默认报告引用。不要通过修改旧环境版本号伪装新测试；新增 report 保存快照。没有支持数据时使用未验证状态，不复制另一主机的结果。

当前原型只接受 `exampleOnly: true`、`publication.status: draft`、`indexable: false` 的示例。这里故意展示草稿 fixture，不是正式发布逻辑。接入真实数据前应新增正式发布模式、完整 JSON Schema 与审核规则，并明确移除全站 noindex；不能只将 exampleOnly 改为 false。

## 模板与构建

- `src/data.mjs`：读文件、校验引用与关键语义、公开字段投影。
- `src/render.mjs`：静态 HTML 模板与内容块渲染。
- `src/client.js`：搜索、筛选、主机/版本切换、URL 状态与浏览器前后退。
- `src/style.css`：响应式样式。
- `scripts/build.mjs`：生成列表、详情、维护指南、404、公开 JSON。
- `vercel.json`：构建配置、clean URLs、全站 noindex HTTP 头。
- `.github/workflows/check.yml`：数据与构建 CI。

主内容在构建时进入 HTML，不依赖浏览器请求私有飞书服务。默认详情即使禁用 JS 也可阅读；搜索、筛选、历史版本切换需要 JS。canonical 不含筛选参数。不存在的路由返回 404，未使用 SPA catch-all。

当前演示站不提交 sitemap；所有页面有 noindex。搜索引擎可索引的正式版本应单独补充 sitemap、站点域名与发布门槛。

内部 audit 字段不会出现在公开 JSON 或 HTML。公开投影仍应只填写适合公开的说明和配置；不要把私人信息放进前端要展示的文本。

构建使用 `SITE_URL`，或 Vercel 的 `VERCEL_PROJECT_PRODUCTION_URL` 生成 canonical。本地默认 localhost。原型采用系统字体、原创 SVG 示意图，没有真实游戏截图或外部字体依赖。

## Vercel

Import Git Repository，选择这个仓库。Framework Preset 为 Other，Build 为 `npm run build`，Output 为 `dist`；这些已写入配置。连接仓库后，main 发布生产，其他分支/PR 生成预览。若 Vercel GitHub App 尚无此仓库权限，需要账号所有者授权该仓库。

可用 CLI：

```bash
vercel --prod
vercel git connect
```

## 验证范围

自动测试覆盖关键引用、配置和推荐的一致性、未知数据类型、私有信息投影、HTML 转义、默认静态内容以及未验证状态。校验不是对游戏性能的真实性验证，也不是完整的 JSON Schema。
