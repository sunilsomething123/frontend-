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

    // Declare downloadButtons only once
    const downloadButtons = document.querySelectorAll('.download-btn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const youtubeUrl = document.getElementById('youtube-url').value;

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

    function downloadVideo(videoUrl) {
        // Construct the backend URL that includes the video URL as a query parameter
        const backendUrl = `/redirect?video_url=${encodeURIComponent(videoUrl)}`;
        
        // Redirect the user to the backend, which will then redirect to the Google Video URL
        window.location.href = backendUrl;
    }

    downloadButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const youtubeUrl = document.getElementById('youtube-url').value;

            if (!isValidYouTubeUrl(youtubeUrl)) {
                showError('Please enter a valid YouTube URL');
                return;
            }

            showLoader();
            try {
                // Instead of initiateDownload, call downloadVideo directly
                downloadVideo(youtubeUrl);
                showNotification('Download started', 'success');
            } catch (error) {
                showError('Failed to start download');
            } finally {
                hideLoader();
            }
        });
    });

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
    }

    function clearError() {
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

    function formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        let formattedDuration = '';
        if (hours > 0) {
            formattedDuration += `${hours}:`;
        }
        formattedDuration += `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
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

    // Initialize the application
    updateRecentConversionsList();

    // Check browser support
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

    // Online/Offline status
    window.addEventListener('online', () => {
        showNotification('You are back online!', 'success');
    });

    window.addEventListener('offline', () => {
        showNotification('You are offline. Please check your internet connection.', 'error');
    });
});
