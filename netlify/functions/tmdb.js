const axios = require('axios')

// Default CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, User-Agent',
  'Content-Type': 'application/json'
}

exports.handler = async (event, context) => {
  // Handle CORS preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'CORS OK' })
    }
  }

  // 1. Verify TMDB API Key from Netlify Environment Variables
  const apiKey = process.env.TMDB_API_KEY
  const accessToken = process.env.TMDB_ACCESS_TOKEN

  if (!apiKey && !accessToken) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Missing TMDB API Key',
        message: 'TMDB_API_KEY is not configured in Netlify Environment Variables. Please set it in Netlify Dashboard > Site Configuration > Environment Variables.',
        status_code: 500
      })
    }
  }

  // 2. Extract the relative TMDB endpoint path
  // Supports calls like:
  // - /api/tmdb/trending/all/day
  // - /.netlify/functions/tmdb/trending/all/day
  let endpoint = event.path || ''
  endpoint = endpoint.replace(/^\/api\/tmdb\/?/, '')
  endpoint = endpoint.replace(/^\/\.netlify\/functions\/tmdb\/?/, '')
  endpoint = endpoint.replace(/^\/+/, '') // Remove leading slashes

  if (!endpoint) {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        name: 'Movie Nestle TMDB API Relay',
        status: 'online',
        version: '2.0.0',
        message: 'Use /api/tmdb/<endpoint> to proxy TMDB requests.',
        docs: 'https://developer.themoviedb.org/reference/intro/getting-started'
      })
    }
  }

  // 3. Assemble query parameters
  const queryParams = { ...(event.queryStringParameters || {}) }
  if (apiKey) {
    queryParams.api_key = apiKey
  }

  const tmdbHeaders = {
    'Accept': 'application/json',
    'User-Agent': 'MovieNestle-API-Relay/2.0'
  }
  if (accessToken) {
    tmdbHeaders['Authorization'] = `Bearer ${accessToken}`
  }

  const tmdbUrl = `https://api.themoviedb.org/3/${endpoint}`

  try {
    const response = await axios.get(tmdbUrl, {
      params: queryParams,
      headers: tmdbHeaders,
      timeout: 15000 // 15 seconds timeout
    })

    return {
      statusCode: response.status,
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, max-age=300' // 5 min cache
      },
      body: JSON.stringify(response.data)
    }
  } catch (error) {
    // 4. Detailed Error Handling
    if (error.response) {
      // TMDB responded with a non-2xx status code
      return {
        statusCode: error.response.status,
        headers: corsHeaders,
        body: JSON.stringify(error.response.data || {
          error: 'TMDB API Error',
          status_code: error.response.status,
          message: error.message
        })
      }
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      // Timeout
      return {
        statusCode: 504,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Gateway Timeout',
          status_code: 504,
          message: 'TMDB upstream API timed out after 15 seconds. Please try again.'
        })
      }
    } else {
      // Network or internal relay error
      return {
        statusCode: 502,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Bad Gateway',
          status_code: 502,
          message: `Network error connecting to TMDB: ${error.message}`
        })
      }
    }
  }
}
