import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { AppType, LowcodeApp, PageSchema } from '../types/schema';
import { createEmptyPage, starterApps } from '../data/templates';
import { cloneNode } from '../engine/tree';

interface AppState {
  apps: LowcodeApp[];
  createApp: (input: { name: string; description?: string; type: AppType; page?: PageSchema }) => string;
  updateApp: (id: string, patch: Partial<Pick<LowcodeApp, 'name' | 'description' | 'type' | 'pages'>>) => void;
  deleteApp: (id: string) => void;
  getApp: (id: string) => LowcodeApp | undefined;
  savePage: (appId: string, page: PageSchema) => void;
  duplicateApp: (id: string) => string | null;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      apps: starterApps,

      createApp: ({ name, description = '', type, page }) => {
        const id = nanoid(10);
        const now = new Date().toISOString();
        const app: LowcodeApp = {
          id,
          name,
          description,
          type,
          pages: [page ?? createEmptyPage(name)],
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ apps: [app, ...s.apps] }));
        return id;
      },

      updateApp: (id, patch) => {
        set((s) => ({
          apps: s.apps.map((app) =>
            app.id === id
              ? { ...app, ...patch, updatedAt: new Date().toISOString() }
              : app,
          ),
        }));
      },

      deleteApp: (id) => set((s) => ({ apps: s.apps.filter((a) => a.id !== id) })),

      getApp: (id) => get().apps.find((a) => a.id === id),

      savePage: (appId, page) => {
        set((s) => ({
          apps: s.apps.map((app) => {
            if (app.id !== appId) return app;
            const pages = app.pages.map((p) => (p.id === page.id ? { ...page, updatedAt: new Date().toISOString() } : p));
            const exists = pages.some((p) => p.id === page.id);
            return {
              ...app,
              pages: exists ? pages : [...pages, { ...page, updatedAt: new Date().toISOString() }],
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      duplicateApp: (id) => {
        const source = get().apps.find((a) => a.id === id);
        if (!source) return null;
        const newId = nanoid(10);
        const now = new Date().toISOString();
        const copy: LowcodeApp = {
          ...source,
          id: newId,
          name: `${source.name} 副本`,
          createdAt: now,
          updatedAt: now,
          pages: source.pages.map((p) => ({
            ...p,
            id: nanoid(10),
            root: cloneNode(p.root),
            updatedAt: now,
          })),
        };
        set((s) => ({ apps: [copy, ...s.apps] }));
        return newId;
      },
    }),
    { name: 'lingda-apps-v1' },
  ),
);
