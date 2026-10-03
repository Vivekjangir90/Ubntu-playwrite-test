const axios = require('axios')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, User-Agent',
  'Content-Type': 'application/json'
}

const USER_AGENT = 'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.113 Mobile Safari/537.36'

function isValidHttpUrl(value) {
  try {
    const u = new URL(value)
    return (u.protocol === 'https:' || u.protocol === 'http:') && Boolean(u.hostname)
  } catch {
    return false
  }
}

function getRequestedUrl(event) {
  if (event.httpMethod === 'GET') {
    return event.queryStringParameters?.url || ''
  }
  try {
    return event.body ? (JSON.parse(event.body).url || '') : ''
  } catch {
    return ''
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' }
  }

  if (!['GET', 'POST'].includes(event.httpMethod)) {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: 'Method not allowed', status: 405 })
    }
  }

  const rawUrl = getRequestedUrl(event)
  if (!rawUrl) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: 'Missing url parameter',
        message: 'Query parameter `url` is required (e.g. ?url=https://vidlink.pro/...)',
        status: 400
      })
    }
  }

  const targetUrl = decodeURIComponent(rawUrl)
  if (!isValidHttpUrl(targetUrl)) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: 'Invalid URL format',
        message: 'Target URL must be a valid http or https address',
        url: targetUrl,
        status: 400
      })
    }
  }

  try {
    const response = await axios.get(targetUrl, {
      timeout: 15000,
      maxRedirects: 5,
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': targetUrl
      },
      responseType: 'text',
      validateStatus: () => true
    })

    const isSuccess = response.status >= 200 && response.status < 400
    const finalUrl = response.request?.res?.responseUrl || targetUrl
    const rawData = typeof response.data === 'string' ? response.data : ''
    const isCloudflare = rawData.includes('cf-browser-verification') ||
                         rawData.includes('Just a moment...') ||
                         rawData.includes('challenge-running') ||
                         rawData.includes('cf-turnstile')

    const statusHeaders = {
      ...corsHeaders,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-MovieNestle-Proxy': 'watch-page',
      'X-MovieNestle-Upstream-Status': String(response.status)
    }

    if (!isSuccess) {
      return {
        statusCode: response.status,
        headers: statusHeaders,
        body: JSON.stringify({
          success: false,
          status: response.status,
          upstreamStatus: response.status,
          error: `Upstream watch server returned HTTP ${response.status}`,
          message: `The video provider returned HTTP ${response.status} for the requested title`,
          url: targetUrl,
          finalUrl: finalUrl,
          isCloudflare: isCloudflare,
          contentType: response.headers['content-type'] || 'text/html'
        })
      }
    }

    return {
      statusCode: 200,
      headers: statusHeaders,
      body: JSON.stringify({
        success: true,
        status: response.status,
        upstreamStatus: response.status,
        url: targetUrl,
        finalUrl: finalUrl,
        contentType: response.headers['content-type'] || 'text/html',
        isCloudflare: isCloudflare,
        html: rawData
      })
    }
  } catch (error) {
    const isTimeout = error.code === 'ECONNABORTED' || (error.message && error.message.toLowerCase().includes('timeout'))
    return {
      statusCode: isTimeout ? 504 : 502,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: isTimeout ? 'Upstream Gateway Timeout' : 'Watch server request failed',
        message: error?.message || 'Failed connecting to watch server',
        url: targetUrl,
        status: isTimeout ? 504 : 502
      })
    }
  }
}
