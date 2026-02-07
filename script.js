// Canvas and context
const canvas = document.getElementById('memeCanvas');
const ctx = canvas.getContext('2d');

// UI elements
const imageUpload = document.getElementById('imageUpload');
const topTextInput = document.getElementById('topText');
const bottomTextInput = document.getElementById('bottomText');
const fontSizeSlider = document.getElementById('fontSize');
const fontSizeValue = document.getElementById('fontSizeValue');
const fontFamilySelect = document.getElementById('fontFamily');
const textColorInput = document.getElementById('textColor');
const downloadBtn = document.getElementById('downloadBtn');
const fileName = document.getElementById('fileName');

// Zoom elements
const zoomInBtn = document.getElementById('zoomIn');
const zoomOutBtn = document.getElementById('zoomOut');
const zoomResetBtn = document.getElementById('zoomReset');
const zoomLevelDisplay = document.getElementById('zoomLevel');
const canvasContainer = document.getElementById('canvasContainer');
const canvasZoomWrapper = document.getElementById('canvasZoomWrapper');

// State
let image = null;
let fontSize = 40;
let fontFamily = 'Impact';
let textColor = '#FFFFFF';
let selectedTemplate = null;
let topTextX = null;
let topTextY = null;
let bottomTextX = null;
let bottomTextY = null;
let dragging = null; // 'top', 'bottom', or null
let dragOffsetX = 0;
let dragOffsetY = 0;
let zoomLevel = 1;
const ZOOM_STEP = 0.25;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 4;

// Template images from assets folder
const templates = [
    { name: 'Template 1', path: 'assets/30b1gx.jpg' },
    { name: 'Template 2', path: 'assets/best-meme-templates-04.avif' },
    { name: 'Template 3', path: 'assets/images.jpg' },
    { name: 'Template 4', path: 'assets/IMG_7501 (1).jpg' },
    { name: 'Template 5', path: 'assets/IMG_7501.jpg' }
];

// Initialize canvas
canvas.width = 600;
canvas.height = 400;

// ============================================
// TEMPLATE SELECTION
// ============================================
function loadTemplates() {
    const templateGrid = document.getElementById('templateGrid');
    
    templates.forEach((template, index) => {
        const templateItem = document.createElement('div');
        templateItem.className = 'template-item';
        templateItem.dataset.index = index;
        
        const img = document.createElement('img');
        img.src = template.path;
        img.alt = template.name;
        img.onerror = () => {
            templateItem.style.display = 'none';
        };
        
        templateItem.appendChild(img);
        templateItem.addEventListener('click', () => selectTemplate(template, templateItem));
        
        templateGrid.appendChild(templateItem);
    });
}

function selectTemplate(template, element) {
    // Remove previous selection
    document.querySelectorAll('.template-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Add selection to clicked item
    element.classList.add('selected');
    selectedTemplate = template;
    
    // Clear file input
    imageUpload.value = '';
    fileName.textContent = '';
    
    // Reset text positions
    topTextX = null;
    topTextY = null;
    bottomTextX = null;
    bottomTextY = null;
    
    // Load template image
    const img = new Image();
    img.onload = () => {
        image = img;
        drawCanvas();
        downloadBtn.disabled = false;
    };
    img.onerror = () => {
        alert('Error loading template image.');
    };
    img.src = template.path;
}

// Initialize templates on page load
loadTemplates();

// ============================================
// IMAGE UPLOAD HANDLING
// ============================================
imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file.');
        return;
    }
    
    // Clear template selection
    document.querySelectorAll('.template-item').forEach(item => {
        item.classList.remove('selected');
    });
    selectedTemplate = null;
    
    // Reset text positions
    topTextX = null;
    topTextY = null;
    bottomTextX = null;
    bottomTextY = null;
    
    fileName.textContent = file.name;
    const reader = new FileReader();
    
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            image = img;
            drawCanvas();
            downloadBtn.disabled = false;
        };
        img.onerror = () => {
            alert('Error loading image. Please try another file.');
        };
        img.src = event.target.result;
    };
    
    reader.onerror = () => {
        alert('Error reading file. Please try again.');
    };
    
    reader.readAsDataURL(file);
});

// ============================================
// FONT SIZE CONTROL
// ============================================
fontSizeSlider.addEventListener('input', (e) => {
    fontSize = parseInt(e.target.value);
    fontSizeValue.textContent = fontSize;
    drawCanvas();
});

// ============================================
// FONT FAMILY CONTROL
// ============================================
fontFamilySelect.addEventListener('change', (e) => {
    fontFamily = e.target.value;
    drawCanvas();
});

// ============================================
// TEXT COLOR CONTROL
// ============================================
textColorInput.addEventListener('input', (e) => {
    textColor = e.target.value;
    drawCanvas();
});

// ============================================
// ZOOM CONTROLS
// ============================================
function updateZoom() {
    canvas.style.transform = `scale(${zoomLevel})`;
    // Update wrapper size so the scroll container knows the content size
    canvasZoomWrapper.style.width = (canvas.width * zoomLevel) + 'px';
    canvasZoomWrapper.style.height = (canvas.height * zoomLevel) + 'px';
    zoomLevelDisplay.textContent = Math.round(zoomLevel * 100) + '%';
}

zoomInBtn.addEventListener('click', () => {
    if (zoomLevel < ZOOM_MAX) {
        zoomLevel = Math.min(ZOOM_MAX, Math.round((zoomLevel + ZOOM_STEP) * 100) / 100);
        updateZoom();
    }
});

zoomOutBtn.addEventListener('click', () => {
    if (zoomLevel > ZOOM_MIN) {
        zoomLevel = Math.max(ZOOM_MIN, Math.round((zoomLevel - ZOOM_STEP) * 100) / 100);
        updateZoom();
    }
});

zoomResetBtn.addEventListener('click', () => {
    zoomLevel = 1;
    updateZoom();
});

// Mouse wheel zoom (Ctrl+scroll)
canvasContainer.addEventListener('wheel', (e) => {
    if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
        const newZoom = Math.round((zoomLevel + delta) * 100) / 100;
        zoomLevel = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, newZoom));
        updateZoom();
    }
}, { passive: false });

// ============================================
// TEXT INPUT HANDLERS
// ============================================
topTextInput.addEventListener('input', () => {
    // Initialize position if not set
    const topText = topTextInput.value.trim();
    if (topText && (topTextX === null || topTextY === null)) {
        topTextX = canvas.width / 2;
        topTextY = 20;
    }
    if (!topText) {
        topTextX = null;
        topTextY = null;
    }
    drawCanvas();
});

bottomTextInput.addEventListener('input', () => {
    // Initialize position if not set
    const bottomText = bottomTextInput.value.trim();
    if (bottomText && (bottomTextX === null || bottomTextY === null)) {
        const textHeight = getTextHeight(bottomText);
        bottomTextX = canvas.width / 2;
        bottomTextY = canvas.height - textHeight - 20;
    }
    if (!bottomText) {
        bottomTextX = null;
        bottomTextY = null;
    }
    drawCanvas();
});

// ============================================
// TEXT RENDERING FUNCTIONS
// ============================================

/**
 * Calculate the height of text when wrapped (without drawing)
 * @param {string} text - The text to measure
 * @returns {number} - Total height in pixels
 */
function getTextHeight(text) {
    if (!text) return 0;
    
    ctx.font = `${fontSize}px ${fontFamily}`;
    const maxWidth = canvas.width - 40;
    const words = text.split(' ');
    let line = '';
    let lineCount = 1;

    for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;

        if (testWidth > maxWidth && i > 0) {
            lineCount++;
            line = words[i] + ' ';
        } else {
            line = testLine;
        }
    }
    
    return lineCount * (fontSize + 10) - 10;
}

/**
 * Draw text on canvas with white fill and black stroke
 * @param {string} text - The text to draw
 * @param {number} x - X position (center point)
 * @param {number} y - Y position (top point)
 */
function drawText(text, x, y) {
    if (!text) return;

    // Set font properties
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    // Calculate text wrapping
    const maxWidth = canvas.width - 40;
    const words = text.split(' ');
    let line = '';
    let lineY = y;
    let lines = [];

    // Wrap text if it exceeds max width
    for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;

        if (testWidth > maxWidth && i > 0) {
            lines.push({ text: line.trim(), y: lineY });
            line = words[i] + ' ';
            lineY += fontSize + 10;
        } else {
            line = testLine;
        }
    }
    lines.push({ text: line.trim(), y: lineY });

    // Draw each line with black stroke and custom color fill
    lines.forEach(lineData => {
        // Draw black stroke (outline) first
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = Math.max(1, fontSize / 20);
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.strokeText(lineData.text, x, lineData.y);
        
        // Draw text fill with selected color
        ctx.fillStyle = textColor;
        ctx.fillText(lineData.text, x, lineData.y);
    });
}

// ============================================
// CANVAS DRAWING FUNCTION
// ============================================

/**
 * Main function to draw the entire canvas (image + text)
 */
function drawCanvas() {
    if (!image) return;

    // Calculate dimensions to maintain aspect ratio
    const maxWidth = 600;
    const maxHeight = 400;
    let width = image.width;
    let height = image.height;

    // Scale down if too wide
    if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
    }

    // Scale down if too tall
    if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
    }

    // Round to integers (canvas dimensions are always integers,
    // so float comparisons would reset positions every frame)
    width = Math.round(width);
    height = Math.round(height);

    // Update canvas size only if dimensions actually changed
    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        // Reset text positions when canvas size changes
        topTextX = null;
        topTextY = null;
        bottomTextX = null;
        bottomTextY = null;
    }

    // Keep zoom wrapper in sync with canvas dimensions
    updateZoom();

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image
    ctx.drawImage(image, 0, 0, width, height);

    // Get text values
    const topText = topTextInput.value.trim();
    const bottomText = bottomTextInput.value.trim();

    // Draw top text at stored position or default
    if (topText) {
        if (topTextX === null || topTextY === null) {
            topTextX = canvas.width / 2;
            topTextY = 20;
        }
        drawText(topText, topTextX, topTextY);
    } else {
        topTextX = null;
        topTextY = null;
    }

    // Draw bottom text at stored position or default
    if (bottomText) {
        if (bottomTextX === null || bottomTextY === null) {
            const textHeight = getTextHeight(bottomText);
            bottomTextX = canvas.width / 2;
            bottomTextY = canvas.height - textHeight - 20;
        }
        drawText(bottomText, bottomTextX, bottomTextY);
    } else {
        bottomTextX = null;
        bottomTextY = null;
    }
}

// ============================================
// TEXT DRAGGING FUNCTIONALITY
// ============================================

// Get mouse position relative to canvas
function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

// Simple check if point is near text (within reasonable distance)
function isNearText(mouseX, mouseY, textX, textY, text) {
    if (!text || textX === null || textY === null) return false;
    
    // Set up context for measurement
    ctx.font = `${fontSize}px ${fontFamily}`;
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const textHeight = fontSize;
    
    // Check if mouse is within text bounds (with padding)
    const padding = 20;
    return mouseX >= textX - textWidth/2 - padding &&
           mouseX <= textX + textWidth/2 + padding &&
           mouseY >= textY - padding &&
           mouseY <= textY + textHeight + padding;
}

// Mouse down - start drag
canvas.addEventListener('mousedown', (e) => {
    if (!image) return;
    
    const pos = getMousePos(e);
    const topText = topTextInput.value.trim();
    const bottomText = bottomTextInput.value.trim();
    
    // Initialize positions if needed
    if (topText && (topTextX === null || topTextY === null)) {
        topTextX = canvas.width / 2;
        topTextY = 20;
    }
    if (bottomText && (bottomTextX === null || bottomTextY === null)) {
        const textHeight = getTextHeight(bottomText);
        bottomTextX = canvas.width / 2;
        bottomTextY = canvas.height - textHeight - 20;
    }
    
    // Check top text
    if (topText && topTextX !== null && topTextY !== null) {
        if (isNearText(pos.x, pos.y, topTextX, topTextY, topText)) {
            dragging = 'top';
            dragOffsetX = pos.x - topTextX;
            dragOffsetY = pos.y - topTextY;
            canvas.style.cursor = 'grabbing';
            e.preventDefault();
            return;
        }
    }
    
    // Check bottom text
    if (bottomText && bottomTextX !== null && bottomTextY !== null) {
        if (isNearText(pos.x, pos.y, bottomTextX, bottomTextY, bottomText)) {
            dragging = 'bottom';
            dragOffsetX = pos.x - bottomTextX;
            dragOffsetY = pos.y - bottomTextY;
            canvas.style.cursor = 'grabbing';
            e.preventDefault();
            return;
        }
    }
    
    dragging = null;
});

// Mouse move - handle drag
canvas.addEventListener('mousemove', (e) => {
    if (!image) return;
    
    const pos = getMousePos(e);
    
    // If dragging, update position
    if (dragging === 'top') {
        topTextX = pos.x - dragOffsetX;
        topTextY = pos.y - dragOffsetY;
        // Constrain to canvas
        topTextX = Math.max(50, Math.min(canvas.width - 50, topTextX));
        topTextY = Math.max(10, Math.min(canvas.height - 10, topTextY));
        drawCanvas();
        return;
    }
    
    if (dragging === 'bottom') {
        bottomTextX = pos.x - dragOffsetX;
        bottomTextY = pos.y - dragOffsetY;
        // Constrain to canvas
        bottomTextX = Math.max(50, Math.min(canvas.width - 50, bottomTextX));
        bottomTextY = Math.max(10, Math.min(canvas.height - 10, bottomTextY));
        drawCanvas();
        return;
    }
    
    // Update cursor for hover
    const topText = topTextInput.value.trim();
    const bottomText = bottomTextInput.value.trim();
    
    if (topText && topTextX !== null && topTextY !== null && isNearText(pos.x, pos.y, topTextX, topTextY, topText)) {
        canvas.style.cursor = 'grab';
    } else if (bottomText && bottomTextX !== null && bottomTextY !== null && isNearText(pos.x, pos.y, bottomTextX, bottomTextY, bottomText)) {
        canvas.style.cursor = 'grab';
    } else {
        canvas.style.cursor = 'default';
    }
});

// Mouse up - end drag
canvas.addEventListener('mouseup', () => {
    dragging = null;
    canvas.style.cursor = 'default';
});

document.addEventListener('mouseup', () => {
    dragging = null;
    canvas.style.cursor = 'default';
});

// ============================================
// DOWNLOAD FUNCTIONALITY
// ============================================
downloadBtn.addEventListener('click', () => {
    if (!image) return;

    try {
        const link = document.createElement('a');
        link.download = `meme-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        alert('Error downloading image. Please try again.');
        console.error('Download error:', error);
    }
});
