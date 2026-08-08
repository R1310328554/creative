import { Renderer } from '../../engine/Renderer';
import { useDesignerStore } from '../../store/designerStore';
import type { ComponentType } from '../../types/schema';

export function Canvas() {
  const page = useDesignerStore((s) => s.page);
  const mode = useDesignerStore((s) => s.mode);
  const device = useDesignerStore((s) => s.device);
  const selectedId = useDesignerStore((s) => s.selectedId);
  const hoverId = useDesignerStore((s) => s.hoverId);
  const dropTargetId = useDesignerStore((s) => s.dropTargetId);
  const formValues = useDesignerStore((s) => s.formValues);
  const formErrors = useDesignerStore((s) => s.formErrors);
  const toast = useDesignerStore((s) => s.toast);
  const select = useDesignerStore((s) => s.select);
  const setHover = useDesignerStore((s) => s.setHover);
  const setDropTarget = useDesignerStore((s) => s.setDropTarget);
  const dropComponent = useDesignerStore((s) => s.dropComponent);
  const relocateNode = useDesignerStore((s) => s.relocateNode);
  const setFormValue = useDesignerStore((s) => s.setFormValue);
  const submitForm = useDesignerStore((s) => s.submitForm);
  const resetForm = useDesignerStore((s) => s.resetForm);
  const showToast = useDesignerStore((s) => s.showToast);

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
          dropTargetId={mode === 'design' ? dropTargetId : null}
          onSelect={select}
          onHover={setHover}
          onDropTarget={setDropTarget}
          onDropType={(type, targetId) => dropComponent(type as ComponentType, targetId)}
          onDropNode={(nodeId, targetId) => relocateNode(nodeId, targetId)}
          runtime={
            mode === 'preview'
              ? {
                  values: formValues,
                  errors: formErrors,
                  onChange: setFormValue,
                  onButtonAction: (action, message) => {
                    if (action === 'submit') submitForm(message);
                    else if (action === 'reset') resetForm();
                    else if (action === 'toast') showToast(message || '已触发');
                  },
                }
              : undefined
          }
        />
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
