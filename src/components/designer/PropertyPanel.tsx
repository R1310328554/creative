import { useDesignerStore } from '../../store/designerStore';
import { findNode } from '../../engine/tree';
import { getPaletteItem } from '../../data/palette';
import type { PropFieldMeta, SchemaNode } from '../../types/schema';

export function PropertyPanel() {
  const page = useDesignerStore((s) => s.page);
  const selectedId = useDesignerStore((s) => s.selectedId);
  const updateSelectedProps = useDesignerStore((s) => s.updateSelectedProps);
  const updateSelectedStyle = useDesignerStore((s) => s.updateSelectedStyle);
  const deleteSelected = useDesignerStore((s) => s.deleteSelected);
  const duplicateSelected = useDesignerStore((s) => s.duplicateSelected);

  const node = page && selectedId ? findNode(page.root, selectedId) : null;
  const meta = node ? getPaletteItem(node.type) : null;

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
            <input value={`${meta?.label ?? node.type} (${node.type})`} readOnly />
          </div>
          {(meta?.propFields ?? []).map((field) => (
            <MetaField
              key={field.key}
              field={field}
              node={node}
              onChange={updateSelectedProps}
            />
          ))}
          <div className="prop">
            <label>内边距</label>
            <input
              value={String(node.style?.padding ?? '')}
              placeholder="如 16px 或 24px"
              onChange={(e) => updateSelectedStyle({ padding: e.target.value })}
            />
          </div>
          <div className="prop">
            <label>背景</label>
            <input
              value={String(node.style?.background ?? '')}
              placeholder="#ffffff"
              onChange={(e) => updateSelectedStyle({ background: e.target.value })}
            />
          </div>
          <div className="prop">
            <label>圆角</label>
            <input
              value={String(node.style?.borderRadius ?? '')}
              placeholder="12px"
              onChange={(e) => updateSelectedStyle({ borderRadius: e.target.value })}
            />
          </div>
          <div className="prop">
            <label>文字颜色</label>
            <input
              value={String(node.style?.color ?? '')}
              placeholder="#0f172a"
              onChange={(e) => updateSelectedStyle({ color: e.target.value })}
            />
          </div>
        </div>
      )}
    </aside>
  );
}

function MetaField({
  field,
  node,
  onChange,
}: {
  field: PropFieldMeta;
  node: SchemaNode;
  onChange: (props: Record<string, unknown>) => void;
}) {
  const raw = node.props[field.key];

  if (field.type === 'boolean') {
    return (
      <div className="prop">
        <label>
          <input
            type="checkbox"
            checked={Boolean(raw)}
            onChange={(e) => onChange({ [field.key]: e.target.checked })}
            style={{ marginRight: 8 }}
          />
          {field.label}
        </label>
      </div>
    );
  }

  if (field.type === 'textarea') {
    return (
      <div className="prop">
        <label>{field.label}</label>
        <textarea
          rows={3}
          value={String(raw ?? '')}
          placeholder={field.placeholder}
          onChange={(e) => onChange({ [field.key]: e.target.value })}
        />
      </div>
    );
  }

  if (field.type === 'number') {
    return (
      <div className="prop">
        <label>{field.label}</label>
        <input
          type="number"
          value={Number(raw ?? 0)}
          onChange={(e) => onChange({ [field.key]: Number(e.target.value) })}
        />
      </div>
    );
  }

  if (field.type === 'select') {
    return (
      <div className="prop">
        <label>{field.label}</label>
        <select
          value={String(raw ?? '')}
          onChange={(e) => {
            const v = e.target.value;
            onChange({
              [field.key]: field.key === 'level' || field.key === 'columns' ? Number(v) : v,
            });
          }}
        >
          {(field.options ?? []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === 'options') {
    return (
      <div className="prop">
        <label>{field.label}</label>
        <textarea
          rows={3}
          value={((raw as string[]) ?? []).join(', ')}
          onChange={(e) =>
            onChange({
              [field.key]: e.target.value
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
        />
      </div>
    );
  }

  if (field.type === 'rows') {
    return (
      <div className="prop">
        <label>{field.label}</label>
        <textarea
          rows={5}
          value={((raw as string[][]) ?? []).map((r) => r.join(' | ')).join('\n')}
          onChange={(e) =>
            onChange({
              [field.key]: e.target.value
                .split('\n')
                .map((line) => line.split('|').map((c) => c.trim()))
                .filter((r) => r.some(Boolean)),
            })
          }
        />
      </div>
    );
  }

  return (
    <div className="prop">
      <label>{field.label}</label>
      <input
        value={String(raw ?? '')}
        placeholder={field.placeholder}
        onChange={(e) => onChange({ [field.key]: e.target.value })}
      />
    </div>
  );
}
