import { useDesignerStore } from '../../store/designerStore';
import { findNode } from '../../engine/tree';
import type { SchemaNode } from '../../types/schema';

export function PropertyPanel() {
  const page = useDesignerStore((s) => s.page);
  const selectedId = useDesignerStore((s) => s.selectedId);
  const updateSelectedProps = useDesignerStore((s) => s.updateSelectedProps);
  const updateSelectedStyle = useDesignerStore((s) => s.updateSelectedStyle);
  const deleteSelected = useDesignerStore((s) => s.deleteSelected);
  const duplicateSelected = useDesignerStore((s) => s.duplicateSelected);

  const node = page && selectedId ? findNode(page.root, selectedId) : null;

  return (
    <aside className="panel panel--right">
      <div className="panel__head">
        <h3>属性</h3>
        {node && node.type !== 'Page' && (
          <div style={{ display: 'flex', gap: 4 }}>
            <button type="button" className="btn btn--ghost btn--sm" onClick={duplicateSelected}>
              复制
            </button>
            <button type="button" className="btn btn--ghost btn--sm btn--danger" onClick={deleteSelected}>
              删除
            </button>
          </div>
        )}
      </div>
      {!node ? (
        <div className="prop-empty">选中画布中的组件以编辑属性。</div>
      ) : (
        <div className="props">
          <div className="prop">
            <label>组件类型</label>
            <input value={node.type} readOnly />
          </div>
          <PropFields node={node} onChange={updateSelectedProps} />
          <div className="prop">
            <label>内边距</label>
            <input
              value={node.style?.padding ?? ''}
              placeholder="如 16px 或 24px"
              onChange={(e) => updateSelectedStyle({ padding: e.target.value })}
            />
          </div>
          <div className="prop">
            <label>背景</label>
            <input
              value={node.style?.background ?? ''}
              placeholder="#ffffff"
              onChange={(e) => updateSelectedStyle({ background: e.target.value })}
            />
          </div>
          <div className="prop">
            <label>圆角</label>
            <input
              value={node.style?.borderRadius ?? ''}
              placeholder="12px"
              onChange={(e) => updateSelectedStyle({ borderRadius: e.target.value })}
            />
          </div>
          <div className="prop">
            <label>文字颜色</label>
            <input
              value={node.style?.color ?? ''}
              placeholder="#0f172a"
              onChange={(e) => updateSelectedStyle({ color: e.target.value })}
            />
          </div>
        </div>
      )}
    </aside>
  );
}

function PropFields({
  node,
  onChange,
}: {
  node: SchemaNode;
  onChange: (props: Record<string, unknown>) => void;
}) {
  const p = node.props;
  const set = (key: string, value: unknown) => onChange({ [key]: value });

  const textField = (key: string, label: string) => (
    <div className="prop" key={key}>
      <label>{label}</label>
      <input value={String(p[key] ?? '')} onChange={(e) => set(key, e.target.value)} />
    </div>
  );

  const areaField = (key: string, label: string) => (
    <div className="prop" key={key}>
      <label>{label}</label>
      <textarea rows={3} value={String(p[key] ?? '')} onChange={(e) => set(key, e.target.value)} />
    </div>
  );

  const boolField = (key: string, label: string) => (
    <div className="prop" key={key}>
      <label>
        <input
          type="checkbox"
          checked={Boolean(p[key])}
          onChange={(e) => set(key, e.target.checked)}
          style={{ marginRight: 8 }}
        />
        {label}
      </label>
    </div>
  );

  switch (node.type) {
    case 'Heading':
      return (
        <>
          {textField('text', '标题文案')}
          <div className="prop">
            <label>级别</label>
            <select value={Number(p.level ?? 2)} onChange={(e) => set('level', Number(e.target.value))}>
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  H{n}
                </option>
              ))}
            </select>
          </div>
        </>
      );
    case 'Text':
      return areaField('text', '文本内容');
    case 'Button':
      return (
        <>
          {textField('text', '按钮文字')}
          <div className="prop">
            <label>样式</label>
            <select value={String(p.variant ?? 'primary')} onChange={(e) => set('variant', e.target.value)}>
              <option value="primary">主要</option>
              <option value="ghost">次要</option>
              <option value="accent">强调</option>
            </select>
          </div>
        </>
      );
    case 'Image':
      return (
        <>
          {textField('src', '图片地址')}
          {textField('alt', '替代文本')}
        </>
      );
    case 'Card':
      return (
        <>
          {textField('title', '卡片标题')}
          {textField('subtitle', '副标题')}
        </>
      );
    case 'Input':
    case 'TextArea':
      return (
        <>
          {textField('label', '标签')}
          {textField('placeholder', '占位符')}
          {textField('name', '字段名')}
          {boolField('required', '必填')}
          {node.type === 'TextArea' && (
            <div className="prop">
              <label>行数</label>
              <input
                type="number"
                value={Number(p.rows ?? 3)}
                onChange={(e) => set('rows', Number(e.target.value))}
              />
            </div>
          )}
        </>
      );
    case 'Select':
    case 'Radio':
      return (
        <>
          {textField('label', '标签')}
          <div className="prop">
            <label>选项（逗号分隔）</label>
            <textarea
              rows={3}
              value={((p.options as string[]) ?? []).join(', ')}
              onChange={(e) =>
                set(
                  'options',
                  e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
            />
          </div>
          {node.type === 'Radio' && textField('value', '默认值')}
          {boolField('required', '必填')}
        </>
      );
    case 'DatePicker':
      return (
        <>
          {textField('label', '标签')}
          {textField('name', '字段名')}
          {boolField('required', '必填')}
        </>
      );
    case 'Switch':
    case 'Checkbox':
      return (
        <>
          {textField('label', '标签')}
          {boolField('checked', '默认开启/勾选')}
        </>
      );
    case 'Stat':
      return (
        <>
          {textField('label', '指标名')}
          {textField('value', '数值')}
          {textField('trend', '趋势')}
          <div className="prop">
            <label>语气</label>
            <select value={String(p.tone ?? 'neutral')} onChange={(e) => set('tone', e.target.value)}>
              <option value="positive">正向</option>
              <option value="neutral">中性</option>
              <option value="warning">警示</option>
            </select>
          </div>
        </>
      );
    case 'Table':
      return (
        <>
          {textField('title', '表格标题')}
          <div className="prop">
            <label>列（逗号分隔）</label>
            <textarea
              rows={2}
              value={((p.columns as string[]) ?? []).join(', ')}
              onChange={(e) =>
                set(
                  'columns',
                  e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
            />
          </div>
          <div className="prop">
            <label>行数据（每行用 | 分隔单元格）</label>
            <textarea
              rows={5}
              value={((p.rows as string[][]) ?? []).map((r) => r.join(' | ')).join('\n')}
              onChange={(e) =>
                set(
                  'rows',
                  e.target.value
                    .split('\n')
                    .map((line) => line.split('|').map((c) => c.trim()))
                    .filter((r) => r.some(Boolean)),
                )
              }
            />
          </div>
        </>
      );
    case 'Alert':
      return (
        <>
          {textField('title', '标题')}
          {areaField('message', '内容')}
          <div className="prop">
            <label>类型</label>
            <select value={String(p.tone ?? 'info')} onChange={(e) => set('tone', e.target.value)}>
              <option value="info">信息</option>
              <option value="warning">警告</option>
              <option value="success">成功</option>
            </select>
          </div>
        </>
      );
    case 'Columns':
      return (
        <div className="prop">
          <label>列数</label>
          <input
            type="number"
            min={1}
            max={4}
            value={Number(p.columns ?? 2)}
            onChange={(e) => set('columns', Number(e.target.value))}
          />
        </div>
      );
    case 'Tabs':
      return (
        <div className="prop">
          <label>选项卡（逗号分隔）</label>
          <textarea
            rows={2}
            value={((p.tabs as string[]) ?? []).join(', ')}
            onChange={(e) =>
              set(
                'tabs',
                e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
          />
        </div>
      );
    case 'Spacer':
      return (
        <div className="prop">
          <label>高度 (px)</label>
          <input
            type="number"
            value={Number(p.size ?? 24)}
            onChange={(e) => set('size', Number(e.target.value))}
          />
        </div>
      );
    default:
      return null;
  }
}
