import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Eye,
  Pencil,
  Redo2,
  Save,
  Sparkles,
  Undo2,
  Monitor,
  Tablet,
  Smartphone,
  Download,
  PanelLeft,
  Upload,
  Plus,
} from 'lucide-react';
import { useDesignerStore } from '../../store/designerStore';
import { useAppStore } from '../../store/appStore';
import { useRef, useState } from 'react';
import type { PageSchema } from '../../types/schema';

export function Toolbar() {
  const page = useDesignerStore((s) => s.page);
  const pageId = useDesignerStore((s) => s.pageId);
  const pageList = useDesignerStore((s) => s.pageList);
  const appId = useDesignerStore((s) => s.appId);
  const mode = useDesignerStore((s) => s.mode);
  const device = useDesignerStore((s) => s.device);
  const dirty = useDesignerStore((s) => s.dirty);
  const showAI = useDesignerStore((s) => s.showAI);
  const toast = useDesignerStore((s) => s.toast);
  const setMode = useDesignerStore((s) => s.setMode);
  const setDevice = useDesignerStore((s) => s.setDevice);
  const toggleAI = useDesignerStore((s) => s.toggleAI);
  const toggleOutline = useDesignerStore((s) => s.toggleOutline);
  const renamePage = useDesignerStore((s) => s.renamePage);
  const undo = useDesignerStore((s) => s.undo);
  const redo = useDesignerStore((s) => s.redo);
  const markClean = useDesignerStore((s) => s.markClean);
  const addPage = useDesignerStore((s) => s.addPage);
  const switchPage = useDesignerStore((s) => s.switchPage);
  const importPageSchema = useDesignerStore((s) => s.importPageSchema);
  const showToast = useDesignerStore((s) => s.showToast);
  const savePage = useAppStore((s) => s.savePage);
  const getApp = useAppStore((s) => s.getApp);
  const updateApp = useAppStore((s) => s.updateApp);
  const fileRef = useRef<HTMLInputElement>(null);
  const [localToast, setLocalToast] = useState<string | null>(null);

  const flash = (msg: string) => {
    setLocalToast(msg);
    window.setTimeout(() => setLocalToast(null), 1800);
  };

  const onSave = () => {
    if (!page || !appId) return;
    savePage(appId, page);
    // keep pageList names in persisted app
    const app = getApp(appId);
    if (app) {
      const pages = app.pages.map((p) => (p.id === page.id ? page : p));
      const exists = pages.some((p) => p.id === page.id);
      updateApp(appId, { pages: exists ? pages : [...pages, page] });
    }
    markClean();
    flash('已保存到应用');
  };

  const onExport = () => {
    if (!page) return;
    const blob = new Blob([JSON.stringify(page, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${page.name || 'page'}.lingda.json`;
    a.click();
    URL.revokeObjectURL(url);
    flash('Schema 已导出');
  };

  const onImport = async (file: File) => {
    try {
      const text = await file.text();
      const json = JSON.parse(text) as PageSchema;
      if (!json?.root?.type) throw new Error('invalid');
      importPageSchema(json);
      flash('Schema 已导入');
    } catch {
      showToast('导入失败：请选择有效的灵搭页面 JSON');
    }
  };

  const onSwitchPage = (id: string) => {
    if (!appId || id === pageId) return;
    if (dirty && page) {
      const ok = window.confirm('当前页面未保存，切换前是否保存？');
      if (ok) {
        savePage(appId, page);
        markClean();
      }
    }
    const app = getApp(appId);
    const target = app?.pages.find((p) => p.id === id);
    if (target) switchPage(id, target);
  };

  const onAddPage = () => {
    if (!appId) return;
    if (dirty && page) {
      savePage(appId, page);
      markClean();
    }
    const created = addPage(`页面 ${pageList.length + 1}`);
    if (created) {
      savePage(appId, created);
      flash('已新增页面');
    }
  };

  return (
    <>
      <header className="designer__bar">
        <div className="designer__bar-left">
          <Link to="/" className="btn btn--ghost btn--sm" title="返回工作台">
            <ArrowLeft size={16} />
            工作台
          </Link>
          <div className="page-tabs">
            {pageList.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`page-tab ${p.id === pageId ? 'is-active' : ''}`}
                onClick={() => onSwitchPage(p.id)}
              >
                {p.name}
              </button>
            ))}
            <button type="button" className="btn btn--icon" title="新增页面" onClick={onAddPage}>
              <Plus size={14} />
            </button>
          </div>
          <input
            className="page-name-input"
            value={page?.name ?? ''}
            onChange={(e) => renamePage(e.target.value)}
            aria-label="页面名称"
          />
          {dirty && <span style={{ fontSize: 12, color: 'var(--ld-accent-2)' }}>未保存</span>}
        </div>

        <div className="designer__bar-center">
          <button
            type="button"
            className={`seg ${mode === 'design' ? 'is-active' : ''}`}
            onClick={() => setMode('design')}
          >
            <Pencil size={14} style={{ marginRight: 4 }} />
            设计
          </button>
          <button
            type="button"
            className={`seg ${mode === 'preview' ? 'is-active' : ''}`}
            onClick={() => setMode('preview')}
          >
            <Eye size={14} style={{ marginRight: 4 }} />
            预览
          </button>
        </div>

        <div className="designer__bar-right">
          <button type="button" className={`btn btn--icon ${device === 'desktop' ? 'seg is-active' : ''}`} onClick={() => setDevice('desktop')} title="桌面">
            <Monitor size={16} />
          </button>
          <button type="button" className={`btn btn--icon ${device === 'tablet' ? 'seg is-active' : ''}`} onClick={() => setDevice('tablet')} title="平板">
            <Tablet size={16} />
          </button>
          <button type="button" className={`btn btn--icon ${device === 'mobile' ? 'seg is-active' : ''}`} onClick={() => setDevice('mobile')} title="手机">
            <Smartphone size={16} />
          </button>
          <button type="button" className="btn btn--icon" onClick={undo} title="撤销">
            <Undo2 size={16} />
          </button>
          <button type="button" className="btn btn--icon" onClick={redo} title="重做">
            <Redo2 size={16} />
          </button>
          <button type="button" className="btn btn--icon" onClick={toggleOutline} title="大纲">
            <PanelLeft size={16} />
          </button>
          <button
            type="button"
            className={`btn btn--sm ${showAI ? 'btn--accent' : 'btn--ghost'}`}
            onClick={toggleAI}
          >
            <Sparkles size={14} />
            AI
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onImport(f);
              e.target.value = '';
            }}
          />
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => fileRef.current?.click()}>
            <Upload size={14} />
            导入
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={onExport}>
            <Download size={14} />
            导出
          </button>
          <button type="button" className="btn btn--primary btn--sm" onClick={onSave}>
            <Save size={14} />
            保存
          </button>
        </div>
      </header>
      {(localToast || toast) && <div className="toast">{localToast || toast}</div>}
    </>
  );
}
