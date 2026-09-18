/// <reference types="@figma/plugin-typings" />

import { SwiftBloxNode, UDim2, Vector2Data, Color3 } from './types';

interface GradientData {
  Rotation: number;
  ColorPoints: { Position: number; Color: Color3 }[];
}

function figmaColorToRoblox(paint: SolidPaint): Color3 {
  return {
    R: Math.round(paint.color.r * 255),
    G: Math.round(paint.color.g * 255),
    B: Math.round(paint.color.b * 255),
    A: paint.opacity !== undefined ? paint.opacity : 1
  };
}

function parseGradient(fill: GradientPaint): GradientData | undefined {
  if (!fill.gradientStops || fill.gradientStops.length === 0) return undefined;
  
  const colorPoints = fill.gradientStops.map(stop => ({
    Position: Number(stop.position.toFixed(2)),
    Color: {
      R: Math.round(stop.color.r * 255),
      G: Math.round(stop.color.g * 255),
      B: Math.round(stop.color.b * 255),
      A: stop.color.a
    }
  }));

  return {
    Rotation: 90,
    ColorPoints: colorPoints
  };
}

function getSuffixOverride(name: string): { cleanName: string; forcedClass: string | null; isExclude: boolean; isImage: boolean } {
  const lower = name.toLowerCase();
  
  if (lower.includes('_exclude') || lower.includes('_ignore')) {
    return { cleanName: name, forcedClass: null, isExclude: true, isImage: false };
  }

  // Suffix matching based on FigBlox conventions
  const suffixMap: [string, string][] = [
    ['_imagebutton', 'ImageButton'],
    ['_textbutton', 'TextButton'],
    ['_button', 'Button'], // Handled dynamically
    ['_imagelabel', 'ImageLabel'],
    ['_image', 'ImageLabel'],
    ['_scrollingframe', 'ScrollingFrame'],
    ['_scroll', 'ScrollingFrame'],
    ['_textbox', 'TextBox'],
    ['_box', 'TextBox'],
    ['_textlabel', 'TextLabel'],
    ['_canvasgroup', 'CanvasGroup'],
    ['_frame', 'Frame']
  ];

  for (const [suffix, className] of suffixMap) {
    if (lower.endsWith(suffix)) {
      const clean = name.slice(0, -suffix.length).trim();
      return {
        cleanName: clean.length > 0 ? clean : name,
        forcedClass: className,
        isExclude: false,
        isImage: className === 'ImageLabel' || className === 'ImageButton'
      };
    }
  }

  return { cleanName: name.replace(/\[.*?\]\s*/g, ''), forcedClass: null, isExclude: false, isImage: false };
}

function calculateUDim2(node: SceneNode, parentNode: SceneNode | null): { Size: UDim2; Position: UDim2; AnchorPoint?: Vector2Data; AspectRatio?: number } {
  if (!('absoluteBoundingBox' in node) || !node.absoluteBoundingBox) {
    return {
      Size: { ScaleX: 1, OffsetX: 0, ScaleY: 1, OffsetY: 0 },
      Position: { ScaleX: 0, OffsetX: 0, ScaleY: 0, OffsetY: 0 }
    };
  }

  const nodeBox = node.absoluteBoundingBox;
  const width = Math.round(nodeBox.width);
  const height = Math.round(nodeBox.height);
  const aspectRatio = height > 0 ? Number((width / height).toFixed(4)) : undefined;

  if (!parentNode || !('absoluteBoundingBox' in parentNode) || !parentNode.absoluteBoundingBox) {
    const isFullScreen = width >= 1200 && height >= 700;
    if (isFullScreen) {
      return {
        Size: { ScaleX: 1, OffsetX: 0, ScaleY: 1, OffsetY: 0 },
        Position: { ScaleX: 0, OffsetX: 0, ScaleY: 0, OffsetY: 0 },
        AnchorPoint: { X: 0, Y: 0 }
      };
    }
    return {
      Size: { ScaleX: 0, OffsetX: width, ScaleY: 0, OffsetY: height },
      Position: { ScaleX: 0.5, OffsetX: 0, ScaleY: 0.5, OffsetY: 0 },
      AnchorPoint: { X: 0.5, Y: 0.5 },
      AspectRatio: aspectRatio
    };
  }

  const parentBox = parentNode.absoluteBoundingBox;
  const scaleX = parentBox.width > 0 ? nodeBox.width / parentBox.width : 0;
  const scaleY = parentBox.height > 0 ? nodeBox.height / parentBox.height : 0;
  const posX = parentBox.width > 0 ? (nodeBox.x - parentBox.x) / parentBox.width : 0;
  const posY = parentBox.height > 0 ? (nodeBox.y - parentBox.y) / parentBox.height : 0;

  return {
    Size: { ScaleX: scaleX, OffsetX: 0, ScaleY: scaleY, OffsetY: 0 },
    Position: { ScaleX: posX, OffsetX: 0, ScaleY: posY, OffsetY: 0 },
    AnchorPoint: { X: 0, Y: 0 }
  };
}

export async function parseNode(node: SceneNode, parentNode: SceneNode | null): Promise<SwiftBloxNode | null> {
  if (!node.visible) return null;

  const { cleanName, forcedClass, isExclude, isImage: forceImage } = getSuffixOverride(node.name);
  if (isExclude) return null;

  const { Size, Position, AnchorPoint, AspectRatio } = calculateUDim2(node, parentNode);
  let className = forcedClass || 'Frame';

  // Smart Button detection
  if (forcedClass === 'Button') {
    const hasTextChild = 'children' in node && node.children.some(c => c.type === 'TEXT');
    className = hasTextChild ? 'TextButton' : 'ImageButton';
  }

  // Type auto-detection if no suffix override
  if (!forcedClass) {
    if (node.type === 'TEXT') className = 'TextLabel';
    if (node.type === 'VECTOR' || node.type === 'BOOLEAN_OPERATION') className = 'ImageLabel';
  }

  const isImageNode = forceImage || className === 'ImageLabel' || className === 'ImageButton';

  const robloxNode: any = {
    Name: cleanName,
    ClassName: className,
    Size,
    Position,
    AnchorPoint,
    AspectRatio,
    Children: []
  };

  // Extract fills (Solid or Gradient)
  let solidFill: SolidPaint | undefined;
  let gradientFill: GradientPaint | undefined;

  if ('fills' in node && Array.isArray(node.fills)) {
    solidFill = node.fills.find((f: Paint) => f.type === 'SOLID' && f.visible !== false) as SolidPaint | undefined;
    gradientFill = node.fills.find((f: Paint) => (f.type === 'GRADIENT_LINEAR' || f.type === 'GRADIENT_RADIAL') && f.visible !== false) as GradientPaint | undefined;
  }

  if (gradientFill) {
    robloxNode.Gradient = parseGradient(gradientFill);
  }

  // Text Properties
  if (node.type === 'TEXT' && !isImageNode) {
    robloxNode.Text = node.characters;
    robloxNode.TextSize = typeof node.fontSize === 'number' ? node.fontSize : 14;
    robloxNode.BackgroundTransparency = 1;
    robloxNode.TextWrapped = true;

    if (solidFill) {
      robloxNode.TextColor3 = figmaColorToRoblox(solidFill);
    }

    if (node.textAlignHorizontal === 'LEFT') robloxNode.TextXAlignment = 'Left';
    else if (node.textAlignHorizontal === 'RIGHT') robloxNode.TextXAlignment = 'Right';
    else robloxNode.TextXAlignment = 'Center';

    if (node.textAlignVertical === 'TOP') robloxNode.TextYAlignment = 'Top';
    else if (node.textAlignVertical === 'BOTTOM') robloxNode.TextYAlignment = 'Bottom';
    else robloxNode.TextYAlignment = 'Center';
  } else {
    if (solidFill && !isImageNode) {
      const color = figmaColorToRoblox(solidFill);
      robloxNode.BackgroundColor3 = color;
      robloxNode.BackgroundTransparency = 1 - color.A;
    } else if (!solidFill && !gradientFill && !isImageNode) {
      robloxNode.BackgroundTransparency = 1;
    }
  }

  // Strokes (Borders & Text Outlines)
  if ('strokes' in node && Array.isArray(node.strokes) && node.strokes.length > 0) {
    const solidStroke = node.strokes.find((s: Paint) => s.type === 'SOLID' && s.visible !== false) as SolidPaint | undefined;
    if (solidStroke && 'strokeWeight' in node) {
      robloxNode.Stroke = {
        Color: figmaColorToRoblox(solidStroke),
        Thickness: Number(node.strokeWeight) || 1
      };
    }
  }

  // Corner Radius
  if ('cornerRadius' in node && typeof node.cornerRadius === 'number' && node.cornerRadius > 0) {
    robloxNode.CornerRadius = node.cornerRadius;
  }

  // UIListLayout logic
  const isRootFrame = parentNode === null;
  const isExplicitList = node.name.toLowerCase().includes('_scroll') || node.name.toLowerCase().includes('_list');
  const hasBgOrAbs = 'children' in node && node.children.some(c => {
    const isAbs = 'layoutPositioning' in c && c.layoutPositioning === 'ABSOLUTE';
    return isAbs || /shadow|background|bg/i.test(c.name);
  });

  if ((isExplicitList || (!isRootFrame && !hasBgOrAbs)) && 'layoutMode' in node && (node.layoutMode === 'HORIZONTAL' || node.layoutMode === 'VERTICAL')) {
    robloxNode.ListLayout = {
      FillDirection: node.layoutMode === 'HORIZONTAL' ? 'Horizontal' : 'Vertical',
      Padding: node.itemSpacing || 0,
      SortOrder: 'LayoutOrder'
    };
  }

  // Export as Image if designated
  if (isImageNode) {
    try {
      const bytes = await node.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 2 } });
      robloxNode.ImageBase64 = figma.base64Encode(bytes);
      robloxNode.BackgroundTransparency = 1;
    } catch (e) {
      console.error(`Failed to export image: ${node.name}`, e);
    }
  }

  // Recurse children (skip children if node was exported directly as a flat image)
  if ('children' in node && !isImageNode) {
    for (const child of node.children) {
      const childNode = await parseNode(child, node);
      if (childNode) {
        robloxNode.Children.push(childNode);
      }
    }
  }

  return robloxNode;
}