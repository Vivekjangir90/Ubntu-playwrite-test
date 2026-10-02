# Movie Nestle TMDB API Relay Backend

This directory contains the complete Netlify Function code for `movie-nestle-api.netlify.app`. It acts as a secure intermediary layer between the **Movies Nestle 2.0** Android APK (and Web app) and The Movie Database (TMDB) API.

---

## 🔒 Security Architecture

1. **Zero Client Secrets**: The Android APK does not bundle, store, or transmit any TMDB API key or secret token.
2. **Server-Side Injection**: All requests sent from Android go to:
   ```text
   https://movie-nestle-api.netlify.app/api/tmdb/<endpoint>
   ```
   The Netlify Function injects `TMDB_API_KEY` from its private environment variables and returns the JSON payload back to the app.
3. **No Scraping Relay**: Scraping requests are completely separated. Scraping never runs through Netlify; it runs exclusively client-side on the user's device.

---

## 🚀 Deployment Instructions to Netlify

### Method 1: Using Netlify Dashboard (Recommended)

1. Push this `movie-nestle-api` folder to a new GitHub repository (e.g., `movie-nestle-api`).
2. Log in to [Netlify](https://app.netlify.com/).
3. Click **Add new site** > **Import an existing project** > **GitHub**.
4. Select the repository:
   - **Base directory**: (Leave empty if repository root contains `netlify.toml`, otherwise set to `movie-nestle-api`)
   - **Publish directory**: `public`
   - **Functions directory**: `netlify/functions`
5. Go to **Site configuration** > **Environment variables** > **Add variable**:
   - **Key**: `TMDB_API_KEY`
   - **Value**: *(Your TMDB API Key from themoviedb.org)*
6. (Optional) In **Site settings** > **Change site name**, set the name to:
   ```text
   movie-nestle-api
   ```
   so your URL becomes: `https://movie-nestle-api.netlify.app`
7. Click **Deploy Site**.

### Method 2: Using Netlify CLI

```bash
cd movie-nestle-api
npm install
netlify login
netlify link --name movie-nestle-api
netlify env:set TMDB_API_KEY "your_tmdb_api_key_here"
netlify deploy --prod
```

---

## 🧪 Testing the API Relay

Once deployed, you can verify it in your browser or with curl:

```bash
# Check status page
curl https://movie-nestle-api.netlify.app/

# Test Trending Movies relay
curl https://movie-nestle-api.netlify.app/api/tmdb/trending/all/day

# Test Movie Details relay
curl https://movie-nestle-api.netlify.app/api/tmdb/movie/550
```

---

## ⚠️ Error Responses Handled

* **500 Internal Server Error**: When `TMDB_API_KEY` is missing in Netlify environment variables.
* **4xx / 5xx**: Upstream TMDB API errors are transparently forwarded with original status and messages.
* **504 Gateway Timeout**: Returned if TMDB takes longer than 15 seconds.
