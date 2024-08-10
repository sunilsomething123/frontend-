document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = '/api';
    const form = document.getElementById('converter-form');
    const loader = document.getElementById('loader');
    const errorMessage = document.getElementById('error-message');
    const videoInfo = document.getElementById('video-info');
    const videoPreview = document.getElementById('video-preview');
    const downloadButtons = document.querySelectorAll('.download-btn');
    const formatSelector = document.getElementById('format-selector');
    const convertToMp3Button = document.getElementById('convert-to-mp3');

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
            populateFormatSelector(videoData.formats);
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
                if (result.filename) {
                    window.location.href = `${API_BASE_URL}/download-file/${result.filename}`;
                    showNotification(`Download started for ${quality} version. Filename: ${result.filename}`, 'success');
                }
            } catch (error) {
                showError('Failed to start download');
            } finally {
                hideLoader();
            }
        });
    });

    convertToMp3Button.addEventListener('click', async () => {
        const youtubeUrl = document.getElementById('youtube-url').value;

        showLoader();
        try {
            const result = await convertToMp3(youtubeUrl);
            showNotification(`MP3 conversion complete. Filename: ${result.filename}`, 'success');
            downloadFile(result.filename);
        } catch (error) {
            showError('Failed to convert to MP3');
        } finally {
            hideLoader();
        }
    });

    async function fetchVideoInfo(url) {
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
    }

    function displayVideoInfo(videoData) {
        videoPreview.innerHTML = `
            <iframe width="100%" height="315" src="https://www.youtube.com/embed/${videoData.video_id}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
        `;
        videoInfo.style.display = 'block';
    }

    function populateFormatSelector(formats) {
        formatSelector.innerHTML = '';
        formats.forEach(format => {
            const option = document.createElement('option');
            option.value = format.format_id;
            option.textContent = `${format.resolution} - ${format.ext} (${formatFileSize(format.filesize)})`;
            formatSelector.appendChild(option);
        });
    }

    async function downloadVideo(url, quality) {
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
    }

    async function convertToMp3(url) {
        const response = await fetch(`${API_BASE_URL}/convert-to-mp3`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: url }),
        });

        if (!response.ok) {
            throw new Error('MP3 conversion failed');
        }

        return await response.json();
    }

    function downloadFile(filename) {
        window.location.href = `${API_BASE_URL}/download-file/${filename}`;
    }

    function isValidYouTubeUrl(url) {
        const patterns = [
            /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=|embed\/|v\/|shorts\/)?([a-zA-Z0-9_-]{11})$/,
            /^(https?:\/\/)?(www\.)?youtube\.com\/playlist\?list=[a-zA-Z0-9_-]+$/
        ];
        return patterns.some(pattern => pattern.test(url));
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
        errorMessage.textContent = '';
        errorMessage.style.display = 'none';
    }

    function hideVideoInfo() {
        videoInfo.style.display = 'none';
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

    function formatFileSize(bytes) {
        if (!bytes) return 'Unknown size';
        const units = ['B', 'KB', 'MB', 'GB'];
        let i = 0;
        while (bytes >= 1024 && i < units.length - 1) {
            bytes /= 1024;
            i++;
        }
        return `${bytes.toFixed(2)} ${units[i]}`;
    }

    // Initialize the application
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
