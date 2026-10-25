const axios = require('axios');

const APP_ID = process.env.APP_ID;
const APP_SECRET = process.env.APP_SECRET;
const APP_TOKEN = process.env.APP_TOKEN;
const TABLE_ID = process.env.TABLE_ID;

let cachedToken = null;
let expireTime = 0;

async function getToken() {
  const now = Date.now();
  if (cachedToken && now < expireTime - 600000) {
    return cachedToken;
  }
  const res = await axios.post('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    app_id: APP_ID,
    app_secret: APP_SECRET
  });
  if (res.data.code !== 0) throw new Error(res.data.msg);
  cachedToken = res.data.tenant_access_token;
  expireTime = now + res.data.expire * 1000;
  return cachedToken;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  try {
    const token = await getToken();
    const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/records`;
    const result = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    res.status(200).json(result.data);
  } catch (err) {
    res.status(500).json({ error: err.message, detail: err.response?.data });
  }
}
