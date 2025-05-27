// 쿠팡 API 키 로드
async function loadCoupangKeys() {
  try {
    const response = await fetch(chrome.runtime.getURL('.env.local'));
    const text = await response.text();
    
    const keys = {};
    text.split('\n').forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        if (key && value) {
          keys[key.trim()] = value.trim();
        }
      }
    });
    
    return {
      accessKey: keys.COUPANG_ACCESS_KEY,
      secretKey: keys.COUPANG_SECRET_KEY,
      subId: keys.COUPANG_SUB_ID || 'default_sub_id'
    };
  } catch (error) {
    console.error('Error loading Coupang API keys:', error);
    return null;
  }
}

// HMAC 서명 생성
function generateCoupangSignature(method, uri, accessKey, secretKey) {
  const parts = uri.split('?');
  const path = parts[0];
  const query = parts[1] || '';
  
  const date = new Date();
  const datetime = date.toISOString().replace(/[-:]/g, '').slice(2, 15) + 'Z';
  
  const message = datetime + method + path + query;
  
  // HMAC-SHA256 해시 생성
  const encoder = new TextEncoder();
  const key = encoder.encode(secretKey);
  const data = encoder.encode(message);
  
  return crypto.subtle.importKey(
    'raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  ).then(key => {
    return crypto.subtle.sign('HMAC', key, data);
  }).then(signature => {
    const hashArray = Array.from(new Uint8Array(signature));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${datetime}, signature=${hashHex}`;
  });
}

// 쿠팡 딥링크 생성
async function createCoupangDeeplink(url) {
  try {
    const keys = await loadCoupangKeys();
    if (!keys || !keys.accessKey || !keys.secretKey) {
      throw new Error('Coupang API keys not found');
    }
    
    const apiUrl = 'https://api-gateway.coupang.com/v2/providers/affiliate_open_api/apis/openapi/v1/deeplink';
    const requestBody = JSON.stringify({
      coupangUrls: [url],
      subId: keys.subId
    });
    
    const signature = await generateCoupangSignature('POST', '/v2/providers/affiliate_open_api/apis/openapi/v1/deeplink', keys.accessKey, keys.secretKey);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': signature
      },
      body: requestBody
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    if (data.rCode !== '0' || !data.data || !data.data.length) {
      throw new Error('Invalid API response');
    }
    
    return data.data[0].shortenUrl || data.data[0].landingUrl;
  } catch (error) {
    console.error('Error creating Coupang deeplink:', error);
    throw error;
  }
}

// 메시지 리스너 설정
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'createDeeplink') {
    createCoupangDeeplink(request.url)
      .then(link => {
        sendResponse({ success: true, link });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // 비동기 응답을 위해 true 반환
  }
}); 