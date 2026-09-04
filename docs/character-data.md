# 三字起课数据来源

- 繁简转换：`opencc-js@1.4.2`，MIT AND Apache-2.0；词组级转换在本地浏览器运行，不调用网络接口。
- 康熙笔画：`breezyreeds/kangxi-strokecount`，固定 commit `778d23d0566066ab19906557755b882818ec0a06`，MIT License。
- 生成方式：从该 commit 的 `kangxi-strokecount.csv` 读取 `Character` 与 `Strokes` 字段，按 Unicode code point 的 `floor(codePoint / 4096)` 分成 20 个 JSON 区段文件，共 606,845 bytes。应用通过 `import.meta.glob` 按字符所在区段懒加载；查不到时不猜测。
- 2026-09-03 构建记录：首页主 chunk `index-u4eBxyZl.js` 为 208,602 bytes；OpenCC 按需 chunk `cn2t-DDyjQPTw.js` 为 1,100,390 bytes，未进入首页主 chunk。
- 数据口径：上游 README 声明为 Unicode 11.0.0 中康熙字典收录的汉字，共 63696 字；其数值不宣称等同所有民间姓名学口径。
