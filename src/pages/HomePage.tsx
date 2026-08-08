import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Copy, Trash2, Sparkles } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { templateGallery } from '../data/templates';
import type { AppType } from '../types/schema';

const typeLabel: Record<AppType, string> = {
  form: '表单应用',
  page: '页面应用',
  dashboard: '数据看板',
  workflow: '流程应用',
};

export function HomePage() {
  const apps = useAppStore((s) => s.apps);
  const createApp = useAppStore((s) => s.createApp);
  const deleteApp = useAppStore((s) => s.deleteApp);
  const duplicateApp = useAppStore((s) => s.duplicateApp);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('未命名应用');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<AppType>('form');

  const sorted = useMemo(
    () => [...apps].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [apps],
  );

  const submitCreate = () => {
    const id = createApp({ name: name.trim() || '未命名应用', description, type });
    setOpen(false);
    navigate(`/designer/${id}`);
  };

  const fromTemplate = (tplId: string) => {
    const tpl = templateGallery.find((t) => t.id === tplId);
    if (!tpl) return;
    const page = tpl.build();
    const id = createApp({
      name: tpl.name,
      description: tpl.blurb,
      type: tpl.type,
      page,
    });
    navigate(`/designer/${id}`);
  };

  return (
    <div className="home">
      <nav className="home__nav">
        <div className="brand">
          <span className="brand__mark">灵</span>
          <span className="brand__name">灵搭</span>
          <span className="brand__tag">Lingda AI Low-Code</span>
        </div>
        <div className="home__nav-actions">
          <button type="button" className="btn btn--ghost" onClick={() => setOpen(true)}>
            <Plus size={16} />
            新建应用
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              const id = createApp({
                name: 'AI 快速创建',
                description: '用自然语言生成页面',
                type: 'page',
              });
              navigate(`/designer/${id}`);
            }}
          >
            <Sparkles size={16} />
            AI 创建
          </button>
        </div>
      </nav>

      <section className="home__hero">
        <div className="home__hero-copy">
          <div className="brand__name">灵搭</div>
          <h1>用 AI 搭业务，像搭积木一样设计应用</h1>
          <p>
            拖拽组件、配置属性、一句话生成表单与看板。面向企业内部场景的低代码设计工作台，灵感来自宜搭与微搭。
          </p>
          <div className="home__cta">
            <button type="button" className="btn btn--accent" onClick={() => setOpen(true)}>
              开始设计
            </button>
            <a href="#apps" className="btn btn--ghost" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', borderColor: 'rgba(255,255,255,0.35)' }}>
              查看我的应用
            </a>
          </div>
        </div>

        <div className="home__hero-panel">
          <h2>三步上手</h2>
          <p>从模板起步，或让 AI 直接生成可编辑 Schema。</p>
          <ol style={{ margin: 0, paddingLeft: 18, color: 'var(--ld-ink-soft)', lineHeight: 1.8, fontSize: 14 }}>
            <li>选择模板或新建空白应用</li>
            <li>拖拽组件 / 对话生成页面结构</li>
            <li>预览、导出 JSON Schema 或继续迭代</li>
          </ol>
          <button
            type="button"
            className="btn btn--primary"
            style={{ marginTop: 20, width: '100%' }}
            onClick={() => fromTemplate('tpl-leave')}
          >
            用「请假申请」模板开始
          </button>
        </div>
      </section>

      <section className="home__section" id="apps">
        <div className="home__section-head">
          <div>
            <h2>我的应用</h2>
            <p>本地已保存 {sorted.length} 个应用，可随时继续编辑。</p>
          </div>
        </div>
        <div className="app-grid">
          <button type="button" className="create-card" onClick={() => setOpen(true)}>
            <span>
              <Plus size={22} style={{ display: 'block', margin: '0 auto 8px' }} />
              新建应用
            </span>
          </button>
          {sorted.map((app) => (
            <article key={app.id} className="app-card">
              <span className="app-card__type">{typeLabel[app.type]}</span>
              <h3>{app.name}</h3>
              <p>{app.description || '暂无描述'}</p>
              <div className="app-card__meta">
                <span>{new Date(app.updatedAt).toLocaleString('zh-CN')}</span>
                <div className="app-card__actions">
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    title="复制"
                    onClick={() => duplicateApp(app.id)}
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm btn--danger"
                    title="删除"
                    onClick={() => {
                      if (confirm(`确定删除「${app.name}」？`)) deleteApp(app.id);
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                  <Link to={`/designer/${app.id}`} className="btn btn--primary btn--sm">
                    编辑
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="home__section" id="templates">
        <div className="home__section-head">
          <div>
            <h2>模板中心</h2>
            <p>常见企业场景一键生成，生成后仍可自由改。</p>
          </div>
        </div>
        <div className="tpl-grid">
          {templateGallery.map((tpl) => (
            <button key={tpl.id} type="button" className="tpl-card" onClick={() => fromTemplate(tpl.id)}>
              <span className="tpl-card__type">{typeLabel[tpl.type]}</span>
              <h3>{tpl.name}</h3>
              <p>{tpl.blurb}</p>
            </button>
          ))}
        </div>
      </section>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>新建应用</h3>
            <p>创建一个可拖拽设计的低代码应用。</p>
            <div className="form-stack">
              <label>
                应用名称
                <input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
              </label>
              <label>
                描述
                <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
              </label>
              <label>
                类型
                <select value={type} onChange={(e) => setType(e.target.value as AppType)}>
                  <option value="form">表单应用</option>
                  <option value="page">页面应用</option>
                  <option value="dashboard">数据看板</option>
                  <option value="workflow">流程应用</option>
                </select>
              </label>
            </div>
            <div className="modal__actions">
              <button type="button" className="btn btn--ghost" onClick={() => setOpen(false)}>
                取消
              </button>
              <button type="button" className="btn btn--primary" onClick={submitCreate}>
                创建并打开设计器
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
