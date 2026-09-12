# 本地记录与规则页面

## 自动保存与本地数据

每次成功起课会生成唯一 `runId`，并自动保存一次。普通 React rerender 和掌诀动画重播不会新增记录；随机结果的“换一组”和历史详情的“按当前规则重新起课”属于新起课，会生成新 `runId` 和新记录。

数据只写入当前浏览器的 `localStorage`：

- key：`bright-idea:divination-records`
- `schemaVersion`：`1`
- 定义位置：`src/features/history/types.ts`
- 存取与损坏恢复：`src/features/history/storage.ts`

记录保存起课时间、问题、体系、方式、原始输入、最终三数、文字或时间来源详情、三传与计算步骤、规则版本、自动 topic/intent、解说快照、验证状态、实际结果、复盘备注和最后修改时间。历史详情显示保存时的结果和解说，不用当前配置覆盖旧快照。

JSON 损坏或浏览器拒绝存取时，页面显示错误并保留应用可用；程序不会自动删除旧记录，也不会用新记录静默覆盖损坏内容。

## 搜索、复盘与删除

记录列表默认按起课时间倒序，可按关键词、六宫/九宫、数字/文字/随机/时间、验证状态筛选。进入详情再返回时，筛选状态保留。

验证状态包括：未验证、较符合、部分符合、不符合。实际结果与复盘备注可直接编辑。单条删除有一次确认，清空全部有两次确认。

“按当前规则重新起课”读取旧记录保存的最终三个数，调用当前同体系规则生成新结果和新记录，不修改原记录。

## 备份与恢复

“导出全部”下载包含 `schemaVersion` 和全部记录的 JSON，不包含 API Key、密码或 AI 配置。导入时先完整校验 envelope、记录和嵌套快照的白名单字段；任何记录无效都会终止整个导入，且不会写入数据。

有效导入按 `id` 合并：已有 id 默认保留本机版本，不覆盖；新 id 加入列表。导入结果会显示新增和跳过数量。

## 规则页面

规则页的数据不是单独抄写的副本：

- 页面只渲染当前选中的完整体系；六宫章节由 `src/components/sixRuleSections.ts` 定义，九宫章节由 `src/components/nineRuleSections.ts` 定义，目录不再使用“通用规则”共用章节。
- 六宫专属的口诀事项细断与日时双宫不会出现在九宫正文；九宫的病符、桃花、天德只在九宫配置章节显示。

- 宫位、五行、方位、关键词和规则版本读取 `src/rules/configs.ts` 导出的 `classicSixRules`、`xunNineRules`。
- 初传、中传、末传含义和行动建议读取 `src/features/divination/palaceSemantics.ts` 的 `palaceSemantics`。
- 六宫与九宫固定示例调用 `src/rules/engine.ts` 的 `calculateThreePasses()`。
- 五行生克顺序读取 `elementGenerates`、`elementControls`，方向说明调用 `describeElementRelation()`；三者都来自 `src/features/divination/interpretation.ts`。
- topic/intent 分类展示读取 `src/features/divination/questionContext.ts` 导出的识别规则。
- 十二时辰名称和序号调用 `getShichen()`；时间范围按当前两小时一时辰的边界显示。

页面会说明连续起数、四种起课方式、闰月与 23 点口径、五行关系、解说阶段和历史快照原则。AI 按钮的当前行为仍是复制提示词并打开外部网站，不调用仓库中的历史 API。
