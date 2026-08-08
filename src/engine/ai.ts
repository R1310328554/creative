import { nanoid } from 'nanoid';
import type { SchemaNode } from '../types/schema';
import {
  createCrmDashboardPage,
  createLeaveFormPage,
  createOnboardingPage,
  createEmptyPage,
} from '../data/templates';
import { appendFieldsToRoot } from './form';
import { updateNode } from './tree';

export interface AIGenerateResult {
  reply: string;
  root: SchemaNode;
  pageName?: string;
  mode: 'replace' | 'refine';
}

function matches(text: string, keywords: string[]) {
  return keywords.some((k) => text.includes(k));
}

function isRefineIntent(text: string) {
  return matches(text, [
    '增加',
    '添加',
    '加上',
    '加一个',
    '加个',
    '补充',
    '插入',
    '改成',
    '修改',
    '把',
    '标题改',
    '字段',
  ]);
}

/** 本地规则引擎：生成或细化页面 Schema（可替换为真实大模型 API） */
export async function generatePageFromPrompt(
  prompt: string,
  currentRoot?: SchemaNode | null,
): Promise<AIGenerateResult> {
  await new Promise((r) => setTimeout(r, 550 + Math.random() * 450));
  const text = prompt.trim().toLowerCase();
  const raw = prompt.trim();

  if (currentRoot && isRefineIntent(text)) {
    return refinePage(raw, text, currentRoot);
  }

  if (matches(text, ['请假', '休假', '年假', 'leave'])) {
    const page = createLeaveFormPage();
    return {
      reply:
        '已根据「请假审批」场景生成表单：包含申请人、类型、日期区间、事由与提交操作。可继续说「增加附件说明字段」进行细化。',
      root: withButtonActions(page.root),
      pageName: page.name,
      mode: 'replace',
    };
  }

  if (matches(text, ['入职', '新员工', 'onboard', '登记'])) {
    const page = createOnboardingPage();
    return {
      reply: '已生成「员工入职登记」双栏表单。可说「增加紧急联系人字段」继续完善。',
      root: withButtonActions(page.root),
      pageName: page.name,
      mode: 'replace',
    };
  }

  if (matches(text, ['看板', 'dashboard', '销售', 'crm', '商机', '经营'])) {
    const page = createCrmDashboardPage();
    return {
      reply: '已生成销售经营看板：四个核心指标 + 近期商机表格。',
      root: page.root,
      pageName: page.name,
      mode: 'replace',
    };
  }

  if (matches(text, ['报销', '费用', 'expense'])) {
    return {
      reply: '已生成费用报销表单。预览模式下可填写并提交校验。',
      root: withButtonActions(buildExpenseForm()),
      pageName: '费用报销',
      mode: 'replace',
    };
  }

  if (matches(text, ['客户', '联系人', '线索'])) {
    return {
      reply: '已生成客户信息采集页。',
      root: withButtonActions(buildCustomerForm()),
      pageName: '客户建档',
      mode: 'replace',
    };
  }

  if (matches(text, ['问卷', '调研', '反馈', 'survey'])) {
    return {
      reply: '已生成简易调研问卷。',
      root: withButtonActions(buildSurvey()),
      pageName: '满意度调研',
      mode: 'replace',
    };
  }

  const title = extractTitle(raw) || 'AI 生成页面';
  return {
    reply: `已根据描述「${raw.slice(0, 40)}${raw.length > 40 ? '…' : ''}」生成页面骨架。可继续用「增加xxx字段」细化。`,
    root: withButtonActions(buildGenericForm(title, raw)),
    pageName: title,
    mode: 'replace',
  };
}

function refinePage(raw: string, text: string, current: SchemaNode): AIGenerateResult {
  // 改标题
  const titleMatch = raw.match(/(?:标题|名称).*?(?:改成|改为|换成)\s*[「"']?(.+?)[」"']?$/);
  if (titleMatch || matches(text, ['标题改', '改标题'])) {
    const newTitle =
      titleMatch?.[1]?.trim() ||
      raw.replace(/.*(改成|改为|换成)/, '').trim() ||
      '未命名页面';
    let root = current;
    const heading = findFirst(current, 'Heading');
    if (heading) {
      root = updateNode(current, heading.id, (n) => ({
        ...n,
        props: { ...n.props, text: newTitle },
      }));
    }
    return {
      reply: `已将标题更新为「${newTitle}」。`,
      root,
      mode: 'refine',
    };
  }

  // 增加字段
  if (matches(text, ['增加', '添加', '加上', '加一个', '加个', '补充', '插入'])) {
    const fields = inferFieldsFromRefine(raw, text);
    if (fields.length) {
      const root = appendFieldsToRoot(current, fields);
      const names = fields.map((f) => String(f.props.label ?? f.type)).join('、');
      return {
        reply: `已在页面中追加字段：${names}。可在大纲或画布中继续调整位置。`,
        root,
        mode: 'refine',
      };
    }
  }

  // 增加提示条
  if (matches(text, ['提示', '警告', 'alert', '说明条'])) {
    const alert = n('Alert', {
      title: '提示',
      message: raw.replace(/.*(提示|警告)[：:]?/, '').trim() || '请注意填写规范。',
      tone: matches(text, ['警告']) ? 'warning' : 'info',
    });
    const children = [...(current.children ?? [])];
    const insertAt = Math.min(2, children.length);
    children.splice(insertAt, 0, alert);
    return {
      reply: '已在页面顶部附近插入提示条。',
      root: { ...current, children },
      mode: 'refine',
    };
  }

  return {
    reply:
      '已理解你的细化需求，但未能精确匹配操作。可尝试：「增加手机号字段」「把标题改成出差申请」「添加提示条」。也可以直接描述要重新生成的完整页面。',
    root: current,
    mode: 'refine',
  };
}

function inferFieldsFromRefine(raw: string, text: string): SchemaNode[] {
  const fields: SchemaNode[] = [];
  const pushInput = (label: string, name: string, required = false) => {
    fields.push(n('Input', { label, name, placeholder: `请输入${label}`, required }));
  };

  if (matches(text, ['手机', '电话', '联系方式'])) {
    pushInput('手机号', 'phone', true);
  }
  if (matches(text, ['邮箱', 'email', '邮件'])) {
    pushInput('邮箱', 'email');
  }
  if (matches(text, ['附件', '上传', '证明', '发票号'])) {
    pushInput('附件说明', 'attachment');
  }
  if (matches(text, ['紧急联系人'])) {
    pushInput('紧急联系人', 'emergencyContact', true);
    pushInput('紧急联系电话', 'emergencyPhone', true);
  }
  if (matches(text, ['地址', '住址'])) {
    fields.push(n('TextArea', { label: '地址', name: 'address', rows: 2, placeholder: '请输入地址' }));
  }
  if (matches(text, ['备注', '说明'])) {
    fields.push(n('TextArea', { label: '备注', name: 'extraRemark', rows: 3, placeholder: '补充说明' }));
  }
  if (matches(text, ['日期', '时间'])) {
    fields.push(n('DatePicker', { label: '日期', name: `date_${nanoid(4)}`, required: false }));
  }
  if (matches(text, ['开关', '是否'])) {
    const label = raw.match(/增加(.+?)(开关|字段)?/)?.[1]?.trim() || '是否启用';
    fields.push(n('Switch', { label, name: `switch_${nanoid(4)}`, checked: false }));
  }
  if (matches(text, ['下拉', '选择', '类型'])) {
    fields.push(
      n('Select', {
        label: '类型',
        name: `select_${nanoid(4)}`,
        options: ['选项 A', '选项 B', '选项 C'],
        placeholder: '请选择',
      }),
    );
  }

  // 通用：增加XXX字段
  if (!fields.length) {
    const m = raw.match(/(?:增加|添加|加上|加一个|加个)\s*[「"']?(.+?)[」"']?(?:字段|输入框|表单项)?$/);
    const label = m?.[1]?.replace(/(字段|输入框|表单项)$/, '').trim();
    if (label && label.length <= 20) {
      pushInput(label, `field_${nanoid(4)}`);
    }
  }

  return fields;
}

function findFirst(root: SchemaNode, type: SchemaNode['type']): SchemaNode | null {
  if (root.type === type) return root;
  for (const c of root.children ?? []) {
    const f = findFirst(c, type);
    if (f) return f;
  }
  return null;
}

function withButtonActions(root: SchemaNode): SchemaNode {
  const map = (node: SchemaNode): SchemaNode => {
    if (node.type === 'Button') {
      const text = String(node.props.text ?? '');
      let action = String(node.props.action ?? 'toast');
      if (/提交|保存|报销|问卷|审批/.test(text)) action = 'submit';
      else if (/重置|取消|清空/.test(text)) action = 'reset';
      return {
        ...node,
        props: {
          ...node.props,
          action,
          actionMessage: node.props.actionMessage ?? `${text || '操作'}成功`,
        },
        children: node.children?.map(map),
      };
    }
    return { ...node, children: node.children?.map(map) };
  };
  return map(root);
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

function buildExpenseForm(): SchemaNode {
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
      n(
        'Row',
        {},
        [
          n('Button', { text: '重置', variant: 'ghost', action: 'reset' }),
          n('Button', {
            text: '提交报销',
            variant: 'primary',
            action: 'submit',
            actionMessage: '报销已提交，等待财务审核',
          }),
        ],
        { justifyContent: 'flex-end', gap: '12px' },
      ),
    ],
    { padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' },
  );
}

function buildCustomerForm(): SchemaNode {
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
            n('Input', {
              label: '客户名称',
              placeholder: '公司或联系人',
              name: 'customer',
              required: true,
            }),
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
      n('Button', {
        text: '保存客户',
        variant: 'primary',
        action: 'submit',
        actionMessage: '客户档案已保存',
      }),
    ],
    { padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' },
  );
}

function buildSurvey(): SchemaNode {
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
      n('Button', {
        text: '提交问卷',
        variant: 'primary',
        action: 'submit',
        actionMessage: '感谢反馈，问卷已提交',
      }),
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
    n(
      'Row',
      {},
      [
        n('Button', { text: '重置', variant: 'ghost', action: 'reset' }),
        n('Button', {
          text: '提交',
          variant: 'primary',
          action: 'submit',
          actionMessage: '提交成功',
        }),
      ],
      { justifyContent: 'flex-end', gap: '12px' },
    ),
  ];
  return page.root;
}

export const AI_QUICK_PROMPTS = [
  '生成一个请假审批表单',
  '做一个销售经营看板',
  '创建员工入职登记页',
  '生成费用报销申请单',
  '增加手机号字段',
  '把标题改成出差申请',
];

export const AI_REFINE_PROMPTS = [
  '增加手机号字段',
  '增加附件说明字段',
  '增加备注字段',
  '把标题改成出差申请',
  '添加提示条：请仔细核对信息',
];
