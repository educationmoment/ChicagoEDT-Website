function initLunaHero() {
  const video1 = document.getElementById('lunabotics-video-1');
  const video2 = document.getElementById('lunabotics-video-2');
  
  if (!video1 || !video2) {
    console.warn('Lunabotics videos not found');
    return;
  }

  let currentVideo = 1;

  // playing first video
  video1.play().catch(err => console.log('Video autoplay prevented:', err));

  // switch videos
  video1.addEventListener('ended', () => {
    video1.classList.remove('active');
    video2.classList.add('active');
    video2.play();
    currentVideo = 2;
  });

  video2.addEventListener('ended', () => {
    video2.classList.remove('active');
    video1.classList.add('active');
    video1.play();
    currentVideo = 1;
  });

  // pause when hidden (performance)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      video1.pause();
      video2.pause();
    } else {
      if (currentVideo === 1) {
        video1.play();
      } else {
        video2.play();
      }
    }
  });
}