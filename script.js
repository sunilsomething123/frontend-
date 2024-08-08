document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'https://you2-mp4-snzg.onrender.com/api';
    // For local development, use:
    // const API_BASE_URL = 'http://localhost:7700/api';

    const form = document.getElementById('converter-form');
    const loader = document.getElementById('loader');
    const errorMessage = document.getElementById('error-message');
    const videoInfo = document.getElementById('video-info');
    const thumbnail = document.getElementById('thumbnail');
    const videoTitle = document.getElementById('video-title');
    const videoDuration = document.getElementById('video-duration');
    const downloadButton = document.getElementById('download-button');
    const convertToMp3Button = document.getElementById('convert-to-mp3');
    const formatSelector = document.getElementById('format-selector');

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
            addRecentConversion(videoData);
        } catch (error) {
            showError(error.message);
        } finally {
            hideLoader();
        }
    });

    downloadButton.addEventListener('click', async () => {
        const youtubeUrl = document.getElementById('youtube-url').value;
        const selectedFormat = formatSelector.value;
        
        if (!selectedFormat) {
            showError('Please select a format');
            return;
        }

        showLoader();
        try {
            await downloadVideo(youtubeUrl, selectedFormat);
            showNotification('Download started', 'success');
        } catch (error) {
            showError('Failed to start download');
        } finally {
            hideLoader();
        }
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
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch video information');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching video info:', error);
            throw error;
        }
    }

    function displayVideoInfo(videoData) {
        thumbnail.src = videoData.thumbnail;
        videoTitle.textContent = videoData.title;
        videoDuration.textContent = `Duration: ${formatDuration(videoData.duration)}`;
        
        const viewCount = document.createElement('p');
        viewCount.textContent = `Views: ${formatNumber(videoData.viewCount)}`;
        
        const likeCount = document.createElement('p');
        likeCount.textContent = `Likes: ${formatNumber(videoData.likeCount)}`;
        
        const publishDate = document.createElement('p');
        publishDate.textContent = `Published: ${formatDate(videoData.publishedAt)}`;
        
        videoInfo.appendChild(viewCount);
        videoInfo.appendChild(likeCount);
        videoInfo.appendChild(publishDate);
        
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

    async function downloadVideo(url, formatId) {
        const response = await fetch(`${API_BASE_URL}/download?url=${encodeURIComponent(url)}&format=${formatId}`);
        
        if (!response.ok) {
            throw new Error('Download failed');
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const filename = getFilenameFromContentDisposition(response.headers.get('Content-Disposition')) || 'video.mp4';

        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
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

    function getFilenameFromContentDisposition(contentDisposition) {
        if (!contentDisposition) return null;
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(contentDisposition);
        if (matches != null && matches[1]) {
            return matches[1].replace(/['"]/g, '');
        }
        return null;
    }

    function formatDuration(duration) {
        const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
        const hours = (match[1] && match[1].slice(0, -1)) || 0;
        const minutes = (match[2] && match[2].slice(0, -1)) || 0;
        const seconds = (match[3] && match[3].slice(0, -1)) || 0;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
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

    function addRecentConversion(videoData) {
        const recentConversions = JSON.parse(localStorage.getItem('recentConversions')) || [];
        recentConversions.unshift({
            title: videoData.title,
            thumbnail: videoData.thumbnail,
            duration: videoData.duration
        });
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
            const img = document.createElement('img');
            img.src = video.thumbnail;
            img.alt = video.title;
            img.width = 120;
            li.appendChild(img);
            
            const titleSpan = document.createElement('span');
            titleSpan.textContent = video.title;
            li.appendChild(titleSpan);
            
            const durationSpan = document.createElement('span');
            durationSpan.textContent = formatDuration(video.duration);
            li.appendChild(durationSpan);
            
            li.addEventListener('click', () => {
                document.getElementById('youtube-url').value = `https://www.youtube.com/watch?v=${video.id}`;
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
