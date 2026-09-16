/// <reference types="@figma/plugin-typings" />

import { SwiftBloxNode, UDim2, Color3 } from './types';

function figmaColorToRoblox(paint: SolidPaint): Color3 {
  return {
    R: Math.round(paint.color.r * 255),
    G: Math.round(paint.color.g * 255),
    B: Math.round(paint.color.b * 255),
    A: paint.opacity !== undefined ? paint.opacity : 1
  };
}

function calculateUDim2(node: SceneNode, parentNode: SceneNode | null): { Size: UDim2; Position: UDim2 } {
  if (!parentNode || !('absoluteBoundingBox' in parentNode) || !('absoluteBoundingBox' in node)) {
    return {
      Size: { ScaleX: 1, OffsetX: 0, ScaleY: 1, OffsetY: 0 },
      Position: { ScaleX: 0, OffsetX: 0, ScaleY: 0, OffsetY: 0 }
    };
  }

  const parentBox = parentNode.absoluteBoundingBox;
  const nodeBox = node.absoluteBoundingBox;

  if (!parentBox || !nodeBox) {
    return {
      Size: { ScaleX: 1, OffsetX: 0, ScaleY: 1, OffsetY: 0 },
      Position: { ScaleX: 0, OffsetX: 0, ScaleY: 0, OffsetY: 0 }
    };
  }

  const scaleX = nodeBox.width / parentBox.width;
  const scaleY = nodeBox.height / parentBox.height;
  const posX = (nodeBox.x - parentBox.x) / parentBox.width;
  const posY = (nodeBox.y - parentBox.y) / parentBox.height;

  return {
    Size: { ScaleX: scaleX, OffsetX: 0, ScaleY: scaleY, OffsetY: 0 },
    Position: { ScaleX: posX, OffsetX: 0, ScaleY: posY, OffsetY: 0 }
  };
}

export async function parseNode(node: SceneNode, parentNode: SceneNode | null): Promise<SwiftBloxNode | null> {
  if (!node.visible) return null;

  const { Size, Position } = calculateUDim2(node, parentNode);
  let className = 'Frame';
  const name = node.name;

  if (name.startsWith('[Btn]')) className = 'TextButton';
  if (name.startsWith('[Scroll]')) className = 'ScrollingFrame';
  if (name.startsWith('[Group]')) className = 'Frame';
  if (node.type === 'TEXT' && className === 'Frame') className = 'TextLabel';
  
  let isImage = false;
  if (node.type === 'VECTOR' || node.type === 'BOOLEAN_OPERATION') {
    className = name.startsWith('[Btn]') ? 'ImageButton' : 'ImageLabel';
    isImage = true;
  }
  
  if ('fills' in node && Array.isArray(node.fills)) {
    const hasImageFill = node.fills.some((fill: Paint) => fill.type === 'IMAGE');
    if (hasImageFill) {
      className = name.startsWith('[Btn]') ? 'ImageButton' : 'ImageLabel';
      isImage = true;
    }
  }

  const robloxNode: SwiftBloxNode = {
    Name: name.replace(/\[.*?\]\s*/g, ''),
    ClassName: className,
    Size,
    Position,
    Children: []
  };

  if (name.startsWith('[Group]')) {
    robloxNode.BackgroundTransparency = 1;
  }

  if ('fills' in node && Array.isArray(node.fills)) {
    const solidFill = node.fills.find((f: Paint) => f.type === 'SOLID' && f.visible !== false) as SolidPaint | undefined;
    if (solidFill && !name.startsWith('[Group]')) {
      const color = figmaColorToRoblox(solidFill);
      robloxNode.BackgroundColor3 = color;
      robloxNode.BackgroundTransparency = 1 - color.A;
    } else if (!solidFill && !isImage) {
      robloxNode.BackgroundTransparency = 1;
    }
  }

  if ('strokes' in node && Array.isArray(node.strokes) && node.strokes.length > 0) {
    const solidStroke = node.strokes.find((s: Paint) => s.type === 'SOLID' && s.visible !== false) as SolidPaint | undefined;
    if (solidStroke && 'strokeWeight' in node) {
      robloxNode.Stroke = {
        Color: figmaColorToRoblox(solidStroke),
        Thickness: Number(node.strokeWeight) || 1
      };
    }
  }

  if ('cornerRadius' in node && typeof node.cornerRadius === 'number' && node.cornerRadius > 0) {
    robloxNode.CornerRadius = node.cornerRadius;
  }

  if ('layoutMode' in node && (node.layoutMode === 'HORIZONTAL' || node.layoutMode === 'VERTICAL')) {
    robloxNode.ListLayout = {
      FillDirection: node.layoutMode === 'HORIZONTAL' ? 'Horizontal' : 'Vertical',
      Padding: node.itemSpacing || 0,
      SortOrder: 'LayoutOrder'
    };
  }

  if (node.type === 'TEXT') {
    robloxNode.Text = node.characters;
    robloxNode.TextSize = Number(node.fontSize) || 14;
    robloxNode.BackgroundTransparency = 1;
    
    if (node.textAlignHorizontal === 'LEFT') robloxNode.TextXAlignment = 'Left';
    else if (node.textAlignHorizontal === 'RIGHT') robloxNode.TextXAlignment = 'Right';
    else robloxNode.TextXAlignment = 'Center';

    if (node.textAlignVertical === 'TOP') robloxNode.TextYAlignment = 'Top';
    else if (node.textAlignVertical === 'BOTTOM') robloxNode.TextYAlignment = 'Bottom';
    else robloxNode.TextYAlignment = 'Center';
  }

  if (isImage) {
    try {
      const bytes = await node.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 2 } });
      robloxNode.ImageBase64 = figma.base64Encode(bytes);
      robloxNode.BackgroundTransparency = 1;
    } catch (e) {
      console.error(`Failed to export image for ${name}`, e);
    }
  }

  if ('children' in node && !isImage) {
    for (const child of node.children) {
      const childNode = await parseNode(child, node);
      if (childNode) {
        robloxNode.Children.push(childNode);
      }
    }
  }

  return robloxNode;
}