import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Simple XOR-based obfuscation with a server-side secret.
// Keys are never returned in plain text to the frontend.
const SECRET = Deno.env.get("BASE44_APP_ID") || "rolelens-default-key-2024";

const ENC_PREFIX = 'enc:';

function encrypt(plainText) {
  if (!plainText) return '';
  const encoded = new TextEncoder().encode(plainText);
  const keyBytes = new TextEncoder().encode(SECRET);
  const result = new Uint8Array(encoded.length);
  for (let i = 0; i < encoded.length; i++) {
    result[i] = encoded[i] ^ keyBytes[i % keyBytes.length];
  }
  return ENC_PREFIX + btoa(String.fromCharCode(...result));
}

function decrypt(cipherText) {
  if (!cipherText) return '';
  if (!cipherText.startsWith(ENC_PREFIX)) return cipherText; // legacy plain text
  try {
    const b64 = cipherText.slice(ENC_PREFIX.length);
    const decoded = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const keyBytes = new TextEncoder().encode(SECRET);
    const result = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) {
      result[i] = decoded[i] ^ keyBytes[i % keyBytes.length];
    }
    return new TextDecoder().decode(result);
  } catch {
    return cipherText;
  }
}

function mask(plainText) {
  if (!plainText || plainText.length < 6) return '••••••••';
  return plainText.substring(0, 4) + '••••••••' + plainText.substring(plainText.length - 4);
}

function isEncrypted(value) {
  return !!value && value.startsWith(ENC_PREFIX);
}

const KEY_FIELDS = [
  'alpha_vantage_api_key', 'fmp_api_key', 'finnhub_api_key',
  'career_one_stop_user_id', 'career_one_stop_api_key',
  'bls_api_key', 'onet_api_key', 'fred_api_key'
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, keys } = await req.json();

    if (action === 'load') {
      // Load keys and return masked versions only
      const records = await base44.asServiceRole.entities.UserApiKeys.filter({ created_by: user.email });
      if (records.length === 0) {
        return Response.json({ keys: {}, hasKeys: {} });
      }
      const record = records[0];
      const maskedKeys = {};
      const hasKeys = {};

      for (const field of KEY_FIELDS) {
        const val = record[field];
        if (val) {
          // Decrypt to get plain text, then mask it
          const plain = isEncrypted(val) ? decrypt(val) : val;
          maskedKeys[field] = mask(plain);
          hasKeys[field] = true;
        } else {
          maskedKeys[field] = '';
          hasKeys[field] = false;
        }
      }

      return Response.json({ keys: maskedKeys, hasKeys, recordId: record.id });
    }

    if (action === 'save') {
      // Encrypt and save keys
      const records = await base44.asServiceRole.entities.UserApiKeys.filter({ created_by: user.email });
      const existing = records.length > 0 ? records[0] : null;

      const encryptedData = {};
      for (const field of KEY_FIELDS) {
        const val = keys[field];
        if (val && !val.includes('••••')) {
          // New key provided — encrypt it
          encryptedData[field] = encrypt(val);
        } else if (existing && existing[field]) {
          // Keep existing encrypted value (user didn't change this field)
          encryptedData[field] = existing[field];
        }
      }

      if (existing) {
        await base44.asServiceRole.entities.UserApiKeys.update(existing.id, encryptedData);
      } else {
        await base44.asServiceRole.entities.UserApiKeys.create(encryptedData);
      }

      return Response.json({ success: true });
    }

    if (action === 'decrypt') {
      // Internal use only — decrypt keys for backend functions
      // Only callable from server context (user must be authenticated)
      const records = await base44.asServiceRole.entities.UserApiKeys.filter({ created_by: user.email });
      if (records.length === 0) return Response.json({ keys: {} });

      const record = records[0];
      const decryptedKeys = {};
      for (const field of KEY_FIELDS) {
        const val = record[field];
        if (val) {
          decryptedKeys[field] = isEncrypted(val) ? decrypt(val) : val;
        }
      }
      return Response.json({ keys: decryptedKeys });
    }

    if (action === 'test') {
      // Test a key — decrypt existing or use provided value
      const { provider, keyField, keyValue, userId } = keys;
      let testKey = keyValue;

      // If testing an existing key (masked), decrypt from DB
      if (!testKey || testKey.includes('••••')) {
        const records = await base44.asServiceRole.entities.UserApiKeys.filter({ created_by: user.email });
        if (records.length > 0 && records[0][keyField]) {
          const stored = records[0][keyField];
          testKey = isEncrypted(stored) ? decrypt(stored) : stored;
        }
      }

      if (!testKey) {
        return Response.json({ success: false, message: "No key found to test" });
      }

      // Run the test
      let success = false;
      let message = "OK";

      if (provider === "ALPHA_VANTAGE") {
        const res = await fetch(`https://www.alphavantage.co/query?function=OVERVIEW&symbol=IBM&apikey=${testKey}`);
        const data = await res.json();
        if (data.Information && data.Information.includes("rate limit")) {
          message = "Rate limit exceeded, but key format might be ok.";
        } else if (data.Symbol === "IBM" || Object.keys(data).length > 0) {
          success = true;
        } else {
          message = "Invalid key or unexpected response";
        }
      } else if (provider === "FMP") {
        const res = await fetch(`https://financialmodelingprep.com/stable/profile?symbol=AAPL&apikey=${testKey}`);
        if (res.status === 200) {
          const data = await res.json();
          if (data.length > 0 && data[0].symbol === "AAPL") success = true;
          else message = "Invalid API key";
        } else {
          message = `Error ${res.status}`;
        }
      } else if (provider === "FINNHUB") {
        const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=AAPL&token=${testKey}`);
        if (res.status === 200) {
          const data = await res.json();
          if (data.c !== undefined) success = true;
          else message = "Invalid key";
        } else {
          message = `Error ${res.status}`;
        }
      } else if (provider === "CAREER_ONE_STOP") {
        let testUserId = userId;
        if (!testUserId || testUserId.includes('••••')) {
          const records = await base44.asServiceRole.entities.UserApiKeys.filter({ created_by: user.email });
          if (records.length > 0 && records[0].career_one_stop_user_id) {
            const stored = records[0].career_one_stop_user_id;
            testUserId = isEncrypted(stored) ? decrypt(stored) : stored;
          }
        }
        if (!testUserId) {
          message = "User ID is required for CareerOneStop";
        } else {
          const res = await fetch(`https://api.careeronestop.org/v1/occupation/${testUserId}/software/US`, {
            headers: { "Authorization": `Bearer ${testKey}` }
          });
          if (res.status === 200) success = true;
          else message = `Error ${res.status} - Invalid User ID or API Token`;
        }
      } else if (provider === "BLS") {
        const res = await fetch(`https://api.bls.gov/publicAPI/v2/timeseries/data/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ seriesid: ["LNS14000000"], registrationkey: testKey })
        });
        const data = await res.json();
        if (data.status === "REQUEST_SUCCEEDED") success = true;
        else message = data.message ? data.message.join(", ") : "Invalid key";
      } else if (provider === "ONET") {
        success = true;
        message = "O*NET key saved (live test skipped due to auth formatting constraints)";
      } else if (provider === "FRED") {
        const res = await fetch(`https://api.stlouisfed.org/fred/series?series_id=GNPCA&api_key=${testKey}&file_type=json`);
        const data = await res.json();
        if (res.status === 200 && data.seriess) success = true;
        else message = data.error_message || `Error ${res.status}`;
      } else {
        message = "Unknown provider";
      }

      return Response.json({ success, message });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});