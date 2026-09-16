export interface UDim2 {
  ScaleX: number;
  OffsetX: number;
  ScaleY: number;
  OffsetY: number;
}

export interface Color3 {
  R: number;
  G: number;
  B: number;
  A: number; // Stored here for BackgroundTransparency mapping
}

export interface SwiftBloxNode {
  Name: string;
  ClassName: string;
  Size: UDim2;
  Position: UDim2;
  BackgroundColor3?: Color3;
  BackgroundTransparency?: number;
  CornerRadius?: number;
  Stroke?: { Color: Color3; Thickness: number };
  ListLayout?: { FillDirection: 'Horizontal' | 'Vertical'; Padding: number; SortOrder: 'LayoutOrder' };
  Text?: string;
  TextColor3?: Color3;
  TextSize?: number;
  Font?: string;
  TextXAlignment?: 'Left' | 'Center' | 'Right';
  TextYAlignment?: 'Top' | 'Center' | 'Bottom';
  ImageBase64?: string; // For asset uploads
  Children: SwiftBloxNode[];
}