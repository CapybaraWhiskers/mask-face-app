const imageUpload = document.getElementById('imageUpload');
const container = document.querySelector('.image-container');
const addMarkerBtn = document.getElementById('addMarker');
const loading = document.getElementById('loading');
const maskTypeSelector = document.getElementById('maskType');
const mosaicSizeInput = document.getElementById('mosaicSize');
const emojiSelector = document.getElementById('emojiSelector');
let maskType = maskTypeSelector ? maskTypeSelector.value : 'emoji';
let mosaicSize = mosaicSizeInput ? parseInt(mosaicSizeInput.value) : 10;
let uploadedImage;

if (maskType === 'mosaic') {
    if (mosaicSizeInput) {
        mosaicSizeInput.style.display = 'inline-block';
    }
    if (emojiSelector) {
        emojiSelector.style.display = 'none';
    }
} else {
    if (emojiSelector) {
        emojiSelector.style.display = 'inline-block';
    }
}

const expressionEmojiMap = {
    angry: '😠',
    disgusted: '🤢',
    fearful: '😨',
    happy: '😄',
    neutral: '😐',
    sad: '😢',
    surprised: '😮'
};

if (maskTypeSelector) {
    maskTypeSelector.addEventListener('change', () => {
        maskType = maskTypeSelector.value;
        if (maskType === 'mosaic') {
            mosaicSizeInput.style.display = 'inline-block';
            if (emojiSelector) {
                emojiSelector.style.display = 'none';
            }
        } else {
            mosaicSizeInput.style.display = 'none';
            if (emojiSelector) {
                emojiSelector.style.display = 'inline-block';
            }
        }
    });
}

if (mosaicSizeInput) {
    mosaicSizeInput.addEventListener('input', () => {
        mosaicSize = parseInt(mosaicSizeInput.value);
        document.querySelectorAll('.mosaic-marker').forEach(el => {
            el.dataset.pixel = mosaicSize;
            drawMosaicCanvas(el);
        });
    });
}

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

        // Detect faces with expression info before showing the image
        const detections = await faceapi
            .detectAllFaces(uploadedImage)
            .withFaceExpressions();

        container.appendChild(uploadedImage);

        // Scale face detection boxes to the displayed image size
        const scaleX = uploadedImage.clientWidth / uploadedImage.naturalWidth;
        const scaleY = uploadedImage.clientHeight / uploadedImage.naturalHeight;

        // Create markers
        detections.forEach(det => {
            const { x, y, width, height } = det.detection.box;
            if (maskType === 'mosaic') {
                const mosaic = createMosaicMarker(
                    x * scaleX,
                    y * scaleY,
                    width * scaleX,
                    height * scaleY,
                    mosaicSize
                );
                container.appendChild(mosaic);
            } else {
                const expressions = det.expressions;
                const best = Object.keys(expressions).reduce((a, b) =>
                    expressions[a] > expressions[b] ? a : b);
                const emoji = expressionEmojiMap[best] || '😊';
                const span = createMarker(
                    x * scaleX,
                    y * scaleY,
                    width * scaleX,
                    height * scaleY,
                    emoji
                );
                container.appendChild(span);
            }
        });

        loading.classList.add('hidden');
    };
});

addMarkerBtn.addEventListener('click', () => {
    if (!uploadedImage) return;
    const size = 80;
    const x = (uploadedImage.clientWidth - size) / 2;
    const y = (uploadedImage.clientHeight - size) / 2;
    if (maskType === 'mosaic') {
        const mosaic = createMosaicMarker(x, y, size, size, mosaicSize);
        container.appendChild(mosaic);
    } else {
        const selector = document.getElementById('emojiSelector');
        const emoji = selector ? selector.value : '😊';
        const span = createMarker(x, y, size, size, emoji);
        container.appendChild(span);
    }
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

    document.querySelectorAll('.mosaic-marker').forEach(div => {
        if (div.classList.contains('dimmed')) return;
        const left = parseFloat(div.style.left);
        const top = parseFloat(div.style.top);
        const width = parseFloat(div.style.width);
        const height = parseFloat(div.style.height);
        const pixel = parseInt(div.dataset.pixel);
        drawMosaic(ctx, left * scaleX, top * scaleY, width * scaleX, height * scaleY, pixel);
    });

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'masked.png';
    link.click();
});

function makeDraggableResizable(el, onUpdate) {
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
        if (onUpdate) onUpdate(el);
    });

    const SIZE_STEP = 5;
    el.addEventListener('wheel', e => {
        e.preventDefault();
        let size = parseFloat(el.style.width);
        size += Math.sign(e.deltaY) * -SIZE_STEP;
        size = Math.max(10, size);
        el.style.width = size + 'px';
        el.style.height = size + 'px';
        el.style.fontSize = size + 'px';
        if (onUpdate) onUpdate(el);
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

function drawMosaic(ctx, sx, sy, sw, sh, pixel) {
    const tmpW = Math.max(1, Math.floor(sw / pixel));
    const tmpH = Math.max(1, Math.floor(sh / pixel));
    const tmp = document.createElement('canvas');
    tmp.width = tmpW;
    tmp.height = tmpH;
    const tctx = tmp.getContext('2d');
    tctx.drawImage(uploadedImage, sx, sy, sw, sh, 0, 0, tmpW, tmpH);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tmp, 0, 0, tmpW, tmpH, sx, sy, sw, sh);
}

function drawMosaicCanvas(canvas) {
    if (!uploadedImage) return;
    const pixel = parseInt(canvas.dataset.pixel);
    const scaleX = uploadedImage.naturalWidth / uploadedImage.clientWidth;
    const scaleY = uploadedImage.naturalHeight / uploadedImage.clientHeight;
    const left = parseFloat(canvas.style.left);
    const top = parseFloat(canvas.style.top);
    const width = parseFloat(canvas.style.width);
    const height = parseFloat(canvas.style.height);
    const sx = left * scaleX;
    const sy = top * scaleY;
    const sw = width * scaleX;
    const sh = height * scaleY;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);
    const tmpW = Math.max(1, Math.floor(sw / pixel));
    const tmpH = Math.max(1, Math.floor(sh / pixel));
    const tmp = document.createElement('canvas');
    tmp.width = tmpW;
    tmp.height = tmpH;
    const tctx = tmp.getContext('2d');
    tctx.drawImage(uploadedImage, sx, sy, sw, sh, 0, 0, tmpW, tmpH);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tmp, 0, 0, tmpW, tmpH, 0, 0, width, height);
}

function createMosaicMarker(x, y, width, height, pixel = 10) {
    const canvas = document.createElement('canvas');
    canvas.className = 'mosaic-marker';
    canvas.style.left = x + 'px';
    canvas.style.top = y + 'px';
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    canvas.dataset.pixel = pixel;
    drawMosaicCanvas(canvas);
    canvas.addEventListener('click', e => {
        e.stopPropagation();
        if (canvas._wasDragged) {
            canvas._wasDragged = false;
            return;
        }
        canvas.classList.toggle('dimmed');
    });

    makeDraggableResizable(canvas, drawMosaicCanvas);
    return canvas;
}