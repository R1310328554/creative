# 灵搭 Lingda · AI 低代码设计平台

面向企业内部场景的 Web 低代码开发 / 设计工具，产品形态参考阿里 [宜搭](https://www.aliwork.com/) 与腾讯 [微搭](https://cloud.tencent.com/product/weda)：可视化拖拽搭建、组件属性配置、模板中心，并内置 **AI 助手** 用自然语言生成可编辑页面 Schema。

## 功能

- **工作台**：应用列表、新建 / 复制 / 删除、模板一键创建
- **可视化设计器**：组件面板、画布拖拽、大纲树拖拽调整层级、物料驱动属性面板
- **多页面**：应用内页面标签切换、新增页面
- **AI 生成 + 细化**：整页生成（请假 / 看板 / 入职 / 报销等）；也可说「增加手机号字段」「把标题改成出差申请」做局部细化
- **预览运行时**：表单受控填写、必填校验、按钮动作（提交 / 重置 / Toast）
- **预览与多端**：设计 / 预览切换，桌面 / 平板 / 手机画布宽度
- **撤销重做**（属性编辑防抖）、Schema JSON 导入 / 导出、本地持久化（localStorage）

## 技术栈

- React 19 + TypeScript + Vite
- Zustand（状态与本地持久化）
- React Router
- 自研 Schema 渲染引擎（无第三方低代码运行时依赖）

## 快速开始

```bash
npm install
npm run dev
```

浏览器打开控制台提示的本地地址（默认 `http://localhost:5173`）。

```bash
npm run build    # 生产构建
npm run preview  # 预览构建产物
```

## 目录结构

```
src/
  data/          # 组件物料、模板
  engine/        # Schema 树操作、渲染器、AI 生成
  store/         # 应用与设计器状态
  components/    # 设计器 UI
  pages/         # 工作台 / 设计器路由页
  styles/        # 全局设计系统
  types/         # Schema 类型
```

## AI 说明

当前 AI 助手为**可替换的本地意图引擎**（`src/engine/ai.ts`）：根据关键词与模板组装 Schema，便于离线演示。接入真实大模型时，只需让模型输出同构的 `SchemaNode` JSON，再调用 `replaceRoot` 即可。

## 品牌

**灵搭 Lingda** — 青绿品牌色 + Instrument Serif / Sora 字体，强调「搭」业务而非堆砌仪表盘。
