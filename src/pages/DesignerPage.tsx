import { useEffect } from 'react';
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
  const loadPage = useDesignerStore((s) => s.loadPage);
  const page = useDesignerStore((s) => s.page);
  const showAI = useDesignerStore((s) => s.showAI);
  const deleteSelected = useDesignerStore((s) => s.deleteSelected);
  const undo = useDesignerStore((s) => s.undo);
  const redo = useDesignerStore((s) => s.redo);

  useEffect(() => {
    if (app) {
      loadPage(app.id, app.pages[0]);
    }
  }, [app, loadPage]);

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
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        e.preventDefault();
        deleteSelected();
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
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, borderRight: '1px solid var(--ld-line)' }}>
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
