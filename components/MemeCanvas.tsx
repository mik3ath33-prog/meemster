'use client';

import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';

interface TextLayer {
  id: number;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  textColor: string;
}

interface MemeCanvasProps {
  imageDataUrl: string | null;
  onImageReady?: (ready: boolean) => void;
  onSelectionChange?: (layerId: number | null) => void;
}

export interface MemeCanvasRef {
  addTextLayer: () => void;
  deleteTextLayer: (id: number) => void;
  updateLayer: (updates: Partial<TextLayer>) => void;
  exportCanvas: () => Promise<string>;
  getSelectedLayer: () => TextLayer | null;
  selectedLayerId: number | null;
  textLayers: TextLayer[];
  imageReady: boolean;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomReset: () => void;
  zoomLevel: number;
}

const HANDLE_SIZE = 8;
const DELETE_BTN_RADIUS = 9;
const MIN_BOX_SIZE = 30;
const ZOOM_STEP = 0.25;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 4;

const MemeCanvas = forwardRef<MemeCanvasRef, MemeCanvasProps>(
  ({ imageDataUrl, onImageReady, onSelectionChange }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const baseDimsRef = useRef<{ width: number; height: number }>({ width: 600, height: 400 });
  const [zoomLevel, setZoomLevel] = useState(1);
    const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
    const [nextLayerId, setNextLayerId] = useState(1);
    const [selectedLayerId, setSelectedLayerId] = useState<number | null>(null);
    const [interaction, setInteraction] = useState<string | null>(null);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0, layer: null as TextLayer | null });
    const [image, setImage] = useState<HTMLImageElement | null>(null);

    const getSelectedLayer = useCallback(() => {
      if (selectedLayerId === null) return null;
      return textLayers.find(l => l.id === selectedLayerId) || null;
    }, [textLayers, selectedLayerId]);

    const drawLayerText = useCallback((layer: TextLayer, targetCtx: CanvasRenderingContext2D) => {
      if (!layer.text) return;
      
      targetCtx.font = `${layer.fontSize}px ${layer.fontFamily}`;
      targetCtx.textAlign = 'center';
      targetCtx.textBaseline = 'top';
      
      const maxWidth = layer.width;
      const lineHeight = layer.fontSize * 1.25;
      const lines: string[] = [];
      
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
          const metrics = targetCtx.measureText(testLine);
          
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
      
      targetCtx.save();
      targetCtx.beginPath();
      targetCtx.rect(layer.x, layer.y, layer.width, layer.height);
      targetCtx.clip();
      
      lines.forEach((line, i) => {
        const y = startY + i * lineHeight;
        
        targetCtx.strokeStyle = '#000000';
        targetCtx.lineWidth = Math.max(1, layer.fontSize / 15);
        targetCtx.lineJoin = 'round';
        targetCtx.miterLimit = 2;
        targetCtx.strokeText(line, centerX, y);
        
        targetCtx.fillStyle = layer.textColor;
        targetCtx.fillText(line, centerX, y);
      });
      
      targetCtx.restore();
    }, []);

    const getHandlePositions = useCallback((layer: TextLayer) => {
      return [
        { type: 'nw', x: layer.x, y: layer.y },
        { type: 'ne', x: layer.x + layer.width, y: layer.y },
        { type: 'sw', x: layer.x, y: layer.y + layer.height },
        { type: 'se', x: layer.x + layer.width, y: layer.y + layer.height }
      ];
    }, []);

    const getDeleteBtnCenter = useCallback((layer: TextLayer) => {
      return {
        x: layer.x + layer.width - DELETE_BTN_RADIUS - 3,
        y: layer.y + DELETE_BTN_RADIUS + 3
      };
    }, []);

    const drawSelectionUI = useCallback((layer: TextLayer, ctx: CanvasRenderingContext2D) => {
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
    }, [getHandlePositions, getDeleteBtnCenter]);

    const drawCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas || !image) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const dpr = window.devicePixelRatio || 1;
      
      // Compute logical dimensions (fit image to max 600x400)
      const maxWidth = 600;
      const maxHeight = 400;
      let logicalW = image.width;
      let logicalH = image.height;
      
      if (logicalW > maxWidth) {
        logicalH = (logicalH * maxWidth) / logicalW;
        logicalW = maxWidth;
      }
      if (logicalH > maxHeight) {
        logicalW = (logicalW * maxHeight) / logicalH;
        logicalH = maxHeight;
      }
      
      logicalW = Math.round(logicalW);
      logicalH = Math.round(logicalH);
      baseDimsRef.current = { width: logicalW, height: logicalH };
      
      // Render scale: DPR * zoom for crisp text at every zoom level
      const renderScale = dpr * zoomLevel;
      const bufferW = Math.round(logicalW * renderScale);
      const bufferH = Math.round(logicalH * renderScale);
      
      // Set buffer size (actual pixel resolution)
      canvas.width = bufferW;
      canvas.height = bufferH;
      
      // Set CSS display size (visual size on screen)
      canvas.style.width = Math.round(logicalW * zoomLevel) + 'px';
      canvas.style.height = Math.round(logicalH * zoomLevel) + 'px';
      
      // Scale context so all drawing uses logical coordinates
      ctx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
      
      ctx.clearRect(0, 0, logicalW, logicalH);
      ctx.drawImage(image, 0, 0, logicalW, logicalH);
      
      textLayers.forEach(layer => {
        drawLayerText(layer, ctx);
      });
      
      if (selectedLayerId !== null) {
        const layer = getSelectedLayer();
        if (layer) {
          drawSelectionUI(layer, ctx);
        }
      }
    }, [image, textLayers, selectedLayerId, zoomLevel, getSelectedLayer, drawLayerText, drawSelectionUI]);

    useEffect(() => {
      if (imageDataUrl) {
        const img = new Image();
        img.onload = () => {
          setImage(img);
          onImageReady?.(true);
        };
        img.src = imageDataUrl;
      } else {
        setImage(null);
        setTextLayers([]);
        setSelectedLayerId(null);
        onImageReady?.(false);
      }
    }, [imageDataUrl, onImageReady]);

    useEffect(() => {
      drawCanvas();
    }, [drawCanvas]);

    // Notify parent when selection changes
    useEffect(() => {
      onSelectionChange?.(selectedLayerId);
    }, [selectedLayerId, onSelectionChange]);

    const getMousePos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      
      const rect = canvas.getBoundingClientRect();
      const dims = baseDimsRef.current;
      // Map CSS pixels to logical coordinates
      return {
        x: (e.clientX - rect.left) * (dims.width / rect.width),
        y: (e.clientY - rect.top) * (dims.height / rect.height)
      };
    }, []);

    const hitTest = useCallback((mouseX: number, mouseY: number): { type: string; layerId?: number; handle?: string } => {
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
    }, [textLayers, selectedLayerId, getSelectedLayer, getHandlePositions, getDeleteBtnCenter]);

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!image) return;
      
      const pos = getMousePos(e);
      const hit = hitTest(pos.x, pos.y);
      
      if (hit.type === 'delete' && hit.layerId !== undefined) {
        setTextLayers(prev => prev.filter(l => l.id !== hit.layerId));
        if (selectedLayerId === hit.layerId) {
          setSelectedLayerId(null);
        }
        return;
      }
      
      if (hit.type === 'resize' && hit.layerId !== undefined) {
        const layer = textLayers.find(l => l.id === hit.layerId);
        if (layer) {
          setInteraction('resize-' + hit.handle);
          setDragStart({ x: pos.x, y: pos.y, layer: { ...layer } });
        }
        e.preventDefault();
        return;
      }
      
      if (hit.type === 'select' && hit.layerId !== undefined) {
        setSelectedLayerId(hit.layerId);
        setInteraction('move');
        const layer = textLayers.find(l => l.id === hit.layerId);
        if (layer) {
          setDragStart({ x: pos.x, y: pos.y, layer: { ...layer } });
        }
        e.preventDefault();
        return;
      }
      
      if (selectedLayerId !== null) {
        setSelectedLayerId(null);
        setInteraction(null);
      }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!image) return;
      
      const pos = getMousePos(e);
      
      if (interaction === 'move') {
        const layer = getSelectedLayer();
        if (layer && dragStart.layer) {
          const dx = pos.x - dragStart.x;
          const dy = pos.y - dragStart.y;
          setTextLayers(prev => prev.map(l => 
            l.id === layer.id 
              ? { ...l, x: dragStart.layer!.x + dx, y: dragStart.layer!.y + dy }
              : l
          ));
        }
        return;
      }
      
      if (interaction && interaction.startsWith('resize-')) {
        const layer = getSelectedLayer();
        if (layer && dragStart.layer) {
          const handle = interaction.replace('resize-', '');
          const dx = pos.x - dragStart.x;
          const dy = pos.y - dragStart.y;
          const orig = dragStart.layer;
          
          let newLayer = { ...layer };
          switch (handle) {
            case 'se':
              newLayer.width = Math.max(MIN_BOX_SIZE, orig.width + dx);
              newLayer.height = Math.max(MIN_BOX_SIZE, orig.height + dy);
              newLayer.x = orig.x;
              newLayer.y = orig.y;
              break;
            case 'sw':
              newLayer.width = Math.max(MIN_BOX_SIZE, orig.width - dx);
              newLayer.x = orig.x + orig.width - newLayer.width;
              newLayer.y = orig.y;
              newLayer.height = Math.max(MIN_BOX_SIZE, orig.height + dy);
              break;
            case 'ne':
              newLayer.width = Math.max(MIN_BOX_SIZE, orig.width + dx);
              newLayer.height = Math.max(MIN_BOX_SIZE, orig.height - dy);
              newLayer.x = orig.x;
              newLayer.y = orig.y + orig.height - newLayer.height;
              break;
            case 'nw':
              newLayer.width = Math.max(MIN_BOX_SIZE, orig.width - dx);
              newLayer.height = Math.max(MIN_BOX_SIZE, orig.height - dy);
              newLayer.x = orig.x + orig.width - newLayer.width;
              newLayer.y = orig.y + orig.height - newLayer.height;
              break;
          }
          // Scale font size proportionally with box width
          const widthScale = newLayer.width / orig.width;
          newLayer.fontSize = Math.max(8, Math.round(orig.fontSize * widthScale));
          setTextLayers(prev => prev.map(l => l.id === layer.id ? newLayer : l));
        }
        return;
      }
      
      const hit = hitTest(pos.x, pos.y);
      const canvas = canvasRef.current;
      if (canvas) {
        if (hit.type === 'delete') {
          canvas.style.cursor = 'pointer';
        } else if (hit.type === 'resize') {
          const handle = hit.handle;
          if (handle === 'nw' || handle === 'se') {
            canvas.style.cursor = 'nwse-resize';
          } else {
            canvas.style.cursor = 'nesw-resize';
          }
        } else if (hit.type === 'select') {
          canvas.style.cursor = 'grab';
        } else {
          canvas.style.cursor = 'default';
        }
      }
    };

    const handleMouseUp = () => {
      setInteraction(null);
    };

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
      if (e.altKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
        setZoomLevel(prev => Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Math.round((prev + delta) * 100) / 100)));
      }
    };

    const zoomIn = () => {
      setZoomLevel(prev => {
        if (prev < ZOOM_MAX) {
          return Math.min(ZOOM_MAX, Math.round((prev + ZOOM_STEP) * 100) / 100);
        }
        return prev;
      });
    };

    const zoomOut = () => {
      setZoomLevel(prev => {
        if (prev > ZOOM_MIN) {
          return Math.max(ZOOM_MIN, Math.round((prev - ZOOM_STEP) * 100) / 100);
        }
        return prev;
      });
    };

    const zoomReset = () => {
      setZoomLevel(1);
    };

    // Keyboard shortcuts
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (selectedLayerId !== null && document.activeElement?.tagName !== 'TEXTAREA' && document.activeElement?.tagName !== 'INPUT') {
            e.preventDefault();
            deleteTextLayer(selectedLayerId);
          }
        }
        
        if (e.key === 'Escape' && selectedLayerId !== null) {
          setSelectedLayerId(null);
          setInteraction(null);
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedLayerId]);

    const addTextLayer = () => {
      const canvas = canvasRef.current;
      if (!canvas || !image) return;
      
      const layer: TextLayer = {
        id: nextLayerId,
        text: 'Text',
        x: Math.round(canvas.width / 2 - 100),
        y: Math.round(canvas.height / 2 - 25),
        width: 200,
        height: 50,
        fontSize: 32,
        fontFamily: 'Impact',
        textColor: '#FFFFFF'
      };
      setTextLayers(prev => [...prev, layer]);
      setSelectedLayerId(layer.id);
      setNextLayerId(prev => prev + 1);
    };

    const deleteTextLayer = (id: number) => {
      setTextLayers(prev => prev.filter(l => l.id !== id));
      if (selectedLayerId === id) {
        setSelectedLayerId(null);
      }
    };

    const updateLayer = (updates: Partial<TextLayer>) => {
      if (selectedLayerId === null) return;
      setTextLayers(prev => prev.map(l => 
        l.id === selectedLayerId ? { ...l, ...updates } : l
      ));
    };

    const exportCanvas = (): Promise<string> => {
      return new Promise((resolve) => {
        if (!image || !imageDataUrl) {
          resolve('');
          return;
        }
        
        const dims = baseDimsRef.current;
        const EXPORT_SCALE = 2; // Always export at 2x for crisp quality
        
        const exportImg = new Image();
        exportImg.onload = () => {
          const exportEl = document.createElement('canvas');
          exportEl.width = Math.round(dims.width * EXPORT_SCALE);
          exportEl.height = Math.round(dims.height * EXPORT_SCALE);
          const exportCtx = exportEl.getContext('2d');
          
          if (exportCtx) {
            exportCtx.setTransform(EXPORT_SCALE, 0, 0, EXPORT_SCALE, 0, 0);
            exportCtx.drawImage(exportImg, 0, 0, dims.width, dims.height);
            
            textLayers.forEach(layer => {
              drawLayerText(layer, exportCtx);
            });
            
            resolve(exportEl.toDataURL('image/jpeg', 0.95));
          } else {
            resolve('');
          }
        };
        exportImg.src = imageDataUrl;
      });
    };

    const zoomWrapperRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      addTextLayer,
      deleteTextLayer,
      updateLayer,
      exportCanvas,
      getSelectedLayer,
      selectedLayerId,
      textLayers,
      imageReady: !!image,
      zoomIn,
      zoomOut,
      zoomReset,
      zoomLevel,
    }));

    return (
      <div className="canvas-container" onWheel={handleWheel}>
        <div className="canvas-zoom-wrapper" ref={zoomWrapperRef}>
          <canvas
            ref={canvasRef}
            id="memeCanvas"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>
      </div>
    );
  }
);

MemeCanvas.displayName = 'MemeCanvas';

export default MemeCanvas;
