const imageUpload = document.getElementById('imageUpload');
const container = document.querySelector('.image-container');
let uploadedImage;

imageUpload.addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;

    // Upload to Flask and get a data URL
    const form = new FormData();
    form.append('image', file);
    const res = await fetch('/api/upload', { method: 'POST', body: form });
    const { url } = await res.json();

    container.innerHTML = '';
    uploadedImage = new Image();
    uploadedImage.src = url;
    uploadedImage.id = 'uploadedImage';
    uploadedImage.onload = async () => {
        container.appendChild(uploadedImage);

        // Load face-api.js model
        await faceapi.nets.ssdMobilenetv1.loadFromUri('models');

        // Detect faces
        const detections = await faceapi.detectAllFaces(uploadedImage);

        // Create emoji markers
        detections.forEach((det, i) => {
            const { x, y, width, height } = det.box;
            const span = document.createElement('span');
            span.className = 'emoji-marker';
            span.textContent = '😊';
            span.style.left = x + 'px';
            span.style.top = y + 'px';
            span.style.width = width + 'px';
            span.style.height = height + 'px';

            // Toggle visibility
            span.addEventListener('click', e => {
                e.stopPropagation();
                span.style.display = span.style.display === 'none' ? 'flex' : 'none';
            });

            // Enable drag & resize
            makeDraggableResizable(span);

            container.appendChild(span);
        });
    };
});

document.getElementById('download').addEventListener('click', () => {
    if (!uploadedImage) return;
    const canvas = document.createElement('canvas');
    canvas.width = uploadedImage.naturalWidth;
    canvas.height = uploadedImage.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(uploadedImage, 0, 0);

    document.querySelectorAll('.emoji-marker').forEach(span => {
        if (span.style.display === 'none') return;
        const x = parseFloat(span.style.left);
        const y = parseFloat(span.style.top);
        const h = parseFloat(span.style.height);
        ctx.font = `${h}px serif`;
        ctx.textBaseline = 'top';
        ctx.fillText(span.textContent, x, y);
    });

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'masked.png';
    link.click();
});

function makeDraggableResizable(el) {
    let dragging = false;
    let startX, startY, startLeft, startTop;

    el.addEventListener('pointerdown', e => {
        e.stopPropagation();
        dragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startLeft = parseFloat(el.style.left);
        startTop = parseFloat(el.style.top);
        el.setPointerCapture(e.pointerId);
    });

    el.addEventListener('pointermove', e => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        el.style.left = startLeft + dx + 'px';
        el.style.top = startTop + dy + 'px';
    });

    el.addEventListener('pointerup', e => {
        dragging = false;
        el.releasePointerCapture(e.pointerId);
    });
}