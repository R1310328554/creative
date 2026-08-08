import type { SchemaNode } from '../types/schema';

const FORM_TYPES = new Set([
  'Input',
  'TextArea',
  'Select',
  'DatePicker',
  'Switch',
  'Checkbox',
  'Radio',
]);

export interface FormFieldMeta {
  id: string;
  name: string;
  label: string;
  type: SchemaNode['type'];
  required: boolean;
  defaultValue: unknown;
}

export function collectFormFields(root: SchemaNode): FormFieldMeta[] {
  const fields: FormFieldMeta[] = [];
  const walk = (node: SchemaNode) => {
    if (FORM_TYPES.has(node.type)) {
      const name = String(node.props.name || node.id);
      let defaultValue: unknown = '';
      if (node.type === 'Switch' || node.type === 'Checkbox') {
        defaultValue = Boolean(node.props.checked);
      } else if (node.type === 'Radio') {
        defaultValue = node.props.value ?? '';
      } else if (node.type === 'Select') {
        defaultValue = '';
      }
      fields.push({
        id: node.id,
        name,
        label: String(node.props.label ?? name),
        type: node.type,
        required: Boolean(node.props.required),
        defaultValue,
      });
    }
    for (const child of node.children ?? []) walk(child);
  };
  walk(root);
  return fields;
}

export function buildInitialValues(root: SchemaNode): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const field of collectFormFields(root)) {
    values[field.name] = field.defaultValue;
  }
  return values;
}

export function validateForm(
  root: SchemaNode,
  values: Record<string, unknown>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of collectFormFields(root)) {
    if (!field.required) continue;
    const v = values[field.name];
    const empty =
      v === undefined ||
      v === null ||
      v === '' ||
      (typeof v === 'boolean' && field.type === 'Checkbox' && v === false);
    if (empty) {
      errors[field.name] = `请填写${field.label}`;
    }
  }
  return errors;
}

/** 在现有页面根下追加若干表单字段（用于 AI 细化） */
export function appendFieldsToRoot(
  root: SchemaNode,
  fields: SchemaNode[],
): SchemaNode {
  const children = [...(root.children ?? [])];
  // 优先插入到最后一个 Card / Section
  for (let i = children.length - 1; i >= 0; i -= 1) {
    const c = children[i];
    if (c.type === 'Card' || c.type === 'Section') {
      children[i] = {
        ...c,
        children: [...(c.children ?? []), ...fields],
      };
      return { ...root, children };
    }
  }
  return { ...root, children: [...children, ...fields] };
}
