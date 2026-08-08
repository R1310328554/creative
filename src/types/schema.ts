export type ComponentType =
  | 'Page'
  | 'Section'
  | 'Row'
  | 'Columns'
  | 'Text'
  | 'Heading'
  | 'Button'
  | 'Image'
  | 'Divider'
  | 'Input'
  | 'TextArea'
  | 'Select'
  | 'DatePicker'
  | 'Switch'
  | 'Checkbox'
  | 'Radio'
  | 'Table'
  | 'Stat'
  | 'Card'
  | 'Tabs'
  | 'Alert'
  | 'Spacer';

export type NodeStyle = Record<string, string | number | undefined>;

export interface SchemaNode {
  id: string;
  type: ComponentType;
  label?: string;
  props: Record<string, unknown>;
  style?: NodeStyle;
  children?: SchemaNode[];
}

export interface PageSchema {
  id: string;
  name: string;
  description?: string;
  root: SchemaNode;
  updatedAt: string;
}

export type AppType = 'form' | 'page' | 'dashboard' | 'workflow';

export interface LowcodeApp {
  id: string;
  name: string;
  description: string;
  type: AppType;
  cover?: string;
  pages: PageSchema[];
  createdAt: string;
  updatedAt: string;
}

export interface PaletteItem {
  type: ComponentType;
  label: string;
  category: 'layout' | 'basic' | 'form' | 'data' | 'feedback';
  description: string;
  defaultProps: Record<string, unknown>;
  defaultStyle?: NodeStyle;
  canHaveChildren?: boolean;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  schemaPatch?: SchemaNode | null;
  createdAt: string;
}
