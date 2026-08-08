import { useState, type CSSProperties, type ReactNode } from 'react';
import clsx from 'clsx';
import type { SchemaNode } from '../types/schema';

export interface RuntimeHandlers {
  values: Record<string, unknown>;
  errors: Record<string, string>;
  onChange: (name: string, value: unknown) => void;
  onButtonAction: (action: string, message?: string) => void;
}

interface RendererProps {
  node: SchemaNode;
  mode?: 'design' | 'preview';
  selectedId?: string | null;
  hoverId?: string | null;
  dropTargetId?: string | null;
  onSelect?: (id: string) => void;
  onHover?: (id: string | null) => void;
  onDropTarget?: (id: string | null) => void;
  onDropType?: (type: string, targetId: string) => void;
  onDropNode?: (nodeId: string, targetId: string) => void;
  runtime?: RuntimeHandlers;
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
  dropTargetId,
  onSelect,
  onHover,
  onDropTarget,
  onDropType,
  onDropNode,
  runtime,
}: RendererProps) {
  const selected = selectedId === node.id;
  const hovered = hoverId === node.id;
  const dropActive = dropTargetId === node.id;
  const design = mode === 'design';
  const [tabActive, setTabActive] = useState(Number(node.props.active ?? 0));

  const wrap = (content: ReactNode, className?: string) => (
    <div
      className={clsx(
        'ld-node',
        `ld-node--${node.type.toLowerCase()}`,
        design && 'ld-node--design',
        selected && 'is-selected',
        hovered && !selected && 'is-hovered',
        dropActive && 'is-drop-target',
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
              onDropTarget?.(node.id);
            }
          : undefined
      }
      onDragLeave={
        design
          ? (e) => {
              e.stopPropagation();
              onDropTarget?.(null);
            }
          : undefined
      }
      onDrop={
        design
          ? (e) => {
              e.preventDefault();
              e.stopPropagation();
              const type = e.dataTransfer.getData('application/lingda-type');
              const nodeId = e.dataTransfer.getData('application/lingda-node');
              if (type) onDropType?.(type, node.id);
              else if (nodeId) onDropNode?.(nodeId, node.id);
              onDropTarget?.(null);
            }
          : undefined
      }
    >
      {design && (selected || hovered || dropActive) && (
        <span className="ld-node__badge">{node.label || node.type}</span>
      )}
      {content}
    </div>
  );

  const kids = (children?: SchemaNode[]) =>
    (children ?? node.children ?? []).map((child) => (
      <Renderer
        key={child.id}
        node={child}
        mode={mode}
        selectedId={selectedId}
        hoverId={hoverId}
        dropTargetId={dropTargetId}
        onSelect={onSelect}
        onHover={onHover}
        onDropTarget={onDropTarget}
        onDropType={onDropType}
        onDropNode={onDropNode}
        runtime={runtime}
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
          className={clsx(
            'ld-btn',
            `ld-btn--${node.props.variant ?? 'primary'}`,
            `ld-btn--${node.props.size ?? 'md'}`,
          )}
          onClick={(e) => {
            if (design) {
              e.preventDefault();
              return;
            }
            const action = String(node.props.action ?? 'toast');
            const message = String(node.props.actionMessage ?? node.props.text ?? '已触发');
            runtime?.onButtonAction(action, message);
          }}
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
      return wrap(
        <FormControl node={node} design={design} runtime={runtime} />,
        'ld-field',
      );
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
      const active = design ? Number(node.props.active ?? 0) : tabActive;
      const childList = node.children ?? [];
      return wrap(
        <div className="ld-tabs">
          <div className="ld-tabs__list">
            {tabs.map((t, i) => (
              <button
                key={`${t}-${i}`}
                type="button"
                className={clsx('ld-tabs__tab', i === active && 'is-active')}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!design) setTabActive(i);
                  else onSelect?.(node.id);
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="ld-tabs__panel">
            {design ? kids() : kids(childList[active] ? [childList[active]] : childList.slice(0, 1))}
            {design && !childList.length && <div className="ld-drop-hint">为每个选项卡添加内容节点</div>}
          </div>
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

function FormControl({
  node,
  design,
  runtime,
}: {
  node: SchemaNode;
  design: boolean;
  runtime?: RuntimeHandlers;
}) {
  const label = String(node.props.label ?? '');
  const required = Boolean(node.props.required);
  const name = String(node.props.name || node.id);
  const value = runtime?.values[name];
  const error = runtime?.errors[name];
  const interactive = !design && Boolean(runtime);

  if (node.type === 'Switch') {
    const on = interactive ? Boolean(value) : Boolean(node.props.checked);
    return (
      <label className="ld-field__inner" style={{ gridTemplateColumns: '1fr auto', alignItems: 'center' }}>
        {label && <span className="ld-field__label">{label}</span>}
        <button
          type="button"
          className={clsx('ld-switch', on && 'is-on')}
          onClick={(e) => {
            e.preventDefault();
            if (interactive) runtime?.onChange(name, !on);
          }}
          aria-pressed={on}
        >
          <span className="ld-switch__knob" />
        </button>
      </label>
    );
  }

  if (node.type === 'Checkbox') {
    const checked = interactive ? Boolean(value) : Boolean(node.props.checked);
    return (
      <div>
        <label className="ld-checkline">
          <input
            type="checkbox"
            checked={checked}
            disabled={design}
            onChange={(e) => interactive && runtime?.onChange(name, e.target.checked)}
          />
          <span>
            {label}
            {required && <i style={{ color: 'var(--ld-danger)' }}> *</i>}
          </span>
        </label>
        {error ? <div className="ld-field__error">{error}</div> : null}
      </div>
    );
  }

  if (node.type === 'Radio') {
    const current = interactive ? String(value ?? '') : String(node.props.value ?? '');
    return (
      <div className="ld-field__inner">
        {label && (
          <span className="ld-field__label">
            {label}
            {required && <i>*</i>}
          </span>
        )}
        <div className="ld-radio-group">
          {((node.props.options as string[]) ?? []).map((opt) => (
            <label key={opt} className="ld-radio">
              <input
                type="radio"
                name={name}
                checked={opt === current}
                disabled={design}
                onChange={() => interactive && runtime?.onChange(name, opt)}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
        {error ? <div className="ld-field__error">{error}</div> : null}
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
          className={clsx('ld-control', error && 'is-invalid')}
          placeholder={String(node.props.placeholder ?? '')}
          readOnly={design}
          value={interactive ? String(value ?? '') : ''}
          onChange={(e) => interactive && runtime?.onChange(name, e.target.value)}
        />
      )}
      {node.type === 'TextArea' && (
        <textarea
          className={clsx('ld-control ld-control--area', error && 'is-invalid')}
          rows={Number(node.props.rows ?? 3)}
          placeholder={String(node.props.placeholder ?? '')}
          readOnly={design}
          value={interactive ? String(value ?? '') : ''}
          onChange={(e) => interactive && runtime?.onChange(name, e.target.value)}
        />
      )}
      {node.type === 'Select' && (
        <select
          className={clsx('ld-control', error && 'is-invalid')}
          disabled={design}
          value={interactive ? String(value ?? '') : ''}
          onChange={(e) => interactive && runtime?.onChange(name, e.target.value)}
        >
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
        <input
          className={clsx('ld-control', error && 'is-invalid')}
          type="date"
          readOnly={design}
          value={interactive ? String(value ?? '') : ''}
          onChange={(e) => interactive && runtime?.onChange(name, e.target.value)}
        />
      )}
      {error ? <div className="ld-field__error">{error}</div> : null}
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
