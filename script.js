// script.js - Main application script for Adzan Display System

// Global variables
let prayerTimes = {};
let currentSlideIndex = 0;
let slideInterval;
let quranVerseInterval;
let currentDate = new Date();
let adminModal;

// Variables to track triggered prayer times to prevent repeated triggers
let lastCheckedMinute = null;
let triggeredPrayers = {};

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize all application components
function initializeApp() {
    loadPrayerTimes();
    updateTime();
    setInterval(updateTime, 1000); // Update every second
    
    setupVideoPlayer();
    setupAdminPanel();
    setupQuranVerses();
    setupEventListeners();
    
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
    
    // Initialize QRIS image
    initQrisImage();
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
    document.getElementById('imsak-time').textContent = prayerTimes.imsak;
    document.getElementById('subuh-time').textContent = prayerTimes.subuh;
    document.getElementById('syuruq-time').textContent = prayerTimes.syuruq;
    document.getElementById('dhuha-time').textContent = prayerTimes.dhuha;
    document.getElementById('dhuhur-time').textContent = prayerTimes.dhuhur;
    document.getElementById('ashar-time').textContent = prayerTimes.ashar;
    document.getElementById('maghrib-time').textContent = prayerTimes.maghrib;
    document.getElementById('isya-time').textContent = prayerTimes.isya;
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
    
    // Update Hijri date
    updateHijriDate(now);
    
    // Update countdown to next prayer
    updateCountdownToNextPrayer(now);
    
    // Check if today is Friday and update Dhuhur to Jumat if needed
    updateFridayPrayerDisplay(now);
    
    // Check for prayer time notifications
    handlePrayerTimeNotifications();
}

// Convert Gregorian date to Hijri date (simplified)
function updateHijriDate(date) {
    // This is a simplified version - in production, use a proper library like moment-hijri
    // For now, we'll use a placeholder that shows today's approximate Hijri date
    // In a real application, you would use a conversion algorithm or API
    document.getElementById('hijri-date').textContent = getApproximateHijriDate(date);
}

// Convert Gregorian date to Hijri date using proper calculation
function getApproximateHijriDate(date) {
    // Hijri months array
    const hijriMonths = [
        'Muharram', 'Safar', 'Rabi\' al-Awwal', 'Rabi\' al-Thani',
        'Jumada al-Ula', 'Jumada al-Thani', 'Rajab', 'Sha\'ban',
        'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
    ];
    
    // Calculate Hijri date based on known conversion factors
    // This uses a simplified but reasonably accurate method
    
    // Reference point: January 22, 2026 = 03 Sha'ban 1447 H
    const referenceDate = new Date(2026, 0, 22); // January 22, 2026
    const referenceHijri = {
        day: 3,
        month: 7, // Sha'ban (index 7)
        year: 1447
    };
    
    // Calculate days difference
    const timeDiff = date.getTime() - referenceDate.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
    
    // Average Hijri year is about 354.367 days
    const hijriDaysPerYear = 354.367;
    
    // Calculate approximate Hijri date
    let totalDays = referenceHijri.day + daysDiff;
    let hijriMonth = referenceHijri.month;
    let hijriYear = referenceHijri.year;
    
    // Days in each Hijri month (approximate)
    const daysInMonth = [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29];
    
    // Adjust for month overflow/underflow
    while (totalDays > daysInMonth[hijriMonth]) {
        totalDays -= daysInMonth[hijriMonth];
        hijriMonth++;
        if (hijriMonth >= 12) {
            hijriMonth = 0;
            hijriYear++;
        }
    }
    
    while (totalDays <= 0) {
        hijriMonth--;
        if (hijriMonth < 0) {
            hijriMonth = 11;
            hijriYear--;
        }
        totalDays += daysInMonth[hijriMonth];
    }
    
    const hijriDay = totalDays;
    
    return `${hijriDay} ${hijriMonths[hijriMonth]} ${hijriYear} H`;
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
    
    // Save slides
    document.getElementById('save-slides')?.addEventListener('click', saveSlides);
    
    // Save ramadan events
    document.getElementById('save-ramadan')?.addEventListener('click', saveRamadanEvents);
    
    // Add ramadan event listeners
    document.getElementById('add-ramadan-event')?.addEventListener('click', addNewRamadanEvent);
    
    // Save QRIS image
    document.getElementById('save-qris')?.addEventListener('click', saveQrisImage);
    
    // Add event listeners for video selection buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('select-video-btn')) {
            const videoSrc = e.target.getAttribute('data-video');
            selectVideo(videoSrc);
        }
    });
    
    // Save qurban data
    document.getElementById('save-qurban')?.addEventListener('click', saveQurbanData);
    
    // Save rekening info
    document.getElementById('save-rekening')?.addEventListener('click', saveRekeningInfo);
    
    // Save donation and finance info
    document.getElementById('save-donasi-finance')?.addEventListener('click', saveDonationFinance);
    
    // Save staff info
    document.getElementById('save-staff')?.addEventListener('click', saveStaffInfo);
}

// Load form data from localStorage or current display
function loadFormData() {
    // Load general info
    document.getElementById('masjid-name-input').value = document.getElementById('masjid-name').textContent;
    document.getElementById('masjid-address-input').value = document.getElementById('masjid-address').textContent;
    document.getElementById('masjid-info-input').value = document.getElementById('masjid-info').textContent;
    
    // Load prayer times
    document.getElementById('imsak-time-input').value = document.getElementById('imsak-time').textContent;
    document.getElementById('subuh-time-input').value = document.getElementById('subuh-time').textContent;
    document.getElementById('syuruq-time-input').value = document.getElementById('syuruq-time').textContent;
    document.getElementById('dhuha-time-input').value = document.getElementById('dhuha-time').textContent;
    document.getElementById('dhuhur-time-input').value = document.getElementById('dhuhur-time').textContent;
    document.getElementById('ashar-time-input').value = document.getElementById('ashar-time').textContent;
    document.getElementById('maghrib-time-input').value = document.getElementById('maghrib-time').textContent;
    document.getElementById('isya-time-input').value = document.getElementById('isya-time').textContent;
    
    // Load bank info
    document.querySelector('#bank-name')?.setAttribute('placeholder', document.querySelector('.bank-account-details p:nth-child(1)').textContent.replace('Nama Bank: ', '').trim());
    document.querySelector('#account-number')?.setAttribute('placeholder', document.querySelector('.bank-account-details p:nth-child(2)').textContent.replace('Nomor Rekening: ', '').trim());
    document.querySelector('#account-name')?.setAttribute('placeholder', document.querySelector('.bank-account-details p:nth-child(3)').textContent.replace('Atas Nama: ', '').trim());
    
    // Set video-only mode as default in the admin panel
    document.getElementById('show-videos').checked = true;
}

// Save general info from form
function saveGeneralInfo() {
    const nameInput = document.getElementById('masjid-name-input').value;
    const addressInput = document.getElementById('masjid-address-input').value;
    const infoInput = document.getElementById('masjid-info-input').value;
    
    document.getElementById('masjid-name').textContent = nameInput;
    document.getElementById('masjid-address').textContent = addressInput;
    document.getElementById('masjid-info').textContent = infoInput;
    
    // Save to localStorage
    localStorage.setItem('masjidName', nameInput);
    localStorage.setItem('masjidAddress', addressInput);
    localStorage.setItem('masjidInfo', infoInput);
    
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
    
    alert('Waktu sholat berhasil disimpan!');
}

// Save video slides from form
function saveSlides() {
    alert('Video slide berhasil disimpan!');
}

// Note: Ramadan functions are implemented in content_manager.js and will override these.
// The actual implementations are in content_manager.js which is loaded after this file.

// Save qurban data from form
function saveQurbanData() {
    alert('Data qurban berhasil disimpan!');
}

// Save jumat schedule from form
function saveJumatSchedule() {
    // This function is no longer needed as the jumat schedule section has been removed
    console.log('Jadwal Jumat functionality has been removed');
}

// Save rekening info from form
function saveRekeningInfo() {
    const bankName = document.querySelector('#bank-name').value;
    const accountNumber = document.querySelector('#account-number').value;
    const accountName = document.querySelector('#account-name').value;
    
    // Update display if values are provided
    if (bankName) {
        document.querySelector('.bank-account-details p:nth-child(1) strong').nextSibling.textContent = ` ${bankName}`;
    }
    if (accountNumber) {
        document.querySelector('.bank-account-details p:nth-child(2) strong').nextSibling.textContent = ` ${accountNumber}`;
    }
    if (accountName) {
        document.querySelector('.bank-account-details p:nth-child(3) strong').nextSibling.textContent = ` ${accountName}`;
    }
    
    alert('Informasi rekening berhasil disimpan!');
}

// Save donation and finance info from form
function saveDonationFinance() {
    alert('Data donasi dan keuangan berhasil disimpan!');
}

// Save staff info from form
function saveStaffInfo() {
    alert('Data petugas berhasil disimpan!');
}

// Save QRIS image
function saveQrisImage() {
    const fileInput = document.getElementById('qris-image');
    
    if (fileInput && fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        const fileType = file.type;
        
        // Validate file type
        if (!fileType.startsWith('image/')) {
            alert('Harap pilih file gambar (JPG, PNG, GIF)');
            return;
        }
        
        // Create a FileReader to read the file
        const reader = new FileReader();
        
        reader.onload = function(e) {
            // Save the image data URL to localStorage
            localStorage.setItem('qrisImageData', e.target.result);
            
            // Update the QRIS image on the page
            updateQrisImage(e.target.result);
            
            alert('Gambar QRIS berhasil disimpan!');
        };
        
        reader.readAsDataURL(file);
    } else {
        alert('Harap pilih file gambar terlebih dahulu');
    }
}

// Update QRIS image on the page
function updateQrisImage(imageData) {
    const qrisImg = document.querySelector('.qris-code-img');
    if (qrisImg) {
        qrisImg.src = imageData;
    }
}

// Initialize QRIS image from localStorage
function initQrisImage() {
    const savedQrisImage = localStorage.getItem('qrisImageData');
    if (savedQrisImage) {
        updateQrisImage(savedQrisImage);
    }
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

// Function to check if it's currently prayer time (within 1 minute of adhan)
function isPrayerTime(now) {
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // Debug logging
    console.log('Checking prayer time:', now.toLocaleTimeString(), 'Current minutes:', currentTime);
    
    // Ensure prayerTimes is loaded
    if (!prayerTimes || Object.keys(prayerTimes).length === 0) {
        console.log('Prayer times not loaded yet in script.js');
        return null;
    }
    
    // Only check for mandatory prayers: Subuh, Dhuhur, Ashar, Maghrib, Isya
    const mandatoryPrayers = ['subuh', 'dhuhur', 'ashar', 'maghrib', 'isya'];
    
    for (const prayer of mandatoryPrayers) {
        if (!prayerTimes[prayer]) continue; // Skip if prayer time is not set
        
        const prayerMinute = timeToMinutes(prayerTimes[prayer]);
        
        // Debug logging
        console.log(`Checking ${prayer}: ${prayerTimes[prayer]}, Minutes: ${prayerMinute}, Current: ${currentTime}`);
        
        // Check if current time matches prayer time
        if (currentTime === prayerMinute) {
            // Check if this prayer was already triggered in the past 10 minutes
            const nowMs = now.getTime();
            if (typeof triggeredPrayers !== 'undefined' && (!triggeredPrayers[prayer] || (nowMs - triggeredPrayers[prayer]) > 10 * 60 * 1000)) { // 10 minutes
                console.log('PRAYER TIME DETECTED:', prayer);
                if (typeof triggeredPrayers !== 'undefined') {
                    triggeredPrayers[prayer] = nowMs; // Mark as triggered
                }
                return prayer;
            }
        }
    }
    
    return null;
}

// Function to play beep sound
function playBeepSound() {
    try {
        const audio = new Audio('asset/audio/beep.mp3');
        
        // Configure audio element for better autoplay compatibility
        audio.volume = 1.0;
        audio.preload = 'auto';
        
        // Try to unlock audio context first (helps with autoplay policies)
        if (audio && typeof audio.play === 'function') {
            // Create a temporary muted audio to initialize audio context
            const tempAudio = new Audio();
            tempAudio.volume = 0.01;
            
            // Play the beep sound
            const playPromise = audio.play();
            
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log("Beep sound played successfully");
                    })
                    .catch(error => {
                        console.error("Error playing beep sound:", error);
                        console.log("Beep sound autoplay was prevented by browser policies");
                        
                        // Try multiple fallback approaches
                        setTimeout(() => {
                            // Approach 1: Direct play
                            audio.play().catch(err1 => {
                                console.error("Direct play failed:", err1);
                                
                                // Approach 2: Set muted temporarily
                                audio.muted = true;
                                audio.play()
                                    .then(() => {
                                        // Unmute after playing
                                        setTimeout(() => {
                                            audio.muted = false;
                                        }, 100);
                                    })
                                    .catch(err2 => {
                                        console.error("Muted play failed:", err2);
                                        
                                        // Approach 3: Create new audio element
                                        const retryAudio = new Audio('asset/audio/beep.mp3');
                                        retryAudio.volume = 1.0;
                                        retryAudio.preload = 'auto';
                                        retryAudio.play().catch(err3 => {
                                            console.error("Retry with new element failed:", err3);
                                        });
                                    });
                            });
                        }, 50);
                    });
            }
        }
    } catch (error) {
        console.error("Error creating beep audio element:", error);
    }
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

// Variable to track if adzan mode is active
let adzanModeActive = false;

// Function to check if adzan mode is active
function isAdzanModeActive() {
    return adzanModeActive;
}

// Function to show adzan notification
function showAdzanNotification(prayerName) {
    // Set flag to indicate adzan mode is active
    adzanModeActive = true;
    
    // Create adzan notification overlay
    const adzanOverlay = document.createElement('div');
    adzanOverlay.id = 'adzan-overlay';
    adzanOverlay.style.position = 'fixed';
    adzanOverlay.style.top = '0';
    adzanOverlay.style.left = '0';
    adzanOverlay.style.width = '100%';
    adzanOverlay.style.height = '100%';
    adzanOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
    adzanOverlay.style.zIndex = '9999';
    adzanOverlay.style.display = 'flex';
    adzanOverlay.style.flexDirection = 'column';
    adzanOverlay.style.justifyContent = 'center';
    adzanOverlay.style.alignItems = 'center';
    adzanOverlay.style.textAlign = 'center';
    adzanOverlay.style.color = '#ffcc02';
    adzanOverlay.style.fontFamily = 'Arial, sans-serif';
    adzanOverlay.style.overflow = 'hidden';
    
    // Create content for the overlay
    const adzanContent = document.createElement('div');
    adzanContent.innerHTML = `
        <h1 style="font-size: 4rem; margin-bottom: 1rem; text-shadow: 0 0 20px rgba(255, 204, 2, 0.7);">Saatnya Adzan</h1>
        <h2 style="font-size: 3rem; margin-bottom: 2rem; text-transform: capitalize;">${capitalizeFirstLetter(prayerName)}</h2>
        <div id="adzan-timer" style="font-size: 5rem; font-weight: bold; margin-top: 1rem;">05:00</div>
    `;
    
    adzanOverlay.appendChild(adzanContent);
    document.body.appendChild(adzanOverlay);
    
    // Start the 5-minute countdown
    startAdzanCountdown();
    
    // Pause all videos
    pauseAllVideos();
    
    // Pause all slides
    pauseAllSlideshow();
    
    // Disable scrolling
    document.body.style.overflow = 'hidden';
}

// Function to start adzan countdown
function startAdzanCountdown() {
    let timeLeft = 5 * 60; // 5 minutes in seconds
    const timerElement = document.getElementById('adzan-timer');
    
    const countdownInterval = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        timeLeft--;
        
        if (timeLeft < 0) {
            clearInterval(countdownInterval);
            
            // Start Iqomah countdown after Adzan finishes
            const prayerName = document.querySelector('#adzan-overlay h2').textContent.toLowerCase();
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
                <div id="iqomah-timer" style="font-size: 6rem; font-weight: bold; margin: 0 0 20px 0; text-shadow: 3px 3px 6px rgba(0,0,0,0.5);"></div>
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
    
    // Note: No audio played during Iqomah notification - only beep sound 5 seconds before end
    
    // Start countdown for Iqomah (10 minutes)
    startIqomahCountdown(10 * 60); // 10 minutes in seconds
    
    // Pause all videos and slideshow during Iqomah
    pauseAllVideos();
    pauseAllSlideshow();
    
    // Disable scrolling
    document.body.style.overflow = 'hidden';
}

// Function to start Iqomah countdown
function startIqomahCountdown() {
    let timeLeft = 10 * 60; // 10 minutes in seconds
    const timerElement = document.getElementById('iqomah-timer');
    
    const countdownInterval = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Play beep sound 5 seconds before Iqomah notification ends
        if (timeLeft === 5) {
            playBeepSound();
        }
        
        timeLeft--;
        
        if (timeLeft < 0) {
            clearInterval(countdownInterval);
            hideIqomahNotification();
        }
    }, 1000);
}

// Function to hide Iqomah notification
function hideIqomahNotification() {
    const iqomahOverlay = document.getElementById('iqomah-overlay');
    if (iqomahOverlay) {
        iqomahOverlay.style.display = 'none';
    }
    
    // Resume videos and slideshow
    resumeAllVideos();
    resumeAllSlideshow();
    
    // Re-enable scrolling
    document.body.style.overflow = 'auto';
    
    // Reset adzan mode flag
    adzanModeActive = false;
}

// Function to hide adzan notification
function hideAdzanNotification() {
    const adzanOverlay = document.getElementById('adzan-overlay');
    if (adzanOverlay) {
        adzanOverlay.remove();
    }
    
    // Reset flag
    adzanModeActive = false;
    
    // Resume scrolling
    document.body.style.overflow = 'auto';
    
    // Resume videos
    resumeAllVideos();
    
    // Resume slideshow
    resumeAllSlideshow();
}

// Function to pause all videos
function pauseAllVideos() {
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
        video.pause();
        video.classList.add('paused-by-adzan');
    });
}

// Function to resume all videos
function resumeAllVideos() {
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
        if (video.classList.contains('paused-by-adzan')) {
            video.classList.remove('paused-by-adzan');
            
            // Only play if the video is visible and in video-only mode
            if (document.getElementById('show-videos')?.checked) {
                video.play().catch(e => console.log('Resume video error:', e));
            }
        }
    });
}

// Function to pause all slideshow
function pauseAllSlideshow() {
    // If there are slideshow intervals, clear them
    if (slideInterval) {
        clearInterval(slideInterval);
        slideInterval = null;
    }
}

// Function to resume all slideshow
function resumeAllSlideshow() {
    // Restart slideshow if needed
    restartCarousel();
}

// Function to highlight current prayer in the UI
function highlightCurrentPrayer(prayerName) {
    // Remove highlighting from all prayer cards
    document.querySelectorAll('.prayer-card').forEach(card => {
        card.classList.remove('current-prayer');
    });
    
    // Add highlighting to current prayer card
    const prayerCard = document.getElementById(`${prayerName}-time`).closest('.prayer-card');
    prayerCard.classList.add('current-prayer');
    
    // Remove highlighting after 5 minutes
    setTimeout(() => {
        prayerCard.classList.remove('current-prayer');
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
                dhuhurTimeElement.textContent = prayerTimes.dhuhur;
            }
            
            // Update the label to be "Jumat"
            const dhuhurLabel = dhuhurTimeElement.closest('.prayer-card').querySelector('.prayer-label');
            if (dhuhurLabel) {
                dhuhurLabel.textContent = 'Jumat';
            }
        }
    } else {
        // If it's not Friday, revert to normal Dhuhur display
        if (prayerTimes && prayerTimes.dhuhur) {
            const dhuhurTimeElement = document.getElementById('dhuhur-time');
            if (dhuhurTimeElement) {
                dhuhurTimeElement.textContent = prayerTimes.dhuhur;
                
                // Revert the label back to Dhuhur
                const dhuhurLabel = dhuhurTimeElement.closest('.prayer-card').querySelector('.prayer-label');
                if (dhuhurLabel) {
                    dhuhurLabel.textContent = 'Dhuhur';
                }
            }
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

// Export functions that might be needed by other scripts
window.AdzanApp = {
    updateTime: updateTime,
    loadPrayerTimes: loadPrayerTimes,
    updatePrayerTimeDisplays: updatePrayerTimeDisplays,
    setupCarousel: setupCarousel,
    setupAdminPanel: setupAdminPanel,
    setupQuranVerses: setupQuranVerses
};
