import { create } from 'zustand';
import type { AIMessage, ComponentType, PageSchema, SchemaNode } from '../types/schema';
import {
  canAcceptChildren,
  createNode,
  findNode,
  insertChild,
  moveNode,
  removeNode,
  updateNode,
} from '../engine/tree';
import { generatePageFromPrompt } from '../engine/ai';
import { nanoid } from 'nanoid';

interface DesignerState {
  appId: string | null;
  page: PageSchema | null;
  selectedId: string | null;
  hoverId: string | null;
  mode: 'design' | 'preview';
  device: 'desktop' | 'tablet' | 'mobile';
  showAI: boolean;
  showOutline: boolean;
  aiMessages: AIMessage[];
  aiLoading: boolean;
  dirty: boolean;
  history: PageSchema[];
  future: PageSchema[];

  loadPage: (appId: string, page: PageSchema) => void;
  select: (id: string | null) => void;
  setHover: (id: string | null) => void;
  setMode: (mode: 'design' | 'preview') => void;
  setDevice: (device: 'desktop' | 'tablet' | 'mobile') => void;
  toggleAI: () => void;
  toggleOutline: () => void;

  addComponent: (type: ComponentType, parentId?: string) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  updateSelectedProps: (props: Record<string, unknown>) => void;
  updateSelectedStyle: (style: Record<string, string>) => void;
  dropComponent: (type: ComponentType, targetId: string) => void;
  relocateNode: (nodeId: string, targetParentId: string) => void;
  replaceRoot: (root: SchemaNode, pageName?: string) => void;
  renamePage: (name: string) => void;

  undo: () => void;
  redo: () => void;
  markClean: () => void;

  askAI: (prompt: string) => Promise<void>;
  clearAI: () => void;
}

function pushHistory(state: DesignerState, nextPage: PageSchema) {
  const history = state.page ? [...state.history.slice(-29), state.page] : state.history;
  return { history, future: [] as PageSchema[], page: nextPage, dirty: true };
}

export const useDesignerStore = create<DesignerState>((set, get) => ({
  appId: null,
  page: null,
  selectedId: null,
  hoverId: null,
  mode: 'design',
  device: 'desktop',
  showAI: true,
  showOutline: true,
  aiMessages: [
    {
      id: 'welcome',
      role: 'assistant',
      content:
        '你好，我是灵搭 AI。描述你想要的表单、看板或页面，例如「生成一个请假审批表单」，我来帮你搭好可编辑的页面结构。',
      createdAt: new Date().toISOString(),
    },
  ],
  aiLoading: false,
  dirty: false,
  history: [],
  future: [],

  loadPage: (appId, page) =>
    set({
      appId,
      page: structuredClone(page),
      selectedId: page.root.id,
      hoverId: null,
      mode: 'design',
      dirty: false,
      history: [],
      future: [],
    }),

  select: (id) => set({ selectedId: id }),
  setHover: (id) => set({ hoverId: id }),
  setMode: (mode) => set({ mode }),
  setDevice: (device) => set({ device }),
  toggleAI: () => set((s) => ({ showAI: !s.showAI })),
  toggleOutline: () => set((s) => ({ showOutline: !s.showOutline })),

  addComponent: (type, parentId) => {
    const { page, selectedId } = get();
    if (!page) return;
    const targetId = parentId ?? selectedId ?? page.root.id;
    const target = findNode(page.root, targetId);
    const parent =
      target && canAcceptChildren(target.type)
        ? target
        : findNode(page.root, page.root.id)!;
    const child = createNode(type);
    const root = insertChild(page.root, parent.id, child);
    const next = { ...page, root, updatedAt: new Date().toISOString() };
    set((s) => ({ ...pushHistory(s, next), selectedId: child.id }));
  },

  deleteSelected: () => {
    const { page, selectedId } = get();
    if (!page || !selectedId || selectedId === page.root.id) return;
    const root = removeNode(page.root, selectedId);
    const next = { ...page, root, updatedAt: new Date().toISOString() };
    set((s) => ({ ...pushHistory(s, next), selectedId: page.root.id }));
  },

  duplicateSelected: () => {
    const { page, selectedId } = get();
    if (!page || !selectedId || selectedId === page.root.id) return;
    const node = findNode(page.root, selectedId);
    if (!node) return;
    const parent = (() => {
      const walk = (n: SchemaNode): SchemaNode | null => {
        for (const c of n.children ?? []) {
          if (c.id === selectedId) return n;
          const f = walk(c);
          if (f) return f;
        }
        return null;
      };
      return walk(page.root);
    })();
    if (!parent) return;
    const copy = structuredClone(node);
    const remap = (n: SchemaNode): SchemaNode => ({
      ...n,
      id: nanoid(8),
      children: n.children?.map(remap),
    });
    const cloned = remap(copy);
    const root = insertChild(page.root, parent.id, cloned);
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
    set((s) => pushHistory(s, next));
  },

  updateSelectedStyle: (style) => {
    const { page, selectedId } = get();
    if (!page || !selectedId) return;
    const root = updateNode(page.root, selectedId, (n) => ({
      ...n,
      style: { ...n.style, ...style },
    }));
    const next = { ...page, root, updatedAt: new Date().toISOString() };
    set((s) => pushHistory(s, next));
  },

  dropComponent: (type, targetId) => {
    const { page } = get();
    if (!page) return;
    let parentId = targetId;
    const target = findNode(page.root, targetId);
    if (!target) return;
    if (!canAcceptChildren(target.type)) {
      // drop onto leaf → insert into its parent
      const walk = (n: SchemaNode): string | null => {
        for (const c of n.children ?? []) {
          if (c.id === targetId) return n.id;
          const f = walk(c);
          if (f) return f;
        }
        return null;
      };
      parentId = walk(page.root) ?? page.root.id;
    }
    const child = createNode(type);
    const root = insertChild(page.root, parentId, child);
    const next = { ...page, root, updatedAt: new Date().toISOString() };
    set((s) => ({ ...pushHistory(s, next), selectedId: child.id }));
  },

  relocateNode: (nodeId, targetParentId) => {
    const { page } = get();
    if (!page) return;
    const target = findNode(page.root, targetParentId);
    if (!target || !canAcceptChildren(target.type)) return;
    const root = moveNode(page.root, nodeId, targetParentId);
    const next = { ...page, root, updatedAt: new Date().toISOString() };
    set((s) => pushHistory(s, next));
  },

  replaceRoot: (root, pageName) => {
    const { page } = get();
    if (!page) return;
    const next: PageSchema = {
      ...page,
      name: pageName ?? page.name,
      root,
      updatedAt: new Date().toISOString(),
    };
    set((s) => ({ ...pushHistory(s, next), selectedId: root.id }));
  },

  renamePage: (name) => {
    const { page } = get();
    if (!page) return;
    const next = { ...page, name, updatedAt: new Date().toISOString() };
    set((s) => pushHistory(s, next));
  },

  undo: () => {
    const { history, page, future } = get();
    if (!history.length || !page) return;
    const prev = history[history.length - 1];
    set({
      page: prev,
      history: history.slice(0, -1),
      future: [page, ...future],
      dirty: true,
      selectedId: prev.root.id,
    });
  },

  redo: () => {
    const { future, page, history } = get();
    if (!future.length || !page) return;
    const next = future[0];
    set({
      page: next,
      future: future.slice(1),
      history: [...history, page],
      dirty: true,
      selectedId: next.root.id,
    });
  },

  markClean: () => set({ dirty: false }),

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
      const result = await generatePageFromPrompt(content);
      const assistant: AIMessage = {
        id: nanoid(8),
        role: 'assistant',
        content: result.reply,
        schemaPatch: result.root,
        createdAt: new Date().toISOString(),
      };
      get().replaceRoot(result.root, result.pageName);
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

  clearAI: () =>
    set({
      aiMessages: [
        {
          id: 'welcome',
          role: 'assistant',
          content: '对话已清空。告诉我你想搭建什么页面吧。',
          createdAt: new Date().toISOString(),
        },
      ],
    }),
}));
