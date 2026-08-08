import type { CSSProperties, ReactNode } from 'react';
import clsx from 'clsx';
import type { SchemaNode } from '../types/schema';

interface RendererProps {
  node: SchemaNode;
  mode?: 'design' | 'preview';
  selectedId?: string | null;
  hoverId?: string | null;
  onSelect?: (id: string) => void;
  onHover?: (id: string | null) => void;
  onDropType?: (type: string, targetId: string) => void;
}

function styleOf(node: SchemaNode): CSSProperties {
  const s = node.style ?? {};
  const css: CSSProperties = { ...s } as CSSProperties;
  if (node.type === 'Columns') {
    const cols = Number(node.props.columns ?? 2);
    css.display = 'grid';
    css.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
  }
  if (node.type === 'Image') {
    css.objectFit = 'cover';
  }
  return css;
}

export function Renderer({
  node,
  mode = 'preview',
  selectedId,
  hoverId,
  onSelect,
  onHover,
  onDropType,
}: RendererProps) {
  const selected = selectedId === node.id;
  const hovered = hoverId === node.id;
  const design = mode === 'design';

  const wrap = (content: ReactNode, className?: string) => (
    <div
      className={clsx(
        'ld-node',
        `ld-node--${node.type.toLowerCase()}`,
        design && 'ld-node--design',
        selected && 'is-selected',
        hovered && !selected && 'is-hovered',
        className,
      )}
      style={styleOf(node)}
      data-node-id={node.id}
      onClick={
        design
          ? (e) => {
              e.stopPropagation();
              onSelect?.(node.id);
            }
          : undefined
      }
      onMouseEnter={
        design
          ? (e) => {
              e.stopPropagation();
              onHover?.(node.id);
            }
          : undefined
      }
      onMouseLeave={design ? () => onHover?.(null) : undefined}
      onDragOver={
        design
          ? (e) => {
              e.preventDefault();
              e.stopPropagation();
            }
          : undefined
      }
      onDrop={
        design
          ? (e) => {
              e.preventDefault();
              e.stopPropagation();
              const type = e.dataTransfer.getData('application/lingda-type');
              if (type) onDropType?.(type, node.id);
            }
          : undefined
      }
    >
      {design && (selected || hovered) && (
        <span className="ld-node__badge">{node.label || node.type}</span>
      )}
      {content}
    </div>
  );

  const kids = () =>
    (node.children ?? []).map((child) => (
      <Renderer
        key={child.id}
        node={child}
        mode={mode}
        selectedId={selectedId}
        hoverId={hoverId}
        onSelect={onSelect}
        onHover={onHover}
        onDropType={onDropType}
      />
    ));

  switch (node.type) {
    case 'Page':
      return wrap(<div className="ld-page-inner">{kids()}</div>, 'ld-page');
    case 'Section':
    case 'Row':
    case 'Columns':
      return wrap(
        <>
          {kids()}
          {design && !(node.children?.length) && (
            <div className="ld-drop-hint">拖拽组件到此处</div>
          )}
        </>,
      );
    case 'Card':
      return wrap(
        <>
          <div className="ld-card__head">
            <h3>{String(node.props.title ?? '')}</h3>
            {node.props.subtitle ? <p>{String(node.props.subtitle)}</p> : null}
          </div>
          <div className="ld-card__body">
            {kids()}
            {design && !(node.children?.length) && (
              <div className="ld-drop-hint">拖入内容</div>
            )}
          </div>
        </>,
        'ld-card',
      );
    case 'Heading': {
      const level = Number(node.props.level ?? 2);
      const text = String(node.props.text ?? '');
      const Tag = (`h${Math.min(4, Math.max(1, level))}` as unknown) as 'h1';
      return wrap(<Tag className="ld-heading">{text}</Tag>);
    }
    case 'Text':
      return wrap(<p className="ld-text">{String(node.props.text ?? '')}</p>);
    case 'Button':
      return wrap(
        <button
          type="button"
          className={clsx('ld-btn', `ld-btn--${node.props.variant ?? 'primary'}`, `ld-btn--${node.props.size ?? 'md'}`)}
          onClick={(e) => design && e.preventDefault()}
        >
          {String(node.props.text ?? '按钮')}
        </button>,
        'ld-btn-wrap',
      );
    case 'Image':
      return wrap(
        <img
          className="ld-image"
          src={String(node.props.src ?? '')}
          alt={String(node.props.alt ?? '')}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
        />,
      );
    case 'Divider':
      return wrap(<hr className="ld-divider" />);
    case 'Spacer':
      return wrap(<div style={{ height: Number(node.props.size ?? 24) }} />);
    case 'Input':
    case 'TextArea':
    case 'Select':
    case 'DatePicker':
    case 'Switch':
    case 'Checkbox':
    case 'Radio':
      return wrap(<FormControl node={node} design={design} />, 'ld-field');
    case 'Table':
      return wrap(<DataTable node={node} />, 'ld-table-wrap');
    case 'Stat':
      return wrap(
        <div className={clsx('ld-stat', `ld-stat--${node.props.tone ?? 'neutral'}`)}>
          <span className="ld-stat__label">{String(node.props.label ?? '')}</span>
          <strong className="ld-stat__value">{String(node.props.value ?? '')}</strong>
          <span className="ld-stat__trend">{String(node.props.trend ?? '')}</span>
        </div>,
      );
    case 'Tabs': {
      const tabs = (node.props.tabs as string[]) ?? [];
      const active = Number(node.props.active ?? 0);
      return wrap(
        <div className="ld-tabs">
          <div className="ld-tabs__list">
            {tabs.map((t, i) => (
              <span key={t} className={clsx('ld-tabs__tab', i === active && 'is-active')}>
                {t}
              </span>
            ))}
          </div>
          <div className="ld-tabs__panel">{kids()}</div>
        </div>,
      );
    }
    case 'Alert':
      return wrap(
        <div className={clsx('ld-alert', `ld-alert--${node.props.tone ?? 'info'}`)}>
          <strong>{String(node.props.title ?? '')}</strong>
          <p>{String(node.props.message ?? '')}</p>
        </div>,
      );
    default:
      return wrap(<div>{kids()}</div>);
  }
}

function FormControl({ node, design }: { node: SchemaNode; design: boolean }) {
  const label = String(node.props.label ?? '');
  const required = Boolean(node.props.required);

  if (node.type === 'Switch') {
    return (
      <label className="ld-field__inner" style={{ gridTemplateColumns: '1fr auto', alignItems: 'center' }}>
        {label && <span className="ld-field__label">{label}</span>}
        <span className={clsx('ld-switch', node.props.checked && 'is-on')}>
          <span className="ld-switch__knob" />
        </span>
      </label>
    );
  }

  if (node.type === 'Checkbox') {
    return (
      <label className="ld-checkline">
        <input type="checkbox" defaultChecked={Boolean(node.props.checked)} disabled={design} />
        <span>{label}</span>
      </label>
    );
  }

  if (node.type === 'Radio') {
    return (
      <div className="ld-field__inner">
        {label && <span className="ld-field__label">{label}</span>}
        <div className="ld-radio-group">
          {((node.props.options as string[]) ?? []).map((opt) => (
            <label key={opt} className="ld-radio">
              <input
                type="radio"
                name={String(node.props.name ?? node.id)}
                defaultChecked={opt === node.props.value}
                disabled={design}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  return (
    <label className="ld-field__inner">
      {label && (
        <span className="ld-field__label">
          {label}
          {required && <i>*</i>}
        </span>
      )}
      {node.type === 'Input' && (
        <input
          className="ld-control"
          placeholder={String(node.props.placeholder ?? '')}
          readOnly={design}
        />
      )}
      {node.type === 'TextArea' && (
        <textarea
          className="ld-control ld-control--area"
          rows={Number(node.props.rows ?? 3)}
          placeholder={String(node.props.placeholder ?? '')}
          readOnly={design}
        />
      )}
      {node.type === 'Select' && (
        <select className="ld-control" disabled={design} defaultValue="">
          <option value="" disabled>
            {String(node.props.placeholder ?? '请选择')}
          </option>
          {((node.props.options as string[]) ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}
      {node.type === 'DatePicker' && (
        <input className="ld-control" type="date" readOnly={design} />
      )}
    </label>
  );
}

function DataTable({ node }: { node: SchemaNode }) {
  const columns = (node.props.columns as string[]) ?? [];
  const rows = (node.props.rows as string[][]) ?? [];
  const title = String(node.props.title ?? '');
  return (
    <div className="ld-table">
      {title ? <div className="ld-table__title">{title}</div> : null}
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
