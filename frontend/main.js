const imageUpload = document.getElementById('imageUpload');
const container = document.querySelector('.image-container');
const addMarkerBtn = document.getElementById('addMarker');
const emojiSelect = document.getElementById('emojiSelect');
const loading = document.getElementById('loading');
let uploadedImage;

imageUpload.addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;

    loading.classList.remove('hidden');

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
        // Load face-api.js models
        await faceapi.nets.ssdMobilenetv1.loadFromUri('models');
        await faceapi.nets.faceExpressionNet.loadFromUri('models');

        // Detect faces and expressions before showing the image
        const detections = await faceapi
            .detectAllFaces(uploadedImage)
            .withFaceExpressions();

        container.appendChild(uploadedImage);

        // Scale face detection boxes to the displayed image size
        const scaleX = uploadedImage.clientWidth / uploadedImage.naturalWidth;
        const scaleY = uploadedImage.clientHeight / uploadedImage.naturalHeight;

        // Create emoji markers using detected expressions
        detections.forEach(det => {
            const { x, y, width, height } = det.box;
            const expressions = det.expressions || {};
            const best = Object.keys(expressions).reduce((a, b) =>
                expressions[a] > expressions[b] ? a : b, 'neutral');
            const emojiMap = {
                happy: '😊',
                sad: '😢',
                angry: '😠',
                surprised: '😮',
                disgusted: '🤢',
                fearful: '😱',
                neutral: '😐'
            };
            const emoji = emojiMap[best] || '😊';
            const span = createMarker(
                x * scaleX,
                y * scaleY,
                width * scaleX,
                height * scaleY,
                emoji
            );
            container.appendChild(span);
        });

        loading.classList.add('hidden');
    };
});

addMarkerBtn.addEventListener('click', () => {
    if (!uploadedImage) return;
    const size = 80;
    const x = (uploadedImage.clientWidth - size) / 2;
    const y = (uploadedImage.clientHeight - size) / 2;
    const emoji = emojiSelect.value || '😊';
    const span = createMarker(x, y, size, size, emoji);
    container.appendChild(span);
});

document.getElementById('download').addEventListener('click', () => {
    if (!uploadedImage) return;
    const canvas = document.createElement('canvas');
    canvas.width = uploadedImage.naturalWidth;
    canvas.height = uploadedImage.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(uploadedImage, 0, 0);

    const scaleX = uploadedImage.naturalWidth / uploadedImage.clientWidth;
    const scaleY = uploadedImage.naturalHeight / uploadedImage.clientHeight;

    document.querySelectorAll('.emoji-marker').forEach(span => {
        if (span.classList.contains('dimmed')) return;
        const left = parseFloat(span.style.left);
        const top = parseFloat(span.style.top);
        const width = parseFloat(span.style.width);
        const height = parseFloat(span.style.height);
        const centerX = (left + width / 2) * scaleX;
        const centerY = (top + height / 2) * scaleY;
        const fontSize = height * scaleY;
        ctx.font = `${fontSize}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(span.textContent, centerX, centerY);
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
        el._wasDragged = false;
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
        el._wasDragged = true;
    });

    el.addEventListener('pointerup', e => {
        dragging = false;
        el.releasePointerCapture(e.pointerId);
    });

    el.addEventListener('wheel', e => {
        e.preventDefault();
        let size = parseFloat(el.style.width);
        size += e.deltaY < 0 ? 5 : -5;
        size = Math.max(10, size);
        el.style.width = size + 'px';
        el.style.height = size + 'px';
        el.style.fontSize = size + 'px';
    });
}

function createMarker(x, y, width, height, emoji = '😊') {
    const span = document.createElement('span');
    span.className = 'emoji-marker';
    span.textContent = emoji;
    span.style.left = x + 'px';
    span.style.top = y + 'px';
    span.style.width = width + 'px';
    span.style.height = height + 'px';
    span.style.fontSize = height + 'px';

    span.addEventListener('click', e => {
        e.stopPropagation();
        if (span._wasDragged) {
            span._wasDragged = false;
            return;
        }
        span.classList.toggle('dimmed');
    });

    makeDraggableResizable(span);
    return span;
}