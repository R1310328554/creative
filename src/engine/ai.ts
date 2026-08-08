import { nanoid } from 'nanoid';
import type { SchemaNode } from '../types/schema';
import {
  createCrmDashboardPage,
  createLeaveFormPage,
  createOnboardingPage,
  createEmptyPage,
} from '../data/templates';

export interface AIGenerateResult {
  reply: string;
  root: SchemaNode;
  pageName: string;
}

function matches(text: string, keywords: string[]) {
  return keywords.some((k) => text.includes(k));
}

/** 本地规则引擎：根据自然语言意图生成页面 Schema（可替换为真实大模型 API） */
export async function generatePageFromPrompt(prompt: string): Promise<AIGenerateResult> {
  await new Promise((r) => setTimeout(r, 700 + Math.random() * 500));
  const text = prompt.trim().toLowerCase();
  const raw = prompt.trim();

  if (matches(text, ['请假', '休假', '年假', 'leave'])) {
    const page = createLeaveFormPage();
    return {
      reply: '已根据「请假审批」场景生成表单：包含申请人、类型、日期区间、事由与提交操作。可在画布上继续调整字段。',
      root: page.root,
      pageName: page.name,
    };
  }

  if (matches(text, ['入职', '新员工', 'onboard', '登记'])) {
    const page = createOnboardingPage();
    return {
      reply: '已生成「员工入职登记」双栏表单：左侧个人信息，右侧入职物资与工位偏好。',
      root: page.root,
      pageName: page.name,
    };
  }

  if (matches(text, ['看板', 'dashboard', '销售', 'crm', '商机', '经营'])) {
    const page = createCrmDashboardPage();
    return {
      reply: '已生成销售经营看板：四个核心指标 + 近期商机表格，适合作为 CRM 首页。',
      root: page.root,
      pageName: page.name,
    };
  }

  if (matches(text, ['报销', '费用', 'expense'])) {
    const root = buildExpenseForm(raw);
    return {
      reply: '已生成费用报销表单：含费用类型、金额、发生日期、发票上传说明与审批提交。',
      root,
      pageName: '费用报销',
    };
  }

  if (matches(text, ['客户', '联系人', '线索'])) {
    const root = buildCustomerForm(raw);
    return {
      reply: '已生成客户信息采集页：基础档案、跟进状态与备注字段已就绪。',
      root,
      pageName: '客户建档',
    };
  }

  if (matches(text, ['问卷', '调研', '反馈', 'survey'])) {
    const root = buildSurvey(raw);
    return {
      reply: '已生成简易调研问卷：满意度评分、多选题与开放反馈区。',
      root,
      pageName: '满意度调研',
    };
  }

  // 通用：从提示词抽取标题，拼装基础表单骨架
  const title = extractTitle(raw) || 'AI 生成页面';
  const root = buildGenericForm(title, raw);
  return {
    reply: `已根据描述「${raw.slice(0, 40)}${raw.length > 40 ? '…' : ''}」生成可编辑页面骨架。你可以继续用自然语言细化，或在右侧属性面板微调。`,
    root,
    pageName: title,
  };
}

function extractTitle(prompt: string): string | null {
  const m =
    prompt.match(/生成?[一个张]?(.+?)(页面|表单|看板|应用)/) ||
    prompt.match(/做[一个张]?(.+?)(页面|表单|看板)/) ||
    prompt.match(/创建(.+?)(页面|表单|看板)/);
  return m?.[1]?.trim().slice(0, 20) || null;
}

function n(
  type: SchemaNode['type'],
  props: Record<string, unknown> = {},
  children: SchemaNode[] = [],
  style: SchemaNode['style'] = {},
): SchemaNode {
  return { id: nanoid(8), type, props, children, style, label: type };
}

function buildExpenseForm(_hint: string): SchemaNode {
  return n(
    'Page',
    { title: '费用报销' },
    [
      n('Heading', { text: '费用报销申请', level: 1 }),
      n('Text', { text: '提交报销明细，财务将在 3 个工作日内完成审核。' }),
      n('Alert', {
        title: '发票要求',
        message: '单笔超过 500 元需上传电子发票或照片。',
        tone: 'warning',
      }),
      n(
        'Card',
        { title: '报销明细', subtitle: '' },
        [
          n('Select', {
            label: '费用类型',
            options: ['差旅', '餐饮', '交通', '办公用品', '其他'],
            name: 'category',
            required: true,
          }),
          n('Row', {}, [
            n('Input', { label: '金额（元）', placeholder: '0.00', name: 'amount', required: true }),
            n('DatePicker', { label: '发生日期', name: 'occurredAt', required: true }),
          ]),
          n('TextArea', {
            label: '费用说明',
            placeholder: '请描述业务背景',
            name: 'desc',
            rows: 3,
          }),
          n('Input', { label: '发票号 / 附件说明', placeholder: '选填', name: 'invoice' }),
        ],
        { padding: '24px', borderRadius: '16px', background: '#fff', border: '1px solid #e2e8f0' },
      ),
      n('Row', {}, [
        n('Button', { text: '取消', variant: 'ghost' }),
        n('Button', { text: '提交报销', variant: 'primary' }),
      ], { justifyContent: 'flex-end', gap: '12px' }),
    ],
    { padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' },
  );
}

function buildCustomerForm(_hint: string): SchemaNode {
  return n(
    'Page',
    { title: '客户建档' },
    [
      n('Heading', { text: '客户建档', level: 1 }),
      n('Text', { text: '录入潜在客户信息，便于销售跟进与转化。' }),
      n(
        'Card',
        { title: '客户档案', subtitle: '' },
        [
          n('Row', {}, [
            n('Input', { label: '客户名称', placeholder: '公司或联系人', name: 'customer', required: true }),
            n('Input', { label: '联系电话', placeholder: '手机号', name: 'phone' }),
          ]),
          n('Row', {}, [
            n('Select', {
              label: '客户来源',
              options: ['官网', '转介绍', '展会', '广告投放', '其他'],
              name: 'source',
            }),
            n('Select', {
              label: '跟进状态',
              options: ['新线索', '沟通中', '方案中', '已成交', '已流失'],
              name: 'status',
            }),
          ]),
          n('TextArea', { label: '需求备注', placeholder: '记录客户诉求', name: 'note', rows: 4 }),
        ],
        { padding: '24px', borderRadius: '16px', background: '#fff', border: '1px solid #e2e8f0' },
      ),
      n('Button', { text: '保存客户', variant: 'primary' }),
    ],
    { padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' },
  );
}

function buildSurvey(_hint: string): SchemaNode {
  return n(
    'Page',
    { title: '满意度调研' },
    [
      n('Heading', { text: '产品满意度调研', level: 1 }),
      n('Text', { text: '感谢参与，预计 2 分钟完成。' }),
      n(
        'Card',
        { title: '问卷内容', subtitle: '' },
        [
          n('Radio', {
            label: '整体满意度',
            options: ['非常满意', '满意', '一般', '不满意'],
            value: '满意',
            name: 'score',
          }),
          n('Select', {
            label: '最常用功能',
            options: ['表单设计', '流程审批', '数据看板', 'AI 生成'],
            name: 'feature',
          }),
          n('Checkbox', { label: '愿意接受回访', checked: false, name: 'callback' }),
          n('TextArea', {
            label: '改进建议',
            placeholder: '告诉我们你的想法',
            name: 'feedback',
            rows: 4,
          }),
        ],
        { padding: '24px', borderRadius: '16px', background: '#fff', border: '1px solid #e2e8f0' },
      ),
      n('Button', { text: '提交问卷', variant: 'primary' }),
    ],
    { padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' },
  );
}

function buildGenericForm(title: string, prompt: string): SchemaNode {
  const page = createEmptyPage(title);
  page.root.children = [
    n('Heading', { text: title, level: 1 }),
    n('Text', { text: `由 AI 根据「${prompt.slice(0, 60)}」生成的可编辑骨架。` }),
    n(
      'Card',
      { title: '信息填写', subtitle: '可继续增删字段' },
      [
        n('Input', { label: '名称', placeholder: '请输入', name: 'name', required: true }),
        n('Select', {
          label: '分类',
          options: ['类型一', '类型二', '类型三'],
          name: 'category',
        }),
        n('DatePicker', { label: '日期', name: 'date' }),
        n('TextArea', { label: '说明', placeholder: '补充信息', name: 'desc', rows: 3 }),
        n('Switch', { label: '需要跟进', checked: false, name: 'follow' }),
      ],
      { padding: '24px', borderRadius: '16px', background: '#fff', border: '1px solid #e2e8f0' },
    ),
    n('Row', {}, [
      n('Button', { text: '重置', variant: 'ghost' }),
      n('Button', { text: '提交', variant: 'primary' }),
    ], { justifyContent: 'flex-end', gap: '12px' }),
  ];
  return page.root;
}

export const AI_QUICK_PROMPTS = [
  '生成一个请假审批表单',
  '做一个销售经营看板',
  '创建员工入职登记页',
  '生成费用报销申请单',
  '做一个客户建档表单',
  '创建满意度调研问卷',
];
