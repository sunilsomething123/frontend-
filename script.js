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
    const downloadButtons = document.querySelectorAll('.download-btn');
    const convertToMp3Button = document.getElementById('convert-to-mp3-btn');
    const recentConversionsList = document.getElementById('recent-conversions');

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

    downloadButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const quality = button.dataset.quality;
            const youtubeUrl = document.getElementById('youtube-url').value;

            showLoader();
            try {
                const result = await downloadVideo(youtubeUrl, quality);
                showNotification(`Download started for ${quality} version. Filename: ${result.filename}`, 'success');
                // You might want to add logic here to handle the downloaded file
            } catch (error) {
                showError('Failed to start download');
            } finally {
                hideLoader();
            }
        });
    });

    convertToMp3Button.addEventListener('click', async () => {
        const filename = document.getElementById('filename').value;

        if (!filename) {
            showError('No filename provided');
            return;
        }

        showLoader();
        try {
            const result = await convertToMp3(filename);
            showNotification(`Conversion to MP3 started. Filename: ${result.filename}`, 'success');
        } catch (error) {
            showError('Failed to convert video to MP3');
        } finally {
            hideLoader();
        }
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

    async function downloadVideo(url, quality) {
        try {
            const response = await fetch(`${API_BASE_URL}/download`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: url, quality: quality }),
            });

            if (!response.ok) {
                throw new Error('Failed to download video');
            }

            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }

    async function convertToMp3(filename) {
        try {
            const response = await fetch(`${API_BASE_URL}/convert-to-mp3`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ filename: filename }),
            });

            if (!response.ok) {
                throw new Error('Failed to convert video to MP3');
            }

            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }

    function downloadFile(filename) {
        window.location.href = `${API_BASE_URL}/download-file/${filename}`;
    }

    async function deleteFile(filename) {
        try {
            const response = await fetch(`${API_BASE_URL}/delete-file`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ filename: filename }),
            });

            if (!response.ok) {
                throw new Error('Failed to delete file');
            }

            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
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
        recentConversionsList.innerHTML = '';

        recentConversions.forEach(video => {
            const li = document.createElement('li');
            li.textContent = video.title;
            li.addEventListener('click', () => {
                document.getElementById('youtube-url').value = video.url;
                form.dispatchEvent(new Event('submit'));
            });
            recentConversionsList.appendChild(li);
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

    function formatDuration(duration) {
        const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
        if (match) {
            const hours = match[1] ? parseInt(match[1], 10) : 0;
            const minutes = match[2] ? parseInt(match[2], 10) : 0;
            const seconds = match[3] ? parseInt(match[3], 10) : 0;

            return `${hours > 0 ? hours + ':' : ''}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return 'Unknown';
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
