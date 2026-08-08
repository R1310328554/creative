import { useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Toolbar } from '../components/designer/Toolbar';
import { ComponentPalette } from '../components/designer/ComponentPalette';
import { OutlineTree } from '../components/designer/OutlineTree';
import { Canvas } from '../components/designer/Canvas';
import { PropertyPanel } from '../components/designer/PropertyPanel';
import { AIAssistant } from '../components/designer/AIAssistant';
import { useAppStore } from '../store/appStore';
import { useDesignerStore } from '../store/designerStore';

export function DesignerPage() {
  const { appId } = useParams();
  const app = useAppStore((s) => s.apps.find((a) => a.id === appId));
  const loadApp = useDesignerStore((s) => s.loadApp);
  const page = useDesignerStore((s) => s.page);
  const showAI = useDesignerStore((s) => s.showAI);
  const deleteSelected = useDesignerStore((s) => s.deleteSelected);
  const undo = useDesignerStore((s) => s.undo);
  const redo = useDesignerStore((s) => s.redo);
  const loadedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!app) return;
    // 仅在切换应用时加载，避免保存后重置设计器状态
    if (loadedFor.current === app.id) return;
    loadApp(app.id, app.pages);
    loadedFor.current = app.id;
  }, [app, loadApp]);

  useEffect(() => {
    loadedFor.current = null;
  }, [appId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((meta && e.key === 'z' && e.shiftKey) || (meta && e.key === 'y')) {
        e.preventDefault();
        redo();
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && !meta) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        e.preventDefault();
        deleteSelected();
      }
      if (meta && e.key === 's') {
        e.preventDefault();
        document.querySelector<HTMLButtonElement>('.designer__bar-right .btn--primary')?.click();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [deleteSelected, undo, redo]);

  if (!app) {
    return (
      <div style={{ padding: 48 }}>
        <h2>应用不存在</h2>
        <p style={{ color: 'var(--ld-muted)' }}>该应用可能已被删除。</p>
        <Link to="/" className="btn btn--primary" style={{ marginTop: 16, display: 'inline-flex' }}>
          返回工作台
        </Link>
      </div>
    );
  }

  if (!page) return null;

  return (
    <div className="designer">
      <Toolbar />
      <div className={`designer__body ${showAI ? 'ai-open' : ''}`}>
        <div className="designer__left">
          <ComponentPalette />
          <OutlineTree />
        </div>
        <Canvas />
        <PropertyPanel />
        <AIAssistant />
      </div>
    </div>
  );
}
