import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { uploadAssetToOpenCloud } from './openCloud';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// In-memory buffer storing the latest exported Figma payload
let currentPayload: any = null;
let lastExportTimestamp: number | null = null;

// Option B: Figma Plugin POSTs JSON here
app.post('/export', (req: Request, res: Response) => {
  const payload = req.body;

  if (!payload || !payload.Name) {
    return res.status(400).json({ success: false, error: 'Invalid payload structure' });
  }

  currentPayload = payload;
  lastExportTimestamp = Date.now();
  console.log(`[Bridge] Received Figma export: "${payload.Name}" at ${new Date(lastExportTimestamp).toLocaleTimeString()}`);

  return res.status(200).json({ success: true, message: 'Payload cached successfully' });
});

// Option B: Roblox Studio Plugin GETs JSON from here
app.get('/export', (_req: Request, res: Response) => {
  if (!currentPayload) {
    return res.status(404).json({ success: false, error: 'No exported payload found' });
  }

  return res.status(200).json(currentPayload);
});

// Option C: Open Cloud direct asset upload endpoint
app.post('/upload-asset', async (req: Request, res: Response) => {
  const { name, base64Data } = req.body;

  if (!name || !base64Data) {
    return res.status(400).json({ error: 'Missing name or base64Data' });
  }

  try {
    const fileBuffer = Buffer.from(base64Data, 'base64');
    const result = await uploadAssetToOpenCloud({
      name,
      description: 'Uploaded via SwiftBlox UI Pipeline',
      assetType: 'Decal',
      fileBuffer
    });

    console.log(`[Open Cloud] Asset uploaded: ${result.assetId}`);
    return res.status(200).json({ success: true, assetId: result.assetId });
  } catch (error: any) {
    console.error('[Open Cloud Error]', error.response?.data || error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`⚡ SwiftBlox Bridge Server listening at http://localhost:${PORT}`);
});