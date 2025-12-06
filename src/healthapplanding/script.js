document.addEventListener('DOMContentLoaded', () => {
    
    // --- Smooth Scroll ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // --- Video Modal Logic ---
    const modal = document.getElementById("video-modal");
    const btn = document.getElementById("open-video-btn");
    const closeBtn = document.getElementsByClassName("close-modal")[0];
    const videoPlayer = document.getElementById("full-video");

    if(btn && modal) {
        // Open Modal
        btn.onclick = function() {
            modal.style.display = "block";
            // Ensure video loads and plays correctly
            videoPlayer.load(); 
            videoPlayer.play(); 
        }

        // Close Modal (X button)
        closeBtn.onclick = function() {
            modal.style.display = "none";
            videoPlayer.pause(); 
            videoPlayer.currentTime = 0; // Reset
        }

        // Close Modal (Click outside)
        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = "none";
                videoPlayer.pause();
                videoPlayer.currentTime = 0;
            }
        }
    }
});