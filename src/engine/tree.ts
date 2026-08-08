import { nanoid } from 'nanoid';
import type { ComponentType, SchemaNode } from '../types/schema';
import { paletteItems } from '../data/palette';

export function createNode(type: ComponentType): SchemaNode {
  const meta = paletteItems.find((item) => item.type === type);
  return {
    id: nanoid(8),
    type,
    label: meta?.label,
    props: { ...(meta?.defaultProps ?? {}) },
    style: { ...(meta?.defaultStyle ?? {}) },
    children: meta?.canHaveChildren ? [] : undefined,
  };
}

export function cloneNode(node: SchemaNode): SchemaNode {
  return {
    ...node,
    id: nanoid(8),
    props: { ...node.props },
    style: node.style ? { ...node.style } : undefined,
    children: node.children?.map(cloneNode),
  };
}

export function findNode(root: SchemaNode, id: string): SchemaNode | null {
  if (root.id === id) return root;
  for (const child of root.children ?? []) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

export function findParent(root: SchemaNode, id: string): SchemaNode | null {
  for (const child of root.children ?? []) {
    if (child.id === id) return root;
    const found = findParent(child, id);
    if (found) return found;
  }
  return null;
}

export function updateNode(
  root: SchemaNode,
  id: string,
  updater: (node: SchemaNode) => SchemaNode,
): SchemaNode {
  if (root.id === id) return updater(root);
  if (!root.children) return root;
  return {
    ...root,
    children: root.children.map((child) => updateNode(child, id, updater)),
  };
}

export function removeNode(root: SchemaNode, id: string): SchemaNode {
  if (!root.children) return root;
  return {
    ...root,
    children: root.children
      .filter((child) => child.id !== id)
      .map((child) => removeNode(child, id)),
  };
}

export function insertChild(
  root: SchemaNode,
  parentId: string,
  child: SchemaNode,
  index?: number,
): SchemaNode {
  return updateNode(root, parentId, (parent) => {
    const children = [...(parent.children ?? [])];
    if (index === undefined || index < 0 || index > children.length) {
      children.push(child);
    } else {
      children.splice(index, 0, child);
    }
    return { ...parent, children };
  });
}

export function moveNode(
  root: SchemaNode,
  nodeId: string,
  targetParentId: string,
  index?: number,
): SchemaNode {
  const node = findNode(root, nodeId);
  if (!node || nodeId === targetParentId) return root;
  if (findNode(node, targetParentId)) return root;
  const without = removeNode(root, nodeId);
  return insertChild(without, targetParentId, node, index);
}

export function canAcceptChildren(type: ComponentType): boolean {
  return Boolean(paletteItems.find((item) => item.type === type)?.canHaveChildren) || type === 'Page';
}

export function flattenTree(root: SchemaNode, depth = 0): Array<{ node: SchemaNode; depth: number }> {
  const list = [{ node: root, depth }];
  for (const child of root.children ?? []) {
    list.push(...flattenTree(child, depth + 1));
  }
  return list;
}
