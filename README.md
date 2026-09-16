# ⚡ SwiftBlox UI

> **A seamless pipeline for translating Figma designs into native Roblox UI.**

SwiftBlox UI bridges the gap between **UI/UX design and Roblox development**.

Instead of manually rebuilding every frame, button, label, image, and layout from a Figma design, SwiftBlox UI parses the Figma layer tree and converts it into a responsive, scale-based Roblox `GuiObject` hierarchy.

The pipeline combines a **TypeScript-based Figma plugin** with a **Luau-driven Roblox Studio plugin**, allowing designers and developers to move from design to implementation with minimal manual reconstruction.

---

## ✨ Features

### 🎨 Figma Exporter

**TypeScript + Vite + Figma Plugin API**

- **Smart UDim2 Conversion**
  - Converts absolute Figma coordinates into scale-based Roblox `UDim2` values.
  - Designed for responsive screen-space layouts rather than fixed pixel positioning.

- **Deep Style Extraction**
  - Maps supported Figma styling properties to Roblox UI equivalents.
  - Supports properties such as:
    - `UICorner`
    - `UIStroke`
    - `UIListLayout`
    - Background colors
    - Text properties
    - Transparency
    - Images

- **Semantic Layer Parsing**
  - Uses custom layer prefixes to determine the intended Roblox class.
  - Examples:
    - `[Btn]` → `TextButton` / `ImageButton`
    - `[Scroll]` → `ScrollingFrame`
    - `[Group]` → transparent `Frame`

- **Asset Export Pipeline**
  - Uses Figma's `exportAsync()` API to extract supported image and vector assets.

- **Clean JSON Payload**
  - Serializes the Figma hierarchy into a structured JSON payload containing:
    - Layer hierarchy
    - Positions
    - Sizes
    - Styles
    - Text properties
    - Component metadata
    - Asset information

---

### 🛠️ Roblox Studio Importer

**Luau + Rojo + Roblox Studio API**

- **Native GUI Rendering**
  - Dynamically reconstructs the exported Figma hierarchy as Roblox `GuiObject` instances.

- **Package-Oriented Workflow**
  - Generated UI is placed into a dedicated container inside `StarterGui`.
  - The resulting hierarchy can be converted into a Roblox Package for reuse and versioning.

- **Full Undo Support**
  - Uses `ChangeHistoryService:SetWaypoint()` during generation.
  - Failed or unwanted imports can be rolled back using:

  ```text
  Ctrl + Z
