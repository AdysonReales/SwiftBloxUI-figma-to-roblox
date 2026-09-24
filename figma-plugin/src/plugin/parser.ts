/// <reference types="@figma/plugin-typings" />

import { SwiftBloxNode, UDim2, Vector2Data, Color3, GradientData } from './types';

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
    Position: typeof stop.position === 'number' ? Number(stop.position.toFixed(2)) : 0,
    Color: {
      R: Math.round(stop.color.r * 255),
      G: Math.round(stop.color.g * 255),
      B: Math.round(stop.color.b * 255),
      A: stop.color.a
    }
  }));

  return { Rotation: 90, ColorPoints: colorPoints };
}

function getSuffixOverride(name: string): { cleanName: string; forcedClass: string | null; isExclude: boolean; isImage: boolean; isLock: boolean; isGray: boolean; scrollAxis: 'X' | 'Y' | 'XY' | null } {
  const lower = name.toLowerCase();
  
  const isExclude = lower.includes('_exclude') || lower.includes('_ignore');
  const isLock = lower.includes('_lock');
  const isGray = lower.includes('_gray');
  
  let scrollAxis: 'X' | 'Y' | 'XY' | null = null;
  if (lower.includes('_scrollx')) scrollAxis = 'X';
  else if (lower.includes('_scrolly')) scrollAxis = 'Y';
  else if (lower.includes('_scroll') || lower.includes('_scrollingframe')) scrollAxis = 'XY';

  const suffixMap: [string, string][] = [
    ['_imagebutton', 'ImageButton'],
    ['_textbutton', 'TextButton'],
    ['_button', 'Button'],
    ['_imagelabel', 'ImageLabel'],
    ['_image', 'ImageLabel'],
    ['_scrollingframe', 'ScrollingFrame'],
    ['_scrollx', 'ScrollingFrame'],
    ['_scrolly', 'ScrollingFrame'],
    ['_scroll', 'ScrollingFrame'],
    ['_textbox', 'TextBox'],
    ['_box', 'TextBox'],
    ['_textlabel', 'TextLabel'],
    ['_canvasgroup', 'CanvasGroup'],
    ['_canvas', 'CanvasGroup'],
    ['_viewportframe', 'ViewportFrame'],
    ['_vpf', 'ViewportFrame'],
    ['_frame', 'Frame']
  ];

  let cleanName = name;
  let forcedClass: string | null = null;

  for (const [suffix, className] of suffixMap) {
    if (lower.includes(suffix)) {
      forcedClass = className;
      cleanName = name.replace(new RegExp(`${suffix}|_gray|_lock|_exclude|_ignore`, 'gi'), '').trim();
      break;
    }
  }

  cleanName = cleanName.replace(/_gray|_lock|_exclude|_ignore/gi, '').replace(/\[.*?\]\s*/g, '').trim();

  return { 
    cleanName: cleanName.length > 0 ? cleanName : 'Element', 
    forcedClass, 
    isExclude, 
    isImage: forcedClass === 'ImageLabel' || forcedClass === 'ImageButton',
    isLock,
    isGray,
    scrollAxis
  };
}

function calculateUDim2(node: SceneNode, parentNode: SceneNode | null): { Size: UDim2; Position: UDim2; AnchorPoint?: Vector2Data; AspectRatio?: number } {
  if (!('absoluteBoundingBox' in node) || !node.absoluteBoundingBox) {
    return { Size: { ScaleX: 1, OffsetX: 0, ScaleY: 1, OffsetY: 0 }, Position: { ScaleX: 0, OffsetX: 0, ScaleY: 0, OffsetY: 0 } };
  }

  const nodeBox = node.absoluteBoundingBox;
  const width = Math.round(nodeBox.width);
  const height = Math.round(nodeBox.height);
  const aspectRatio = height > 0 ? Number((width / height).toFixed(4)) : undefined;

  if (!parentNode || !('absoluteBoundingBox' in parentNode) || !parentNode.absoluteBoundingBox) {
    const isFullScreen = width >= 1200 && height >= 700;
    if (isFullScreen) {
      return { Size: { ScaleX: 1, OffsetX: 0, ScaleY: 1, OffsetY: 0 }, Position: { ScaleX: 0, OffsetX: 0, ScaleY: 0, OffsetY: 0 }, AnchorPoint: { X: 0, Y: 0 } };
    }
    return { Size: { ScaleX: 0, OffsetX: width, ScaleY: 0, OffsetY: height }, Position: { ScaleX: 0.5, OffsetX: 0, ScaleY: 0.5, OffsetY: 0 }, AnchorPoint: { X: 0.5, Y: 0.5 }, AspectRatio: aspectRatio };
  }

  const parentBox = parentNode.absoluteBoundingBox;
  const scaleX = parentBox.width > 0 ? nodeBox.width / parentBox.width : 0;
  const scaleY = parentBox.height > 0 ? nodeBox.height / parentBox.height : 0;
  const posX = parentBox.width > 0 ? (nodeBox.x - parentBox.x) / parentBox.width : 0;
  const posY = parentBox.height > 0 ? (nodeBox.y - parentBox.y) / parentBox.height : 0;

  return { Size: { ScaleX: scaleX, OffsetX: 0, ScaleY: scaleY, OffsetY: 0 }, Position: { ScaleX: posX, OffsetX: 0, ScaleY: posY, OffsetY: 0 }, AnchorPoint: { X: 0, Y: 0 } };
}

export async function parseNode(node: SceneNode, parentNode: SceneNode | null): Promise<SwiftBloxNode | null> {
  if (!node.visible) return null;

  const { cleanName, forcedClass, isExclude, isImage: forceImage, isLock, isGray, scrollAxis } = getSuffixOverride(node.name);
  if (isExclude) return null;

  const { Size, Position, AnchorPoint, AspectRatio } = calculateUDim2(node, parentNode);
  let className = forcedClass || 'Frame';

  if (forcedClass === 'Button') {
    const hasTextChild = 'children' in node && node.children.some(c => c.type === 'TEXT');
    className = hasTextChild ? 'TextButton' : 'ImageButton';
  }

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
    AspectRatio: isLock ? AspectRatio : undefined,
    Children: []
  };

  if (scrollAxis && className === 'ScrollingFrame') {
    robloxNode.ScrollAxis = scrollAxis;
  }

  let solidFill: SolidPaint | undefined;
  let gradientFills: GradientPaint[] = [];

  if ('fills' in node && Array.isArray(node.fills)) {
    const visibleFills = node.fills.filter((f: Paint) => f.visible !== false);
    solidFill = visibleFills.find((f: Paint) => f.type === 'SOLID') as SolidPaint | undefined;
    gradientFills = visibleFills.filter((f: Paint) => f.type === 'GRADIENT_LINEAR' || f.type === 'GRADIENT_RADIAL') as GradientPaint[];
  }

  if (gradientFills.length > 0) {
    robloxNode.Gradient = parseGradient(gradientFills[0]);
    robloxNode.BackgroundColor3 = { R: 255, G: 255, B: 255, A: 1 };
    robloxNode.BackgroundTransparency = 0;
  } else if (solidFill && !isImageNode) {
    const color = figmaColorToRoblox(solidFill);
    robloxNode.BackgroundColor3 = color;
    robloxNode.BackgroundTransparency = 1 - color.A;
  } else if (!isImageNode) {
    robloxNode.BackgroundTransparency = 1;
  }

  if (node.type === 'TEXT' && !isImageNode) {
    robloxNode.Text = node.characters;
    robloxNode.TextSize = (typeof node.fontSize === 'number') ? node.fontSize : 14;
    robloxNode.BackgroundTransparency = 1;
    robloxNode.TextWrapped = true;
    
    if (node.fontName && typeof node.fontName !== 'symbol') {
      robloxNode.FontFamily = node.fontName.family;
      robloxNode.FontStyle = node.fontName.style;
    }

    if (solidFill) {
      robloxNode.TextColor3 = figmaColorToRoblox(solidFill);
    }

    if (node.textAlignHorizontal === 'LEFT') robloxNode.TextXAlignment = 'Left';
    else if (node.textAlignHorizontal === 'RIGHT') robloxNode.TextXAlignment = 'Right';
    else robloxNode.TextXAlignment = 'Center';

    if (node.textAlignVertical === 'TOP') robloxNode.TextYAlignment = 'Top';
    else if (node.textAlignVertical === 'BOTTOM') robloxNode.TextYAlignment = 'Bottom';
    else robloxNode.TextYAlignment = 'Center';
  }

  if ('strokes' in node && Array.isArray(node.strokes) && node.strokes.length > 0) {
    const solidStroke = node.strokes.find((s: Paint) => s.type === 'SOLID' && s.visible !== false) as SolidPaint | undefined;
    if (solidStroke && 'strokeWeight' in node && typeof node.strokeWeight === 'number') {
      robloxNode.Stroke = { Color: figmaColorToRoblox(solidStroke), Thickness: node.strokeWeight };
    }
  }

  if ('cornerRadius' in node && typeof node.cornerRadius === 'number' && node.cornerRadius > 0) {
    robloxNode.CornerRadius = node.cornerRadius;
  }

  if ('effects' in node && Array.isArray(node.effects)) {
    const dropShadow = node.effects.find(e => e.type === 'DROP_SHADOW' && e.visible !== false) as DropShadowEffect | undefined;
    if (dropShadow) {
      robloxNode.Shadow = {
        Color: { R: Math.round(dropShadow.color.r * 255), G: Math.round(dropShadow.color.g * 255), B: Math.round(dropShadow.color.b * 255), A: 1 },
        Offset: { X: dropShadow.offset.x, Y: dropShadow.offset.y },
        Blur: typeof dropShadow.radius === 'number' ? dropShadow.radius : 4,
        Transparency: 1 - dropShadow.color.a
      };
    }
  }

  const isRootFrame = parentNode === null;
  const hasBgOrAbs = 'children' in node && node.children.some(c => ('layoutPositioning' in c && c.layoutPositioning === 'ABSOLUTE') || /shadow|background|bg/i.test(c.name));

  if (!isRootFrame && !hasBgOrAbs && 'layoutMode' in node && (node.layoutMode === 'HORIZONTAL' || node.layoutMode === 'VERTICAL')) {
    robloxNode.ListLayout = {
      FillDirection: node.layoutMode === 'HORIZONTAL' ? 'Horizontal' : 'Vertical',
      Padding: typeof node.itemSpacing === 'number' ? node.itemSpacing : 0,
      SortOrder: 'LayoutOrder'
    };
    
    if ('paddingTop' in node && typeof node.paddingTop === 'number' && (node.paddingTop > 0 || node.paddingBottom > 0 || node.paddingLeft > 0 || node.paddingRight > 0)) {
      robloxNode.Padding = {
        Top: typeof node.paddingTop === 'number' ? node.paddingTop : 0,
        Bottom: typeof node.paddingBottom === 'number' ? node.paddingBottom : 0,
        Left: typeof node.paddingLeft === 'number' ? node.paddingLeft : 0,
        Right: typeof node.paddingRight === 'number' ? node.paddingRight : 0
      };
    }
  }

  if (isImageNode) {
    try {
      const bytes = await node.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 2 } });
      robloxNode.ImageBase64 = figma.base64Encode(bytes);
      robloxNode.BackgroundTransparency = 1;
      
      if (isGray && solidFill) {
        robloxNode.ImageColor3 = figmaColorToRoblox(solidFill);
      }
    } catch (e) {
      console.error(`Failed to export image: ${node.name}`, e);
    }
  }

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