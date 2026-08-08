import { Renderer } from '../../engine/Renderer';
import { useDesignerStore } from '../../store/designerStore';
import type { ComponentType } from '../../types/schema';

export function Canvas() {
  const page = useDesignerStore((s) => s.page);
  const mode = useDesignerStore((s) => s.mode);
  const device = useDesignerStore((s) => s.device);
  const selectedId = useDesignerStore((s) => s.selectedId);
  const hoverId = useDesignerStore((s) => s.hoverId);
  const select = useDesignerStore((s) => s.select);
  const setHover = useDesignerStore((s) => s.setHover);
  const dropComponent = useDesignerStore((s) => s.dropComponent);

  if (!page) return null;

  return (
    <div
      className="canvas-shell"
      onClick={() => mode === 'design' && select(page.root.id)}
    >
      <div className={`canvas-frame canvas-frame--${device}`}>
        <Renderer
          node={page.root}
          mode={mode}
          selectedId={mode === 'design' ? selectedId : null}
          hoverId={mode === 'design' ? hoverId : null}
          onSelect={select}
          onHover={setHover}
          onDropType={(type, targetId) => dropComponent(type as ComponentType, targetId)}
        />
      </div>
    </div>
  );
}
