/**
 * Netlify Function: HelloSign (Dropbox Sign) proxy
 * Securely sends DORA rep agreements for e-signature.
 *
 * Environment variables required:
 *   HELLOSIGN_API_KEY - Your HelloSign API key
 *   HELLOSIGN_CLIENT_ID - Your HelloSign client ID
 *   HELLOSIGN_TENANT_TEMPLATE_ID - Template ID for tenant rep agreement
 *   HELLOSIGN_LISTING_TEMPLATE_ID - Template ID for listing agreement
 *   HELLOSIGN_BUYER_SELLER_TEMPLATE_ID - Template ID for buyer/seller agreement
 */

const TEMPLATE_MAP = {
  tenant: 'HELLOSIGN_TENANT_TEMPLATE_ID',
  landlord: 'HELLOSIGN_LISTING_TEMPLATE_ID',
  buyer_seller: 'HELLOSIGN_BUYER_SELLER_TEMPLATE_ID'
};

exports.handler = async (event) => {
  // CORS headers
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
    const { templateId, signerEmail, signerName, clientType, metadata } = JSON.parse(event.body);

    // Validate required fields
    if (!signerEmail || !signerName || !clientType) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: signerEmail, signerName, clientType' })
      };
    }

    const apiKey = process.env.HELLOSIGN_API_KEY;
    const clientId = process.env.HELLOSIGN_CLIENT_ID;
    const envTemplateKey = TEMPLATE_MAP[clientType];
    const resolvedTemplateId = process.env[envTemplateKey] || templateId;

    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'HelloSign API key not configured. Set HELLOSIGN_API_KEY env variable.' })
      };
    }

    if (!resolvedTemplateId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: `No template configured for client type: ${clientType}` })
      };
    }

    // Call HelloSign API to create signature request from template
    const formData = new URLSearchParams();
    formData.append('template_ids[0]', resolvedTemplateId);
    formData.append('client_id', clientId);
    formData.append('signers[Client][email_address]', signerEmail);
    formData.append('signers[Client][name]', signerName);
    formData.append('test_mode', process.env.HELLOSIGN_TEST_MODE === 'true' ? '1' : '0');
    formData.append('subject', `Resolute Real Estate — Representation Agreement`);
    formData.append('message', `Hi ${signerName}, please review and sign your representation agreement with Resolute Real Estate.`);

    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        formData.append(`metadata[${key}]`, value);
      });
    }

    const response = await fetch('https://api.hellosign.com/v3/signature_request/send_with_template', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(apiKey + ':').toString('base64')
      },
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('HelloSign API error:', data);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error: data.error?.error_msg || 'HelloSign API request failed',
          details: data.error
        })
      };
    }

    // Extract signature request info
    const signatureRequest = data.signature_request;
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        signatureRequestId: signatureRequest.signature_request_id,
        title: signatureRequest.title,
        status: signatureRequest.is_complete ? 'complete' : 'pending',
        signers: signatureRequest.signatures.map(s => ({
          email: s.signer_email_address,
          name: s.signer_name,
          status: s.status_code
        }))
      })
    };

  } catch (error) {
    console.error('HelloSign function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', message: error.message })
    };
  }
};
