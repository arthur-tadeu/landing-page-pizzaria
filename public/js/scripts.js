/* ==========================================================================
   BELLA ITALIA - SCROLL VIDEO SYNC
   Controls video currentTime based on user scroll position.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('scroll-video');
    const heroSection = document.getElementById('hero-section');
    
    if (!video || !heroSection) return;

    let targetTime = 0;
    let isVideoReady = false;

    // Garante que os metadados do vídeo estejam carregados
    video.addEventListener('loadedmetadata', () => {
        isVideoReady = true;
    });

    // Se o vídeo já estiver pronto
    if (video.readyState >= 1) {
        isVideoReady = true;
    }

    // Atualiza o tempo do vídeo suavemente com requestAnimationFrame
    function syncVideoWithScroll() {
        if (!isVideoReady || !video.duration) {
            requestAnimationFrame(syncVideoWithScroll);
            return;
        }

        const rect = heroSection.getBoundingClientRect();
        const sectionHeight = heroSection.offsetHeight - window.innerHeight;
        
        // Calcula quanto da seção já foi rolando (0 a 1)
        const scrollProgress = Math.min(Math.max(-rect.top / sectionHeight, 0), 1);
        
        // Calcula o tempo alvo correspondente no vídeo
        targetTime = scrollProgress * video.duration;

        // Interpolação suave para evitar saltos abruptos no vídeo
        if (Math.abs(video.currentTime - targetTime) > 0.01) {
            video.currentTime += (targetTime - video.currentTime) * 0.15;
        }

        requestAnimationFrame(syncVideoWithScroll);
    }

    // Inicia a sincronização por rAF
    requestAnimationFrame(syncVideoWithScroll);

    // Efeito suave para navegação por clique na Navbar
    document.querySelectorAll('.nav-item').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId && targetId.startsWith('#')) {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
});