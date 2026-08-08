import { useMemo, useState, type ReactNode } from 'react';
import {
  Type,
  Square,
  Columns3,
  Heading,
  MousePointerClick,
  Image as ImageIcon,
  Minus,
  FormInput,
  AlignLeft,
  ListFilter,
  Calendar,
  ToggleLeft,
  CheckSquare,
  CircleDot,
  Table2,
  Gauge,
  LayoutTemplate,
  PanelsTopLeft,
  TriangleAlert,
  Space,
  Rows3,
} from 'lucide-react';
import type { ComponentType } from '../../types/schema';
import { categoryLabels, paletteItems } from '../../data/palette';
import { useDesignerStore } from '../../store/designerStore';

const icons: Partial<Record<ComponentType, ReactNode>> = {
  Section: <Square size={16} />,
  Row: <Rows3 size={16} />,
  Columns: <Columns3 size={16} />,
  Card: <LayoutTemplate size={16} />,
  Heading: <Heading size={16} />,
  Text: <Type size={16} />,
  Button: <MousePointerClick size={16} />,
  Image: <ImageIcon size={16} />,
  Divider: <Minus size={16} />,
  Spacer: <Space size={16} />,
  Input: <FormInput size={16} />,
  TextArea: <AlignLeft size={16} />,
  Select: <ListFilter size={16} />,
  DatePicker: <Calendar size={16} />,
  Switch: <ToggleLeft size={16} />,
  Checkbox: <CheckSquare size={16} />,
  Radio: <CircleDot size={16} />,
  Table: <Table2 size={16} />,
  Stat: <Gauge size={16} />,
  Tabs: <PanelsTopLeft size={16} />,
  Alert: <TriangleAlert size={16} />,
};

const categories = ['layout', 'basic', 'form', 'data', 'feedback'] as const;

export function ComponentPalette() {
  const [q, setQ] = useState('');
  const addComponent = useDesignerStore((s) => s.addComponent);

  const groups = useMemo(() => {
    const query = q.trim().toLowerCase();
    return categories
      .map((cat) => ({
        cat,
        items: paletteItems.filter(
          (item) =>
            item.category === cat &&
            (!query ||
              item.label.toLowerCase().includes(query) ||
              item.type.toLowerCase().includes(query)),
        ),
      }))
      .filter((g) => g.items.length);
  }, [q]);

  return (
    <aside className="panel">
      <div className="panel__head">
        <h3>组件</h3>
      </div>
      <div className="palette-search">
        <input
          className="ld-control"
          placeholder="搜索组件…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {groups.map((group) => (
        <div key={group.cat} className="palette-group">
          <div className="palette-group__title">{categoryLabels[group.cat]}</div>
          {group.items.map((item) => (
            <button
              key={item.type}
              type="button"
              className="palette-item"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/lingda-type', item.type);
                e.dataTransfer.effectAllowed = 'copy';
              }}
              onDoubleClick={() => addComponent(item.type)}
              title="拖到画布，或双击添加"
            >
              <span className="palette-item__icon">{icons[item.type]}</span>
              <span>
                <strong>{item.label}</strong>
                <span>{item.description}</span>
              </span>
            </button>
          ))}
        </div>
      ))}
    </aside>
  );
}
