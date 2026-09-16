/// <reference types="@figma/plugin-typings" />

import { parseNode } from './parser';

declare const __html__: string;

figma.showUI(__html__, { width: 340, height: 420, themeColors: true });

figma.ui.onmessage = async (msg: { type: string; [key: string]: any }) => {
  if (msg.type === 'EXPORT_UI') {
    const selection = figma.currentPage.selection;

    if (selection.length === 0) {
      figma.ui.postMessage({
        type: 'ERROR',
        message: 'Please select a Frame to export.'
      });
      return;
    }

    const rootNode = selection[0];
    if (rootNode.type !== 'FRAME' && rootNode.type !== 'COMPONENT' && rootNode.type !== 'INSTANCE') {
      figma.ui.postMessage({
        type: 'ERROR',
        message: 'Root selection must be a Frame, Component, or Instance.'
      });
      return;
    }

    figma.ui.postMessage({ type: 'STATUS', message: 'Parsing nodes & extracting assets...' });

    try {
      const parsedData = await parseNode(rootNode, null);
      
      figma.ui.postMessage({
        type: 'EXPORT_SUCCESS',
        payload: parsedData
      });
    } catch (error) {
      figma.ui.postMessage({
        type: 'ERROR',
        message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  } else if (msg.type === 'CLOSE') {
    figma.closePlugin();
  }
};