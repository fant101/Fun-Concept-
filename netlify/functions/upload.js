/**
 * Netlify Function: File upload handler
 * Receives files and stores them in Netlify Blobs (or S3/R2).
 *
 * Environment variables:
 *   UPLOAD_STORAGE - 'blobs' (default) or 's3'
 *   AWS_S3_BUCKET - S3 bucket name (if using S3)
 *   AWS_REGION - AWS region (if using S3)
 */

const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    // Parse multipart form data from base64 body
    const contentType = event.headers['content-type'] || '';

    if (!contentType.includes('multipart/form-data')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Content-Type must be multipart/form-data' })
      };
    }

    // For Netlify Blobs storage
    const store = getStore('onboarding-uploads');
    const timestamp = Date.now();
    const clientId = event.queryStringParameters?.clientId || 'unknown';

    // In a real implementation, parse multipart body here.
    // For now, accept base64-encoded file data in JSON format.
    const { files } = JSON.parse(event.body);

    if (!files || !Array.isArray(files) || files.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No files provided' })
      };
    }

    const uploaded = [];

    for (const file of files) {
      const key = `${clientId}/${timestamp}-${file.name}`;
      const buffer = Buffer.from(file.data, 'base64');

      await store.set(key, buffer, {
        metadata: {
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          uploadedAt: new Date().toISOString()
        }
      });

      uploaded.push({
        key,
        name: file.name,
        size: file.size
      });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: `${uploaded.length} file(s) uploaded successfully`,
        files: uploaded
      })
    };

  } catch (error) {
    console.error('Upload function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Upload failed', message: error.message })
    };
  }
};
