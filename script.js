document.addEventListener('DOMContentLoaded', () => { 
    const API_BASE_URL = 'https://you2-mp4-snzg.onrender.com/api';
    // For local development, you might use:
    // const API_BASE_URL = 'http://localhost:7700/api';
    
    const form = document.getElementById('converter-form');
    const loader = document.getElementById('loader');
    const errorMessage = document.getElementById('error-message');
    const videoInfo = document.getElementById('video-info');
    const thumbnail = document.getElementById('thumbnail');
    const videoTitle = document.getElementById('video-title');
    const videoDuration = document.getElementById('video-duration');
    const downloadButton = document.querySelector('.download-btn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const youtubeUrl = document.getElementById('youtube-url').value.trim();

        if (!isValidYouTubeUrl(youtubeUrl)) {
            showError('Please enter a valid YouTube URL');
            return;
        }

        showLoader();
        clearError();
        hideVideoInfo();

        try {
            const videoData = await fetchVideoInfo(youtubeUrl);
            displayVideoInfo(videoData);
            addRecentConversion(videoData);
        } catch (error) {
            showError('An error occurred while fetching video information');
        } finally {
            hideLoader();
        }
    });

    downloadButton.addEventListener('click', async () => {
        const youtubeUrl = document.getElementById('youtube-url').value.trim();

        if (!isValidYouTubeUrl(youtubeUrl)) {
            showError('Please enter a valid YouTube URL');
            return;
        }

        showLoader();
        try {
            await downloadVideo(youtubeUrl);
            showNotification('Redirecting to video playback...', 'success');
        } catch (error) {
            showError('Failed to start download');
        } finally {
            hideLoader();
        }
    });

    function redirectToGoogleVideoUrl(youtubeUrl) {
        const encodedUrl = encodeURIComponent(youtubeUrl);
        const targetUrl = `${API_BASE_URL}/get-google-video-url?url=${encodedUrl}`;
        
        fetch(targetUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json(); // Expecting JSON response
            })
            .then(data => {
                if (data.error) {
                    alert("Error: " + data.error);
                } else {
                    window.location.href = data.google_video_url;
                }
            })
            .catch(error => {
                console.error("Error fetching Google Video URL:", error);
                alert("Failed to fetch Google Video URL. " + error.message);
            });
    }

    function isValidYouTubeUrl(url) {
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
        return youtubeRegex.test(url);
    }

    function showLoader() {
        loader.style.display = 'block';
    }

    function hideLoader() {
        loader.style.display = 'none';
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }

    function clearError() {
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';
    }

    function hideVideoInfo() {
        videoInfo.style.display = 'none';
    }

    async function fetchVideoInfo(url) {
        try {
            const response = await fetch(`${API_BASE_URL}/video-info`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: url }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch video information');
            }

            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }

    function displayVideoInfo(videoData) {
        thumbnail.src = videoData.thumbnail;
        videoTitle.textContent = videoData.title;
        videoDuration.textContent = `Duration: ${formatDuration(videoData.duration)}`;
        videoInfo.style.display = 'block';
    }

    function formatDuration(durationISO) {
        const match = durationISO.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
        if (!match) return 'Unknown';

        const hours = match[1] ? parseInt(match[1], 10) : 0;
        const minutes = match[2] ? parseInt(match[2], 10) : 0;
        const seconds = match[3] ? parseInt(match[3], 10) : 0;

        let formattedDuration = '';
        if (hours > 0) {
            formattedDuration += `${hours}:`;
        }
        formattedDuration += `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        return formattedDuration;
    }

    function addRecentConversion(videoData) {
        const recentConversions = JSON.parse(localStorage.getItem('recentConversions')) || [];
        recentConversions.unshift(videoData);
        if (recentConversions.length > 5) {
            recentConversions.pop();
        }
        localStorage.setItem('recentConversions', JSON.stringify(recentConversions));
        updateRecentConversionsList();
    }

    function updateRecentConversionsList() {
        const recentConversions = JSON.parse(localStorage.getItem('recentConversions')) || [];
        const recentList = document.getElementById('recent-conversions');
        recentList.innerHTML = '';

        recentConversions.forEach(video => {
            const li = document.createElement('li');
            li.textContent = video.title;
            li.addEventListener('click', () => {
                document.getElementById('youtube-url').value = video.url;
                form.dispatchEvent(new Event('submit'));
            });
            recentList.appendChild(li);
        });
    }

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    updateRecentConversionsList();

    function checkBrowserSupport() {
        const requiredFeatures = {
            'Fetch API': 'fetch' in window,
            'Promise': 'Promise' in window,
            'localStorage': 'localStorage' in window,
            'Flexbox': CSS.supports('display', 'flex')
        };

        let unsupportedFeatures = [];

        for (let feature in requiredFeatures) {
            if (!requiredFeatures[feature]) {
                unsupportedFeatures.push(feature);
            }
        }

        if (unsupportedFeatures.length > 0) {
            showNotification(`Your browser doesn't support: ${unsupportedFeatures.join(', ')}. Some features may not work correctly.`, 'warning');
        }
    }

    checkBrowserSupport();

    window.addEventListener('online', () => {
        showNotification('You are back online!', 'success');
    });

    window.addEventListener('offline', () => {
        showNotification('You are offline. Please check your internet connection.', 'error');
    });
});
