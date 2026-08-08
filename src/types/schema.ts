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

export type ButtonAction =
  | { type: 'toast'; message: string }
  | { type: 'submit'; successMessage?: string }
  | { type: 'reset' }
  | { type: 'navigate'; href: string };

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

export type PropFieldType = 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'options' | 'rows';

export interface PropFieldMeta {
  key: string;
  label: string;
  type: PropFieldType;
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
}

export interface PaletteItem {
  type: ComponentType;
  label: string;
  category: 'layout' | 'basic' | 'form' | 'data' | 'feedback';
  description: string;
  defaultProps: Record<string, unknown>;
  defaultStyle?: NodeStyle;
  canHaveChildren?: boolean;
  propFields?: PropFieldMeta[];
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  schemaPatch?: SchemaNode | null;
  mode?: 'replace' | 'refine';
  createdAt: string;
}

export interface FormRuntimeState {
  values: Record<string, unknown>;
  errors: Record<string, string>;
  submitted: boolean;
  toast: string | null;
}
