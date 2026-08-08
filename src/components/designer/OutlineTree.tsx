import { canAcceptChildren, flattenTree } from '../../engine/tree';
import { useDesignerStore } from '../../store/designerStore';

export function OutlineTree() {
  const page = useDesignerStore((s) => s.page);
  const selectedId = useDesignerStore((s) => s.selectedId);
  const dropTargetId = useDesignerStore((s) => s.dropTargetId);
  const select = useDesignerStore((s) => s.select);
  const setDropTarget = useDesignerStore((s) => s.setDropTarget);
  const relocateNode = useDesignerStore((s) => s.relocateNode);
  const showOutline = useDesignerStore((s) => s.showOutline);

  if (!page || !showOutline) return null;
  const items = flattenTree(page.root);

  return (
    <div style={{ borderTop: '1px solid var(--ld-line)', flex: 1, minHeight: 0, overflow: 'auto' }}>
      <div className="panel__head">
        <h3>大纲</h3>
        <span style={{ fontSize: 11, color: 'var(--ld-muted)' }}>可拖拽调整层级</span>
      </div>
      <div style={{ padding: '8px 8px 16px' }}>
        {items.map(({ node, depth }) => (
          <button
            key={node.id}
            type="button"
            className={`outline-item ${selectedId === node.id ? 'is-active' : ''} ${dropTargetId === node.id ? 'is-drop' : ''}`}
            style={{ paddingLeft: 10 + depth * 14 }}
            draggable={node.id !== page.root.id}
            onClick={() => select(node.id)}
            onDragStart={(e) => {
              e.dataTransfer.setData('application/lingda-node', node.id);
              e.dataTransfer.effectAllowed = 'move';
            }}
            onDragOver={(e) => {
              e.preventDefault();
              if (canAcceptChildren(node.type)) setDropTarget(node.id);
            }}
            onDragLeave={() => setDropTarget(null)}
            onDrop={(e) => {
              e.preventDefault();
              const nodeId = e.dataTransfer.getData('application/lingda-node');
              if (nodeId && nodeId !== node.id && canAcceptChildren(node.type)) {
                relocateNode(nodeId, node.id);
              }
              setDropTarget(null);
            }}
          >
            {node.label || node.type}
          </button>
        ))}
      </div>
    </div>
  );
}
