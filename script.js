// Canvas and context
const canvas = document.getElementById('memeCanvas');
const ctx = canvas.getContext('2d');

// UI elements
const imageUpload = document.getElementById('imageUpload');
const fontSizeSlider = document.getElementById('fontSize');
const fontSizeValue = document.getElementById('fontSizeValue');
const fontFamilySelect = document.getElementById('fontFamily');
const textColorInput = document.getElementById('textColor');
const downloadBtn = document.getElementById('downloadBtn');
const fileName = document.getElementById('fileName');
const addTextBtn = document.getElementById('addTextBtn');
const layerTextarea = document.getElementById('layerText');
const deleteLayerBtn = document.getElementById('deleteLayerBtn');

// Zoom elements
const zoomInBtn = document.getElementById('zoomIn');
const zoomOutBtn = document.getElementById('zoomOut');
const zoomResetBtn = document.getElementById('zoomReset');
const zoomLevelDisplay = document.getElementById('zoomLevel');
const canvasContainer = document.getElementById('canvasContainer');
const canvasZoomWrapper = document.getElementById('canvasZoomWrapper');

// State
let image = null;
let imageDataUrl = null;
let selectedTemplate = null;

// Zoom state
let zoomLevel = 1;
const ZOOM_STEP = 0.25;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 4;

// Text layer system
let textLayers = [];
let nextLayerId = 1;
let selectedLayerId = null;

// Interaction state
let interaction = null;
let dragStartX = 0;
let dragStartY = 0;
let dragStartLayer = null;

// Constants
const HANDLE_SIZE = 8;
const DELETE_BTN_RADIUS = 9;
const MIN_BOX_SIZE = 30;

// Initialize canvas
canvas.width = 600;
canvas.height = 400;

// ============================================
// TEMPLATE SELECTION
// ============================================
function loadTemplates() {
    const templateGrid = document.getElementById('templateGrid');
    
    TEMPLATE_DATA.forEach((template, index) => {
        const templateItem = document.createElement('div');
        templateItem.className = 'template-item';
        templateItem.dataset.index = index;
        
        const img = document.createElement('img');
        img.src = template.data;
        img.alt = template.name;
        
        templateItem.appendChild(img);
        templateItem.addEventListener('click', () => selectTemplate(template, templateItem));
        templateGrid.appendChild(templateItem);
    });
}

function selectTemplate(template, element) {
    document.querySelectorAll('.template-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    element.classList.add('selected');
    selectedTemplate = template;
    
    imageUpload.value = '';
    fileName.textContent = '';
    
    textLayers = [];
    selectedLayerId = null;
    updateLayerPanel();
    
    // Templates are already data URLs, so load directly
    imageDataUrl = template.data;
    const img = new Image();
    img.onload = () => {
        image = img;
        drawCanvas();
        downloadBtn.disabled = false;
        addTextBtn.disabled = false;
    };
    img.src = imageDataUrl;
}

loadTemplates();

// ============================================
// IMAGE UPLOAD HANDLING
// ============================================
imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        return;
    }
    
    document.querySelectorAll('.template-item').forEach(item => {
        item.classList.remove('selected');
    });
    selectedTemplate = null;
    
    textLayers = [];
    selectedLayerId = null;
    updateLayerPanel();
    
    fileName.textContent = file.name;
    const reader = new FileReader();
    
    reader.onload = (event) => {
        imageDataUrl = event.target.result;
        const img = new Image();
        img.onload = () => {
            image = img;
            drawCanvas();
            downloadBtn.disabled = false;
            addTextBtn.disabled = false;
        };
        img.src = imageDataUrl;
    };
    
    reader.readAsDataURL(file);
});

// ============================================
// ZOOM CONTROLS
// ============================================
function updateZoom() {
    canvas.style.transform = `scale(${zoomLevel})`;
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

canvasContainer.addEventListener('wheel', (e) => {
    if (e.altKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
        const newZoom = Math.round((zoomLevel + delta) * 100) / 100;
        zoomLevel = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, newZoom));
        updateZoom();
    }
}, { passive: false });

// ============================================
// TEXT LAYER MANAGEMENT
// ============================================
function addTextLayer() {
    if (!image) return;
    
    const layer = {
        id: nextLayerId++,
        text: 'Text',
        x: Math.round(canvas.width / 2 - 100),
        y: Math.round(canvas.height / 2 - 25),
        width: 200,
        height: 50,
        fontSize: 32,
        fontFamily: 'Impact',
        textColor: '#FFFFFF'
    };
    textLayers.push(layer);
    selectedLayerId = layer.id;
    updateLayerPanel();
    drawCanvas();
    
    layerTextarea.focus();
    layerTextarea.select();
}

function deleteTextLayer(id) {
    textLayers = textLayers.filter(l => l.id !== id);
    if (selectedLayerId === id) {
        selectedLayerId = null;
    }
    updateLayerPanel();
    drawCanvas();
}

function getSelectedLayer() {
    if (selectedLayerId === null) return null;
    return textLayers.find(l => l.id === selectedLayerId) || null;
}

function updateLayerPanel() {
    const layerControlsEls = document.querySelectorAll('.layer-controls');
    const layer = getSelectedLayer();
    
    if (layer) {
        layerControlsEls.forEach(el => el.style.display = '');
        layerTextarea.value = layer.text;
        fontSizeSlider.value = layer.fontSize;
        fontSizeValue.textContent = layer.fontSize;
        fontFamilySelect.value = layer.fontFamily;
        textColorInput.value = layer.textColor;
    } else {
        layerControlsEls.forEach(el => el.style.display = 'none');
    }
}

// ============================================
// CONTROL EVENT HANDLERS
// ============================================
addTextBtn.addEventListener('click', addTextLayer);

deleteLayerBtn.addEventListener('click', () => {
    if (selectedLayerId !== null) {
        deleteTextLayer(selectedLayerId);
    }
});

layerTextarea.addEventListener('input', () => {
    const layer = getSelectedLayer();
    if (layer) {
        layer.text = layerTextarea.value;
        drawCanvas();
    }
});

fontSizeSlider.addEventListener('input', (e) => {
    const layer = getSelectedLayer();
    if (layer) {
        layer.fontSize = parseInt(e.target.value);
        fontSizeValue.textContent = layer.fontSize;
        drawCanvas();
    }
});

fontFamilySelect.addEventListener('change', (e) => {
    const layer = getSelectedLayer();
    if (layer) {
        layer.fontFamily = e.target.value;
        drawCanvas();
    }
});

textColorInput.addEventListener('input', (e) => {
    const layer = getSelectedLayer();
    if (layer) {
        layer.textColor = e.target.value;
        drawCanvas();
    }
});

// ============================================
// TEXT RENDERING
// ============================================
function drawLayerText(layer, targetCtx) {
    if (!layer.text) return;
    const c = targetCtx || ctx;
    
    c.font = `${layer.fontSize}px ${layer.fontFamily}`;
    c.textAlign = 'center';
    c.textBaseline = 'top';
    
    const maxWidth = layer.width;
    const lineHeight = layer.fontSize * 1.25;
    const lines = [];
    
    const paragraphs = layer.text.split('\n');
    
    for (const para of paragraphs) {
        if (para === '') {
            lines.push('');
            continue;
        }
        const words = para.split(' ');
        let currentLine = '';
        
        for (const word of words) {
            const testLine = currentLine ? currentLine + ' ' + word : word;
            const metrics = c.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) lines.push(currentLine);
    }
    
    const totalTextHeight = lines.length * lineHeight;
    const startY = layer.y + Math.max(0, (layer.height - totalTextHeight) / 2);
    const centerX = layer.x + layer.width / 2;
    
    c.save();
    c.beginPath();
    c.rect(layer.x, layer.y, layer.width, layer.height);
    c.clip();
    
    lines.forEach((line, i) => {
        const y = startY + i * lineHeight;
        
        c.strokeStyle = '#000000';
        c.lineWidth = Math.max(1, layer.fontSize / 15);
        c.lineJoin = 'round';
        c.miterLimit = 2;
        c.strokeText(line, centerX, y);
        
        c.fillStyle = layer.textColor;
        c.fillText(line, centerX, y);
    });
    
    c.restore();
}

// ============================================
// SELECTION UI RENDERING
// ============================================
function getHandlePositions(layer) {
    return [
        { type: 'nw', x: layer.x, y: layer.y },
        { type: 'ne', x: layer.x + layer.width, y: layer.y },
        { type: 'sw', x: layer.x, y: layer.y + layer.height },
        { type: 'se', x: layer.x + layer.width, y: layer.y + layer.height }
    ];
}

function getDeleteBtnCenter(layer) {
    return {
        x: layer.x + layer.width - DELETE_BTN_RADIUS - 3,
        y: layer.y + DELETE_BTN_RADIUS + 3
    };
}

function drawSelectionUI(layer) {
    ctx.strokeStyle = '#d97757';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(layer.x, layer.y, layer.width, layer.height);
    ctx.setLineDash([]);
    
    const handles = getHandlePositions(layer);
    handles.forEach(h => {
        ctx.fillStyle = '#d97757';
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1;
        ctx.fillRect(h.x - HANDLE_SIZE / 2, h.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
        ctx.strokeRect(h.x - HANDLE_SIZE / 2, h.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
    });
    
    const del = getDeleteBtnCenter(layer);
    
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.arc(del.x, del.y, DELETE_BTN_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(del.x, del.y, DELETE_BTN_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    const r = 4;
    ctx.beginPath();
    ctx.moveTo(del.x - r, del.y - r);
    ctx.lineTo(del.x + r, del.y + r);
    ctx.moveTo(del.x + r, del.y - r);
    ctx.lineTo(del.x - r, del.y + r);
    ctx.stroke();
    ctx.lineCap = 'butt';
}

// ============================================
// MAIN CANVAS DRAWING
// ============================================
function drawCanvas() {
    if (!image) return;
    
    const maxWidth = 600;
    const maxHeight = 400;
    let width = image.width;
    let height = image.height;
    
    if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
    }
    if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
    }
    
    width = Math.round(width);
    height = Math.round(height);
    
    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
    }
    
    updateZoom();
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, width, height);
    
    textLayers.forEach(layer => {
        drawLayerText(layer);
    });
    
    if (selectedLayerId !== null) {
        const layer = getSelectedLayer();
        if (layer) {
            drawSelectionUI(layer);
        }
    }
}

// ============================================
// HIT TESTING
// ============================================
function hitTest(mouseX, mouseY) {
    if (selectedLayerId !== null) {
        const layer = getSelectedLayer();
        if (layer) {
            const del = getDeleteBtnCenter(layer);
            if (Math.hypot(mouseX - del.x, mouseY - del.y) <= DELETE_BTN_RADIUS + 3) {
                return { type: 'delete', layerId: layer.id };
            }
            
            const handles = getHandlePositions(layer);
            for (const handle of handles) {
                if (Math.abs(mouseX - handle.x) <= HANDLE_SIZE + 2 &&
                    Math.abs(mouseY - handle.y) <= HANDLE_SIZE + 2) {
                    return { type: 'resize', handle: handle.type, layerId: layer.id };
                }
            }
        }
    }
    
    for (let i = textLayers.length - 1; i >= 0; i--) {
        const layer = textLayers[i];
        if (mouseX >= layer.x && mouseX <= layer.x + layer.width &&
            mouseY >= layer.y && mouseY <= layer.y + layer.height) {
            return { type: 'select', layerId: layer.id };
        }
    }
    
    return { type: 'none' };
}

function getResizeCursor(handle) {
    switch (handle) {
        case 'nw': case 'se': return 'nwse-resize';
        case 'ne': case 'sw': return 'nesw-resize';
        default: return 'default';
    }
}

function resizeLayer(layer, handle, dx, dy) {
    const orig = dragStartLayer;
    
    switch (handle) {
        case 'se':
            layer.width = Math.max(MIN_BOX_SIZE, orig.width + dx);
            layer.height = Math.max(MIN_BOX_SIZE, orig.height + dy);
            layer.x = orig.x;
            layer.y = orig.y;
            break;
        case 'sw':
            layer.width = Math.max(MIN_BOX_SIZE, orig.width - dx);
            layer.x = orig.x + orig.width - layer.width;
            layer.y = orig.y;
            layer.height = Math.max(MIN_BOX_SIZE, orig.height + dy);
            break;
        case 'ne':
            layer.width = Math.max(MIN_BOX_SIZE, orig.width + dx);
            layer.height = Math.max(MIN_BOX_SIZE, orig.height - dy);
            layer.x = orig.x;
            layer.y = orig.y + orig.height - layer.height;
            break;
        case 'nw':
            layer.width = Math.max(MIN_BOX_SIZE, orig.width - dx);
            layer.height = Math.max(MIN_BOX_SIZE, orig.height - dy);
            layer.x = orig.x + orig.width - layer.width;
            layer.y = orig.y + orig.height - layer.height;
            break;
    }
}

// ============================================
// MOUSE EVENT HANDLERS
// ============================================
function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

canvas.addEventListener('mousedown', (e) => {
    if (!image) return;
    
    const pos = getMousePos(e);
    const hit = hitTest(pos.x, pos.y);
    
    if (hit.type === 'delete') {
        deleteTextLayer(hit.layerId);
        return;
    }
    
    if (hit.type === 'resize') {
        const layer = textLayers.find(l => l.id === hit.layerId);
        interaction = 'resize-' + hit.handle;
        dragStartX = pos.x;
        dragStartY = pos.y;
        dragStartLayer = { ...layer };
        canvas.style.cursor = getResizeCursor(hit.handle);
        e.preventDefault();
        return;
    }
    
    if (hit.type === 'select') {
        selectedLayerId = hit.layerId;
        interaction = 'move';
        const layer = textLayers.find(l => l.id === hit.layerId);
        dragStartX = pos.x;
        dragStartY = pos.y;
        dragStartLayer = { ...layer };
        canvas.style.cursor = 'grabbing';
        updateLayerPanel();
        drawCanvas();
        e.preventDefault();
        return;
    }
    
    if (selectedLayerId !== null) {
        selectedLayerId = null;
        interaction = null;
        updateLayerPanel();
        drawCanvas();
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (!image) return;
    
    const pos = getMousePos(e);
    
    if (interaction === 'move') {
        const layer = getSelectedLayer();
        if (!layer) return;
        
        const dx = pos.x - dragStartX;
        const dy = pos.y - dragStartY;
        layer.x = dragStartLayer.x + dx;
        layer.y = dragStartLayer.y + dy;
        
        drawCanvas();
        return;
    }
    
    if (interaction && interaction.startsWith('resize-')) {
        const layer = getSelectedLayer();
        if (!layer) return;
        
        const handle = interaction.replace('resize-', '');
        const dx = pos.x - dragStartX;
        const dy = pos.y - dragStartY;
        
        resizeLayer(layer, handle, dx, dy);
        drawCanvas();
        return;
    }
    
    const hit = hitTest(pos.x, pos.y);
    if (hit.type === 'delete') {
        canvas.style.cursor = 'pointer';
    } else if (hit.type === 'resize') {
        canvas.style.cursor = getResizeCursor(hit.handle);
    } else if (hit.type === 'select') {
        canvas.style.cursor = 'grab';
    } else {
        canvas.style.cursor = 'default';
    }
});

canvas.addEventListener('mouseup', () => {
    if (interaction) {
        interaction = null;
    }
});

document.addEventListener('mouseup', () => {
    if (interaction) {
        interaction = null;
    }
});

document.addEventListener('keydown', (e) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedLayerId !== null) {
        if (document.activeElement !== layerTextarea) {
            e.preventDefault();
            deleteTextLayer(selectedLayerId);
        }
    }
    
    if (e.key === 'Escape' && selectedLayerId !== null) {
        selectedLayerId = null;
        interaction = null;
        updateLayerPanel();
        drawCanvas();
    }
});

// ============================================
// DOWNLOAD FUNCTIONALITY
// ============================================
downloadBtn.addEventListener('click', () => {
    if (!imageDataUrl) return;
    
    const exportImg = new Image();
    exportImg.onload = () => {
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = canvas.width;
        exportCanvas.height = canvas.height;
        const exportCtx = exportCanvas.getContext('2d');
        
        exportCtx.drawImage(exportImg, 0, 0, canvas.width, canvas.height);
        
        textLayers.forEach(layer => {
            drawLayerText(layer, exportCtx);
        });
        
        const link = document.createElement('a');
        link.download = `meme-${Date.now()}.jpg`;
        link.href = exportCanvas.toDataURL('image/jpeg', 0.95);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    exportImg.src = imageDataUrl;
});
