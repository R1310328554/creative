import { flattenTree } from '../../engine/tree';
import { useDesignerStore } from '../../store/designerStore';

export function OutlineTree() {
  const page = useDesignerStore((s) => s.page);
  const selectedId = useDesignerStore((s) => s.selectedId);
  const select = useDesignerStore((s) => s.select);
  const showOutline = useDesignerStore((s) => s.showOutline);

  if (!page || !showOutline) return null;
  const items = flattenTree(page.root);

  return (
    <div style={{ borderTop: '1px solid var(--ld-line)' }}>
      <div className="panel__head">
        <h3>大纲</h3>
      </div>
      <div style={{ padding: '8px 8px 16px' }}>
        {items.map(({ node, depth }) => (
          <button
            key={node.id}
            type="button"
            className={`outline-item ${selectedId === node.id ? 'is-active' : ''}`}
            style={{ paddingLeft: 10 + depth * 14 }}
            onClick={() => select(node.id)}
          >
            {node.label || node.type}
          </button>
        ))}
      </div>
    </div>
  );
}
