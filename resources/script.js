document.addEventListener('DOMContentLoaded',()=>{
  const audio = document.getElementById('audio');
  const playBtn = document.getElementById('playBtn');
  const progress = document.getElementById('progress');
  const progressBar = document.getElementById('progressBar');
  const progressWrap = document.querySelector('.progress-wrap');
  const time = document.getElementById('time');
  const songTitle = document.getElementById('songTitle');
  const overlay = document.getElementById('overlay');
  const toastContainer = document.getElementById('toastContainer');

  // Mobile detection
  function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
  }

  // Mobile optimizations
  if (isMobile()) {
    // Add mobile class to body for CSS targeting
    document.body.classList.add('mobile');
    
    // Adjust toast positioning for mobile
    if (toastContainer) {
      toastContainer.style.top = '10px';
      toastContainer.style.right = '10px';
    }

  }

  // Toast notification function
  function showToast(message, type = 'success') {
    // Remove any existing toasts instantly
    toastContainer.innerHTML = '';
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      toast.classList.add('hidden');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    }, 3000);
  }

  // Discord status functionality
  const discordUserId = '284372724900691979';
  const discordAvatar = document.getElementById('discordAvatar');
  const discordName = document.getElementById('discordName');
  const discordStatus = document.getElementById('discordStatus');
  const discordStatusContainer = document.querySelector('.discord-status');

  function updateDiscordUI(data) {
    try {
      if (data) {
        // Update avatar with cache busting prevention
        if (data.discord_user.avatar) {
          const avatarUrl = `https://cdn.discordapp.com/avatars/${data.discord_user.id}/${data.discord_user.avatar}.png?size=64`;
          discordAvatar.src = avatarUrl;
        } else {
          discordAvatar.src = `https://cdn.discordapp.com/embed/avatars/${parseInt(data.discord_user.discriminator) % 5}.png`;
        }
        
        // Update name
        const displayName = data.discord_user.global_name || data.discord_user.username;
        discordName.textContent = displayName;
        
        // Update status
        const statusMap = {
          online: 'Online',
          idle: 'Idle', 
          dnd: 'Do Not Disturb',
          offline: 'Offline'
        };
        
        const statusText = statusMap[data.discord_status] || 'Unknown';
        discordStatus.textContent = statusText;
        
        // Update status class for styling
        discordStatusContainer.className = `discord-status ${data.discord_status}`;
        
        // Add activity if present
        if (data.activities && data.activities.length > 0) {
          const activity = data.activities[0];
          if (activity.name && activity.name !== 'Custom Status') {
            discordStatus.textContent = `${statusText} - ${activity.name}`;
          }
        }
        
        // Update Spotify status
        updateSpotifyStatus(data);
      }
    } catch (error) {
      console.error('Error updating Discord UI:', error);
    }
  }

  // Spotify status functionality
  const spotifyAlbumArt = document.getElementById('spotifyAlbumArt');
  const spotifySong = document.getElementById('spotifySong');
  const spotifyArtist = document.getElementById('spotifyArtist');
  const spotifyStatusContainer = document.getElementById('spotifyStatus');
  const spotifyProgressBar = document.getElementById('spotifyProgressBar');
  const spotifyCurrentTime = document.getElementById('spotifyCurrentTime');
  const spotifyTotalTime = document.getElementById('spotifyTotalTime');
  const spotifyCard = document.querySelector('.spotify-card');

  let spotifyProgressInterval;

  function formatSpotifyTime(ms) {
    if (!ms || !isFinite(ms)) return '0:00';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  function updateSpotifyProgress(data) {
    try {
      const spotifyActivity = data.activities?.find(activity => activity.type === 2 && activity.name === 'Spotify');
      
      if (spotifyActivity && spotifyActivity.timestamps) {
        const { start, end } = spotifyActivity.timestamps;
        
        if (start && end) {
          const now = Date.now();
          const totalDuration = end - start;
          const currentProgress = now - start;
          
          // Calculate progress percentage
          const progressPercent = Math.max(0, Math.min(100, (currentProgress / totalDuration) * 100));
          
          // Update progress bar
          spotifyProgressBar.style.setProperty('--progress', progressPercent + '%');
          
          // Update time displays
          spotifyCurrentTime.textContent = formatSpotifyTime(currentProgress);
          spotifyTotalTime.textContent = formatSpotifyTime(totalDuration);
          
          // Clear existing interval before starting new one
          if (spotifyProgressInterval) {
            clearInterval(spotifyProgressInterval);
            spotifyProgressInterval = null;
          }
          
          // Start real-time updates
          spotifyProgressInterval = setInterval(() => {
            const now = Date.now();
            const currentProgress = now - start;
            
            if (currentProgress >= totalDuration) {
              // Song ended, clear interval
              clearInterval(spotifyProgressInterval);
              spotifyProgressInterval = null;
              spotifyProgressBar.style.setProperty('--progress', '0%');
              spotifyCurrentTime.textContent = '0:00';
            } else {
              const progressPercent = Math.max(0, Math.min(100, (currentProgress / totalDuration) * 100));
              spotifyProgressBar.style.setProperty('--progress', progressPercent + '%');
              spotifyCurrentTime.textContent = formatSpotifyTime(currentProgress);
            }
          }, 1000); // Update every second
        }
      } else {
        // No Spotify activity or no timestamps
        clearInterval(spotifyProgressInterval);
        spotifyProgressInterval = null;
        spotifyProgressBar.style.setProperty('--progress', '0%');
        spotifyCurrentTime.textContent = '0:00';
        spotifyTotalTime.textContent = '0:00';
      }
    } catch (error) {
      console.error('Error updating Spotify progress:', error);
      clearInterval(spotifyProgressInterval);
      spotifyProgressInterval = null;
    }
  }

  function updateSpotifyStatus(data) {
    try {
      const spotifyActivity = data.activities?.find(activity => activity.type === 2 && activity.name === 'Spotify');
      
      if (spotifyActivity && spotifyActivity.assets) {
        // Show the Spotify card immediately
        spotifyCard.classList.remove('hidden');
        
        // Update album art
        if (spotifyActivity.assets.large_image) {
          const albumArtUrl = spotifyActivity.assets.large_image.startsWith('spotify:') 
            ? `https://i.scdn.co/image/${spotifyActivity.assets.large_image.replace('spotify:', '')}`
            : spotifyActivity.assets.large_image;
          spotifyAlbumArt.src = albumArtUrl;
        } else {
          spotifyAlbumArt.src = 'https://i.scdn.co/image/ab67616d0000b2735a9a6c4b9a0c4e5a6d7e8f9a'; // Default Spotify placeholder
        }
        
        // Update song and artist
        spotifySong.textContent = spotifyActivity.details || 'Unknown Song';
        spotifyArtist.textContent = spotifyActivity.state || 'Unknown Artist';
        
        // Add playing class for green color
        spotifyStatusContainer.className = 'spotify-status playing';
        
        // Update progress
        updateSpotifyProgress(data);
      } else {
        // Hide the Spotify card with fade-out animation
        spotifyCard.classList.add('hidden');
        
        // Clear progress after animation completes
        setTimeout(() => {
          if (spotifyCard.classList.contains('hidden')) {
            clearInterval(spotifyProgressInterval);
            spotifyProgressInterval = null;
            spotifyProgressBar.style.setProperty('--progress', '0%');
            spotifyCurrentTime.textContent = '0:00';
            spotifyTotalTime.textContent = '0:00';
          }
        }, 300); // Match the CSS transition duration
      }
    } catch (error) {
      console.error('Error updating Spotify status:', error);
      // Hide card on error with fade-out
      spotifyCard.classList.add('hidden');
      
      // Clear progress after animation
      setTimeout(() => {
        if (spotifyCard.classList.contains('hidden')) {
          clearInterval(spotifyProgressInterval);
          spotifyProgressInterval = null;
          spotifyProgressBar.style.setProperty('--progress', '0%');
          spotifyCurrentTime.textContent = '0:00';
          spotifyTotalTime.textContent = '0:00';
        }
      }, 300);
    }
  }

  // Fast HTTP API with timeout
  async function tryHTTPAPI() {
    try {
      // Set a timeout of 5 seconds
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`https://api.lanyard.rest/v1/users/${discordUserId}`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        updateDiscordUI(result.data);
      } else {
        throw new Error('Invalid response');
      }
    } catch (error) {
      console.error('HTTP API failed:', error);
      // Set default values immediately on error
      discordName.textContent = 'Status unavailable';
      discordStatus.textContent = 'Connection failed';
      discordStatusContainer.className = 'discord-status offline';
      discordAvatar.src = 'https://cdn.discordapp.com/embed/avatars/0.png';
    }
  }

  // Initialize with timeout and fallback
  function initDiscordStatus() {
    // Show loading state briefly
    discordName.textContent = 'Loading...';
    discordStatus.textContent = 'Connecting...';
    
    // Try HTTP API first (faster than WebSocket for initial load)
    tryHTTPAPI();
    
    // Try WebSocket for real-time updates
    setTimeout(initWebSocket, 1000);
  }

  // WebSocket for real-time updates
  function initWebSocket() {
    try {
      const ws = new WebSocket(`wss://api.lanyard.rest/socket`);
      
      ws.onopen = () => {
        console.log('Lanyard WebSocket connected for real-time updates');
        ws.send(JSON.stringify({
          op: 2,
          d: {
            subscribe_to_id: discordUserId
          }
        }));
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.t === 'PRESENCE_UPDATE') {
          updateDiscordUI(data.d);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      ws.onclose = () => {
        console.log('WebSocket closed, retrying in 10s...');
        setTimeout(initWebSocket, 10000);
      };
      
    } catch (error) {
      console.error('WebSocket failed:', error);
    }
  }

  // Initialize immediately
  initDiscordStatus();
  
  // Update every 10 seconds as fallback (reduced from 60 for faster updates)
  setInterval(tryHTTPAPI, 10000);

  // song player
  const song = { src: 'resources/song.mp3', name: 'hopeless - morgue' };

  function loadSong() {
    audio.src = song.src;
    songTitle.textContent = song.name;
    audio.load();
  }

  function nextSong() {
    // Restart the same song
    loadSong();
    audio.play();
    playBtn.classList.add('playing');
  }

  function formatTime(s){
    if(!isFinite(s)) return '0:00';
    const m = Math.floor(s/60);
    const sec = Math.floor(s%60).toString().padStart(2,'0');
    return m+':'+sec;
  }

  function extractNameFromSrc(src){
    try{
      const p = src.split('/').pop().split('?')[0];
      return decodeURIComponent(p).replace(/\.[^/.]+$/,'');
    }catch(e){return 'Unknown Song'}
  }
  if(songTitle) songTitle.textContent = extractNameFromSrc(audio.src || '');

  // Audio ended event - restart same song
  audio.addEventListener('ended', () => {
    // Restart the same song
    audio.currentTime = 0;
    audio.play();
    playBtn.classList.add('playing');
  });

  // Initialize with single song
  loadSong();
  
  // Set volume to 20% and lock it
  audio.volume = 0.1;
  
  // Prevent volume changes
  audio.addEventListener('volumechange', () => {
    if (audio.volume !== 0.1) {
      audio.volume = 0.1;
    }
  });
  
  // Override any volume control attempts
  const originalVolumeSet = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'volume');
  if (originalVolumeSet && originalVolumeSet.set) {
    Object.defineProperty(audio, 'volume', {
      get: originalVolumeSet.get,
      set: function(value) {
        originalVolumeSet.set.call(this, 0.1);
      }
    });
  }

  // Overlay click handler
  overlay.addEventListener('click',()=>{
    // Start fade animation
    overlay.style.animation = 'fadeOut 0.8s ease-out forwards';
    
    // Start music immediately
    audio.play();
    playBtn.classList.add('playing');
    
    // Remove overlay after animation completes
    setTimeout(() => {
      overlay.classList.add('hidden');
      overlay.style.animation = ''; // Reset animation
    }, 800);
  });

  playBtn.addEventListener('click',()=>{
    if(audio.paused){
      audio.play();
      playBtn.classList.add('playing');
    } else {
      audio.pause();
      playBtn.classList.remove('playing');
    }
  });

  audio.addEventListener('loadedmetadata',()=>{
    progress.value = 0;
    progressBar.style.width = '0%';
  });

  audio.addEventListener('timeupdate',()=>{
    if(audio.duration){
      const progressPercent = (audio.currentTime / audio.duration) * 100;
      progressBar.style.width = progressPercent + '%';
      progress.value = progressPercent;
    }
  });

  // Click to seek on progress bar
  progressWrap.addEventListener('click',(e)=>{
    if(isFinite(audio.duration)){
      const rect = progressWrap.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const width = rect.width;
      const pct = Math.max(0, Math.min(100, (x / width) * 100));
      progress.value = pct;
      progressBar.style.width = pct + '%';
      audio.currentTime = (pct / 100) * audio.duration;
    }
  });

  // Seek when user interacts with range (fallback)
  let seeking = false;
  progress.addEventListener('input',(e)=>{
    seeking = true;
    const pct = Number(e.target.value)/100;
    if(isFinite(audio.duration)){
      time.textContent = formatTime(pct*audio.duration);
      progressBar.style.width = (pct * 100) + '%';
    }
  });
  progress.addEventListener('change',(e)=>{
    const pct = Number(e.target.value)/100;
    if(isFinite(audio.duration)) audio.currentTime = pct*audio.duration;
    seeking = false;
  });

  // space toggles play/pause when focused on body (only after overlay is hidden)
  document.body.addEventListener('keydown',(e)=>{
    if(e.code==='Space' && document.activeElement.tagName!=='INPUT' && overlay.classList.contains('hidden')){
      e.preventDefault();
      playBtn.click();
    }
  });
});
