import { nanoid } from 'nanoid';
import type { LowcodeApp, PageSchema, SchemaNode } from '../types/schema';

const now = () => new Date().toISOString();

function node(
  type: SchemaNode['type'],
  props: Record<string, unknown> = {},
  children: SchemaNode[] = [],
  style: SchemaNode['style'] = {},
): SchemaNode {
  return { id: nanoid(8), type, props, children, style };
}

export function createEmptyPage(name = '未命名页面'): PageSchema {
  return {
    id: nanoid(10),
    name,
    description: '',
    updatedAt: now(),
    root: node(
      'Page',
      { title: name },
      [
        node('Heading', { text: name, level: 1 }, [], { margin: '0 0 8px' }),
        node('Text', { text: '从左侧拖入组件，或让 AI 帮你生成页面。' }, [], {
          margin: '0 0 24px',
          color: '#64748b',
        }),
        node(
          'Section',
          { title: '' },
          [],
          {
            padding: '28px',
            minHeight: '160px',
            border: '1px dashed #cbd5e1',
            borderRadius: '16px',
            background: 'rgba(255,255,255,0.7)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          } as SchemaNode['style'],
        ),
      ],
      {
        padding: '32px',
        minHeight: '100%',
        background: 'transparent',
        display: 'flex',
        flexDirection: 'column',
        gap: '0',
      },
    ),
  };
}

export function createLeaveFormPage(): PageSchema {
  return {
    id: nanoid(10),
    name: '请假申请',
    description: '员工请假流程表单',
    updatedAt: now(),
    root: node(
      'Page',
      { title: '请假申请' },
      [
        node('Heading', { text: '请假申请', level: 1 }),
        node('Text', { text: '填写请假信息并提交审批，系统将自动通知直属主管。' }),
        node('Alert', {
          title: '审批说明',
          message: '年假需提前 1 个工作日申请；病假请上传相关证明。',
          tone: 'info',
        }),
        node(
          'Card',
          { title: '基本信息', subtitle: '申请人与请假类型' },
          [
            node('Row', {}, [
              node('Input', { label: '申请人', placeholder: '自动带出', name: 'applicant', required: true }),
              node('Select', {
                label: '请假类型',
                options: ['年假', '事假', '病假', '调休'],
                name: 'leaveType',
                required: true,
              }),
            ]),
            node('Row', {}, [
              node('DatePicker', { label: '开始日期', name: 'startDate', required: true }),
              node('DatePicker', { label: '结束日期', name: 'endDate', required: true }),
            ]),
            node('TextArea', {
              label: '请假事由',
              placeholder: '请说明请假原因',
              name: 'reason',
              rows: 4,
              required: true,
            }),
            node('Switch', { label: '是否需要工作交接', checked: true, name: 'handover' }),
          ],
          { padding: '24px', borderRadius: '16px', background: '#fff', border: '1px solid #e2e8f0' },
        ),
        node('Row', {}, [
          node('Button', { text: '保存草稿', variant: 'ghost', size: 'md' }),
          node('Button', { text: '提交审批', variant: 'primary', size: 'md' }),
        ], { justifyContent: 'flex-end', gap: '12px', margin: '8px 0 0' }),
      ],
      { padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' },
    ),
  };
}

export function createCrmDashboardPage(): PageSchema {
  return {
    id: nanoid(10),
    name: '销售看板',
    description: 'CRM 经营概览',
    updatedAt: now(),
    root: node(
      'Page',
      { title: '销售看板' },
      [
        node('Heading', { text: '销售经营看板', level: 1 }),
        node('Text', { text: '实时掌握商机、成交与跟进情况。' }),
        node(
          'Row',
          {},
          [
            node('Stat', { label: '本月商机', value: '86', trend: '+18%', tone: 'positive' }),
            node('Stat', { label: '成交金额', value: '¥128万', trend: '+9%', tone: 'positive' }),
            node('Stat', { label: '跟进中', value: '34', trend: '-3%', tone: 'neutral' }),
            node('Stat', { label: '流失风险', value: '7', trend: '+2', tone: 'warning' }),
          ],
          { gap: '16px' },
        ),
        node(
          'Card',
          { title: '近期商机', subtitle: '按更新时间排序' },
          [
            node('Table', {
              title: '',
              columns: ['客户', '阶段', '负责人', '预计金额'],
              rows: [
                ['星河科技', '方案报价', '周宁', '¥46万'],
                ['青竹零售', '需求确认', '林悦', '¥18万'],
                ['远航物流', '商务谈判', '赵凯', '¥72万'],
              ],
            }),
          ],
          { padding: '20px', borderRadius: '16px', background: '#fff', border: '1px solid #e2e8f0' },
        ),
      ],
      { padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' },
    ),
  };
}

export function createOnboardingPage(): PageSchema {
  return {
    id: nanoid(10),
    name: '员工入职',
    description: '新员工信息采集',
    updatedAt: now(),
    root: node(
      'Page',
      { title: '员工入职登记' },
      [
        node('Heading', { text: '员工入职登记', level: 1 }),
        node('Text', { text: '人力资源部用于采集新员工基础档案与入职物资需求。' }),
        node(
          'Columns',
          { columns: 2 },
          [
            node(
              'Card',
              { title: '个人信息', subtitle: '' },
              [
                node('Input', { label: '姓名', placeholder: '请输入姓名', name: 'name', required: true }),
                node('Input', { label: '手机号', placeholder: '请输入手机号', name: 'phone', required: true }),
                node('Select', {
                  label: '部门',
                  options: ['产品', '研发', '设计', '运营', '销售'],
                  name: 'dept',
                }),
                node('DatePicker', { label: '入职日期', name: 'joinDate' }),
              ],
              { padding: '20px', borderRadius: '16px', background: '#fff', border: '1px solid #e2e8f0' },
            ),
            node(
              'Card',
              { title: '入职准备', subtitle: '' },
              [
                node('Checkbox', { label: '需要电脑设备', checked: true, name: 'laptop' }),
                node('Checkbox', { label: '需要门禁卡', checked: true, name: 'badge' }),
                node('Radio', {
                  label: '工位偏好',
                  options: ['开放区', '靠窗', '安静区'],
                  value: '开放区',
                  name: 'seat',
                }),
                node('TextArea', { label: '备注', placeholder: '其他需求', name: 'note', rows: 3 }),
              ],
              { padding: '20px', borderRadius: '16px', background: '#fff', border: '1px solid #e2e8f0' },
            ),
          ],
          { display: 'grid', gap: '16px' },
        ),
        node('Button', { text: '提交入职信息', variant: 'primary', size: 'md' }),
      ],
      { padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' },
    ),
  };
}

export const starterApps: LowcodeApp[] = [
  {
    id: 'app-leave',
    name: '请假审批',
    description: '人事请假申请与审批表单，含类型、日期与事由。',
    type: 'form',
    createdAt: '2026-08-01T08:00:00.000Z',
    updatedAt: '2026-08-07T10:20:00.000Z',
    pages: [createLeaveFormPage()],
  },
  {
    id: 'app-crm',
    name: '销售看板',
    description: 'CRM 经营概览，指标卡与商机列表一页呈现。',
    type: 'dashboard',
    createdAt: '2026-08-02T08:00:00.000Z',
    updatedAt: '2026-08-08T09:10:00.000Z',
    pages: [createCrmDashboardPage()],
  },
  {
    id: 'app-onboard',
    name: '入职登记',
    description: '新员工档案采集与入职物资准备清单。',
    type: 'form',
    createdAt: '2026-08-03T08:00:00.000Z',
    updatedAt: '2026-08-06T15:40:00.000Z',
    pages: [createOnboardingPage()],
  },
];

export const templateGallery = [
  {
    id: 'tpl-leave',
    name: '请假申请单',
    type: 'form' as const,
    blurb: '人事流程 · 审批表单',
    build: createLeaveFormPage,
  },
  {
    id: 'tpl-crm',
    name: '销售经营看板',
    type: 'dashboard' as const,
    blurb: '数据洞察 · 指标总览',
    build: createCrmDashboardPage,
  },
  {
    id: 'tpl-onboard',
    name: '员工入职登记',
    type: 'form' as const,
    blurb: 'HR 采集 · 双栏布局',
    build: createOnboardingPage,
  },
  {
    id: 'tpl-blank',
    name: '空白页面',
    type: 'page' as const,
    blurb: '从零开始设计',
    build: () => createEmptyPage('空白页面'),
  },
];
