'use client';

import { useEffect, useState } from 'react';
import { MemeCanvasRef } from './MemeCanvas';

interface ControlPanelProps {
  canvasRef: React.RefObject<MemeCanvasRef>;
  onDownload: () => void;
  onPost?: () => void;
  canPost?: boolean;
  isPosting?: boolean;
  selectedLayerId?: number | null;
}

export default function ControlPanel({ canvasRef, onDownload, onPost, canPost = false, isPosting = false, selectedLayerId = null }: ControlPanelProps) {
  const [fontSize, setFontSize] = useState(32);
  const [fontFamily, setFontFamily] = useState('Impact');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [layerText, setLayerText] = useState('');
  const [imageReady, setImageReady] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Sync layer controls when selection changes
  useEffect(() => {
    const layer = canvasRef.current?.getSelectedLayer();
    if (layer) {
      setFontSize(layer.fontSize);
      setFontFamily(layer.fontFamily);
      setTextColor(layer.textColor);
      setLayerText(layer.text);
    } else {
      setLayerText('');
    }
  }, [selectedLayerId]);

  useEffect(() => {
    // Sync zoom level and image ready state from canvas
    const interval = setInterval(() => {
      if (canvasRef.current) {
        setZoomLevel(canvasRef.current.zoomLevel || 1);
        setImageReady(canvasRef.current.imageReady || false);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handleFontSizeChange = (value: number) => {
    setFontSize(value);
    canvasRef.current?.updateLayer({ fontSize: value });
  };

  const handleFontFamilyChange = (value: string) => {
    setFontFamily(value);
    canvasRef.current?.updateLayer({ fontFamily: value });
  };

  const handleTextColorChange = (value: string) => {
    setTextColor(value);
    canvasRef.current?.updateLayer({ textColor: value });
  };

  const handleLayerTextChange = (value: string) => {
    setLayerText(value);
    canvasRef.current?.updateLayer({ text: value });
  };

  const handleZoomIn = () => {
    canvasRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    canvasRef.current?.zoomOut();
  };

  const handleZoomReset = () => {
    canvasRef.current?.zoomReset();
  };

  const handleDeleteLayer = () => {
    if (canvasRef.current?.selectedLayerId) {
      canvasRef.current.deleteTextLayer(canvasRef.current.selectedLayerId);
    }
  };

  const handleAddText = () => {
    canvasRef.current?.addTextLayer();
    const layer = canvasRef.current?.getSelectedLayer();
    if (layer) {
      setLayerText(layer.text);
      setFontSize(layer.fontSize);
      setFontFamily(layer.fontFamily);
      setTextColor(layer.textColor);
    }
  };

  const hasSelectedLayer = selectedLayerId !== null;

  return (
    <div className="control-panel">
      <div className="control-row">
        <div className="control-item">
          <button
            id="addTextBtn"
            className="action-btn"
            disabled={!imageReady}
            onClick={handleAddText}
          >
            + Add Text
          </button>
        </div>
        {hasSelectedLayer && (
          <>
            <div className="control-item layer-controls">
              <label htmlFor="layerText">Text</label>
              <textarea
                id="layerText"
                rows={2}
                placeholder="Enter text..."
                value={layerText}
                onChange={(e) => handleLayerTextChange(e.target.value)}
              />
            </div>
            <div className="control-item layer-controls">
              <label htmlFor="fontSize">Size</label>
              <div className="slider-container">
                <input
                  type="range"
                  id="fontSize"
                  min="10"
                  max="100"
                  value={fontSize}
                  onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
                />
                <span id="fontSizeValue">{fontSize}</span>
              </div>
            </div>
            <div className="control-item layer-controls">
              <label htmlFor="fontFamily">Font</label>
              <select
                id="fontFamily"
                value={fontFamily}
                onChange={(e) => handleFontFamilyChange(e.target.value)}
              >
                <option value="Impact">Impact</option>
                <option value="Arial Black">Arial Black</option>
                <option value="Comic Sans MS">Comic Sans MS</option>
                <option value="Verdana">Verdana</option>
                <option value="Georgia">Georgia</option>
              </select>
            </div>
            <div className="control-item layer-controls">
              <label htmlFor="textColor">Color</label>
              <input
                type="color"
                id="textColor"
                value={textColor}
                onChange={(e) => handleTextColorChange(e.target.value)}
              />
            </div>
            <div className="control-item layer-controls">
              <button
                id="deleteLayerBtn"
                className="delete-layer-btn"
                title="Delete selected text layer"
                onClick={handleDeleteLayer}
              >
                Delete
              </button>
            </div>
          </>
        )}
        <div className="control-item zoom-controls">
          <label>Zoom</label>
          <button
            id="zoomOut"
            className="zoom-btn"
            title="Zoom out"
            onClick={handleZoomOut}
          >
            -
          </button>
          <span id="zoomLevel">{Math.round(zoomLevel * 100)}%</span>
          <button
            id="zoomIn"
            className="zoom-btn"
            title="Zoom in"
            onClick={handleZoomIn}
          >
            +
          </button>
          <button
            id="zoomReset"
            className="zoom-btn zoom-reset"
            title="Reset zoom"
            onClick={handleZoomReset}
          >
            Fit
          </button>
        </div>
        <div className="control-item">
          <button
            id="downloadBtn"
            className="download-btn"
            disabled={!imageReady}
            onClick={onDownload}
          >
            Download
          </button>
        </div>
        {canPost && (
          <div className="control-item">
            <button
              id="postBtn"
              className="action-btn"
              disabled={!imageReady || isPosting}
              onClick={onPost}
            >
              {isPosting ? 'Posting...' : 'Post Meme'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
