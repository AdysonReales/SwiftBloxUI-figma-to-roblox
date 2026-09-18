import axios from 'axios';
import FormData from 'form-data';

interface OpenCloudUploadParams {
  name: string;
  description: string;
  assetType: 'Decal' | 'Model';
  fileBuffer: Buffer;
}

export async function uploadAssetToOpenCloud(params: OpenCloudUploadParams): Promise<{ assetId: string }> {
  const apiKey = process.env.ROBLOX_OPENCLOUD_API_KEY;
  const creatorId = process.env.ROBLOX_CREATOR_ID;
  const creatorType = process.env.ROBLOX_CREATOR_TYPE || 'User';

  if (!apiKey || !creatorId) {
    throw new Error('Missing ROBLOX_OPENCLOUD_API_KEY or ROBLOX_CREATOR_ID environment variables.');
  }

  const metadata = {
    assetType: params.assetType,
    displayName: params.name,
    description: params.description,
    creationContext: {
      creator: {
        [creatorType === 'Group' ? 'groupId' : 'userId']: creatorId
      }
    }
  };

  const form = new FormData();
  form.append('request', JSON.stringify(metadata), { contentType: 'application/json' });
  form.append('fileContent', params.fileBuffer, {
    filename: `${params.name}.png`,
    contentType: 'image/png'
  });

  const response = await axios.post('https://apis.roblox.com/assets/v1/assets', form, {
    headers: {
      'x-api-key': apiKey,
      ...form.getHeaders()
    }
  });

  const data = response.data;
  const assetId = data.response?.assetId || data.assetId;

  if (!assetId && data.path) {
    // Handling asynchronous Open Cloud operations
    const opUrl = `https://apis.roblox.com/assets/v1/${data.path}`;
    const opResponse = await axios.get(opUrl, {
      headers: { 'x-api-key': apiKey }
    });
    return { assetId: opResponse.data.response?.assetId };
  }

  return { assetId };
}