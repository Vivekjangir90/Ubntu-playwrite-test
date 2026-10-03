const axios = require('axios')
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, User-Agent',
  'Content-Type': 'application/json'
}
const USER_AGENT = 'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.113 Mobile Safari/537.36'
function isValidHttpUrl(value) {
  try { const u = new URL(value); return (u.protocol === 'https:' || u.protocol === 'http:') && !!u.hostname } catch { return false }
}
function getRequestedUrl(event) {
  if (event.httpMethod === 'GET') return event.queryStringParameters?.url || ''
  try { return event.body ? (JSON.parse(event.body).url || '') : '' } catch { return '' }
}
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders, body: '' }
  if (!['GET','POST'].includes(event.httpMethod)) return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({success:false,error:'Method not allowed'}) }
  const targetUrl = getRequestedUrl(event)
  if (!targetUrl) return { statusCode:400, headers:corsHeaders, body:JSON.stringify({success:false,error:'Missing url parameter'}) }
  if (!isValidHttpUrl(targetUrl)) return { statusCode:400, headers:corsHeaders, body:JSON.stringify({success:false,error:'Invalid URL'}) }
  try {
    const response = await axios.get(targetUrl, {
      timeout:15000, maxRedirects:5,
      headers:{'User-Agent':USER_AGENT,'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8','Accept-Language':'en-US,en;q=0.9','Referer':targetUrl},
      responseType:'text', validateStatus:()=>true
    })
    return {
      statusCode: response.status,
      headers:{...corsHeaders,'Cache-Control':'no-store, no-cache, must-revalidate','X-MovieNestle-Proxy':'watch-page'},
      body:JSON.stringify({success:response.status>=200 && response.status<400,status:response.status,finalUrl:response.request?.res?.responseUrl || targetUrl,contentType:response.headers['content-type'] || 'text/html',html:typeof response.data==='string'?response.data:''})
    }
  } catch (error) {
    return {statusCode:502,headers:corsHeaders,body:JSON.stringify({success:false,error:'Watch server request failed',message:error?.message || 'Unknown error'})}
  }
}
