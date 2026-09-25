"use strict";
/// <reference types="@figma/plugin-typings" />
figma.showUI(__html__, { width: 450, height: 450 });
figma.ui.onmessage = async (msg) => {
    if (msg.type === 'draw-ui') {
        const nodes = msg.nodes;
        // Pre-load safe fonts to prevent crashes
        await figma.loadFontAsync({ family: "Inter", style: "Regular" });
        await figma.loadFontAsync({ family: "Inter", style: "Bold" });
        const rootFrame = figma.createFrame();
        rootFrame.name = "SwiftBlox_HTML_Import";
        rootFrame.resize(800, 600);
        rootFrame.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
        let maxX = 0;
        let maxY = 0;
        for (const node of nodes) {
            if (node.x + node.width > maxX)
                maxX = node.x + node.width;
            if (node.y + node.height > maxY)
                maxY = node.y + node.height;
            if (node.type === 'FRAME') {
                const frame = figma.createFrame();
                frame.name = node.isImage ? node.name + "_ImageLabel" : node.name;
                frame.resize(node.width, node.height);
                frame.x = node.x;
                frame.y = node.y;
                frame.cornerRadius = node.radius;
                if (node.bg) {
                    frame.fills = [{ type: 'SOLID', color: { r: node.bg.r, g: node.bg.g, b: node.bg.b }, opacity: node.bg.a }];
                }
                else {
                    frame.fills = [];
                }
                if (node.border) {
                    frame.strokes = [{ type: 'SOLID', color: { r: node.border.color.r, g: node.border.color.g, b: node.border.color.b }, opacity: node.border.color.a }];
                    frame.strokeWeight = node.border.width;
                }
                rootFrame.appendChild(frame);
            }
            if (node.type === 'TEXT') {
                const text = figma.createText();
                text.name = node.name;
                text.fontName = { family: "Inter", style: node.fontWeight };
                text.characters = node.text;
                text.fontSize = node.fontSize;
                text.resize(node.width, node.height);
                text.x = node.x;
                text.y = node.y;
                text.fills = [{ type: 'SOLID', color: { r: node.color.r, g: node.color.g, b: node.color.b }, opacity: node.color.a }];
                if (node.textAlign === 'center')
                    text.textAlignHorizontal = 'CENTER';
                else if (node.textAlign === 'right')
                    text.textAlignHorizontal = 'RIGHT';
                else
                    text.textAlignHorizontal = 'LEFT';
                text.textAlignVertical = 'CENTER';
                rootFrame.appendChild(text);
            }
        }
        if (maxX > 0 && maxY > 0) {
            rootFrame.resize(maxX + 40, maxY + 40);
        }
        figma.currentPage.appendChild(rootFrame);
        figma.viewport.scrollAndZoomIntoView([rootFrame]);
        figma.notify("✅ HTML Layout Generated Successfully!");
    }
};
