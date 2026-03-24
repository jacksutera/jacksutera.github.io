document.addEventListener('DOMContentLoaded', function() {
    initBackgroundAnimation();
    initDragSystem();
});

function initBackgroundAnimation() {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.zIndex = '-1';
    canvas.style.pointerEvents = 'none';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        particles.forEach(particle => {
            if (particle.x > canvas.width) particle.x = canvas.width - 10;
            if (particle.y > canvas.height) particle.y = canvas.height - 10;
            if (particle.x < 0) particle.x = 10;
            if (particle.y < 0) particle.y = 10;
        });
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const particles = [];
    const particleCount = 35;
    const maxSpeed = 0.3;
    const connectionDistance = 120;
    const dotRadius = 1.5;
    const dotColor = 'rgba(40, 201, 113, 0.3)';

    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * maxSpeed * 2,
            vy: (Math.random() - 0.5) * maxSpeed * 2
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;

            if (particle.x <= 0 || particle.x >= canvas.width) {
                particle.vx *= -1;
                particle.x = Math.max(0, Math.min(canvas.width, particle.x));
            }
            if (particle.y <= 0 || particle.y >= canvas.height) {
                particle.vy *= -1;
                particle.y = Math.max(0, Math.min(canvas.height, particle.y));
            }

            ctx.beginPath();
            ctx.arc(particle.x, particle.y, dotRadius, 0, Math.PI * 2);
            ctx.fillStyle = dotColor;
            ctx.fill();
        });

        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < connectionDistance) {
                    const opacity = (1 - distance / connectionDistance) * 0.08;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(40, 201, 113, ${opacity})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(animate);
    }

    animate();
}

function initDragSystem() {
    const artifacts = document.querySelectorAll('.artifact');
    let zCounter = 1;
    let dragState = null;
    const minVisiblePx = 20;

    artifacts.forEach(artifact => {
        let mouseDownPos = null;
        let hasMoved = false;

        artifact.addEventListener('mousedown', function(e) {
            if (e.target.closest('a') && e.target.closest('a') !== artifact) {
                return;
            }

            const rect = artifact.getBoundingClientRect();
            dragState = {
                element: artifact,
                offsetX: e.clientX - rect.left,
                offsetY: e.clientY - rect.top
            };

            mouseDownPos = { x: e.clientX, y: e.clientY };
            hasMoved = false;

            artifact.style.zIndex = ++zCounter;
            artifact.classList.add('dragging');
            artifact.style.transform = 'scale(1.02)';

            e.preventDefault();
        });

        artifact.addEventListener('touchstart', function(e) {
            if (e.target.closest('a') && e.target.closest('a') !== artifact) {
                return;
            }

            const touch = e.touches[0];
            const rect = artifact.getBoundingClientRect();
            dragState = {
                element: artifact,
                offsetX: touch.clientX - rect.left,
                offsetY: touch.clientY - rect.top
            };

            mouseDownPos = { x: touch.clientX, y: touch.clientY };
            hasMoved = false;

            artifact.style.zIndex = ++zCounter;
            artifact.classList.add('dragging');
            artifact.style.transform = 'scale(1.02)';

            e.preventDefault();
        });

        if (artifact.tagName === 'A') {
            artifact.addEventListener('click', function(e) {
                if (hasMoved) {
                    e.preventDefault();
                }
            });
        }

        const parentLink = artifact.parentElement;
        if (parentLink && parentLink.tagName === 'A') {
            parentLink.addEventListener('click', function(e) {
                if (hasMoved) {
                    e.preventDefault();
                }
            });
        }

        artifact.addEventListener('mouseup', function() {
            if (dragState && dragState.element === artifact) {
                artifact.classList.remove('dragging');
                artifact.style.transform = 'scale(1.0)';
                artifact.style.transition = 'transform 0.2s';
                setTimeout(() => {
                    artifact.style.transition = '';
                }, 200);
            }
        });

        artifact.addEventListener('touchend', function() {
            if (dragState && dragState.element === artifact) {
                artifact.classList.remove('dragging');
                artifact.style.transform = 'scale(1.0)';
                artifact.style.transition = 'transform 0.2s';
                setTimeout(() => {
                    artifact.style.transition = '';
                }, 200);
            }
        });
    });

    document.addEventListener('mousemove', function(e) {
        if (!dragState) return;

        const artifact = dragState.element;
        const rect = artifact.getBoundingClientRect();
        const canvas = document.getElementById('canvas') || document.body;
        const canvasRect = canvas.getBoundingClientRect();

        let newLeft = e.clientX - dragState.offsetX;
        let newTop = e.clientY - dragState.offsetY;

        const maxLeft = window.innerWidth - minVisiblePx;
        const maxTop = window.innerHeight - minVisiblePx;
        const minLeft = -(rect.width - minVisiblePx);
        const minTop = -(rect.height - minVisiblePx);

        newLeft = Math.max(minLeft, Math.min(maxLeft, newLeft));
        newTop = Math.max(minTop, Math.min(maxTop, newTop));

        artifact.style.left = newLeft + 'px';
        artifact.style.top = newTop + 'px';

        if (e.clientX !== dragState.startX || e.clientY !== dragState.startY) {
            const moveDistance = Math.sqrt(
                Math.pow(e.clientX - (dragState.startX || e.clientX), 2) +
                Math.pow(e.clientY - (dragState.startY || e.clientY), 2)
            );
            if (moveDistance > 5) {
                artifacts.forEach(art => {
                    if (art === artifact || art.parentElement === artifact || art.contains(artifact)) {
                        const mouseDownPosCheck = { x: e.clientX, y: e.clientY };
                        if (Math.abs(mouseDownPosCheck.x - (dragState.startX || e.clientX)) > 5 ||
                            Math.abs(mouseDownPosCheck.y - (dragState.startY || e.clientY)) > 5) {
                            art.dataset.hasMoved = 'true';
                        }
                    }
                });
            }
        }

        if (!dragState.startX) {
            dragState.startX = e.clientX;
            dragState.startY = e.clientY;
        }

        e.preventDefault();
    });

    document.addEventListener('touchmove', function(e) {
        if (!dragState) return;

        const touch = e.touches[0];
        const artifact = dragState.element;
        const rect = artifact.getBoundingClientRect();

        let newLeft = touch.clientX - dragState.offsetX;
        let newTop = touch.clientY - dragState.offsetY;

        const maxLeft = window.innerWidth - minVisiblePx;
        const maxTop = window.innerHeight - minVisiblePx;
        const minLeft = -(rect.width - minVisiblePx);
        const minTop = -(rect.height - minVisiblePx);

        newLeft = Math.max(minLeft, Math.min(maxLeft, newLeft));
        newTop = Math.max(minTop, Math.min(maxTop, newTop));

        artifact.style.left = newLeft + 'px';
        artifact.style.top = newTop + 'px';

        e.preventDefault();
    });

    document.addEventListener('mouseup', function(e) {
        if (dragState) {
            const artifact = dragState.element;
            const moveDistance = dragState.startX && dragState.startY ? Math.sqrt(
                Math.pow(e.clientX - dragState.startX, 2) +
                Math.pow(e.clientY - dragState.startY, 2)
            ) : 0;

            if (moveDistance > 5) {
                artifacts.forEach(art => {
                    if (art === artifact || art.contains(artifact)) {
                        let current = art;
                        while (current) {
                            if (current.tagName === 'A') {
                                current.dataset.dragMoved = 'true';
                                setTimeout(() => {
                                    delete current.dataset.dragMoved;
                                }, 100);
                            }
                            current = current.parentElement;
                        }
                    }
                });
            }

            artifact.classList.remove('dragging');
            artifact.style.transform = 'scale(1.0)';
            artifact.style.transition = 'transform 0.2s';
            setTimeout(() => {
                artifact.style.transition = '';
            }, 200);

            dragState = null;
        }
    });

    document.addEventListener('touchend', function() {
        if (dragState) {
            const artifact = dragState.element;
            artifact.classList.remove('dragging');
            artifact.style.transform = 'scale(1.0)';
            artifact.style.transition = 'transform 0.2s';
            setTimeout(() => {
                artifact.style.transition = '';
            }, 200);

            dragState = null;
        }
    });

    artifacts.forEach(artifact => {
        if (artifact.tagName === 'A') {
            artifact.addEventListener('click', function(e) {
                if (artifact.dataset.dragMoved === 'true') {
                    e.preventDefault();
                }
            });
        }
    });
}
