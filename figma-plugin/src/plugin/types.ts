export interface UDim2 {
  ScaleX: number;
  OffsetX: number;
  ScaleY: number;
  OffsetY: number;
}

export interface Vector2Data {
  X: number;
  Y: number;
}

export interface Color3 {
  R: number;
  G: number;
  B: number;
  A: number;
}

export interface SwiftBloxNode {
  Name: string;
  ClassName: string;
  Size: UDim2;
  Position: UDim2;
  AnchorPoint?: Vector2Data;
  AspectRatio?: number;
  BackgroundColor3?: Color3;
  BackgroundTransparency?: number;
  CornerRadius?: number;
  Stroke?: { Color: Color3; Thickness: number };
  ListLayout?: { FillDirection: 'Horizontal' | 'Vertical'; Padding: number; SortOrder: 'LayoutOrder' };
  Text?: string;
  TextColor3?: Color3;
  TextSize?: number;
  TextWrapped?: boolean;
  Font?: string;
  TextXAlignment?: 'Left' | 'Center' | 'Right';
  TextYAlignment?: 'Top' | 'Center' | 'Bottom';
  ImageBase64?: string;
  Children: SwiftBloxNode[];
}