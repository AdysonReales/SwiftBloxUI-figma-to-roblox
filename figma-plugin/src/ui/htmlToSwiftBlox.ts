type Color = { R: number; G: number; B: number; A: number };

type SwiftBloxNode = {
  Name: string;
  ClassName: string;
  Size: { ScaleX: number; OffsetX: number; ScaleY: number; OffsetY: number };
  Position: { ScaleX: number; OffsetX: number; ScaleY: number; OffsetY: number };
  BackgroundColor3?: Color;
  BackgroundTransparency?: number;
  CornerRadius?: number;
  Stroke?: { Color: Color; Thickness: number };
  Text?: string;
  TextColor3?: Color;
  TextSize?: number;
  TextWrapped?: boolean;
  FontFamily?: string;
  FontWeight?: string;
  TextXAlignment?: 'Left' | 'Center' | 'Right';
  TextYAlignment?: 'Top' | 'Center' | 'Bottom';
  Children: SwiftBloxNode[];
};

const invisibleColor = (color: string) => color === 'transparent' || color === 'rgba(0, 0, 0, 0)';

function colorFromCss(value: string): Color | undefined {
  if (!value || invisibleColor(value)) return undefined;
  const parts = value.match(/[\d.]+/g);
  if (!parts || parts.length < 3) return undefined;
  return {
    R: Math.round(Number(parts[0])),
    G: Math.round(Number(parts[1])),
    B: Math.round(Number(parts[2])),
    A: parts.length > 3 ? Number(parts[3]) : 1,
  };
}

function pixel(value: string): number {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : 0;
}

function fontWeight(value: string): string {
  const weight = Number.parseInt(value, 10);
  if (weight >= 700) return 'Bold';
  if (weight >= 600) return 'SemiBold';
  if (weight >= 500) return 'Medium';
  if (weight <= 300) return 'Light';
  return 'Regular';
}

function alignment(value: string): 'Left' | 'Center' | 'Right' {
  if (value === 'center' || value === 'justify') return 'Center';
  if (value === 'right' || value === 'end') return 'Right';
  return 'Left';
}

function safeName(element: Element, index: number): string {
  const id = element.id ? `_${element.id}` : '';
  const className = typeof element.className === 'string' && element.className.trim()
    ? `_${element.className.trim().split(/\s+/)[0]}` : '';
  return `${element.tagName}${id || className || `_${index}`}`.replace(/[^A-Za-z0-9_]/g, '_');
}

function textDirectlyIn(element: Element): string {
  return Array.from(element.childNodes)
    .filter((node) => node.nodeType === Node.TEXT_NODE)
    .map((node) => node.textContent?.replace(/\s+/g, ' ').trim() ?? '')
    .filter(Boolean)
    .join(' ');
}

function nodeClass(element: Element, directText: string): string {
  const tag = element.tagName.toLowerCase();
  if (tag === 'button' || (element as HTMLElement).getAttribute('role') === 'button') return 'TextButton';
  if (tag === 'input' || tag === 'textarea') return 'TextBox';
  if (tag === 'img') return 'ImageLabel';
  if (directText && element.children.length === 0) return 'TextLabel';
  return 'Frame';
}

export function convertHtmlToSwiftBlox(html: string): { payload: SwiftBloxNode; warnings: string[] } {
  if (!html.trim()) throw new Error('Paste some HTML before converting.');

  const renderArea = document.getElementById('html-render-area') as HTMLDivElement | null;
  if (!renderArea) throw new Error('HTML layout engine is unavailable.');

  // Keep pasted styles isolated so a page-level selector cannot change the plugin itself.
  const sandbox = renderArea.shadowRoot ?? renderArea.attachShadow({ mode: 'open' });
  sandbox.innerHTML = html;
  sandbox.querySelectorAll('script, iframe, object, embed, link[rel="stylesheet"]').forEach((element) => element.remove());

  const warnings: string[] = [];
  let index = 0;
  const rootRect = renderArea.getBoundingClientRect();

  const walk = (element: Element, parentRect: DOMRect): SwiftBloxNode | undefined => {
    const htmlElement = element as HTMLElement;
    const style = window.getComputedStyle(htmlElement);
    const rect = htmlElement.getBoundingClientRect();
    if (style.display === 'none' || rect.width <= 0 || rect.height <= 0) return undefined;

    const directText = textDirectlyIn(element);
    const className = nodeClass(element, directText);
    const widthScale = parentRect.width > 0 ? rect.width / parentRect.width : 0;
    const heightScale = parentRect.height > 0 ? rect.height / parentRect.height : 0;
    const xScale = parentRect.width > 0 ? (rect.left - parentRect.left) / parentRect.width : 0;
    const yScale = parentRect.height > 0 ? (rect.top - parentRect.top) / parentRect.height : 0;
    const background = colorFromCss(style.backgroundColor);
    const border = pixel(style.borderTopWidth) > 0 && style.borderStyle !== 'none'
      ? colorFromCss(style.borderTopColor) : undefined;

    const node: SwiftBloxNode = {
      Name: safeName(element, ++index),
      ClassName: className,
      Size: { ScaleX: widthScale, OffsetX: 0, ScaleY: heightScale, OffsetY: 0 },
      Position: { ScaleX: xScale, OffsetX: 0, ScaleY: yScale, OffsetY: 0 },
      Children: [],
    };

    if (background && className !== 'TextLabel') {
      node.BackgroundColor3 = background;
      node.BackgroundTransparency = 1 - background.A;
    } else {
      node.BackgroundTransparency = 1;
    }
    const radius = pixel(style.borderTopLeftRadius);
    if (radius > 0) node.CornerRadius = radius;
    if (border) node.Stroke = { Color: border, Thickness: pixel(style.borderTopWidth) || 1 };

    if (className === 'TextLabel' || className === 'TextButton' || className === 'TextBox') {
      const input = element as HTMLInputElement;
      node.Text = className === 'TextBox' ? (input.value || input.placeholder || '') : directText || element.textContent?.trim() || '';
      node.TextColor3 = colorFromCss(style.color) ?? { R: 0, G: 0, B: 0, A: 1 };
      node.TextSize = pixel(style.fontSize) || 14;
      node.TextWrapped = style.whiteSpace !== 'nowrap';
      node.FontFamily = style.fontFamily.split(',')[0].replace(/["']/g, '').trim() || 'Gotham';
      node.FontWeight = fontWeight(style.fontWeight);
      node.TextXAlignment = alignment(style.textAlign);
      node.TextYAlignment = 'Center';
    }

    if (element.tagName.toLowerCase() === 'img') {
      warnings.push(`Image "${safeName(element, index)}" needs a Roblox asset ID after import.`);
    }
    if (style.backgroundImage && style.backgroundImage !== 'none') {
      warnings.push(`Background image or CSS gradient on "${safeName(element, index)}" was not converted.`);
    }
    if (style.boxShadow && style.boxShadow !== 'none') {
      warnings.push(`Box shadow on "${safeName(element, index)}" was not converted.`);
    }

    Array.from(element.children).forEach((child) => {
      const childNode = walk(child, rect);
      if (childNode) node.Children.push(childNode);
    });
    return node;
  };

  const payload: SwiftBloxNode = {
    Name: 'HTML_Import',
    ClassName: 'Frame',
    Size: { ScaleX: 1, OffsetX: 0, ScaleY: 1, OffsetY: 0 },
    Position: { ScaleX: 0, OffsetX: 0, ScaleY: 0, OffsetY: 0 },
    BackgroundTransparency: 1,
    Children: [],
  };

  Array.from(sandbox.children).forEach((child) => {
    const childNode = walk(child, rootRect);
    if (childNode) payload.Children.push(childNode);
  });
  if (payload.Children.length === 0) throw new Error('No visible HTML elements were found. Use inline CSS or a <style> block.');
  return { payload, warnings };
}
