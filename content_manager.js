// content_manager.js - Content Management Functions for Admin Panel

// Global variables
let prayerTimes = {};
let currentSlideIndex = 0;
let slideInterval;
let quranVerseInterval;
let currentDate = new Date();
let adminModal;
let originalPrayerLayout = null;

// Initialize prayer layout - no longer storing original layout since we're using dynamic structure
function initPrayerLayoutStorage() {
    // We no longer store original layout since we dynamically rebuild the 'atas' and 'bawah' structure
    // The layout is now built dynamically with rebuildPrayerTimeStructure()
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize all application components
function initializeApp() {
    // Initialize prayer time structure first
    rebuildPrayerTimeStructure();
    
    loadPrayerTimes();
    updateTime();
    setInterval(updateTime, 1000); // Update every second
    
    setupVideoPlayer();
    setupAdminPanel();
    setupQuranVerses();
    setupEventListeners();
    
    // Load prayer time visibility on app initialization
    loadPrayerTimeVisibility();
    
    // Automatically start with video-only mode on application load
    setTimeout(() => {
        // Check if the video-only radio button exists and select it
        const videoOnlyRadio = document.getElementById('show-videos');
        if (videoOnlyRadio) {
            videoOnlyRadio.checked = true;
            
            // Trigger the change event to activate video-only mode
            const event = new Event('change');
            videoOnlyRadio.dispatchEvent(event);
            
            // Also immediately call the video-only function to ensure it runs
            setTimeout(() => {
                showOnlyVideos();
            }, 100);
        }
    }, 500); // Small delay to ensure everything is loaded
    
    // Additional check to ensure videos play after a short delay
    setTimeout(() => {
        ensureVideosPlay();
    }, 1000);
    
    // Load selected video on startup
    loadSelectedVideo();
    
    // Set up prayer time notifications
    setInterval(handlePrayerTimeNotifications, 1000); // Check for prayer time every second
    
    // Initialize ramadan data
    initRamadanData();
    
    // Initialize qurban data
    initQurbanData();
    
    // Initialize qurban totals display
    updateQurbanTotals();
    
    // Initialize donation and finance data
    initDonationFinanceData();
    
    // Initialize jumat schedule data
    initJumatScheduleData();
    
    // Initialize jumat schedule display
    initJumatScheduleDisplay();
    
    // Initialize rekening data
    initRekeningData();
    
    // Initialize running text with current mosque name
    const currentMosqueName = localStorage.getItem('masjidName') || 'Masjid Al-Muttaqin';
    updateRunningText(currentMosqueName);
    
    // Load custom running text if available
    loadCustomRunningText();
    
    // Initialize background template
    loadBackgroundTemplate();
    
    // Initialize staff data
    initStaffData();
    updateStaffPeriodically();
    
    // Setup activity detection for fullscreen button
    setupActivityDetection();
    
    // Initially hide the fullscreen button
    setTimeout(() => {
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        if (fullscreenBtn) {
            fullscreenBtn.classList.add('hidden');
        }
    }, 1000); // Delay to ensure button is created
    
    // Setup profile picture zoom functionality
    setupProfilePicZoom();
}

// Load custom running text from localStorage if available
function loadCustomRunningText() {
    const savedRunningText = localStorage.getItem('runningText');
    if (savedRunningText) {
        document.querySelector('.running-text').textContent = savedRunningText;
    }
}

// Function to ensure videos play even if previous attempts failed
function ensureVideosPlay() {
    const videoOnlySelected = document.getElementById('show-videos')?.checked;
    
    if (videoOnlySelected) {
        const activeSlide = document.querySelector('.carousel-slide.active');
        const activeVideo = activeSlide ? activeSlide.querySelector('video') : null;
        
        if (activeVideo) {
            // Ensure proper configuration
            activeVideo.muted = true;
            activeVideo.defaultMuted = true;
            activeVideo.loop = true;
            activeVideo.preload = 'auto';
            
            // Try to play with various fallbacks
            activeVideo.play()
                .then(() => {
                    console.log('Video started playing successfully');
                })
                .catch(error => {
                    console.log('Error playing video:', error);
                    
                    // Try more aggressive approach
                    const playPromise = activeVideo.play();
                    if (playPromise !== undefined) {
                        playPromise.then(() => {
                            console.log('Video played after second attempt');
                        })
                        .catch(err => {
                            console.log('Still unable to play video:', err);
                            
                            // Final fallback - try with more aggressive settings
                            activeVideo.setAttribute('muted', '');
                            activeVideo.setAttribute('playsinline', '');
                            activeVideo.setAttribute('autoplay', '');
                            
                            // Try to play after slight delay
                            setTimeout(() => {
                                activeVideo.play().catch(fallbackErr => {
                                    console.log('Final fallback failed:', fallbackErr);
                                });
                            }, 100);
                        });
                    }
                });
        }
    }
}

// Load prayer times from localStorage or use default values
function loadPrayerTimes() {
    const savedTimes = localStorage.getItem('prayerTimes');
    if(savedTimes) {
        prayerTimes = JSON.parse(savedTimes);
    } else {
        // Default prayer times
        prayerTimes = {
            imsak: "04:30",
            subuh: "04:45",
            syuruq: "06:00",
            dhuha: "07:30",
            dhuhur: "12:00",
            ashar: "15:30",
            maghrib: "18:00",
            isya: "19:30"
        };
        savePrayerTimes();
    }
    updatePrayerTimeDisplays();
}

// Save prayer times to localStorage
function savePrayerTimes() {
    localStorage.setItem('prayerTimes', JSON.stringify(prayerTimes));
}

// Update the displayed prayer times
function updatePrayerTimeDisplays() {
    // Update times with proper HTML structure to maintain icons
    document.getElementById('imsak-time').innerHTML = '<span class="time-icon">⏰</span> ' + prayerTimes.imsak;
    document.getElementById('subuh-time').innerHTML = '<span class="time-icon">⏰</span> ' + prayerTimes.subuh;
    document.getElementById('syuruq-time').innerHTML = '<span class="time-icon">⏰</span> ' + prayerTimes.syuruq;
    document.getElementById('dhuha-time').innerHTML = '<span class="time-icon">⏰</span> ' + prayerTimes.dhuha;
    document.getElementById('dhuhur-time').innerHTML = '<span class="time-icon">⏰</span> ' + prayerTimes.dhuhur;
    document.getElementById('ashar-time').innerHTML = '<span class="time-icon">⏰</span> ' + prayerTimes.ashar;
    document.getElementById('maghrib-time').innerHTML = '<span class="time-icon">⏰</span> ' + prayerTimes.maghrib;
    document.getElementById('isya-time').innerHTML = '<span class="time-icon">⏰</span> ' + prayerTimes.isya;
    
    // Update labels for Friday prayer (Dzuhur becomes Jumat)
    updateFridayPrayerDisplay(new Date());
    
    // Ensure all labels are properly updated
    updateAllPrayerLabels();
}

// Function to update all prayer labels
function updateAllPrayerLabels() {
    // Update labels for each prayer
    const imsakLabel = document.querySelector('#imsak-time').closest('.prayer-card')?.querySelector('.prayer-label');
    if (imsakLabel) {
        const currentText = imsakLabel.textContent || imsakLabel.innerText;
        if (!currentText.includes('Imsak')) {
            imsakLabel.innerHTML = '<span class="prayer-icon">🌙</span> Imsak';
        }
    }
    
    const subuhLabel = document.querySelector('#subuh-time').closest('.prayer-card')?.querySelector('.prayer-label');
    if (subuhLabel) {
        const currentText = subuhLabel.textContent || subuhLabel.innerText;
        if (!currentText.includes('Subuh')) {
            subuhLabel.innerHTML = '<span class="prayer-icon">🌅</span> Subuh';
        }
    }
    
    const syuruqLabel = document.querySelector('#syuruq-time').closest('.prayer-card')?.querySelector('.prayer-label');
    if (syuruqLabel) {
        const currentText = syuruqLabel.textContent || syuruqLabel.innerText;
        if (!currentText.includes('Syuruq')) {
            syuruqLabel.innerHTML = '<span class="prayer-icon">☀️</span> Syuruq';
        }
    }
    
    const dhuhaLabel = document.querySelector('#dhuha-time').closest('.prayer-card')?.querySelector('.prayer-label');
    if (dhuhaLabel) {
        const currentText = dhuhaLabel.textContent || dhuhaLabel.innerText;
        if (!currentText.includes('Dhuha')) {
            dhuhaLabel.innerHTML = '<span class="prayer-icon">🌤️</span> Dhuha';
        }
    }
    
    const dhuhurLabel = document.querySelector('#dhuhur-time').closest('.prayer-card')?.querySelector('.prayer-label');
    if (dhuhurLabel) {
        const currentText = dhuhurLabel.textContent || dhuhurLabel.innerText;
        if (!currentText.includes('Dzuhur') && !currentText.includes('Jumat')) {
            dhuhurLabel.innerHTML = '<span class="prayer-icon">🕛</span> Dzuhur';
        }
    }
    
    const asharLabel = document.querySelector('#ashar-time').closest('.prayer-card')?.querySelector('.prayer-label');
    if (asharLabel) {
        const currentText = asharLabel.textContent || asharLabel.innerText;
        if (!currentText.includes('Ashar')) {
            asharLabel.innerHTML = '<span class="prayer-icon">🌆</span> Ashar';
        }
    }
    
    const maghribLabel = document.querySelector('#maghrib-time').closest('.prayer-card')?.querySelector('.prayer-label');
    if (maghribLabel) {
        const currentText = maghribLabel.textContent || maghribLabel.innerText;
        if (!currentText.includes('Maghrib')) {
            maghribLabel.innerHTML = '<span class="prayer-icon">🌇</span> Maghrib';
        }
    }
    
    const isyaLabel = document.querySelector('#isya-time').closest('.prayer-card')?.querySelector('.prayer-label');
    if (isyaLabel) {
        const currentText = isyaLabel.textContent || isyaLabel.innerText;
        if (!currentText.includes('Isya')) {
            isyaLabel.innerHTML = '<span class="prayer-icon">🌙</span> Isya';
        }
    }
}

// Update current time and date display
function updateTime() {
    const now = new Date();
    
    // Update current time
    const timeString = now.toLocaleTimeString('id-ID', { hour12: false });
    document.getElementById('current-time').textContent = timeString;
    
    // Update current date
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const dateString = now.toLocaleDateString('id-ID', options);
    document.getElementById('current-date').textContent = dateString;
    
    // Update Hari In label
    updateHariInLabel(now);
    
    // Update Hijri date
    updateHijriDate(now);
    
    // Update countdown to next prayer
    updateCountdownToNextPrayer(now);
    
    // Check if today is Friday and update Dhuhur to Jumat if needed
    updateFridayPrayerDisplay(now);
    
    // Check for prayer time notifications
    handlePrayerTimeNotifications();
}

// Update Hari In label
function updateHariInLabel(now) {
    const hariInElement = document.getElementById('hari-in');
    if (hariInElement) {
        const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        const hariInString = now.toLocaleDateString('id-ID', options);
        hariInElement.textContent = hariInString;
    }
}

// Convert Gregorian date to Hijri date (simplified)
function updateHijriDate(date) {
    // This is a simplified version - in production, use a proper library like moment-hijri
    // For now, we'll use a placeholder that shows today's approximate Hijri date
    // In a real application, you would use a conversion algorithm or API
    document.getElementById('hijri-date').textContent = getApproximateHijriDate(date);
}

// Simplified Hijri date calculation (approximation)
function getApproximateHijriDate(date) {
    // This is a rough approximation - in real applications, use proper conversion
    const hijriMonths = [
        'Muharram', 'Safar', 'Rabi\' al-Awwal', 'Rabi\' al-Thani',
        'Jumada al-Ula', 'Jumada al-Thani', 'Rajab', 'Sha\'ban',
        'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
    ];
    
    // Simplified calculation - this is not accurate for all dates
    // For a real application, use a proper Hijri conversion library
    const hijriYear = 1445; // Approximate current Hijri year
    const hijriMonth = hijriMonths[2]; // Approximate current month
    const hijriDay = date.getDate(); // Approximate day
    
    return `${hijriDay} ${hijriMonth} ${hijriYear} H`;
}

// Calculate and update countdown to next prayer
function updateCountdownToNextPrayer(now) {
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes
    
    // Define prayer times in minutes from midnight
    const prayerMinutes = {};
    for (const prayer in prayerTimes) {
        const [hours, minutes] = prayerTimes[prayer].split(':').map(Number);
        prayerMinutes[prayer] = hours * 60 + minutes;
    }
    
    // Sort prayers by time
    const sortedPrayers = Object.keys(prayerMinutes).sort((a, b) => prayerMinutes[a] - prayerMinutes[b]);
    
    // Find the next prayer
    let nextPrayer = null;
    for (const prayer of sortedPrayers) {
        if (prayerMinutes[prayer] > currentTime) {
            nextPrayer = prayer;
            break;
        }
    }
    
    // If no next prayer found today, use the first prayer of tomorrow
    if (!nextPrayer) {
        nextPrayer = sortedPrayers[0];
    }
    
    // Calculate time difference
    let diffInMinutes;
    if (prayerMinutes[nextPrayer] > currentTime) {
        diffInMinutes = prayerMinutes[nextPrayer] - currentTime;
    } else {
        // Next prayer is tomorrow
        diffInMinutes = (24 * 60) - currentTime + prayerMinutes[nextPrayer];
    }
    
    // Convert to hours, minutes, seconds
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;
    const seconds = now.getSeconds();
    const remainingSeconds = 60 - seconds;
    
    // Adjust if seconds calculation makes minutes negative
    let finalHours = hours;
    let finalMinutes = minutes;
    let finalSeconds = remainingSeconds;
    
    if (finalSeconds >= 60) {
        finalSeconds -= 60;
        finalMinutes += 1;
    }
    
    if (finalMinutes >= 60) {
        finalMinutes -= 60;
        finalHours += 1;
    }
    
    // Format as HH:MM:SS
    const countdownText = `${String(finalHours).padStart(2, '0')}:${String(finalMinutes).padStart(2, '0')}:${String(finalSeconds).padStart(2, '0')}`;
    
    // Update display
    document.getElementById('countdown').textContent = countdownText;
    document.getElementById('next-prayer-name').textContent = capitalizeFirstLetter(nextPrayer);
}

// Capitalize first letter of a string
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Setup video player functionality
function setupVideoPlayer() {
    // Initialize the main video player
    initializeVideoPlayer();
    
    // Add event listener for video mode radio button
    document.getElementById('show-videos')?.addEventListener('change', function(event) {
        initializeVideoPlayer();
    });
}

// Handle slide mode changes
function handleSlideModeChange(event) {
    const selectedValue = event.target.value;
    
    switch(selectedValue) {
        case 'videos':
            // For video-only mode, immediately show and play videos
            showOnlyVideos();
            break;
    }
}

// Show only video slides and auto-play them
function showOnlyVideos() {
    const slides = document.querySelectorAll('.carousel-slide');
    
    // First hide all image slides and show only video slides
    slides.forEach(slide => {
        const img = slide.querySelector('img');
        const video = slide.querySelector('video');
        
        if (video) {
            slide.style.display = 'block';
            video.muted = true;
            video.loop = true;
            video.preload = 'auto';
            video.setAttribute('playsinline', '');
            video.setAttribute('autoplay', '');
        } else if (img) {
            slide.style.display = 'none';
        }
    });
    
    // Show first visible video slide
    showFirstVisibleSlide();
    
    // Now play the visible video immediately
    const activeSlide = document.querySelector('.carousel-slide.active');
    const activeVideo = activeSlide ? activeSlide.querySelector('video') : null;
    
    if (activeVideo) {
        // Ensure video is properly configured for continuous playback
        activeVideo.muted = true;
        activeVideo.loop = true;
        activeVideo.preload = 'auto';
        
        // Reset and play the video
        activeVideo.currentTime = 0;
        activeVideo.play().catch(e => {
            console.log('Video play error:', e);
            // Attempt to play again with proper configuration
            activeVideo.muted = true;
            activeVideo.loop = true;
            activeVideo.preload = 'auto';
            activeVideo.play().catch(err => console.log('Retry video play error:', err));
        });
    }
    
    // Clear any existing interval to remove delays
    if (slideInterval) {
        clearInterval(slideInterval);
        slideInterval = null;
    }
}

// Show first visible slide (video-only)
function showFirstVisibleSlide() {
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.dot');
    
    // Find first video slide (since we're only showing videos)
    let firstVisibleIndex = -1;
    for (let i = 0; i < slides.length; i++) {
        const video = slides[i].querySelector('video');
        if (video) {  // Since we only show videos, find first slide with video
            firstVisibleIndex = i;
            break;
        }
    }
    
    if (firstVisibleIndex !== -1) {
        // Hide all slides
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        // Show first video slide
        slides[firstVisibleIndex].classList.add('active');
        if (dots[firstVisibleIndex]) {
            dots[firstVisibleIndex].classList.add('active');
        }
        
        currentSlideIndex = firstVisibleIndex;
        
        // Play the video
        const video = slides[firstVisibleIndex].querySelector('video');
        if (video) {
            // Pause all other videos first
            document.querySelectorAll('video').forEach(v => {
                if (v !== video) {
                    v.pause();
                    v.classList.remove('video-playing');
                }
            });
            
            // Ensure video is properly configured for continuous playback
            video.muted = true;
            video.loop = true;
            video.preload = 'auto';
            
            // Play the video
            video.currentTime = 0; // Reset to beginning
            video.play().catch(e => {
                console.log('Video play error:', e);
                // Attempt to play again with proper configuration
                video.muted = true;
                video.loop = true;
                video.preload = 'auto';
                video.play().catch(err => console.log('Retry video play error:', err));
            });
            video.classList.add('video-playing');
        }
    }
}

// Restart carousel interval
function restartCarousel() {
    // Clear existing interval
    if (slideInterval) {
        clearInterval(slideInterval);
    }
    
    // Disable automatic slide change - manual navigation only
    // slideInterval = setInterval(() => {
    //     goToNextVisibleSlide();
    // }, 5000); // Change slide every 5 seconds
}

// Initialize video player
function initializeVideoPlayer() {
    const mainVideo = document.getElementById('main-video');
    if (mainVideo) {
        // Load selected video if available
        const selectedVideo = localStorage.getItem('selectedVideo');
        if (selectedVideo) {
            mainVideo.src = selectedVideo;
        }
        
        // Configure video for autoplay
        mainVideo.muted = true;
        mainVideo.loop = true;
        mainVideo.preload = 'auto';
        mainVideo.setAttribute('playsinline', '');
        
        // Attempt to play the video
        mainVideo.load(); // Ensure the video loads the source
        mainVideo.play().catch(e => {
            console.log('Video play error:', e);
            // Try again with more aggressive settings
            mainVideo.muted = true;
            mainVideo.loop = true;
            mainVideo.play().catch(err => console.log('Retry video play error:', err));
        });
    }
}

// Setup admin panel functionality
function setupAdminPanel() {
    const adminBtn = document.getElementById('admin-btn');
    const adminModal = document.getElementById('admin-modal');
    const closeBtn = document.getElementById('admin-close');
    const tabBtns = document.querySelectorAll('.admin-tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    if (!adminBtn || !adminModal) {
        console.warn('Admin panel elements not found');
        return;
    }
    
    // Open modal
    adminBtn.addEventListener('click', () => {
        adminModal.style.display = 'block';
        // Load current data into form fields
        loadFormData();
    });
    
    // Close modal
    closeBtn.addEventListener('click', () => {
        adminModal.style.display = 'none';
    });
    
    // Close modal when clicking outside of it
    window.addEventListener('click', (event) => {
        if (event.target === adminModal) {
            adminModal.style.display = 'none';
        }
    });
    
    // Tab switching functionality
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            // Remove active class from all buttons and panes
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            
            // Add active class to clicked button and corresponding pane
            btn.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Save general info
    document.getElementById('save-general')?.addEventListener('click', saveGeneralInfo);
    
    // Save prayer times
    document.getElementById('save-prayer-times')?.addEventListener('click', savePrayerTimesFromForm);
    

    
    // Save ramadan events
    document.getElementById('save-ramadan')?.addEventListener('click', saveRamadanEvents);
    
    // Add event listeners for video selection buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('select-video-btn')) {
            const videoSrc = e.target.getAttribute('data-video');
            selectVideo(videoSrc);
        }
    });
    
    // Save qurban data
    document.getElementById('save-qurban')?.addEventListener('click', saveQurbanData);
    
    // Save jumat schedule
    document.getElementById('save-jumat')?.addEventListener('click', saveJumatSchedule);
    
    // Save rekening info
    document.getElementById('save-rekening')?.addEventListener('click', saveRekeningInfo);
    
    // Save donation and finance info
    document.getElementById('save-donasi-finance')?.addEventListener('click', saveDonationFinance);
    
    // Save ramadan events
    document.getElementById('save-ramadan')?.addEventListener('click', saveRamadanEvents);
    
    // Add ramadan event listeners
    document.getElementById('add-ramadan-event')?.addEventListener('click', addNewRamadanEvent);
    
    // Save qurban data
    document.getElementById('save-qurban')?.addEventListener('click', saveQurbanData);
    
    // Add qurban event listeners
    document.getElementById('add-qurban')?.addEventListener('click', addNewQurbanData);
    
    // Save donation and finance info
    document.getElementById('save-donasi-finance')?.addEventListener('click', saveDonationFinance);
    
    // Add donation event listeners
    document.getElementById('add-donation')?.addEventListener('click', addNewDonationData);
    
    // Add finance event listeners
    document.getElementById('add-finance')?.addEventListener('click', addNewFinanceData);
    
    // Save jumat schedule
    document.getElementById('save-jumat')?.addEventListener('click', saveJumatSchedule);
    
    // Add jumat event listeners
    document.getElementById('add-jumat')?.addEventListener('click', addNewJumatSchedule);
    
    // Save staff info
    document.getElementById('save-staff')?.addEventListener('click', saveStaffInfo);
    
    // Add staff event listeners
    document.getElementById('add-staff')?.addEventListener('click', addNewStaff);
}

// Load form data from localStorage or current display
function loadFormData() {
    // Load general info
    document.getElementById('masjid-name-input').value = document.getElementById('masjid-name').textContent;
    document.getElementById('masjid-address-input').value = document.getElementById('masjid-address').textContent;
    document.getElementById('masjid-info-input').value = document.getElementById('masjid-info').textContent;
    
    // Load running text
    const currentRunningText = document.querySelector('.running-text').textContent;
    document.getElementById('running-text-input').value = currentRunningText;
    
    // Load prayer times
    // Extract time value from HTML content, removing the icon part
    document.getElementById('imsak-time-input').value = extractTimeFromHTML(document.getElementById('imsak-time').innerHTML);
    document.getElementById('subuh-time-input').value = extractTimeFromHTML(document.getElementById('subuh-time').innerHTML);
    document.getElementById('syuruq-time-input').value = extractTimeFromHTML(document.getElementById('syuruq-time').innerHTML);
    document.getElementById('dhuha-time-input').value = extractTimeFromHTML(document.getElementById('dhuha-time').innerHTML);
    document.getElementById('dhuhur-time-input').value = extractTimeFromHTML(document.getElementById('dhuhur-time').innerHTML);
    document.getElementById('ashar-time-input').value = extractTimeFromHTML(document.getElementById('ashar-time').innerHTML);
    document.getElementById('maghrib-time-input').value = extractTimeFromHTML(document.getElementById('maghrib-time').innerHTML);
    document.getElementById('isya-time-input').value = extractTimeFromHTML(document.getElementById('isya-time').innerHTML);
    
    // Load bank info
    document.querySelector('#bank-name')?.setAttribute('placeholder', document.querySelector('.bank-account-details p:nth-child(1)').textContent.replace('Nama Bank: ', '').trim());
    document.querySelector('#account-number')?.setAttribute('placeholder', document.querySelector('.bank-account-details p:nth-child(2)').textContent.replace('Nomor Rekening: ', '').trim());
    document.querySelector('#account-name')?.setAttribute('placeholder', document.querySelector('.bank-account-details p:nth-child(3)').textContent.replace('Atas Nama: ', '').trim());
    
    // Load container visibility settings
    loadContainerVisibility();
    
    // Load prayer time visibility settings
    loadPrayerTimeVisibility();
    
    // Set video-only mode as default in the admin panel
    document.getElementById('show-videos').checked = true;
}

// Update the running text with the mosque name
function updateRunningText(mosqueName) {
    const mosqueNameDisplay = document.getElementById('mosque-name-display');
    if (mosqueNameDisplay) {
        mosqueNameDisplay.textContent = mosqueName;
    }
}

// Apply selected background template
function applyBackgroundTemplate(templateName) {
    const body = document.body;
    
    // Remove existing template classes
    body.classList.remove('hijau-tua', 'biru-laut');
    
    // Apply new template if not default
    if (templateName && templateName !== 'default') {
        body.classList.add(templateName);
        
        // Also update the main header gradient to match the theme
        const mainHeader = document.querySelector('.main-header');
        if (mainHeader) {
            switch(templateName) {
                case 'hijau-tua':
                    mainHeader.style.background = 'linear-gradient(135deg, #2e7d32, #1b5e20)';
                    break;
                case 'biru-laut':
                    mainHeader.style.background = 'linear-gradient(135deg, #0d47a1, #002171)';
                    break;
            }
        }
    }
}

// Save background template
function saveBackgroundTemplate() {
    // Find the selected template
    const selectedTemplateOption = document.querySelector('.template-option.selected');
    if (selectedTemplateOption) {
        const templateName = selectedTemplateOption.getAttribute('data-template');
        localStorage.setItem('backgroundTemplate', templateName);
        
        // Apply the template
        applyBackgroundTemplate(templateName);
    }
}

// Load and apply saved background template
function loadBackgroundTemplate() {
    const savedTemplate = localStorage.getItem('backgroundTemplate') || 'default';
    
    // Apply the template
    applyBackgroundTemplate(savedTemplate);
    
    // Update the UI to show the selected template
    updateTemplateSelectionUI(savedTemplate);
}

// Update the UI to show the selected template
function updateTemplateSelectionUI(selectedTemplate) {
    // Remove selected class from all options
    const templateOptions = document.querySelectorAll('.template-option');
    templateOptions.forEach(option => {
        option.classList.remove('selected');
    });
    
    // Add selected class to the chosen option
    if (selectedTemplate !== 'default') {
        const selectedOption = document.querySelector(`.template-option[data-template="${selectedTemplate}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }
    }
}

// Setup background template selection
function setupBackgroundTemplateSelection() {
    const templateOptions = document.querySelectorAll('.template-option');
    
    templateOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected class from all options
            templateOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Add selected class to clicked option
            this.classList.add('selected');
            
            // Apply the template
            const templateName = this.getAttribute('data-template');
            applyBackgroundTemplate(templateName);
        });
    });
}

// Save general info from form
function saveGeneralInfo() {
    const nameInput = document.getElementById('masjid-name-input').value;
    const addressInput = document.getElementById('masjid-address-input').value;
    const infoInput = document.getElementById('masjid-info-input').value;
    const runningTextInput = document.getElementById('running-text-input').value;
    
    document.getElementById('masjid-name').textContent = nameInput;
    document.getElementById('masjid-address').textContent = addressInput;
    document.getElementById('masjid-info').textContent = infoInput;
    
    // Update the running text with the mosque name
    updateRunningText(nameInput);
    
    // Update running text content
    document.querySelector('.running-text').textContent = runningTextInput;
    
    // Save to localStorage
    localStorage.setItem('masjidName', nameInput);
    localStorage.setItem('masjidAddress', addressInput);
    localStorage.setItem('masjidInfo', infoInput);
    localStorage.setItem('runningText', runningTextInput);
    
    // Handle container visibility toggles
    saveContainerVisibility();
    
    // Save background template
    saveBackgroundTemplate();
    
    alert('Informasi umum berhasil disimpan!');
}

// Save prayer times from form
function savePrayerTimesFromForm() {
    prayerTimes.imsak = document.getElementById('imsak-time-input').value;
    prayerTimes.subuh = document.getElementById('subuh-time-input').value;
    prayerTimes.syuruq = document.getElementById('syuruq-time-input').value;
    prayerTimes.dhuha = document.getElementById('dhuha-time-input').value;
    prayerTimes.dhuhur = document.getElementById('dhuhur-time-input').value;
    prayerTimes.ashar = document.getElementById('ashar-time-input').value;
    prayerTimes.maghrib = document.getElementById('maghrib-time-input').value;
    prayerTimes.isya = document.getElementById('isya-time-input').value;
    
    savePrayerTimes();
    updatePrayerTimeDisplays();
    
    // Save and apply prayer time visibility
    savePrayerTimeVisibility();
    applyPrayerTimeVisibility();
    
    alert('Waktu sholat berhasil disimpan!');
}



// Initialize ramadan data
function initRamadanData() {
    // Check if ramadan data exists in localStorage, if not, create default
    const savedRamadan = localStorage.getItem('ramadanInfo');
    if (!savedRamadan) {
        const defaultRamadan = [
            { id: 1, event: 'Sholat Tarawih Berjamaah', time: 'Setiap malam selama Ramadhan' },
            { id: 2, event: 'Tadarus Al-Qur\'an', time: 'Setiap pagi pukul 06:00 WIB' },
            { id: 3, event: 'Ngabuburit Bersama', time: 'Setiap sore menjelang berbuka' },
            { id: 4, event: 'Sholat Idul Fitri', time: '1 Syawal, Pukul 07:00 WIB' }
        ];
        localStorage.setItem('ramadanInfo', JSON.stringify(defaultRamadan));
    }
    
    // Load ramadan data into the form
    loadRamadanInfo();
}

// Load ramadan info from localStorage and populate the form
function loadRamadanInfo() {
    const container = document.getElementById('ramadan-events-container');
    if (!container) return;
    
    const ramadanData = JSON.parse(localStorage.getItem('ramadanInfo') || '[]');
    
    container.innerHTML = ''; // Clear existing content
    
    if (ramadanData.length === 0) {
        container.innerHTML = '<p>Tidak ada data kegiatan Ramadhan. Silakan tambah kegiatan menggunakan tombol di bawah.</p>';
        return;
    }
    
    // Create table for ramadan data
    const table = document.createElement('table');
    table.className = 'ramadan-table';
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    
    // Create header
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `
        <th style="border: 1px solid #ddd; padding: 8px;">No</th>
        <th style="border: 1px solid #ddd; padding: 8px;">Nama Kegiatan</th>
        <th style="border: 1px solid #ddd; padding: 8px;">Tanggal / Waktu</th>
        <th style="border: 1px solid #ddd; padding: 8px;">Aksi</th>
    `;
    table.appendChild(headerRow);
    
    // Add ramadan rows
    ramadanData.forEach((item, index) => {
        const row = document.createElement('tr');
        row.dataset.id = item.id;
        row.innerHTML = `
            <td style="border: 1px solid #ddd; padding: 8px;">${index + 1}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">
                <input type="text" class="ramadan-event" value="${item.event}" style="width: 100%; padding: 4px;">
            </td>
            <td style="border: 1px solid #ddd; padding: 8px;">
                <input type="text" class="ramadan-time" value="${item.time}" style="width: 100%; padding: 4px;">
            </td>
            <td style="border: 1px solid #ddd; padding: 8px;">
                <button class="delete-ramadan-btn" onclick="deleteRamadanEvent(${item.id})" style="background-color: #f44336; color: white; border: none; padding: 4px 8px; cursor: pointer; border-radius: 4px;">Hapus</button>
            </td>
        `;
        table.appendChild(row);
    });
    
    container.appendChild(table);
}

// Add new ramadan event to the form
function addNewRamadanEvent() {
    const container = document.getElementById('ramadan-events-container');
    if (!container) return;
    
    const ramadanData = JSON.parse(localStorage.getItem('ramadanInfo') || '[]');
    const newId = ramadanData.length > 0 ? Math.max(...ramadanData.map(r => r.id)) + 1 : 1;
    
    const newEvent = {
        id: newId,
        event: '',
        time: ''
    };
    
    ramadanData.push(newEvent);
    localStorage.setItem('ramadanInfo', JSON.stringify(ramadanData));
    
    // Reload the form to show the new entry
    loadRamadanInfo();
}

// Delete ramadan event by ID
function deleteRamadanEvent(id) {
    if (confirm('Apakah Anda yakin ingin menghapus kegiatan Ramadhan ini?')) {
        let ramadanData = JSON.parse(localStorage.getItem('ramadanInfo') || '[]');
        ramadanData = ramadanData.filter(item => item.id !== id);
        localStorage.setItem('ramadanInfo', JSON.stringify(ramadanData));
        
        // Reload the form
        loadRamadanInfo();
    }
}

// Save ramadan events from form
function saveRamadanEvents() {
    const rows = document.querySelectorAll('#ramadan-events-container table tr:not(:first-child)');
    
    const updatedRamadanData = [];
    
    rows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        if (inputs.length >= 2) { // event, time
            const id = parseInt(row.dataset.id);
            const event = inputs[0].value.trim();
            const time = inputs[1].value.trim();
            
            if (event && time) { // Only save if all fields are filled
                updatedRamadanData.push({ id, event, time });
            }
        }
    });
    
    // Save to localStorage
    localStorage.setItem('ramadanInfo', JSON.stringify(updatedRamadanData));
    
    // Update the display on the main page
    updateRamadanDisplay();
    
    alert('Kegiatan Ramadhan berhasil disimpan!');
}

// Update the ramadan display on the main page
function updateRamadanDisplay() {
    const ramadanData = JSON.parse(localStorage.getItem('ramadanInfo') || '[]');
    const ramadanTableBody = document.querySelector('.ramadan-table tbody');
    
    if (ramadanTableBody) {
        ramadanTableBody.innerHTML = ''; // Clear existing rows
        
        if (ramadanData.length > 0) {
            ramadanData.forEach((item, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${item.event}</td>
                    <td>${item.time}</td>
                `;
                ramadanTableBody.appendChild(row);
            });
        } else {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>-</td>
                <td>-</td>
                <td>-</td>
            `;
            ramadanTableBody.appendChild(row);
        }
    }
}

// Initialize qurban data
function initQurbanData() {
    // Check if qurban data exists in localStorage, if not, create default
    const savedQurban = localStorage.getItem('qurbanInfo');
    if (!savedQurban) {
        const defaultQurban = [
            { id: 1, name: 'Pak Budi Santoso', animal: 'Kambing', quantity: '1' },
            { id: 2, name: 'Ibu Siti Aminah', animal: 'Sapi', quantity: '1/7' },
            { id: 3, name: 'Pak Joko Widodo', animal: 'Kambing', quantity: '1' }
        ];
        localStorage.setItem('qurbanInfo', JSON.stringify(defaultQurban));
    }
    
    // Load qurban data into the form
    loadQurbanInfo();
}

// Load qurban info from localStorage and populate the form
function loadQurbanInfo() {
    const container = document.getElementById('qurban-container');
    if (!container) return;
    
    const qurbanData = JSON.parse(localStorage.getItem('qurbanInfo') || '[]');
    
    container.innerHTML = ''; // Clear existing content
    
    if (qurbanData.length === 0) {
        container.innerHTML = '<p>Tidak ada data shohibul qurban. Silakan tambah data menggunakan tombol di bawah.</p>';
        return;
    }
    
    // Create table for qurban data
    const table = document.createElement('table');
    table.className = 'qurban-table';
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    
    // Create header
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `
        <th style="border: 1px solid #ddd; padding: 8px;">No</th>
        <th style="border: 1px solid #ddd; padding: 8px;">Nama Shohibul Qurban</th>
        <th style="border: 1px solid #ddd; padding: 8px;">Jenis Hewan</th>
        <th style="border: 1px solid #ddd; padding: 8px;">Jumlah</th>
        <th style="border: 1px solid #ddd; padding: 8px;">Aksi</th>
    `;
    table.appendChild(headerRow);
    
    // Add qurban rows
    qurbanData.forEach((item, index) => {
        const row = document.createElement('tr');
        row.dataset.id = item.id;
        row.innerHTML = `
            <td style="border: 1px solid #ddd; padding: 8px;">${index + 1}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">
                <input type="text" class="qurban-name" value="${item.name}" style="width: 100%; padding: 4px;">
            </td>
            <td style="border: 1px solid #ddd; padding: 8px;">
                <input type="text" class="qurban-animal" value="${item.animal}" style="width: 100%; padding: 4px;">
            </td>
            <td style="border: 1px solid #ddd; padding: 8px;">
                <input type="text" class="qurban-quantity" value="${item.quantity}" style="width: 100%; padding: 4px;">
            </td>
            <td style="border: 1px solid #ddd; padding: 8px;">
                <button class="delete-qurban-btn" onclick="deleteQurbanData(${item.id})" style="background-color: #f44336; color: white; border: none; padding: 4px 8px; cursor: pointer; border-radius: 4px;">Hapus</button>
            </td>
        `;
        
        // Add event listeners to update totals in real-time
        const animalInput = row.querySelector('.qurban-animal');
        const quantityInput = row.querySelector('.qurban-quantity');
        
        animalInput.addEventListener('input', updateQurbanDisplay);
        quantityInput.addEventListener('input', updateQurbanDisplay);
        
        table.appendChild(row);
    });
    
    container.appendChild(table);
}

// Add new qurban data to the form
function addNewQurbanData() {
    const container = document.getElementById('qurban-container');
    if (!container) return;
    
    const qurbanData = JSON.parse(localStorage.getItem('qurbanInfo') || '[]');
    const newId = qurbanData.length > 0 ? Math.max(...qurbanData.map(q => q.id)) + 1 : 1;
    
    const newData = {
        id: newId,
        name: '',
        animal: '',
        quantity: ''
    };
    
    qurbanData.push(newData);
    localStorage.setItem('qurbanInfo', JSON.stringify(qurbanData));
    
    // Reload the form to show the new entry
    loadQurbanInfo();
    
    // Update the main page display to reflect the addition
    updateQurbanDisplay();
}

// Delete qurban data by ID
function deleteQurbanData(id) {
    if (confirm('Apakah Anda yakin ingin menghapus data shohibul qurban ini?')) {
        let qurbanData = JSON.parse(localStorage.getItem('qurbanInfo') || '[]');
        qurbanData = qurbanData.filter(item => item.id !== id);
        localStorage.setItem('qurbanInfo', JSON.stringify(qurbanData));
        
        // Reload the form
        loadQurbanInfo();
        
        // Update the main page display to reflect the deletion
        updateQurbanDisplay();
    }
}

// Save qurban data from form
function saveQurbanData() {
    const rows = document.querySelectorAll('#qurban-container table tr:not(:first-child)');
    
    const updatedQurbanData = [];
    
    rows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        if (inputs.length >= 3) { // name, animal, quantity
            const id = parseInt(row.dataset.id);
            const name = inputs[0].value.trim();
            const animal = inputs[1].value.trim();
            const quantity = inputs[2].value.trim();
            
            if (name && animal && quantity) { // Only save if all fields are filled
                updatedQurbanData.push({ id, name, animal, quantity });
            }
        }
    });
    
    // Save to localStorage
    localStorage.setItem('qurbanInfo', JSON.stringify(updatedQurbanData));
    
    // Update the display on the main page
    updateQurbanDisplay();
    
    alert('Data qurban berhasil disimpan!');
}

// Update the qurban display on the main page
function updateQurbanDisplay() {
    const qurbanData = JSON.parse(localStorage.getItem('qurbanInfo') || '[]');
    const qurbanTableBody = document.querySelector('.qurban-table tbody');
    
    if (qurbanTableBody) {
        qurbanTableBody.innerHTML = ''; // Clear existing rows
        
        if (qurbanData.length > 0) {
            qurbanData.forEach((item, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${item.name}</td>
                    <td>${item.animal}</td>
                    <td>${item.quantity}</td>
                `;
                qurbanTableBody.appendChild(row);
            });
        } else {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
            `;
            qurbanTableBody.appendChild(row);
        }
    }
    
    // Update qurban totals
    updateQurbanTotals();
}

// Calculate and display qurban totals
function updateQurbanTotals() {
    const qurbanData = JSON.parse(localStorage.getItem('qurbanInfo') || '[]');
    
    let totalCattle = 0;
    let totalGoats = 0;
    
    qurbanData.forEach(item => {
        const animalType = item.animal.toLowerCase();
        const quantityStr = item.quantity.toString();
        
        if (animalType.includes('sapi')) {
            // Handle fractional quantities for cattle (e.g., "1/7")
            if (quantityStr.includes('/')) {
                const parts = quantityStr.split('/');
                const numerator = parseFloat(parts[0]) || 0;
                const denominator = parseFloat(parts[1]) || 1;
                totalCattle += numerator / denominator;
            } else {
                totalCattle += parseFloat(quantityStr) || 0;
            }
        } else if (animalType.includes('kambing') || animalType.includes('domba')) {
            totalGoats += parseFloat(quantityStr) || 0;
        }
    });
    
    // Update the table footer display
    const cattleElement = document.getElementById('total-cattle');
    const goatsElement = document.getElementById('total-goats');
    
    if (cattleElement) {
        // Remove trailing zero after decimal point
        const formattedCattle = totalCattle % 1 === 0 ? totalCattle.toString() : totalCattle.toFixed(1);
        cattleElement.textContent = formattedCattle;
    }
    
    if (goatsElement) {
        goatsElement.textContent = totalGoats.toString();
    }
}

// Initialize jumat schedule data
function initJumatScheduleData() {
    // Check if jumat schedule data exists in localStorage, if not, create default
    const savedJumat = localStorage.getItem('jumatSchedule');
    if (!savedJumat) {
        const defaultJumat = [
            { id: 1, date: 'Jumat, 25 April 2025', imam: 'Ust. Ali Rahman', khotib: 'Ust. Budi Santoso', muadzin: 'Ust. Citra Dewi' },
            { id: 2, date: 'Jumat, 2 Mei 2025', imam: 'Ust. Dedi Kurniawan', khotib: 'Ust. Eka Putra', muadzin: 'Ust. Farida Nur' },
            { id: 3, date: 'Jumat, 9 Mei 2025', imam: 'Ust. Gunawan Prasetyo', khotib: 'Ust. Heri Susanto', muadzin: 'Ust. Indra Lesmana' }
        ];
        localStorage.setItem('jumatSchedule', JSON.stringify(defaultJumat));
    }
    
    // Load jumat schedule data into the form
    loadJumatScheduleInfo();
}

// Load jumat schedule info from localStorage and populate the form
function loadJumatScheduleInfo() {
    const container = document.getElementById('jumat-container');
    if (!container) return;
    
    const jumatData = JSON.parse(localStorage.getItem('jumatSchedule') || '[]');
    
    container.innerHTML = ''; // Clear existing content
    
    if (jumatData.length === 0) {
        container.innerHTML = '<p>Tidak ada data jadwal Jumat. Silakan tambah jadwal menggunakan tombol di bawah.</p>';
        return;
    }
    
    // Create table for jumat schedule data
    const table = document.createElement('table');
    table.className = 'jumat-schedule-table';
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    
    // Create header
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `
        <th style="border: 1px solid #ddd; padding: 8px;">No</th>
        <th style="border: 1px solid #ddd; padding: 8px;">Hari & Tanggal</th>
        <th style="border: 1px solid #ddd; padding: 8px;">Nama Imam</th>
        <th style="border: 1px solid #ddd; padding: 8px;">Nama Khotib</th>
        <th style="border: 1px solid #ddd; padding: 8px;">Nama Muadzin</th>
        <th style="border: 1px solid #ddd; padding: 8px;">Aksi</th>
    `;
    table.appendChild(headerRow);
    
    // Add jumat schedule rows
    jumatData.forEach((item, index) => {
        const row = document.createElement('tr');
        row.dataset.id = item.id;
        row.innerHTML = `
            <td style="border: 1px solid #ddd; padding: 8px;">${index + 1}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">
                <input type="text" class="jumat-date" value="${item.date}" style="width: 100%; padding: 4px;">
            </td>
            <td style="border: 1px solid #ddd; padding: 8px;">
                <input type="text" class="jumat-imam" value="${item.imam}" style="width: 100%; padding: 4px;">
            </td>
            <td style="border: 1px solid #ddd; padding: 8px;">
                <input type="text" class="jumat-khotib" value="${item.khotib}" style="width: 100%; padding: 4px;">
            </td>
            <td style="border: 1px solid #ddd; padding: 8px;">
                <input type="text" class="jumat-muadzin" value="${item.muadzin}" style="width: 100%; padding: 4px;">
            </td>
            <td style="border: 1px solid #ddd; padding: 8px;">
                <button class="delete-jumat-btn" onclick="deleteJumatSchedule(${item.id})" style="background-color: #f44336; color: white; border: none; padding: 4px 8px; cursor: pointer; border-radius: 4px;">Hapus</button>
            </td>
        `;
        table.appendChild(row);
    });
    
    container.appendChild(table);
}

// Add new jumat schedule to the form
function addNewJumatSchedule() {
    const container = document.getElementById('jumat-container');
    if (!container) return;
    
    const jumatData = JSON.parse(localStorage.getItem('jumatSchedule') || '[]');
    const newId = jumatData.length > 0 ? Math.max(...jumatData.map(j => j.id)) + 1 : 1;
    
    const newSchedule = {
        id: newId,
        date: '',
        imam: '',
        khotib: '',
        muadzin: ''
    };
    
    jumatData.push(newSchedule);
    localStorage.setItem('jumatSchedule', JSON.stringify(jumatData));
    
    // Reload the form to show the new entry
    loadJumatScheduleInfo();
}

// Delete jumat schedule by ID
function deleteJumatSchedule(id) {
    if (confirm('Apakah Anda yakin ingin menghapus jadwal Jumat ini?')) {
        let jumatData = JSON.parse(localStorage.getItem('jumatSchedule') || '[]');
        jumatData = jumatData.filter(item => item.id !== id);
        localStorage.setItem('jumatSchedule', JSON.stringify(jumatData));
        
        // Reload the form
        loadJumatScheduleInfo();
    }
}

// Save jumat schedule from form
function saveJumatSchedule() {
    const rows = document.querySelectorAll('#jumat-container table tr:not(:first-child)');
    
    const updatedJumatData = [];
    
    rows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        if (inputs.length >= 4) { // date, imam, khotib, muadzin
            const id = parseInt(row.dataset.id);
            const date = inputs[0].value.trim();
            const imam = inputs[1].value.trim();
            const khotib = inputs[2].value.trim();
            const muadzin = inputs[3].value.trim();
            
            if (date && imam && khotib && muadzin) { // Only save if all fields are filled
                updatedJumatData.push({ id, date, imam, khotib, muadzin });
            }
        }
    });
    
    // Save to localStorage
    localStorage.setItem('jumatSchedule', JSON.stringify(updatedJumatData));
    
    // Update the display on the main page
    updateJumatScheduleDisplay();
    
    alert('Jadwal Jumat berhasil disimpan!');
}

// Update the jumat schedule display on the main page
function updateJumatScheduleDisplay() {
    const jumatData = JSON.parse(localStorage.getItem('jumatSchedule') || '[]');
    const jumatTableBody = document.querySelector('.jumat-schedule-table tbody');
    
    if (jumatTableBody) {
        jumatTableBody.innerHTML = ''; // Clear existing rows
        
        if (jumatData.length > 0) {
            jumatData.forEach((item, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${item.date}</td>
                    <td>${item.imam}</td>
                    <td>${item.khotib}</td>
                    <td>${item.muadzin}</td>
                `;
                jumatTableBody.appendChild(row);
            });
        } else {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
            `;
            jumatTableBody.appendChild(row);
        }
    }
}

// Call updateJumatScheduleDisplay when initializing the app to ensure it shows properly
function initJumatScheduleDisplay() {
    updateJumatScheduleDisplay();
}

// Initialize rekening data
function initRekeningData() {
    const savedRekening = localStorage.getItem('rekeningInfo');
    if (savedRekening) {
        const rekeningData = JSON.parse(savedRekening);
        
        // Populate form fields
        if (rekeningData.bankName) {
            document.querySelector('#bank-name').value = rekeningData.bankName;
        }
        if (rekeningData.accountNumber) {
            document.querySelector('#account-number').value = rekeningData.accountNumber;
        }
        if (rekeningData.accountName) {
            document.querySelector('#account-name').value = rekeningData.accountName;
        }
        
        // Update display
        updateRekeningDisplay(rekeningData);
    }
}

// Update rekening display on main page
function updateRekeningDisplay(rekeningData) {
    if (rekeningData.bankName) {
        document.querySelector('.bank-account-details p:nth-child(1) strong').nextSibling.textContent = ` ${rekeningData.bankName}`;
    }
    if (rekeningData.accountNumber) {
        document.querySelector('.bank-account-details p:nth-child(2) strong').nextSibling.textContent = ` ${rekeningData.accountNumber}`;
    }
    if (rekeningData.accountName) {
        document.querySelector('.bank-account-details p:nth-child(3) strong').nextSibling.textContent = ` ${rekeningData.accountName}`;
    }
}

// Save rekening info from form
function saveRekeningInfo() {
    const bankName = document.querySelector('#bank-name').value;
    const accountNumber = document.querySelector('#account-number').value;
    const accountName = document.querySelector('#account-name').value;
    
    // Save to localStorage
    const rekeningData = {
        bankName: bankName,
        accountNumber: accountNumber,
        accountName: accountName
    };
    localStorage.setItem('rekeningInfo', JSON.stringify(rekeningData));
    
    // Update display
    updateRekeningDisplay(rekeningData);
    
    alert('Informasi rekening berhasil disimpan!');
}

// Initialize donation and finance data
function initDonationFinanceData() {
    // Check if donation data exists in localStorage, if not, create default
    const savedDonation = localStorage.getItem('donationInfo');
    if (!savedDonation) {
        const defaultDonation = [
            { id: 1, name: 'Budi Santoso', date: '01 Jan', amount: 'Rp 500.000' },
            { id: 2, name: 'Siti Aminah', date: '02 Jan', amount: 'Rp 250.000' },
            { id: 3, name: 'Agus Prasetyo', date: '03 Jan', amount: 'Rp 750.000' },
            { id: 4, name: 'Indah Lestari', date: '04 Jan', amount: 'Rp 300.000' },
            { id: 5, name: 'Dedi Kurniawan', date: '05 Jan', amount: 'Rp 450.000' }
        ];
        localStorage.setItem('donationInfo', JSON.stringify(defaultDonation));
    }
    
    // Check if finance data exists in localStorage, if not, create default
    const savedFinance = localStorage.getItem('financeInfo');
    if (!savedFinance) {
        const defaultFinance = [
            { id: 1, type: 'Infaq', income: 'Rp 5.000.000', expense: 'Rp 0' },
            { id: 2, type: 'Wakaf', income: 'Rp 2.000.000', expense: 'Rp 0' },
            { id: 3, type: 'Biaya Operasional', income: 'Rp 0', expense: 'Rp 1.500.000' },
            { id: 4, type: 'Perawatan', income: 'Rp 0', expense: 'Rp 1.000.000' },
            { id: 5, type: 'Saldo Akhir', income: '', expense: 'Rp 4.500.000' }
        ];
        localStorage.setItem('financeInfo', JSON.stringify(defaultFinance));
    }
    
    // Load donation and finance data into the form
    loadDonationFinanceInfo();
}

// Load donation and finance info from localStorage and populate the form
function loadDonationFinanceInfo() {
    // Load donation data
    loadDonationData();
    
    // Load finance data
    loadFinanceData();
}

// Load donation data
function loadDonationData() {
    const container = document.getElementById('donation-container');
    if (!container) return;
    
    const donationData = JSON.parse(localStorage.getItem('donationInfo') || '[]');
    
    container.innerHTML = ''; // Clear existing content
    
    if (donationData.length === 0) {
        container.innerHTML = '<p>Tidak ada data donatur. Silakan tambah data menggunakan tombol di bawah.</p>';
        return;
    }
    
    // Create table for donation data
    const table = document.createElement('table');
    table.className = 'donation-table';
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    
    // Create header
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `
        <th style="border: 1px solid #ddd; padding: 8px;">Nama</th>
        <th style="border: 1px solid #ddd; padding: 8px;">Tanggal</th>
        <th style="border: 1px solid #ddd; padding: 8px;">Jumlah</th>
        <th style="border: 1px solid #ddd; padding: 8px;">Aksi</th>
    `;
    table.appendChild(headerRow);
    
    // Add donation rows
    donationData.forEach(item => {
        const row = document.createElement('tr');
        row.dataset.id = item.id;
        row.innerHTML = `
            <td style="border: 1px solid #ddd; padding: 8px;">
                <input type="text" class="donation-name" value="${item.name}" style="width: 100%; padding: 4px;">
            </td>
            <td style="border: 1px solid #ddd; padding: 8px;">
                <input type="text" class="donation-date" value="${item.date}" style="width: 100%; padding: 4px;">
            </td>
            <td style="border: 1px solid #ddd; padding: 8px;">
                <input type="text" class="donation-amount" value="${item.amount}" style="width: 100%; padding: 4px;">
            </td>
            <td style="border: 1px solid #ddd; padding: 8px;">
                <button class="delete-donation-btn" onclick="deleteDonationData(${item.id})" style="background-color: #f44336; color: white; border: none; padding: 4px 8px; cursor: pointer; border-radius: 4px;">Hapus</button>
            </td>
        `;
        table.appendChild(row);
    });
    
    container.appendChild(table);
}

// Load finance data
function loadFinanceData() {
    const container = document.getElementById('finance-container');
    if (!container) return;
    
    const financeData = JSON.parse(localStorage.getItem('financeInfo') || '[]');
    
    container.innerHTML = ''; // Clear existing content
    
    if (financeData.length === 0) {
        container.innerHTML = '<p>Tidak ada data keuangan. Silakan tambah data menggunakan tombol di bawah.</p>';
        return;
    }
    
    // Create table for finance data
    const table = document.createElement('table');
    table.className = 'finance-table';
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    
    // Create header
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `
        <th style="border: 1px solid #ddd; padding: 8px;">Jenis</th>
        <th style="border: 1px solid #ddd; padding: 8px;">Masuk</th>
        <th style="border: 1px solid #ddd; padding: 8px;">Keluar</th>
        <th style="border: 1px solid #ddd; padding: 8px;">Aksi</th>
    `;
    table.appendChild(headerRow);
    
    // Add finance rows (excluding 'Saldo Akhir' which is calculated)
    const filteredFinanceData = financeData.filter(item => item.type.toLowerCase() !== 'saldo akhir');
    
    // Add finance rows
    filteredFinanceData.forEach(item => {
        const row = document.createElement('tr');
        row.dataset.id = item.id;
        row.innerHTML = `
            <td style="border: 1px solid #ddd; padding: 8px;">
                <input type="text" class="finance-type" value="${item.type}" style="width: 100%; padding: 4px;">
            </td>
            <td style="border: 1px solid #ddd; padding: 8px;">
                <input type="text" class="finance-income" value="${item.income}" style="width: 100%; padding: 4px;">
            </td>
            <td style="border: 1px solid #ddd; padding: 8px;">
                <input type="text" class="finance-expense" value="${item.expense}" style="width: 100%; padding: 4px;">
            </td>
            <td style="border: 1px solid #ddd; padding: 8px;">
                <button class="delete-finance-btn" onclick="deleteFinanceData(${item.id})" style="background-color: #f44336; color: white; border: none; padding: 4px 8px; cursor: pointer; border-radius: 4px;">Hapus</button>
            </td>
        `;
        table.appendChild(row);
    });
    
    container.appendChild(table);
}

// Add new donation data to the form
function addNewDonationData() {
    const container = document.getElementById('donation-container');
    if (!container) return;
    
    const donationData = JSON.parse(localStorage.getItem('donationInfo') || '[]');
    const newId = donationData.length > 0 ? Math.max(...donationData.map(d => d.id)) + 1 : 1;
    
    const newData = {
        id: newId,
        name: '',
        date: '',
        amount: ''
    };
    
    donationData.push(newData);
    localStorage.setItem('donationInfo', JSON.stringify(donationData));
    
    // Reload the form to show the new entry
    loadDonationData();
}

// Add new finance data to the form
function addNewFinanceData() {
    const container = document.getElementById('finance-container');
    if (!container) return;
    
    const financeData = JSON.parse(localStorage.getItem('financeInfo') || '[]');
    const newId = financeData.length > 0 ? Math.max(...financeData.map(f => f.id)) + 1 : 1;
    
    const newData = {
        id: newId,
        type: '',
        income: '',
        expense: ''
    };
    
    financeData.push(newData);
    localStorage.setItem('financeInfo', JSON.stringify(financeData));
    
    // Reload the form to show the new entry
    loadFinanceData();
}

// Delete donation data by ID
function deleteDonationData(id) {
    if (confirm('Apakah Anda yakin ingin menghapus data donatur ini?')) {
        let donationData = JSON.parse(localStorage.getItem('donationInfo') || '[]');
        donationData = donationData.filter(item => item.id !== id);
        localStorage.setItem('donationInfo', JSON.stringify(donationData));
        
        // Reload the form
        loadDonationData();
    }
}

// Delete finance data by ID
function deleteFinanceData(id) {
    if (confirm('Apakah Anda yakin ingin menghapus data keuangan ini?')) {
        let financeData = JSON.parse(localStorage.getItem('financeInfo') || '[]');
        financeData = financeData.filter(item => item.id !== id);
        localStorage.setItem('financeInfo', JSON.stringify(financeData));
        
        // Reload the form
        loadFinanceData();
    }
}

// Save donation and finance info from form
function saveDonationFinance() {
    // Save donation data
    const donationRows = document.querySelectorAll('#donation-container table tr:not(:first-child)'); // Skip header row
    
    const updatedDonationData = [];
    
    donationRows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        if (inputs.length >= 3) { // name, date, amount
            const id = parseInt(row.dataset.id);
            const name = inputs[0].value.trim();
            const date = inputs[1].value.trim();
            const amount = inputs[2].value.trim();
            
            if (name && date && amount) { // Only save if all fields are filled
                updatedDonationData.push({ id, name, date, amount });
            }
        }
    });
    
    // Save updated donation data
    localStorage.setItem('donationInfo', JSON.stringify(updatedDonationData));
    
    // Similarly for finance data
    const financeRows = document.querySelectorAll('#finance-container table tr:not(:first-child)'); // Skip header row
    
    const updatedFinanceData = [];
    
    financeRows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        if (inputs.length >= 3) { // type, income, expense
            const id = parseInt(row.dataset.id);
            const type = inputs[0].value.trim();
            const income = inputs[1].value.trim();
            const expense = inputs[2].value.trim();
            
            if (type && type.toLowerCase() !== 'saldo akhir') { // Only save if type is filled and not 'Saldo Akhir'
                updatedFinanceData.push({ id, type, income, expense });
            }
        }
    });
    
    // Save updated finance data
    localStorage.setItem('financeInfo', JSON.stringify(updatedFinanceData));
    
    // Update the display on the main page
    updateDonationFinanceDisplay();
    
    alert('Data donasi dan keuangan berhasil disimpan!');
}

// Calculate saldo akhir based on income and expenses
function calculateSaldoAkhir() {
    const financeData = JSON.parse(localStorage.getItem('financeInfo') || '[]');
    
    let totalIncome = 0;
    let totalExpense = 0;
    
    financeData.forEach(item => {
        // Extract numeric values from formatted currency strings
        if (item.income && typeof item.income === 'string') {
            const incomeValue = item.income.replace(/[Rp.\s]/g, '').replace(/,/g, '');
            if (!isNaN(incomeValue) && incomeValue !== '') {
                totalIncome += parseFloat(incomeValue);
            }
        }
        
        if (item.expense && typeof item.expense === 'string') {
            const expenseValue = item.expense.replace(/[Rp.\s]/g, '').replace(/,/g, '');
            if (!isNaN(expenseValue) && expenseValue !== '') {
                totalExpense += parseFloat(expenseValue);
            }
        }
    });
    
    const saldoAkhir = totalIncome - totalExpense;
    
    // Format the number as currency
    return 'Rp ' + saldoAkhir.toLocaleString('id-ID');
}

// Update the donation and finance display on the main page
function updateDonationFinanceDisplay() {
    // Update donation table on main page
    const donationTableBody = document.querySelector('.donation-table tbody');
    if (donationTableBody) {
        const donationData = JSON.parse(localStorage.getItem('donationInfo') || '[]');
        donationTableBody.innerHTML = ''; // Clear existing rows
        
        if (donationData.length > 0) {
            donationData.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.name}</td>
                    <td>${item.date}</td>
                    <td>${item.amount}</td>
                `;
                donationTableBody.appendChild(row);
            });
        } else {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>-</td>
                <td>-</td>
                <td>-</td>
            `;
            donationTableBody.appendChild(row);
        }
    }
    
    // Update finance table on main page
    const financeTableBody = document.querySelector('.finance-table tbody');
    if (financeTableBody) {
        const financeData = JSON.parse(localStorage.getItem('financeInfo') || '[]');
        financeTableBody.innerHTML = ''; // Clear existing rows
        
        if (financeData.length > 0) {
            // Add all finance items except the Saldo Akhir (we'll add it separately)
            const filteredFinanceData = financeData.filter(item => item.type.toLowerCase() !== 'saldo akhir');
            
            // Add finance items to the table
            filteredFinanceData.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.type}</td>
                    <td>${item.income}</td>
                    <td>${item.expense}</td>
                `;
                financeTableBody.appendChild(row);
            });
            
            // Calculate and add the Saldo Akhir row at position 7 (index 6)
            const saldoAkhir = calculateSaldoAkhir();
            
            // Create saldo akhir row
            const saldoRow = document.createElement('tr');
            saldoRow.innerHTML = `
                <td>Saldo Akhir</td>
                <td></td>
                <td>${saldoAkhir}</td>
            `;
            
            // Insert the saldo row at position 6 (7th position, 0-indexed) if possible
            if (financeTableBody.children.length >= 6) {
                // Insert at position 6 (7th position)
                if (financeTableBody.children[6]) {
                    financeTableBody.insertBefore(saldoRow, financeTableBody.children[6]);
                } else {
                    // If there's no 7th position, append at the end
                    financeTableBody.appendChild(saldoRow);
                }
            } else {
                // If there are fewer than 6 items, append the saldo row at the end
                financeTableBody.appendChild(saldoRow);
            }
        } else {
            // If no data, add a default row
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>-</td>
                <td>-</td>
                <td>-</td>
            `;
            financeTableBody.appendChild(row);
        }
    }
}

// Initialize staff data
function initStaffData() {
    // Check if staff data exists in localStorage, if not, create default
    const savedStaff = localStorage.getItem('staffInfo');
    if (!savedStaff) {
        const defaultStaff = [
            { id: 1, day: 'Senin', imam: 'Ust. Ahmad', muadzin: 'Ust. Budi' },
            { id: 2, day: 'Selasa', imam: 'Ust. Joko', muadzin: 'Ust. Sigit' },
            { id: 3, day: 'Rabu', imam: 'Ust. Rizal', muadzin: 'Ust. Andi' },
            { id: 4, day: 'Kamis', imam: 'Ust. Fajar', muadzin: 'Ust. Rudi' },
            { id: 5, day: 'Jumat', imam: 'Ust. Fauzan', muadzin: 'Ust. Toni' },
            { id: 6, day: 'Sabtu', imam: 'Ust. Arif', muadzin: 'Ust. Dedi' },
            { id: 7, day: 'Minggu', imam: 'Ust. Yusuf', muadzin: 'Ust. Fikri' }
        ];
        localStorage.setItem('staffInfo', JSON.stringify(defaultStaff));
    }
    
    // Load staff data into the form
    loadStaffInfo();
    
    // Update the main page staff display
    updateStaffDisplay();
}

// Load staff info from localStorage and populate the form
function loadStaffInfo() {
    const staffContainer = document.getElementById('staff-container');
    if (!staffContainer) return;
    
    const staffData = JSON.parse(localStorage.getItem('staffInfo') || '[]');
    
    staffContainer.innerHTML = ''; // Clear existing content
    
    if (staffData.length === 0) {
        staffContainer.innerHTML = '<p>Tidak ada data petugas. Silakan tambah petugas menggunakan tombol di bawah.</p>';
        return;
    }
    
    // Create table for staff data
    const table = document.createElement('table');
    table.className = 'staff-table';
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    
    // Create header
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `
        <th style="border: 1px solid #ddd; padding: 8px;">Hari</th>
        <th style="border: 1px solid #ddd; padding: 8px;">Imam</th>
        <th style="border: 1px solid #ddd; padding: 8px;">Muadzin</th>
        <th style="border: 1px solid #ddd; padding: 8px;">Aksi</th>
    `;
    table.appendChild(headerRow);
    
    // Add staff rows
    staffData.forEach(staff => {
        const row = document.createElement('tr');
        row.dataset.id = staff.id;
        row.innerHTML = `
            <td style="border: 1px solid #ddd; padding: 8px;">
                <input type="text" class="staff-day" value="${staff.day}" style="width: 100%; padding: 4px;">
            </td>
            <td style="border: 1px solid #ddd; padding: 8px;">
                <input type="text" class="staff-imam" value="${staff.imam}" style="width: 100%; padding: 4px;">
            </td>
            <td style="border: 1px solid #ddd; padding: 8px;">
                <input type="text" class="staff-muadzin" value="${staff.muadzin}" style="width: 100%; padding: 4px;">
            </td>
            <td style="border: 1px solid #ddd; padding: 8px;">
                <button class="delete-staff-btn" onclick="deleteStaff(${staff.id})" style="background-color: #f44336; color: white; border: none; padding: 4px 8px; cursor: pointer; border-radius: 4px;">Hapus</button>
            </td>
        `;
        table.appendChild(row);
    });
    
    staffContainer.appendChild(table);
}

// Add new staff row to the form
function addNewStaff() {
    const staffContainer = document.getElementById('staff-container');
    if (!staffContainer) return;
    
    const staffData = JSON.parse(localStorage.getItem('staffInfo') || '[]');
    const newId = staffData.length > 0 ? Math.max(...staffData.map(s => s.id)) + 1 : 1;
    
    const newStaff = {
        id: newId,
        day: '',
        imam: '',
        muadzin: ''
    };
    
    staffData.push(newStaff);
    localStorage.setItem('staffInfo', JSON.stringify(staffData));
    
    // Reload the form to show the new entry
    loadStaffInfo();
}

// Delete staff by ID
function deleteStaff(id) {
    if (confirm('Apakah Anda yakin ingin menghapus data petugas ini?')) {
        let staffData = JSON.parse(localStorage.getItem('staffInfo') || '[]');
        staffData = staffData.filter(staff => staff.id !== id);
        localStorage.setItem('staffInfo', JSON.stringify(staffData));
        
        // Reload the form
        loadStaffInfo();
    }
}

// Save staff info from form
function saveStaffInfo() {
    const rows = document.querySelectorAll('#staff-container table tr:not(:first-child)');
    
    const updatedStaffData = [];
    
    rows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        if (inputs.length >= 3) { // day, imam, muadzin
            const id = parseInt(row.dataset.id);
            const day = inputs[0].value.trim();
            const imam = inputs[1].value.trim();
            const muadzin = inputs[2].value.trim();
            
            if (day && imam && muadzin) { // Only save if all fields are filled
                updatedStaffData.push({ id, day, imam, muadzin });
            }
        }
    });
    
    // Save to localStorage
    localStorage.setItem('staffInfo', JSON.stringify(updatedStaffData));
    
    // Update the display on the main page
    updateStaffDisplay();
    
    alert('Data petugas berhasil disimpan!');
}

// Update the staff display on the main page
function updateStaffDisplay() {
    const staffData = JSON.parse(localStorage.getItem('staffInfo') || '[]');
    const staffTableBody = document.querySelector('.staff-table tbody');
    
    if (staffTableBody) {
        staffTableBody.innerHTML = ''; // Clear existing rows
        
        // Show all staff data in the table
        if (staffData.length > 0) {
            staffData.forEach(staff => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${staff.day}</td>
                    <td>${staff.imam}</td>
                    <td>${staff.muadzin}</td>
                `;
                staffTableBody.appendChild(row);
            });
        } else {
            // If no staff data, show a default row
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>-</td>
                <td>-</td>
                <td>-</td>
            `;
            staffTableBody.appendChild(row);
        }
    }
}

// Function to update staff display periodically
function updateStaffPeriodically() {
    updateStaffDisplay();
    // Update every hour to catch day changes
    setInterval(updateStaffDisplay, 60 * 60 * 1000); 
}

// Function to extract time from HTML content, removing the icon part
function extractTimeFromHTML(htmlContent) {
    // Remove the icon span and extract just the time part
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Get the text content and extract time pattern (HH:MM)
    const text = tempDiv.textContent || tempDiv.innerText;
    const timeMatch = text.match(/\d{1,2}:\d{2}/);
    
    return timeMatch ? timeMatch[0] : '';
}

// Setup Quran verses rotation
function setupQuranVerses() {
    const verses = document.querySelectorAll('.quran-verse-item');
    let currentVerseIndex = 0;
    
    if (verses.length === 0) {
        console.warn('Quran verse elements not found');
        return;
    }
    
    // Show first verse
    verses.forEach((verse, index) => {
        if (index === 0) {
            verse.classList.add('active');
        } else {
            verse.classList.remove('active');
        }
    });
    
    // Rotate verses every 10 seconds
    quranVerseInterval = setInterval(() => {
        verses[currentVerseIndex].classList.remove('active');
        currentVerseIndex = (currentVerseIndex + 1) % verses.length;
        verses[currentVerseIndex].classList.add('active');
    }, 10000); // Change verse every 10 seconds
}

// Setup event listeners for various interactive elements
function setupEventListeners() {
    // Set up background template selection
    setupBackgroundTemplateSelection();
    
    // Set up Intersection Observer to detect when videos become visible
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.5 // Trigger when 50% of the video is visible
    };
    
    const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            const videoOnlySelected = document.getElementById('show-videos')?.checked;
            
            if (entry.isIntersecting && videoOnlySelected) {
                // Video is visible and in video-only mode, try to play it
                video.muted = true;
                video.loop = true;
                
                video.play()
                    .then(() => {
                        console.log('Video started playing via intersection observer');
                    })
                    .catch(error => {
                        console.log('Intersection observer play error:', error);
                        
                        // Try alternative approach
                        setTimeout(() => {
                            video.play().catch(err => {
                                console.log('Retry after intersection observer failed:', err);
                            });
                        }, 100);
                    });
            } else if (!entry.isIntersecting) {
                // Pause video when it's no longer visible
                video.pause();
            }
        });
    }, observerOptions);
    
    // Handle video playback in carousel
    document.querySelectorAll('video').forEach(video => {
        // Ensure videos are properly configured for continuous playback
        video.muted = true;
        video.loop = true;
        video.preload = 'auto';
        
        // Observe each video
        videoObserver.observe(video);
        
        video.addEventListener('loadedmetadata', function() {
            // Ensure video maintains aspect ratio
            this.style.objectFit = 'cover';
            
            // If this video is currently active and in video-only mode, try to play it
            const isActiveSlide = this.closest('.carousel-slide')?.classList.contains('active');
            const videoOnlySelected = document.getElementById('show-videos')?.checked;
            
            if (isActiveSlide && videoOnlySelected) {
                this.play().catch(e => console.log('Auto-play on load error:', e));
            }
        });
        
        video.addEventListener('canplay', function() {
            const isActiveSlide = this.closest('.carousel-slide')?.classList.contains('active');
            const videoOnlySelected = document.getElementById('show-videos')?.checked;
            if (isActiveSlide && videoOnlySelected) {
                this.play().catch(e => console.log('Auto-play on canplay error:', e));
            }
        });
        
        video.addEventListener('ended', function() {
            // Restart video when it ends (in case loop attribute doesn't work)
            this.currentTime = 0;
            this.play().catch(e => console.log('Video restart error:', e));
        });
        
        // Pause video when it's not active
        video.addEventListener('play', function() {
            // Pause other videos
            document.querySelectorAll('video').forEach(otherVideo => {
                if (otherVideo !== this && otherVideo.classList.contains('video-playing')) {
                    otherVideo.pause();
                    otherVideo.classList.remove('video-playing');
                }
            });
            
            this.classList.add('video-playing');
        });
        
        video.addEventListener('pause', function() {
            this.classList.remove('video-playing');
        });
    });
    
    // Handle responsive behavior
    window.addEventListener('resize', function() {
        // Adjust layout as needed
        adjustLayout();
    });
    
    // Initial layout adjustment
    adjustLayout();
    
    // Add event listener for fullscreen button
    document.getElementById('fullscreenBtn')?.addEventListener('click', toggleFullscreen);
}

// Toggle fullscreen mode
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        // Enter fullscreen
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

// Update fullscreen button icon when fullscreen state changes
function updateFullscreenButton() {
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn) {
        const svgIcon = fullscreenBtn.querySelector('svg');
        if (document.fullscreenElement) {
            // Change to minimize icon when in fullscreen
            svgIcon.innerHTML = `<path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>`;
        } else {
            // Change to maximize icon when not in fullscreen
            svgIcon.innerHTML = `<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>`;
        }
    }
}

// Function to show the fullscreen button
function showFullscreenButton() {
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn) {
        fullscreenBtn.classList.remove('hidden');
    }
}

// Function to hide the fullscreen button
function hideFullscreenButton() {
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn && !document.fullscreenElement) {
        fullscreenBtn.classList.add('hidden');
    }
}

// Listen for fullscreen change events
if (document.addEventListener) {
    document.addEventListener('fullscreenchange', updateFullscreenButton);
    document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
    document.addEventListener('mozfullscreenchange', updateFullscreenButton);
    document.addEventListener('MSFullscreenChange', updateFullscreenButton);
}

// Activity detection for fullscreen button
let activityTimer;

// Function to reset the activity timer
function resetActivityTimer() {
    // Show the button when there's activity
    showFullscreenButton();
    
    // Clear the existing timer
    clearTimeout(activityTimer);
    
    // Set a new timer to hide the button after a period of inactivity
    activityTimer = setTimeout(hideFullscreenButton, 3000); // Hide after 3 seconds of inactivity
}

// Add event listeners for user activity
function setupActivityDetection() {
    // Wait for the DOM to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeActivityDetection);
    } else {
        initializeActivityDetection();
    }
}

function initializeActivityDetection() {
    // Events that indicate user activity
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'wheel'];
    
    events.forEach(event => {
        document.addEventListener(event, resetActivityTimer, true);
    });
    
    // Initialize the button as hidden if there's no recent activity
    setTimeout(() => {
        // Check if the fullscreen button exists
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        if (fullscreenBtn) {
            if (!document.hasFocus()) {
                hideFullscreenButton();
            } else {
                resetActivityTimer();
            }
        } else {
            // If button doesn't exist yet, try again after a short delay
            setTimeout(initializeActivityDetection, 500);
        }
    }, 500);
}

// Adjust layout based on screen size
function adjustLayout() {
    // This function can handle responsive adjustments
    // For now, we'll just log the resize event
    console.log('Layout adjusted for resize');
}

// Utility function to convert time string to minutes since midnight
function timeToMinutes(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') {
        console.error('Invalid time string:', timeStr);
        return 0;
    }
    
    const parts = timeStr.split(':');
    if (parts.length !== 2) {
        console.error('Invalid time format:', timeStr);
        return 0;
    }
    
    const [hours, minutes] = parts.map(Number);
    
    if (isNaN(hours) || isNaN(minutes)) {
        console.error('Invalid time values:', timeStr);
        return 0;
    }
    
    return hours * 60 + minutes;
}

// Utility function to convert minutes since midnight to time string
function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

// Variables to track triggered prayer times to prevent repeated triggers
let lastCheckedMinute = null;
let triggeredPrayers = {};

// Function to check if it's currently prayer time (within 1 minute of adhan)
function isPrayerTime(now) {
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // Debug logging
    console.log('Checking prayer time:', now.toLocaleTimeString(), 'Current minutes:', currentTime);
    
    // Ensure prayerTimes is loaded
    if (!prayerTimes || Object.keys(prayerTimes).length === 0) {
        console.log('Prayer times not loaded yet');
        return null;
    }
    
    for (const prayer in prayerTimes) {
        if (!prayerTimes[prayer]) continue; // Skip if prayer time is not set
        
        const prayerMinute = timeToMinutes(prayerTimes[prayer]);
        
        // Debug logging
        console.log(`Checking ${prayer}: ${prayerTimes[prayer]}, Minutes: ${prayerMinute}, Current: ${currentTime}`);
        
        // Check if current time matches prayer time
        if (currentTime === prayerMinute) {
            // Check if this prayer was already triggered in the past 10 minutes
            const nowMs = now.getTime();
            if (!triggeredPrayers[prayer] || (nowMs - triggeredPrayers[prayer]) > 10 * 60 * 1000) { // 10 minutes
                console.log('PRAYER TIME DETECTED:', prayer);
                triggeredPrayers[prayer] = nowMs; // Mark as triggered
                return prayer;
            }
        }
    }
    
    return null;
}



// Function to play adhan audio (if available)
function playAdhan(prayerName) {
    // Create visual Adzan notification
    showAdhanNotification(prayerName);
    
    // In a real implementation, this would play the appropriate adhan audio
    console.log(`Adhan for ${prayerName} should be played now`);
    
    // Example of how to play audio if adhan files exist
    /*
    const audio = new Audio(`asset/sound/${prayerName}_adhan.mp3`);
    audio.play().catch(e => console.error("Error playing adhan:", e));
    */
}

// Function to show Adzan notification
function showAdhanNotification(prayerName) {
    // Create overlay element if it doesn't exist
    let adhanOverlay = document.getElementById('adhan-overlay');
    
    if (!adhanOverlay) {
        adhanOverlay = document.createElement('div');
        adhanOverlay.id = 'adhan-overlay';
        adhanOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: linear-gradient(135deg, #1b5e20, #2e7d32);
            color: #ffcc02;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            text-align: center;
            padding: 20px;
            box-sizing: border-box;
        `;
        
        adhanOverlay.innerHTML = `
            <div class="adhan-content">
                <h1 style="font-size: 6rem; margin: 0 0 30px 0; text-shadow: 3px 3px 6px rgba(0,0,0,0.5); text-transform: uppercase;">Saatnya Adzan</h1>
                <div style="position: relative; display: inline-block; margin-bottom: 40px;">
                    <h2 id="adhan-prayer-name" style="font-size: 4.5rem; margin: 0; text-shadow: 3px 3px 6px rgba(0,0,0,0.5); text-transform: uppercase;"></h2>
                    <div style="position: absolute; bottom: -8px; left: 0; width: 100%; height: 2px; background: linear-gradient(to right, transparent, #ffcc02, transparent);"></div>
                </div>
                <div id="adhan-countdown" style="font-size: 5rem; font-weight: bold; margin: 0 0 30px 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);"></div>
                <p style="font-size: 1.8rem; margin: 0; line-height: 1.4; padding: 0 20px; text-align: center;">Mohon kepada Jamaah untuk segera mengisi shaf terdepan sebagai persiapan Sholat Berjamaah.</p>
            </div>
        `;
        
        document.body.appendChild(adhanOverlay);
    }
    
    // Set the prayer name
    const prayerNameElement = document.getElementById('adhan-prayer-name');
    if (prayerNameElement) {
        prayerNameElement.textContent = getPrayerDisplayName(prayerName);
    }
    
    // Start countdown from 5 minutes
    startAdhanCountdown(5 * 60); // 5 minutes in seconds
    
    // Pause videos and slideshow
    pauseAllMedia();
}

// Function to get proper display name for prayer
function getPrayerDisplayName(prayerName) {
    const prayerNames = {
        'imsak': 'Imsak',
        'subuh': 'Subuh',
        'syuruq': 'Syuruq',
        'dhuha': 'Dhuha',
        'dhuhur': 'Dzuhur',
        'ashar': 'Ashar',
        'maghrib': 'Maghrib',
        'isya': 'Isya'
    };
    
    return prayerNames[prayerName] || prayerName.charAt(0).toUpperCase() + prayerName.slice(1);
}

// Function to start Adzan countdown
function startAdhanCountdown(totalSeconds) {
    let secondsLeft = totalSeconds;
    const countdownElement = document.getElementById('adhan-countdown');
    
    if (!countdownElement) return;
    
    function updateCountdown() {
        const minutes = Math.floor(secondsLeft / 60);
        const seconds = secondsLeft % 60;
        countdownElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (secondsLeft <= 0) {
            // Hide the Adzan overlay
            const adhanOverlay = document.getElementById('adhan-overlay');
            if (adhanOverlay) {
                adhanOverlay.style.display = 'none';
            }
            
            // Start Iqomah countdown after Adzan finishes
            setTimeout(() => {
                const prayerName = document.getElementById('adhan-prayer-name').textContent.toLowerCase();
                showIqomahNotification(prayerName);
            }, 1000);
            
            return;
        }
        
        secondsLeft--;
    }
    
    // Update immediately
    updateCountdown();
    
    // Update every second
    const countdownInterval = setInterval(() => {
        updateCountdown();
        
        if (secondsLeft <= 0) {
            clearInterval(countdownInterval);
            
            // Hide the Adzan overlay
            const adhanOverlay = document.getElementById('adhan-overlay');
            if (adhanOverlay) {
                adhanOverlay.style.display = 'none';
            }
            
            // Start Iqomah countdown after Adzan finishes
            const prayerName = document.getElementById('adhan-prayer-name').textContent.toLowerCase();
            showIqomahNotification(prayerName);
        }
    }, 1000);
}

// Function to show Iqomah notification
function showIqomahNotification(prayerName) {
    // Create overlay element if it doesn't exist
    let iqomahOverlay = document.getElementById('iqomah-overlay');
    
    if (!iqomahOverlay) {
        iqomahOverlay = document.createElement('div');
        iqomahOverlay.id = 'iqomah-overlay';
        iqomahOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: linear-gradient(135deg, #0d47a1, #1976d2);
            color: #ffffff;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            text-align: center;
            padding: 20px;
            box-sizing: border-box;
            overflow: hidden;
        `;
        
        iqomahOverlay.innerHTML = `
            <div class="iqomah-content">
                <h1 style="font-size: 5rem; margin: 0 0 20px 0; text-shadow: 3px 3px 6px rgba(0,0,0,0.5); text-transform: uppercase;">10 MENIT MENUJU IQOMAH</h1>
                <div style="position: relative; display: inline-block; margin-bottom: 30px;">
                    <h2 id="iqomah-prayer-name" style="font-size: 4.5rem; margin: 0; text-shadow: 3px 3px 6px rgba(0,0,0,0.5); text-transform: uppercase;"></h2>
                    <div style="position: absolute; bottom: -8px; left: 0; width: 100%; height: 2px; background: linear-gradient(to right, transparent, #ffffff, transparent);"></div>
                </div>
                <p style="font-size: 2rem; margin: 0 0 30px 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">Rapatkan Shof dan Luruskan</p>
                <div id="iqomah-countdown" style="font-size: 6rem; font-weight: bold; margin: 0 0 20px 0; text-shadow: 3px 3px 6px rgba(0,0,0,0.5);"></div>
                <p style="font-size: 1.5rem; margin: 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">Waktu Sholat akan segera dimulai</p>
            </div>
        `;
        
        document.body.appendChild(iqomahOverlay);
    }
    
    // Set the prayer name
    const prayerNameElement = document.getElementById('iqomah-prayer-name');
    if (prayerNameElement) {
        prayerNameElement.textContent = getPrayerDisplayName(prayerName);
    }
    
    // Start countdown for Iqomah (10 minutes)
    startIqomahCountdown(10 * 60, prayerName); // 10 minutes in seconds
    
    // Pause all media during Iqomah
    pauseAllMedia();
}

// Function to start Iqomah countdown
function startIqomahCountdown(totalSeconds, prayerName) {
    let secondsLeft = totalSeconds;
    const countdownElement = document.getElementById('iqomah-countdown');
    
    if (!countdownElement) return;
    
    function updateCountdown() {
        const minutes = Math.floor(secondsLeft / 60);
        const seconds = secondsLeft % 60;
        countdownElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (secondsLeft <= 0) {
            // Hide the Iqomah overlay
            const iqomahOverlay = document.getElementById('iqomah-overlay');
            if (iqomahOverlay) {
                iqomahOverlay.style.display = 'none';
            }
            
            // Resume videos and slideshow
            resumeAllMedia();
            return;
        }
        
        secondsLeft--;
    }
    
    // Update immediately
    updateCountdown();
    
    // Update every second
    const countdownInterval = setInterval(() => {
        updateCountdown();
        
        if (secondsLeft <= 0) {
            clearInterval(countdownInterval);
            
            // Hide the Iqomah overlay
            const iqomahOverlay = document.getElementById('iqomah-overlay');
            if (iqomahOverlay) {
                iqomahOverlay.style.display = 'none';
            }
            
            // Resume videos and slideshow
            resumeAllMedia();
        }
    }, 1000);
}

// Function to pause all media during Adzan notification
function pauseAllMedia() {
    // Pause all videos
    document.querySelectorAll('video').forEach(video => {
        video.pause();
    });
    
    // Pause any slideshow intervals
    if (slideInterval) {
        clearInterval(slideInterval);
    }
    
    // Pause Quran verse rotation
    if (quranVerseInterval) {
        clearInterval(quranVerseInterval);
    }
}

// Function to resume all media after Adzan notification
function resumeAllMedia() {
    // Resume Quran verse rotation
    if (typeof setupQuranVerses === 'function') {
        // Wait a bit before resuming to avoid conflicts
        setTimeout(() => {
            if (typeof quranVerseInterval === 'undefined' || !quranVerseInterval) {
                setupQuranVerses();
            }
        }, 1000);
    }
    
    // Videos will resume based on their own logic when they become visible again
    ensureVideosPlay();
}

// Function to handle prayer time notifications
function handlePrayerTimeNotifications() {
    const now = new Date();
    
    // Debug: Log the current time and prayer times
    console.log('Current time:', now.toLocaleTimeString());
    console.log('Current minutes:', now.getHours() * 60 + now.getMinutes());
    console.log('Prayer times:', prayerTimes);
    
    const prayer = isPrayerTime(now);
    
    if (prayer) {
        console.log('Prayer time detected:', prayer);
        playAdhan(prayer);
        // Highlight the current prayer in the UI
        highlightCurrentPrayer(prayer);
    }
}

// Function to highlight current prayer in the UI
function highlightCurrentPrayer(prayerName) {
    // Remove highlighting from all prayer items
    document.querySelectorAll('.prayer-item').forEach(item => {
        item.classList.remove('current-prayer');
    });
    
    // Add highlighting to current prayer item
    const prayerItem = document.getElementById(`${prayerName}-time`).closest('.prayer-item');
    prayerItem.classList.add('current-prayer');
    
    // Remove highlighting after 5 minutes
    setTimeout(() => {
        prayerItem.classList.remove('current-prayer');
    }, 5 * 60 * 1000); // 5 minutes
}

// Function to update Friday prayer display
function updateFridayPrayerDisplay(now) {
    // Check if today is Friday (day 5 in JavaScript, where Sunday is 0)
    if (now.getDay() === 5) { // 5 is Friday
        // Update the Dhuhur time display to show the actual time with "Jumat" label
        const dhuhurTimeElement = document.getElementById('dhuhur-time');
        if (dhuhurTimeElement) {
            // Keep the actual time value
            if (prayerTimes && prayerTimes.dhuhur) {
                dhuhurTimeElement.innerHTML = '<span class="time-icon">⏰</span> ' + prayerTimes.dhuhur;
            }
            
            // Update the label to be "Jumat" with appropriate icon
            const dhuhurLabel = document.querySelector('#dhuhur-time').closest('.prayer-item').querySelector('.prayer-label');
            if (dhuhurLabel) {
                dhuhurLabel.innerHTML = '<span class="prayer-icon">🕌</span> Jumat';
            }
        }
    } else {
        // If it's not Friday, revert to normal Dhuhur display
        if (prayerTimes && prayerTimes.dhuhur) {
            const dhuhurTimeElement = document.getElementById('dhuhur-time');
            if (dhuhurTimeElement) {
                dhuhurTimeElement.innerHTML = '<span class="time-icon">⏰</span> ' + prayerTimes.dhuhur;
                
                // Revert the label back to Dhuhur
                const dhuhurLabel = document.querySelector('#dhuhur-time').closest('.prayer-item').querySelector('.prayer-label');
                if (dhuhurLabel) {
                    dhuhurLabel.innerHTML = '<span class="prayer-icon">🕛</span> Dhuhur';
                }
            }
        }
    }
}

// Load selected video on startup
function loadSelectedVideo() {
    // Check if a video has been selected previously
    const selectedVideo = localStorage.getItem('selectedVideo');
    
    if (selectedVideo) {
        // Update the main video source
        const mainVideo = document.getElementById('main-video');
        if (mainVideo) {
            mainVideo.src = selectedVideo;
            
            // Try to play the video
            mainVideo.load(); // Load the new source
            
            // Attempt to play with various fallbacks
            mainVideo.muted = true;
            mainVideo.loop = true;
            mainVideo.preload = 'auto';
            mainVideo.setAttribute('playsinline', '');
            
            mainVideo.play().catch(e => {
                console.log('Auto-play failed for selected video, video will play when ready:', e);
            });
        }
    }
}

// Select a video to be played
function selectVideo(videoSrc) {
    // Update the main video source
    const mainVideo = document.getElementById('main-video');
    if (mainVideo) {
        // Update the source
        mainVideo.src = videoSrc;
        
        // Store the selected video in localStorage
        localStorage.setItem('selectedVideo', videoSrc);
        
        // Try to play the video
        mainVideo.load(); // Load the new source
        
        // Attempt to play with various fallbacks
        mainVideo.muted = true;
        mainVideo.loop = true;
        mainVideo.preload = 'auto';
        mainVideo.setAttribute('playsinline', '');
        
        mainVideo.play().catch(e => {
            console.log('Auto-play failed, video will play when ready:', e);
        });
        
        alert('Video berhasil dipilih!');
    }
}

// Save container visibility settings
function saveContainerVisibility() {
    const containers = {
        'show-qris': '.qris-section',
        'show-bank-account': '.bank-account-section',
        'show-qurban-info': '.qurban-info-section',
        'show-masjid-info': '.info-section',
        'show-ramadan-info': '.ramadan-info-section',
        'show-jumat-schedule': '.jumat-schedule-section'
    };
    
    for (const [checkboxId, selector] of Object.entries(containers)) {
        const checkbox = document.getElementById(checkboxId);
        const container = document.querySelector(selector);
        
        if (checkbox && container) {
            const isVisible = checkbox.checked;
            localStorage.setItem(checkboxId, isVisible);
            
            if (isVisible) {
                container.classList.remove('container-hidden');
            } else {
                container.classList.add('container-hidden');
            }
        }
    }
}

// Load container visibility settings
function loadContainerVisibility() {
    const containers = {
        'show-qris': '.qris-section',
        'show-bank-account': '.bank-account-section',
        'show-qurban-info': '.qurban-info-section',
        'show-masjid-info': '.info-section',
        'show-ramadan-info': '.ramadan-info-section',
        'show-jumat-schedule': '.jumat-schedule-section'
    };
    
    for (const [checkboxId, selector] of Object.entries(containers)) {
        const checkbox = document.getElementById(checkboxId);
        const container = document.querySelector(selector);
        
        if (checkbox && container) {
            const savedVisibility = localStorage.getItem(checkboxId);
            const isVisible = savedVisibility === 'true' || savedVisibility === null; // Default to visible
            
            checkbox.checked = isVisible;
            
            if (isVisible) {
                container.classList.remove('container-hidden');
            } else {
                container.classList.add('container-hidden');
            }
        }
    }
}

// Load prayer time visibility settings
function loadPrayerTimeVisibility() {
    const prayerCheckboxes = [
        'show-imsak', 'show-subuh', 'show-syuruq', 'show-dhuha',
        'show-dhuhur', 'show-ashar', 'show-maghrib', 'show-isya'
    ];
    
    prayerCheckboxes.forEach(checkboxId => {
        const checkbox = document.getElementById(checkboxId);
        if (checkbox) {
            const savedVisibility = localStorage.getItem(checkboxId);
            // Default to visible (true) for all except Imsak, Syuruq, Dhuha
            const defaultValue = ['show-imsak', 'show-syuruq', 'show-dhuha'].includes(checkboxId) ? 'false' : 'true';
            const isVisible = savedVisibility === 'true' || (savedVisibility === null && defaultValue === 'true');
            
            checkbox.checked = isVisible;
        }
    });
    
    // Apply visibility immediately
    applyPrayerTimeVisibility();
}

// Save prayer time visibility settings
function savePrayerTimeVisibility() {
    const prayerCheckboxes = [
        'show-imsak', 'show-subuh', 'show-syuruq', 'show-dhuha',
        'show-dhuhur', 'show-ashar', 'show-maghrib', 'show-isya'
    ];
    
    prayerCheckboxes.forEach(checkboxId => {
        const checkbox = document.getElementById(checkboxId);
        if (checkbox) {
            localStorage.setItem(checkboxId, checkbox.checked.toString());
        }
    });
}

// Apply prayer time visibility to the UI
function applyPrayerTimeVisibility() {
    // Initialize layout if needed
    initPrayerLayoutStorage();
    
    // Map checkbox IDs to prayer time element IDs
    const prayerElements = {
        'show-imsak': 'imsak-time',
        'show-subuh': 'subuh-time',
        'show-syuruq': 'syuruq-time',
        'show-dhuha': 'dhuha-time',
        'show-dhuhur': 'dhuhur-time',
        'show-ashar': 'ashar-time',
        'show-maghrib': 'maghrib-time',
        'show-isya': 'isya-time'
    };
    
    // Process each prayer time visibility setting
    for (const [checkboxId, timeElementId] of Object.entries(prayerElements)) {
        const checkbox = document.getElementById(checkboxId);
        const timeElement = document.getElementById(timeElementId);
        
        if (checkbox && timeElement) {
            const prayerItem = timeElement.closest('.prayer-item');
            if (prayerItem) {
                if (checkbox.checked) {
                    prayerItem.style.display = 'flex';
                    // Make sure parent sections are visible
                    const parentSection = prayerItem.parentElement;
                    if (parentSection) {
                        parentSection.style.display = 'flex';
                    }
                } else {
                    prayerItem.style.display = 'none';
                    
                    // Check if all items in the section are hidden
                    const parentSection = prayerItem.parentElement;
                    if (parentSection) {
                        const allItems = parentSection.querySelectorAll('.prayer-item');
                        const visibleItems = parentSection.querySelectorAll('.prayer-item:not([style*="display: none"])');
                        
                        // If all items in this section are hidden, hide the section
                        if (visibleItems.length === 0 && allItems.length > 0) {
                            parentSection.style.display = 'none';
                        } else {
                            parentSection.style.display = 'flex';
                        }
                    }
                }
            }
        }
    }
}

// Rearrange prayer times into single column layout
function rearrangePrayerLayout(visiblePrayers) {
    const container = document.querySelector('.prayer-times-container-atas-bawah');
    
    if (!container) return;
    
    // Clear existing content
    container.innerHTML = '';
    
    // Create new single column container
    const singleColumnContainer = document.createElement('div');
    singleColumnContainer.className = 'prayer-times-single-column';
    
    // Order of obligatory prayers
    const prayerOrder = ['subuh', 'dhuhur', 'ashar', 'maghrib', 'isya'];
    
    // Add prayer items in correct order
    prayerOrder.forEach(prayerName => {
        const prayer = visiblePrayers.find(p => p.id === prayerName);
        if (prayer) {
            // Move the original item to the new container
            singleColumnContainer.appendChild(prayer.item);
            prayer.item.style.margin = '0';
            prayer.item.style.width = '100%';
        }
    });
    
    // Add the container to the main container
    container.appendChild(singleColumnContainer);
}

// Reset to default layout with 'atas' and 'bawah' sections
function resetPrayerLayout() {
    const container = document.querySelector('.prayer-times-container-atas-bawah');
    
    if (container) {
        // Instead of using stored layout, rebuild the 'atas' and 'bawah' structure
        rebuildPrayerTimeStructure();
        
        // Re-apply prayer time displays
        updatePrayerTimeDisplays();
        
        // Apply visibility settings
        applyPrayerTimeVisibility();
    }
}

// Function to rebuild the prayer time structure without section titles
function rebuildPrayerTimeStructure() {
    const container = document.querySelector('.prayer-times-container-atas-bawah');
    if (!container) return;
    
    // Clear existing content
    container.innerHTML = '';
    
    // Create 'atas' section
    const atasSection = document.createElement('div');
    atasSection.className = 'prayer-section';
    
    // Add prayer items for 'atas' section (without title)
    const atasPrayers = ['imsak', 'subuh', 'syuruq', 'dhuha'];
    atasPrayers.forEach(prayerName => {
        const prayerItem = createPrayerItem(prayerName);
        atasSection.appendChild(prayerItem);
    });
    
    // Create 'bawah' section
    const bawahSection = document.createElement('div');
    bawahSection.className = 'prayer-section';
    
    // Add prayer items for 'bawah' section (without title)
    const bawahPrayers = ['dhuhur', 'ashar', 'maghrib', 'isya'];
    bawahPrayers.forEach(prayerName => {
        const prayerItem = createPrayerItem(prayerName);
        bawahSection.appendChild(prayerItem);
    });
    
    // Append both sections to container
    container.appendChild(atasSection);
    container.appendChild(bawahSection);
}

// Helper function to create a prayer item element
function createPrayerItem(prayerName) {
    const item = document.createElement('div');
    item.className = 'prayer-item';
    
    // Get the prayer name in Indonesian
    const prayerNames = {
        'imsak': 'Imsak',
        'subuh': 'Subuh',
        'syuruq': 'Syuruq',
        'dhuha': 'Dhuha',
        'dhuhur': 'Dzuhur',
        'ashar': 'Ashar',
        'maghrib': 'Maghrib',
        'isya': 'Isya'
    };
    
    // Get the prayer icon
    const prayerIcons = {
        'imsak': '🌙',
        'subuh': '🌅',
        'syuruq': '☀️',
        'dhuha': '🌤️',
        'dhuhur': '🕛',
        'ashar': '🌆',
        'maghrib': '🌇',
        'isya': '🌙'
    };
    
    const prayerLabel = document.createElement('div');
    prayerLabel.className = 'prayer-label';
    prayerLabel.innerHTML = `<span class="prayer-icon">${prayerIcons[prayerName]}</span> ${prayerNames[prayerName]}`;
    
    const prayerTime = document.createElement('div');
    prayerTime.id = `${prayerName}-time`;
    prayerTime.className = 'prayer-time';
    
    item.appendChild(prayerLabel);
    item.appendChild(prayerTime);
    
    return item;
}

// Function to handle profile picture zoom
function setupProfilePicZoom() {
    const profilePic = document.querySelector('.profile-pic');
    
    if (profilePic) {
        profilePic.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent event bubbling
            
            // Toggle zoomed class
            this.classList.toggle('zoomed');
            
            // If zoomed in, add click event to zoom out
            if (this.classList.contains('zoomed')) {
                // Click anywhere to close the zoomed image
                document.addEventListener('click', closeZoomedImage);
            }
        });
    }
}

// Function to close the zoomed image
function closeZoomedImage(e) {
    const profilePic = document.querySelector('.profile-pic');
    
    if (profilePic && profilePic.classList.contains('zoomed')) {
        // Check if the click is not on the image itself
        if (e.target !== profilePic) {
            profilePic.classList.remove('zoomed');
            document.removeEventListener('click', closeZoomedImage);
        }
    }
}

// Export functions that might be needed by other scripts
window.AdzanApp = {
    updateTime: updateTime,
    loadPrayerTimes: loadPrayerTimes,
    updatePrayerTimeDisplays: updatePrayerTimeDisplays,
    setupCarousel: setupCarousel,
    setupAdminPanel: setupAdminPanel,
    setupQuranVerses: setupQuranVerses,
    setupProfilePicZoom: setupProfilePicZoom
};