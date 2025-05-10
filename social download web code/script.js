// DOM Elements
const platformButtons = document.querySelectorAll('.platform-btn');
const videoUrlInput = document.getElementById('video-url');
const fetchBtn = document.getElementById('fetch-btn');
const errorMessage = document.getElementById('error-message');
const videoPreview = document.getElementById('video-preview');
const videoThumbnail = document.getElementById('video-thumbnail');
const playBtn = document.getElementById('play-btn');
const videoPlayer = document.getElementById('video-player');
const videoTitle = document.getElementById('video-title');
const videoDuration = document.getElementById('video-duration');
const videoStats = document.getElementById('video-stats');
const thumbnailContainer = document.querySelector('.thumbnail-container');
const videoPlayerContainer = document.querySelector('.video-player-container');
const formatButtons = document.querySelectorAll('.format-btn');
const videoOnlyBtn = document.getElementById('video-only-btn');
const audioOnlyBtn = document.getElementById('audio-only-btn');
const qualitySelect = document.getElementById('quality-select');
const downloadBtn = document.getElementById('download-btn');
const downloadProgress = document.getElementById('download-progress');
const progressBar = document.getElementById('progress-bar');
const progressPercentage = document.getElementById('progress-percentage');

// State
let currentPlatform = 'youtube';
let currentFormat = 'video_with_audio';
let videoData = null;
let selectedQuality = '';
let downloadUrl = '';
let isDownloading = false;

// API endpoints
const API_ENDPOINTS = {
  youtube: 'https://yt-vid.hazex.workers.dev/',
  facebook: 'https://facebook-downloader.apis-bj-devs.workers.dev/',
  tiktok: 'https://tiktok-dl.akalankanime11.workers.dev/'
};

// Initialize
init();

function init() {
  // Set up event listeners
  platformButtons.forEach(button => {
    button.addEventListener('click', () => {
      setPlatform(button.dataset.platform);
    });
  });

  formatButtons.forEach(button => {
    button.addEventListener('click', () => {
      setFormat(button.dataset.format);
    });
  });

  fetchBtn.addEventListener('click', fetchVideo);
  playBtn.addEventListener('click', playVideo);
  qualitySelect.addEventListener('change', handleQualityChange);
  downloadBtn.addEventListener('click', downloadVideo);

  // Set default state
  setPlatform('youtube');
  setFormat('video_with_audio');
  videoPreview.classList.add('hidden');
  downloadBtn.disabled = true;
}

function setPlatform(platform) {
  currentPlatform = platform;
  
  // Update UI
  platformButtons.forEach(button => {
    if (button.dataset.platform === platform) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
  
  // Show/hide platform specific buttons
  if (platform === 'youtube') {
    videoOnlyBtn.style.display = 'flex';
    audioOnlyBtn.style.display = 'flex';
  } else if (platform === 'facebook') {
    videoOnlyBtn.style.display = 'none';
    audioOnlyBtn.style.display = 'none';
    if (currentFormat !== 'video_with_audio') {
      setFormat('video_with_audio');
    }
  } else if (platform === 'tiktok') {
    videoOnlyBtn.style.display = 'none';
    audioOnlyBtn.style.display = 'flex';
  }
  
  // Clear previous results
  clearResults();
}

function setFormat(format) {
  currentFormat = format;
  
  // Update UI
  formatButtons.forEach(button => {
    if (button.dataset.format === format) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
  
  // Update quality options if we have video data
  if (videoData) {
    updateQualityOptions();
  }
}

function clearResults() {
  videoPreview.classList.add('hidden');
  errorMessage.textContent = '';
  videoData = null;
  downloadUrl = '';
  downloadBtn.disabled = true;
  resetVideoPlayer();
}

function resetVideoPlayer() {
  videoPlayerContainer.classList.add('hidden');
  thumbnailContainer.classList.remove('hidden');
  if (videoPlayer.src) {
    videoPlayer.pause();
    videoPlayer.src = '';
  }
}

async function fetchVideo() {
  const url = videoUrlInput.value.trim();
  
  if (!url) {
    showError('Please enter a valid video URL');
    return;
  }
  
  console.log('Started fetching video for URL:', url);
  console.log('Current platform:', currentPlatform);
  
  // Clear previous results
  clearResults();
  
  // Show loading state
  showError('Fetching video information...');
  
  try {
    // Fetch video information from API
    const apiUrl = `${API_ENDPOINTS[currentPlatform]}?url=${encodeURIComponent(url)}`;
    console.log('Fetching from API URL:', apiUrl);
    
    showError('Connecting to API...');
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }
    
    showError('Parsing response...');
    const data = await response.json();
    
    // Check for API errors
    if (currentPlatform === 'youtube' && data.error) {
      throw new Error(data.join || 'Failed to fetch video information');
    } else if (currentPlatform === 'facebook' && !data.status) {
      throw new Error('Failed to fetch Facebook video');
    } else if (currentPlatform === 'tiktok' && (data.status === false || data.status === 'false')) {
      throw new Error(data.message || 'Failed to fetch TikTok video');
    }
    
    // Save video data
    videoData = {
      platform: currentPlatform,
      data: data
    };
    
    // Update UI with video info
    updateVideoInfo();
    updateQualityOptions();
    videoPreview.classList.remove('hidden');
    errorMessage.textContent = '';
    
    // Scroll to video preview
    videoPreview.scrollIntoView({ behavior: 'smooth' });
    
  } catch (error) {
    showError(error.message || 'Failed to fetch video information');
    console.error('Error fetching video:', error);
  }
}

function showError(message) {
  errorMessage.textContent = message;
}

function updateVideoInfo() {
  // Set thumbnail and title based on platform
  if (currentPlatform === 'youtube') {
    videoThumbnail.src = videoData.data.thumbnail;
    videoTitle.textContent = videoData.data.title;
    videoDuration.textContent = formatTime(videoData.data.duration);
    videoStats.classList.add('hidden');
  } else if (currentPlatform === 'facebook') {
    videoThumbnail.src = videoData.data.data.thumbnail;
    videoTitle.textContent = 'Facebook Video';
    videoDuration.textContent = '00:00';
    videoStats.classList.add('hidden');
  } else if (currentPlatform === 'tiktok') {
    if (videoData.data.author_avatar) {
      videoThumbnail.src = videoData.data.author_avatar;
    } else if (videoData.data.creator?.profile_photo) {
      videoThumbnail.src = videoData.data.creator.profile_photo;
    } else {
      videoThumbnail.src = 'https://cdn-icons-png.flaticon.com/512/5968/5968812.png';
    }
    
    let title = 'TikTok Video';
    if (videoData.data.video_title) {
      title = videoData.data.video_title;
    } else if (videoData.data.author_nickname) {
      title = `TikTok Video by ${videoData.data.author_nickname}`;
    } else if (videoData.data.creator?.username) {
      title = `TikTok Video by @${videoData.data.creator.username}`;
    }
    videoTitle.textContent = title;
    
    // Set duration if available
    if (videoData.data.duration) {
      videoDuration.textContent = formatTime(videoData.data.duration);
    } else if (videoData.data.details?.video_duration) {
      videoDuration.textContent = formatTime(videoData.data.details.video_duration);
    } else {
      videoDuration.textContent = '00:00';
    }
    
    // Show stats if available
    if (videoData.data.details) {
      videoStats.innerHTML = '';
      const { total_views, total_likes } = videoData.data.details;
      
      if (total_views) {
        const viewsSpan = document.createElement('span');
        viewsSpan.innerHTML = `<i class="fas fa-eye"></i> ${formatNumber(total_views)}`;
        videoStats.appendChild(viewsSpan);
      }
      
      if (total_likes) {
        const likesSpan = document.createElement('span');
        likesSpan.innerHTML = `<i class="fas fa-heart"></i> ${formatNumber(total_likes)}`;
        videoStats.appendChild(likesSpan);
      }
      
      videoStats.classList.remove('hidden');
    } else {
      videoStats.classList.add('hidden');
    }
  }
}

function updateQualityOptions() {
  // Clear previous options
  qualitySelect.innerHTML = '';
  
  if (currentPlatform === 'youtube') {
    const ytData = videoData.data;
    
    if (currentFormat === 'video_with_audio' && ytData.video_with_audio) {
      ytData.video_with_audio.forEach(item => {
        const option = document.createElement('option');
        option.value = item.label;
        option.textContent = `${item.label} (${item.width}x${item.height}, ${item.fps}fps)`;
        option.dataset.url = item.url;
        qualitySelect.appendChild(option);
      });
    } else if (currentFormat === 'video_only' && ytData.video_only) {
      ytData.video_only.forEach(item => {
        const option = document.createElement('option');
        option.value = item.label;
        option.textContent = `${item.label} (${item.width}x${item.height}, ${item.fps}fps)`;
        option.dataset.url = item.url;
        qualitySelect.appendChild(option);
      });
    } else if (currentFormat === 'audio' && ytData.audio) {
      ytData.audio.forEach(item => {
        const option = document.createElement('option');
        option.value = item.label;
        option.textContent = `${item.label} (${(item.bitrate / 1000).toFixed(0)}kbps)`;
        option.dataset.url = item.url;
        qualitySelect.appendChild(option);
      });
    }
  } else if (currentPlatform === 'facebook') {
    const fbData = videoData.data;
    const option = document.createElement('option');
    option.value = fbData.data.quality;
    option.textContent = fbData.data.quality;
    option.dataset.url = fbData.data.url;
    qualitySelect.appendChild(option);
  } else if (currentPlatform === 'tiktok') {
    const tkData = videoData.data;
    
    if (currentFormat === 'video_with_audio') {
      let videoUrl = '';
      if (tkData.non_watermarked_url) {
        videoUrl = tkData.non_watermarked_url;
      } else if (tkData.watermarked_url) {
        videoUrl = tkData.watermarked_url;
      } else if (tkData.data?.video) {
        videoUrl = tkData.data.video;
      }
      
      if (videoUrl) {
        const option = document.createElement('option');
        option.value = 'HD';
        option.textContent = 'HD Quality';
        option.dataset.url = videoUrl;
        qualitySelect.appendChild(option);
      }
    } else if (currentFormat === 'audio') {
      let audioUrl = '';
      if (tkData.data?.audio) {
        audioUrl = tkData.data.audio;
      }
      
      if (audioUrl) {
        const option = document.createElement('option');
        option.value = 'audio';
        option.textContent = 'Audio Only';
        option.dataset.url = audioUrl;
        qualitySelect.appendChild(option);
      }
    }
  }
  
  // Select first option and trigger change event
  if (qualitySelect.options.length > 0) {
    qualitySelect.selectedIndex = 0;
    handleQualityChange();
  } else {
    downloadUrl = '';
    downloadBtn.disabled = true;
  }
}

function handleQualityChange() {
  const selectedOption = qualitySelect.options[qualitySelect.selectedIndex];
  if (selectedOption && selectedOption.dataset.url) {
    downloadUrl = selectedOption.dataset.url;
    downloadBtn.disabled = false;
  } else {
    downloadUrl = '';
    downloadBtn.disabled = true;
  }
}

function playVideo() {
  thumbnailContainer.classList.add('hidden');
  videoPlayerContainer.classList.remove('hidden');
  
  // Get video URL based on platform and format
  let videoUrl = '';
  
  if (currentPlatform === 'youtube') {
    const ytData = videoData.data;
    if (ytData.video_with_audio && ytData.video_with_audio.length > 0) {
      videoUrl = ytData.video_with_audio[0].url;
    }
  } else if (currentPlatform === 'facebook') {
    videoUrl = videoData.data.data.url;
  } else if (currentPlatform === 'tiktok') {
    const tkData = videoData.data;
    if (tkData.non_watermarked_url) {
      videoUrl = tkData.non_watermarked_url;
    } else if (tkData.watermarked_url) {
      videoUrl = tkData.watermarked_url;
    } else if (tkData.data?.video) {
      videoUrl = tkData.data.video;
    }
  }
  
  if (videoUrl) {
    videoPlayer.src = videoUrl;
    videoPlayer.play().catch(error => {
      console.error('Error playing video:', error);
    });
  }
}

async function downloadVideo() {
  if (!downloadUrl || isDownloading) return;
  
  try {
    isDownloading = true;
    
    // Show progress
    downloadProgress.classList.remove('hidden');
    progressBar.style.width = '0%';
    progressPercentage.textContent = '0%';
    
    // Start download
    const response = await fetch(downloadUrl);
    
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }
    
    // Get total size
    const contentLength = response.headers.get('content-length');
    const totalSize = contentLength ? parseInt(contentLength, 10) : 0;
    let receivedSize = 0;
    
    // Create a reader from the response
    const reader = response.body.getReader();
    const chunks = [];
    
    // Read data
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      chunks.push(value);
      receivedSize += value.length;
      
      // Update progress
      if (totalSize) {
        const progress = Math.round((receivedSize / totalSize) * 100);
        progressBar.style.width = `${progress}%`;
        progressPercentage.textContent = `${progress}%`;
      }
    }
    
    // Convert chunks to Blob
    const blob = new Blob(chunks);
    
    // Create object URL for download
    const url = URL.createObjectURL(blob);
    
    // Determine file extension
    let fileExtension = 'mp4';
    if (currentFormat === 'audio') {
      fileExtension = 'mp3';
    }
    
    // Generate filename
    let filename = '';
    if (currentPlatform === 'youtube') {
      filename = `${videoData.data.title || 'youtube-video'}.${fileExtension}`;
    } else if (currentPlatform === 'facebook') {
      filename = `facebook-video.${fileExtension}`;
    } else if (currentPlatform === 'tiktok') {
      if (videoData.data.video_title) {
        filename = `${videoData.data.video_title}.${fileExtension}`;
      } else {
        filename = `tiktok-video.${fileExtension}`;
      }
    }
    
    // Download file
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Reset state
      isDownloading = false;
      downloadProgress.classList.add('hidden');
    }, 100);
    
  } catch (error) {
    isDownloading = false;
    downloadProgress.classList.add('hidden');
    
    console.error('Download error:', error);
    showError('Failed to download video: ' + error.message);
  }
}

// Utility functions
function formatTime(seconds) {
  if (!seconds) return '00:00';
  
  // Convert to number if it's a string
  if (typeof seconds === 'string') {
    seconds = parseInt(seconds, 10);
  }
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${padZero(hours)}:${padZero(minutes)}:${padZero(secs)}`;
  } else {
    return `${padZero(minutes)}:${padZero(secs)}`;
  }
}

function padZero(num) {
  return num.toString().padStart(2, '0');
}

function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  } else {
    return num.toString();
  }
}