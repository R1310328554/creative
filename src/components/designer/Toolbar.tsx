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
} from 'lucide-react';
import { useDesignerStore } from '../../store/designerStore';
import { useAppStore } from '../../store/appStore';
import { useState } from 'react';

export function Toolbar() {
  const page = useDesignerStore((s) => s.page);
  const appId = useDesignerStore((s) => s.appId);
  const mode = useDesignerStore((s) => s.mode);
  const device = useDesignerStore((s) => s.device);
  const dirty = useDesignerStore((s) => s.dirty);
  const showAI = useDesignerStore((s) => s.showAI);
  const setMode = useDesignerStore((s) => s.setMode);
  const setDevice = useDesignerStore((s) => s.setDevice);
  const toggleAI = useDesignerStore((s) => s.toggleAI);
  const toggleOutline = useDesignerStore((s) => s.toggleOutline);
  const renamePage = useDesignerStore((s) => s.renamePage);
  const undo = useDesignerStore((s) => s.undo);
  const redo = useDesignerStore((s) => s.redo);
  const markClean = useDesignerStore((s) => s.markClean);
  const savePage = useAppStore((s) => s.savePage);
  const [toast, setToast] = useState<string | null>(null);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1800);
  };

  const onSave = () => {
    if (!page || !appId) return;
    savePage(appId, page);
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

  return (
    <>
      <header className="designer__bar">
        <div className="designer__bar-left">
          <Link to="/" className="btn btn--ghost btn--sm" title="返回工作台">
            <ArrowLeft size={16} />
            工作台
          </Link>
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
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
