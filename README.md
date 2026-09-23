# SwiftBlox UI ⚡

**SwiftBlox UI** is a production-grade **Figma-to-Roblox UI pipeline** that brings 1:1 design fidelity from Figma directly into Roblox Studio.

It provides automated UI conversion, class suffix overrides, native Roblox UI element support, gradient mapping, asset handling, and multiple synchronization workflows through a Figma Plugin, Roblox Studio Companion Plugin, and optional local Bridge Server.

---

## 🏗️ Project Architecture

The repository is divided into three core modules:

```text
SwiftBloxUI/
├── figma-plugin/     # TypeScript, Vite, Tailwind CSS
│                     # Figma Plugin UI & Design Parser
│
├── roblox-plugin/    # Luau, Rojo, Iris GUI
│                     # Roblox Studio Companion Plugin
│
└── bridge-server/    # Node.js, Express
                      # Local HTTP Sync & Open Cloud Hook
```

### Components

| Module          | Technology                     | Purpose                                                             |
| --------------- | ------------------------------ | ------------------------------------------------------------------- |
| `figma-plugin`  | TypeScript, Vite, Tailwind CSS | Parses Figma designs and generates Roblox-compatible UI data        |
| `roblox-plugin` | Luau, Rojo, Iris               | Receives UI data and creates native Roblox UI instances             |
| `bridge-server` | Node.js, Express               | Provides local HTTP synchronization between Figma and Roblox Studio |

---

## 🚀 Key Features

### Figma → Roblox UI Conversion

Convert Figma layouts into native Roblox UI objects while preserving:

* Positioning
* Scaling
* Sizing
* Text properties
* Images
* Corner radii
* Gradients
* Padding
* Shadows
* Layout relationships

### FigBlox-Style Class Suffixes

Use naming suffixes directly inside Figma to control the Roblox class generated during export.

For example:

```text
MainMenu_frame
Play_button
Settings_button
Inventory_scroll
PlayerName_textbox
Character_vpf
```

### Native Roblox UI Integration

SwiftBlox UI maps common Figma properties to native Roblox UI objects:

* Figma Drop Shadow → `UIShadow`
* Figma Corner Radius → `UICorner`
* Figma Auto Layout Padding → `UIPadding`
* Figma Linear Gradient → `UIGradient`
* Figma Group Transparency → `CanvasGroup`
* Figma 3D Viewport → `ViewportFrame`

### Smart Layout Handling

The exporter automatically handles different UI structures, including:

* Full-screen interfaces
* Floating panels
* Modal dialogs
* Aspect-ratio constrained elements
* Nested containers
* Scrollable interfaces
* Viewport-based components

### Asset & Image Handling

Supports:

* Vector graphics
* Image fills
* Base64 image data
* Local asset mapping
* Tintable icon masks
* Transparency edge cleanup through `PixFix`

---

# 📂 Naming Conventions & Suffixes

Append these suffixes to Figma layer names to explicitly control the generated Roblox instance type.

| Suffix            | Roblox Class                 | Description                                                |
| ----------------- | ---------------------------- | ---------------------------------------------------------- |
| `_frame`          | `Frame`                      | Standard UI container                                      |
| `_textlabel`      | `TextLabel`                  | Read-only text                                             |
| `_textbutton`     | `TextButton`                 | Text-based clickable button                                |
| `_button`         | `TextButton` / `ImageButton` | Clickable button with automatic detection                  |
| `_textbox`        | `TextBox`                    | Editable text input                                        |
| `_box`            | `TextBox`                    | Shortcut for `_textbox`                                    |
| `_image`          | `ImageLabel`                 | Static image                                               |
| `_imagelabel`     | `ImageLabel`                 | Static image                                               |
| `_imagebutton`    | `ImageButton`                | Clickable image                                            |
| `_scroll`         | `ScrollingFrame`             | Scrollable container                                       |
| `_scrollingframe` | `ScrollingFrame`             | Scrollable container                                       |
| `_canvas`         | `CanvasGroup`                | Group transparency container                               |
| `_canvasgroup`    | `CanvasGroup`                | Group transparency container                               |
| `_vpf`            | `ViewportFrame`              | 3D viewport                                                |
| `_viewportframe`  | `ViewportFrame`              | 3D viewport                                                |
| `_exclude`        | *Skipped*                    | Completely excluded from export                            |
| `_ignore`         | *Skipped*                    | Completely excluded from export                            |
| `_lock`           | *Preserved*                  | Prevents normal export and preserves aspect ratio behavior |
| `_gray`           | *Tintable*                   | Exports as a white mask for `ImageColor3` tinting          |

---

# 🎨 Example Figma Structure

A Figma design could be organized like this:

```text
MainMenu_frame
├── Background_image
├── Logo_image
├── Play_button
│   └── Play_textlabel
├── Settings_button
└── Version_textlabel
```

SwiftBlox UI converts this structure into Roblox UI instances similar to:

```text
ScreenGui
└── MainMenu
    ├── Background
    ├── Logo
    ├── Play
    │   └── Play
    ├── Settings
    └── Version
```

The suffixes determine how each layer is interpreted during the conversion process.

---

# 🛠️ Installation & Setup

## 1. Figma Plugin

Navigate to the Figma plugin directory:

```bash
cd figma-plugin
```

Install dependencies:

```bash
npm install
```

Build the plugin:

```bash
npm run build
```

After building, load the generated `manifest.json` into Figma:

```text
Figma
→ Plugins
→ Development
→ Import plugin from manifest...
```

Select the generated `manifest.json`.

---

## 2. Roblox Studio Plugin

The Roblox companion plugin uses **Rojo** to build the plugin model.

Navigate to:

```bash
cd roblox-plugin
```

Build the plugin:

```bash
./rojo.exe build -o SwiftBloxUI.rbxmx
```

Copy the generated plugin to your Roblox Studio plugins folder:

```bash
cp SwiftBloxUI.rbxmx "$LOCALAPPDATA/Roblox/Plugins/"
```

Then launch Roblox Studio.

The **SwiftBlox UI** companion plugin should appear in the Plugins toolbar.

> Make sure Rojo is installed and available before running the build command.

---

## 3. Bridge Server

The Bridge Server provides an optional local synchronization method between the Figma plugin and Roblox Studio.

Navigate to:

```bash
cd bridge-server
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The server runs locally at:

```text
http://localhost:3000
```

---

# 🔄 Workflows

SwiftBlox UI supports multiple ways to transfer UI data from Figma to Roblox Studio.

## Option A — Clipboard Workflow

The simplest workflow.

```text
Figma
  ↓
Export UI
  ↓
Copy JSON
  ↓
Roblox Studio Companion Plugin
  ↓
Paste JSON
  ↓
Generate UI
```

### Steps

1. Open your Figma design.
2. Select the UI frame you want to export.
3. Run the SwiftBlox UI Figma plugin.
4. Export the selected design.
5. Copy the generated JSON.
6. Open the SwiftBlox UI plugin inside Roblox Studio.
7. Paste the JSON payload.
8. Generate the Roblox UI.

---

## Option B — Local Bridge Workflow

The Bridge Server provides a more automated synchronization process.

```text
Figma
  ↓
SwiftBlox UI Plugin
  ↓
Local Bridge Server
  ↓
Roblox Studio Plugin
  ↓
Generated Roblox UI
```

### Steps

1. Start the Bridge Server:

```bash
npm run dev
```

2. Open your Figma design.
3. Select the UI you want to synchronize.
4. Send the design payload through the Figma plugin.
5. Open SwiftBlox UI inside Roblox Studio.
6. Select **Sync from Bridge Server**.
7. The Roblox plugin retrieves the latest payload from the local server.
8. The UI is generated inside Roblox Studio.

---

# 🧩 Supported Roblox UI

SwiftBlox UI is designed around Roblox's native GUI system.

Common generated classes include:

```text
Frame
TextLabel
TextButton
TextBox
ImageLabel
ImageButton
ScrollingFrame
CanvasGroup
ViewportFrame

UICorner
UIStroke
UIGradient
UIPadding
UIAspectRatioConstraint
UIShadow
```

This allows exported designs to remain editable inside Roblox Studio rather than becoming flattened images.

---

# 📐 Scaling & Positioning

SwiftBlox UI uses Roblox's scale-based UI system to preserve responsive layouts across different screen sizes.

Rather than relying exclusively on absolute pixel positioning, exported elements can be represented through Roblox `UDim2` values.

Conceptually:

```text
Figma Position
      ↓
Normalized Position
      ↓
Roblox UDim2
```

This allows UI created in Figma to adapt more naturally to different Roblox screen resolutions.

---

# 🖼️ Tintable `_gray` Assets

Adding `_gray` to an image layer allows it to be exported as a tintable white mask.

Example:

```text
Settings_gray
```

The resulting Roblox image can then be recolored using:

```lua
ImageColor3
```

This is useful for:

* Icons
* UI symbols
* Status indicators
* Inventory items
* Themeable interface elements

---

# 🚫 Excluding Layers

Layers that should not appear in the Roblox output can be marked with:

```text
_exclude
```

or:

```text
_ignore
```

Example:

```text
DeveloperNote_exclude
Guide_ignore
```

These elements are skipped during export.

---

# 🔒 Locked Elements

The `_lock` suffix is intended for elements that should remain preserved rather than being processed normally by the exporter.

Example:

```text
Logo_lock
```

This can be used for UI elements that require special aspect-ratio or preservation behavior.

---

# 🧪 Development

Each component can be developed independently.

### Figma Plugin

```bash
cd figma-plugin
npm install
npm run build
```

### Bridge Server

```bash
cd bridge-server
npm install
npm run dev
```

### Roblox Plugin

```bash
cd roblox-plugin
rojo build -o SwiftBloxUI.rbxmx
```

---

# 📁 Repository Structure

```text
SwiftBloxUI/
│
├── figma-plugin/
│   ├── src/
│   ├── manifest.json
│   ├── package.json
│   ├── vite.config.ts
│   └── ...
│
├── roblox-plugin/
│   ├── src/
│   │   ├── UIBuilder.lua
│   │   ├── PropertyMapper.lua
│   │   └── main.server.lua
│   ├── default.project.json
│   └── ...
│
├── bridge-server/
│   ├── src/
│   ├── package.json
│   └── ...
│
└── README.md
```

---

# 🎯 Project Goal

SwiftBlox UI aims to reduce the repetitive work involved in recreating polished Roblox interfaces from Figma.

Instead of manually rebuilding:

```text
Figma Design
      ↓
Find Roblox Instance
      ↓
Create Frame
      ↓
Set Position
      ↓
Set Size
      ↓
Set Colors
      ↓
Add UICorner
      ↓
Add UIGradient
      ↓
Add Padding
      ↓
Repeat...
```

SwiftBlox UI provides a pipeline closer to:

```text
Figma Design
      ↓
SwiftBlox UI
      ↓
Roblox UI
```

The goal is to make **Figma the design source** while keeping the resulting interface **native, editable, and usable inside Roblox Studio**.

---

# 📜 License

This project is currently intended as a personal development project.

License information will be added when the project is prepared for public distribution.
