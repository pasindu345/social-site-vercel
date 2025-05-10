const express = require('express');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname)));

// API proxy endpoints
app.get('/api/youtube', async (req, res) => {
  try {
    const url = req.query.url;
    
    if (!url) {
      return res.status(400).json({ error: true, message: 'URL parameter is required' });
    }

    console.log('Fetching YouTube video info for URL:', url);
    const response = await fetch(`https://yt-vid.hazex.workers.dev/?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    
    console.log('YouTube API response status:', response.status);
    res.json(data);
  } catch (error) {
    console.error('YouTube API error:', error);
    res.status(500).json({ error: true, message: 'Failed to fetch video information' });
  }
});

app.get('/api/facebook', async (req, res) => {
  try {
    const url = req.query.url;
    
    if (!url) {
      return res.status(400).json({ error: true, message: 'URL parameter is required' });
    }

    console.log('Fetching Facebook video info for URL:', url);
    const response = await fetch(`https://facebook-downloader.apis-bj-devs.workers.dev/?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    
    console.log('Facebook API response status:', response.status);
    res.json(data);
  } catch (error) {
    console.error('Facebook API error:', error);
    res.status(500).json({ error: true, message: 'Failed to fetch video information' });
  }
});

app.get('/api/tiktok', async (req, res) => {
  try {
    const url = req.query.url;
    
    if (!url) {
      return res.status(400).json({ error: true, message: 'URL parameter is required' });
    }

    console.log('Fetching TikTok video info for URL:', url);
    
    // Set up headers
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36',
      'sec-ch-ua': '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
      'sec-ch-ua-mobile': '?1',
      'Accept': 'application/json, text/plain, */*'
    };
    
    // First try the akalankanime API
    const response = await fetch(`https://tiktok-dl.akalankanime11.workers.dev/?url=${encodeURIComponent(url)}`, {
      headers
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('TikTok API response status:', response.status);
      return res.json(data);
    }
    
    console.log('First TikTok API failed, trying alternative API');
    
    // If that fails, try a backup API
    try {
      const backupResponse = await fetch(`https://tiktok-video-no-watermark2.p.rapidapi.com/`, {
        method: 'POST',
        headers: {
          ...headers,
          'content-type': 'application/json',
          'X-RapidAPI-Key': '7a0b0ccac1msh786ee4a22d7381bp1428a0jsn0ca541bc25da',
          'X-RapidAPI-Host': 'tiktok-video-no-watermark2.p.rapidapi.com'
        },
        body: JSON.stringify({ url })
      });
      
      if (backupResponse.ok) {
        const data = await backupResponse.json();
        console.log('TikTok backup API response status:', backupResponse.status);
        return res.json(data);
      }
    } catch (backupError) {
      console.error('Error from backup TikTok API:', backupError);
    }
    
    // Let's use yet another fallback API as a final attempt
    try {
      const lastResortResponse = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, {
        headers
      });
      
      if (lastResortResponse.ok) {
        const data = await lastResortResponse.json();
        console.log('TikTok last resort API response status:', lastResortResponse.status);
        return res.json(data);
      }
    } catch (fallbackError) {
      console.error('Error from fallback TikTok API:', fallbackError);
    }
    
    // If all APIs fail, throw an error
    throw new Error('All TikTok API attempts failed');
  } catch (error) {
    console.error('TikTok API error:', error);
    res.status(500).json({ error: true, message: 'Failed to fetch video information' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});