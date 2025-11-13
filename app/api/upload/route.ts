import { type NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const ZENODO_API_URL = 'https://zenodo.org/api';
const ZENODO_TOKEN = process.env.ZENODO_TOKEN;

export async function POST(req: NextRequest) {
  if (!ZENODO_TOKEN) {
    return NextResponse.json(
      { error: 'Zenodo API token is not configured.' },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll('file') as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files were uploaded.' }, { status: 400 });
    }

    const uploadedFiles = [];

    for (const file of files) {
      // 1. Create a new deposition for each file
      const depoResponse = await axios.post(
        `${ZENODO_API_URL}/deposit/depositions`,
        {},
        {
          headers: { 'Content-Type': 'application/json' },
          params: { access_token: ZENODO_TOKEN },
        }
      );

      const deposition = depoResponse.data;
      const bucketUrl = deposition.links.bucket;

      // 2. Upload the file
      const fileBuffer = await file.arrayBuffer();
      await axios.put(`${bucketUrl}/${file.name}`, fileBuffer, {
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        params: { access_token: ZENODO_TOKEN },
      });

      // 3. Add metadata for the file
      const metadata = {
        metadata: {
          title: `File upload: ${file.name}`,
          upload_type: 'dataset',
          description: `Uploaded file: ${file.name}`,
          creators: [{ name: 'File Uploader' }],
        },
      };

      await axios.put(
        `${ZENODO_API_URL}/deposit/depositions/${deposition.id}`,
        metadata,
        {
          headers: { 'Content-Type': 'application/json' },
          params: { access_token: ZENODO_TOKEN },
        }
      );

      // 4. Publish the deposition to get a DOI
      const publishResponse = await axios.post(
        `${ZENODO_API_URL}/deposit/depositions/${deposition.id}/actions/publish`,
        {},
        { params: { access_token: ZENODO_TOKEN } }
      );

      const publishedData = publishResponse.data;

      uploadedFiles.push({
        name: file.name,
        doi: publishedData.doi,
      });
    }

    return NextResponse.json({ files: uploadedFiles });
  } catch (error: any) {
    console.error('Zenodo upload failed:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to upload to Zenodo.', details: error.response?.data },
      { status: 500 }
    );
  }
}