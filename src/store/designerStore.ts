import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { AIMessage, ComponentType, PageSchema, SchemaNode } from '../types/schema';
import {
  canAcceptChildren,
  cloneNode,
  createNode,
  findNode,
  findParent,
  insertChild,
  moveNode,
  removeNode,
  updateNode,
} from '../engine/tree';
import { generatePageFromPrompt } from '../engine/ai';
import { buildInitialValues, validateForm } from '../engine/form';
import { createEmptyPage } from '../data/templates';

interface DesignerState {
  appId: string | null;
  pageId: string | null;
  page: PageSchema | null;
  pageList: Array<{ id: string; name: string }>;
  selectedId: string | null;
  hoverId: string | null;
  dropTargetId: string | null;
  mode: 'design' | 'preview';
  device: 'desktop' | 'tablet' | 'mobile';
  showAI: boolean;
  showOutline: boolean;
  aiMessages: AIMessage[];
  aiLoading: boolean;
  dirty: boolean;
  history: PageSchema[];
  future: PageSchema[];
  formValues: Record<string, unknown>;
  formErrors: Record<string, string>;
  toast: string | null;

  loadApp: (appId: string, pages: PageSchema[], pageId?: string) => void;
  switchPage: (pageId: string, page: PageSchema) => void;
  addPage: (name?: string) => PageSchema | null;
  select: (id: string | null) => void;
  setHover: (id: string | null) => void;
  setDropTarget: (id: string | null) => void;
  setMode: (mode: 'design' | 'preview') => void;
  setDevice: (device: 'desktop' | 'tablet' | 'mobile') => void;
  toggleAI: () => void;
  toggleOutline: () => void;

  addComponent: (type: ComponentType, parentId?: string) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  updateSelectedProps: (props: Record<string, unknown>) => void;
  updateSelectedStyle: (style: Record<string, string>) => void;
  dropComponent: (type: ComponentType, targetId: string, index?: number) => void;
  relocateNode: (nodeId: string, targetParentId: string, index?: number) => void;
  replaceRoot: (root: SchemaNode, pageName?: string) => void;
  importPageSchema: (schema: PageSchema) => void;
  renamePage: (name: string) => void;

  undo: () => void;
  redo: () => void;
  markClean: () => void;
  syncPageListName: () => void;

  setFormValue: (name: string, value: unknown) => void;
  resetForm: () => void;
  submitForm: (successMessage?: string) => boolean;
  showToast: (message: string) => void;
  clearToast: () => void;

  askAI: (prompt: string) => Promise<void>;
  clearAI: () => void;
}

function pushHistory(state: DesignerState, nextPage: PageSchema) {
  const history = state.page ? [...state.history.slice(-29), state.page] : state.history;
  return { history, future: [] as PageSchema[], page: nextPage, dirty: true };
}

let historyTimer: ReturnType<typeof setTimeout> | null = null;
let historyBase: PageSchema | null = null;

function commitSoftEdit(
  get: () => DesignerState,
  set: (partial: Partial<DesignerState> | ((s: DesignerState) => Partial<DesignerState>)) => void,
  nextPage: PageSchema,
) {
  const state = get();
  if (!historyBase) historyBase = state.page;
  set({ page: nextPage, dirty: true, future: [] });
  if (historyTimer) clearTimeout(historyTimer);
  historyTimer = setTimeout(() => {
    const current = get();
    if (historyBase && current.page) {
      set({
        history: [...current.history.slice(-29), historyBase],
        future: [],
      });
    }
    historyBase = null;
    historyTimer = null;
  }, 400);
}

function flushHistory(get: () => DesignerState, set: (p: Partial<DesignerState>) => void) {
  if (historyTimer) {
    clearTimeout(historyTimer);
    historyTimer = null;
  }
  if (historyBase) {
    const current = get();
    set({
      history: [...current.history.slice(-29), historyBase],
      future: [],
    });
    historyBase = null;
  }
}

const welcomeAI: AIMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    '你好，我是灵搭 AI。可以说「生成请假审批表单」，或在现有页面上「增加手机号字段」「把标题改成出差申请」。',
  createdAt: new Date().toISOString(),
};

export const useDesignerStore = create<DesignerState>((set, get) => ({
  appId: null,
  pageId: null,
  page: null,
  pageList: [],
  selectedId: null,
  hoverId: null,
  dropTargetId: null,
  mode: 'design',
  device: 'desktop',
  showAI: true,
  showOutline: true,
  aiMessages: [welcomeAI],
  aiLoading: false,
  dirty: false,
  history: [],
  future: [],
  formValues: {},
  formErrors: {},
  toast: null,

  loadApp: (appId, pages, pageId) => {
    flushHistory(get, set);
    const target = pages.find((p) => p.id === pageId) ?? pages[0];
    if (!target) return;
    set({
      appId,
      pageId: target.id,
      page: structuredClone(target),
      pageList: pages.map((p) => ({ id: p.id, name: p.name })),
      selectedId: target.root.id,
      hoverId: null,
      dropTargetId: null,
      mode: 'design',
      dirty: false,
      history: [],
      future: [],
      formValues: buildInitialValues(target.root),
      formErrors: {},
      toast: null,
    });
  },

  switchPage: (pageId, page) => {
    flushHistory(get, set);
    set({
      pageId,
      page: structuredClone(page),
      selectedId: page.root.id,
      hoverId: null,
      dirty: false,
      history: [],
      future: [],
      formValues: buildInitialValues(page.root),
      formErrors: {},
      mode: 'design',
    });
  },

  addPage: (name = '新页面') => {
    const { appId, pageList } = get();
    if (!appId) return null;
    const page = createEmptyPage(name);
    set({
      pageList: [...pageList, { id: page.id, name: page.name }],
      pageId: page.id,
      page,
      selectedId: page.root.id,
      dirty: true,
      history: [],
      future: [],
      formValues: buildInitialValues(page.root),
      formErrors: {},
    });
    return page;
  },

  select: (id) => set({ selectedId: id }),
  setHover: (id) => set({ hoverId: id }),
  setDropTarget: (id) => set({ dropTargetId: id }),
  setMode: (mode) => {
    const { page } = get();
    if (mode === 'preview' && page) {
      set({
        mode,
        formValues: buildInitialValues(page.root),
        formErrors: {},
        selectedId: null,
      });
    } else {
      set({ mode });
    }
  },
  setDevice: (device) => set({ device }),
  toggleAI: () => set((s) => ({ showAI: !s.showAI })),
  toggleOutline: () => set((s) => ({ showOutline: !s.showOutline })),

  addComponent: (type, parentId) => {
    flushHistory(get, set);
    const { page, selectedId } = get();
    if (!page) return;
    const targetId = parentId ?? selectedId ?? page.root.id;
    const target = findNode(page.root, targetId);
    const parent =
      target && canAcceptChildren(target.type) ? target : findNode(page.root, page.root.id)!;
    const child = createNode(type);
    const root = insertChild(page.root, parent.id, child);
    const next = { ...page, root, updatedAt: new Date().toISOString() };
    set((s) => ({ ...pushHistory(s, next), selectedId: child.id }));
  },

  deleteSelected: () => {
    flushHistory(get, set);
    const { page, selectedId } = get();
    if (!page || !selectedId || selectedId === page.root.id) return;
    const root = removeNode(page.root, selectedId);
    const next = { ...page, root, updatedAt: new Date().toISOString() };
    set((s) => ({ ...pushHistory(s, next), selectedId: page.root.id }));
  },

  duplicateSelected: () => {
    flushHistory(get, set);
    const { page, selectedId } = get();
    if (!page || !selectedId || selectedId === page.root.id) return;
    const node = findNode(page.root, selectedId);
    const parent = findParent(page.root, selectedId);
    if (!node || !parent) return;
    const cloned = cloneNode(node);
    const idx = (parent.children ?? []).findIndex((c) => c.id === selectedId);
    const root = insertChild(page.root, parent.id, cloned, idx + 1);
    const next = { ...page, root, updatedAt: new Date().toISOString() };
    set((s) => ({ ...pushHistory(s, next), selectedId: cloned.id }));
  },

  updateSelectedProps: (props) => {
    const { page, selectedId } = get();
    if (!page || !selectedId) return;
    const root = updateNode(page.root, selectedId, (n) => ({
      ...n,
      props: { ...n.props, ...props },
    }));
    const next = { ...page, root, updatedAt: new Date().toISOString() };
    commitSoftEdit(get, set, next);
  },

  updateSelectedStyle: (style) => {
    const { page, selectedId } = get();
    if (!page || !selectedId) return;
    const root = updateNode(page.root, selectedId, (n) => ({
      ...n,
      style: { ...n.style, ...style },
    }));
    const next = { ...page, root, updatedAt: new Date().toISOString() };
    commitSoftEdit(get, set, next);
  },

  dropComponent: (type, targetId, index) => {
    flushHistory(get, set);
    const { page } = get();
    if (!page) return;
    let parentId = targetId;
    let insertIndex = index;
    const target = findNode(page.root, targetId);
    if (!target) return;
    if (!canAcceptChildren(target.type)) {
      const parent = findParent(page.root, targetId);
      parentId = parent?.id ?? page.root.id;
      if (parent && insertIndex === undefined) {
        insertIndex = (parent.children ?? []).findIndex((c) => c.id === targetId) + 1;
      }
    }
    const child = createNode(type);
    const root = insertChild(page.root, parentId, child, insertIndex);
    const next = { ...page, root, updatedAt: new Date().toISOString() };
    set((s) => ({
      ...pushHistory(s, next),
      selectedId: child.id,
      dropTargetId: null,
    }));
  },

  relocateNode: (nodeId, targetParentId, index) => {
    flushHistory(get, set);
    const { page } = get();
    if (!page || nodeId === page.root.id) return;
    const target = findNode(page.root, targetParentId);
    if (!target || !canAcceptChildren(target.type)) return;
    const root = moveNode(page.root, nodeId, targetParentId, index);
    const next = { ...page, root, updatedAt: new Date().toISOString() };
    set((s) => ({ ...pushHistory(s, next), selectedId: nodeId, dropTargetId: null }));
  },

  replaceRoot: (root, pageName) => {
    flushHistory(get, set);
    const { page } = get();
    if (!page) return;
    const next: PageSchema = {
      ...page,
      name: pageName ?? page.name,
      root,
      updatedAt: new Date().toISOString(),
    };
    set((s) => ({
      ...pushHistory(s, next),
      selectedId: root.id,
      formValues: buildInitialValues(root),
      formErrors: {},
      pageList: s.pageList.map((p) =>
        p.id === next.id ? { ...p, name: next.name } : p,
      ),
    }));
  },

  importPageSchema: (schema) => {
    flushHistory(get, set);
    const { page } = get();
    if (!page) return;
    const next: PageSchema = {
      ...page,
      name: schema.name || page.name,
      root: structuredClone(schema.root),
      updatedAt: new Date().toISOString(),
    };
    set((s) => ({
      ...pushHistory(s, next),
      selectedId: next.root.id,
      formValues: buildInitialValues(next.root),
      formErrors: {},
      pageList: s.pageList.map((p) =>
        p.id === next.id ? { ...p, name: next.name } : p,
      ),
    }));
  },

  renamePage: (name) => {
    const { page } = get();
    if (!page) return;
    const next = { ...page, name, updatedAt: new Date().toISOString() };
    commitSoftEdit(get, set, next);
    set((s) => ({
      pageList: s.pageList.map((p) => (p.id === next.id ? { ...p, name } : p)),
    }));
  },

  undo: () => {
    flushHistory(get, set);
    const { history, page, future } = get();
    if (!history.length || !page) return;
    const prev = history[history.length - 1];
    set({
      page: prev,
      history: history.slice(0, -1),
      future: [page, ...future],
      dirty: true,
      selectedId: prev.root.id,
      formValues: buildInitialValues(prev.root),
      pageList: get().pageList.map((p) =>
        p.id === prev.id ? { ...p, name: prev.name } : p,
      ),
    });
  },

  redo: () => {
    flushHistory(get, set);
    const { future, page, history } = get();
    if (!future.length || !page) return;
    const next = future[0];
    set({
      page: next,
      future: future.slice(1),
      history: [...history, page],
      dirty: true,
      selectedId: next.root.id,
      formValues: buildInitialValues(next.root),
    });
  },

  markClean: () => set({ dirty: false }),
  syncPageListName: () => {
    const { page, pageList } = get();
    if (!page) return;
    set({
      pageList: pageList.map((p) => (p.id === page.id ? { ...p, name: page.name } : p)),
    });
  },

  setFormValue: (name, value) =>
    set((s) => ({
      formValues: { ...s.formValues, [name]: value },
      formErrors: { ...s.formErrors, [name]: '' },
    })),

  resetForm: () => {
    const { page } = get();
    if (!page) return;
    set({
      formValues: buildInitialValues(page.root),
      formErrors: {},
      toast: '表单已重置',
    });
    window.setTimeout(() => {
      if (get().toast === '表单已重置') set({ toast: null });
    }, 1800);
  },

  submitForm: (successMessage = '提交成功') => {
    const { page, formValues } = get();
    if (!page) return false;
    const errors = validateForm(page.root, formValues);
    if (Object.keys(errors).length) {
      set({ formErrors: errors, toast: '请完善必填项后再提交' });
      window.setTimeout(() => {
        if (get().toast === '请完善必填项后再提交') set({ toast: null });
      }, 2000);
      return false;
    }
    set({ formErrors: {}, toast: successMessage });
    window.setTimeout(() => {
      if (get().toast === successMessage) set({ toast: null });
    }, 2200);
    return true;
  },

  showToast: (message) => {
    set({ toast: message });
    window.setTimeout(() => {
      if (get().toast === message) set({ toast: null });
    }, 2000);
  },
  clearToast: () => set({ toast: null }),

  askAI: async (prompt) => {
    const content = prompt.trim();
    if (!content) return;
    const userMsg: AIMessage = {
      id: nanoid(8),
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({
      aiMessages: [...s.aiMessages, userMsg],
      aiLoading: true,
      showAI: true,
    }));
    try {
      const currentRoot = get().page?.root;
      const result = await generatePageFromPrompt(content, currentRoot);
      const assistant: AIMessage = {
        id: nanoid(8),
        role: 'assistant',
        content: result.reply,
        schemaPatch: result.root,
        mode: result.mode,
        createdAt: new Date().toISOString(),
      };
      if (result.mode === 'replace') {
        const hasContent = (currentRoot?.children?.length ?? 0) > 1;
        if (hasContent) {
          const ok = window.confirm('AI 将替换当前整页内容，是否继续？可先撤销恢复。');
          if (!ok) {
            set((s) => ({
              aiLoading: false,
              aiMessages: [
                ...s.aiMessages,
                {
                  id: nanoid(8),
                  role: 'assistant',
                  content: '已取消整页替换。你也可以用「增加xxx字段」做局部细化。',
                  createdAt: new Date().toISOString(),
                },
              ],
            }));
            return;
          }
        }
        get().replaceRoot(result.root, result.pageName);
      } else {
        get().replaceRoot(result.root);
      }
      set((s) => ({
        aiMessages: [...s.aiMessages, assistant],
        aiLoading: false,
      }));
    } catch {
      set((s) => ({
        aiLoading: false,
        aiMessages: [
          ...s.aiMessages,
          {
            id: nanoid(8),
            role: 'assistant',
            content: '生成失败，请稍后重试或换一种描述方式。',
            createdAt: new Date().toISOString(),
          },
        ],
      }));
    }
  },

  clearAI: () => set({ aiMessages: [{ ...welcomeAI, createdAt: new Date().toISOString() }] }),
}));
