import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';

const DebugOverlay = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.85);
  color: #a3ffa3;
  padding: 15px;
  border-radius: 5px;
  font-family: 'Courier New', monospace;
  z-index: 9999; 
  border: 1px solid #444;
  max-width: 400px;
  min-width: 300px;
  pointer-events: none;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.9);
  text-align: left;
  
  
  &:after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 3px;
    height: 100%;
    background-color: #a3ffa3;
    box-shadow: 0 0 8px #a3ffa3;
    opacity: 0.8;
  }
`;

const WarningOverlay = styled.div`
  position: fixed; 
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(50, 0, 0, 0.9);
  color: #ff9999;
  padding: 15px;
  border-radius: 5px;
  font-family: 'Courier New', monospace;
  z-index: 9998; 
  border: 1px solid #660000;
  text-align: center;
  pointer-events: none;
`;

const LoadAllWarning = styled.div`
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 50, 0, 0.9);
  color: #a3ffa3;
  padding: 10px 15px;
  border-radius: 5px;
  font-family: 'Courier New', monospace;
  z-index: 9997;
  border: 1px solid #00aa00;
  text-align: center;
  pointer-events: none;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.7);
`;

const ZoomChangeNotice = styled.div`
  position: fixed;
  top: 70px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 50, 0.9);
  color: #9999ff;
  padding: 8px 15px;
  border-radius: 5px;
  font-family: 'Courier New', monospace;
  z-index: 9996;
  border: 1px solid #5555ff;
  text-align: center;
  pointer-events: none;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.7);
  opacity: 1;
  transition: opacity 0.5s ease-out;
`;

const JumpDialog = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.9);
  color: #a3ffa3;
  padding: 20px;
  border-radius: 5px;
  font-family: 'Courier New', monospace;
  z-index: 10000;
  border: 1px solid #a3ffa3;
  width: 300px;
  box-shadow: 0 0 30px #000;
  
  input {
    background: #111;
    border: 1px solid #a3ffa3;
    color: #fff;
    padding: 8px;
    width: 100%;
    margin-top: 10px;
    font-family: 'Courier New', monospace;
  }
  
  button {
    background: #0a3a0a;
    color: #a3ffa3;
    border: 1px solid #a3ffa3;
    padding: 8px 15px;
    margin-top: 10px;
    margin-right: 10px;
    cursor: pointer;
    font-family: 'Courier New', monospace;
    
    &:hover {
      background: #0c550c;
    }
  }
`;

const TileContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
`;

const MapTile = styled.div`
  position: absolute;
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  border: ${props => props.debug ? '1px solid rgba(163, 255, 163, 0.5)' : 'none'};
`;

const CanvasContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2; 
  overflow: hidden;
  
  canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
`;

const PlaceholderTile = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 10px;
  overflow: hidden;
`;

const TileRenderer = ({
  viewportWidth = window.innerWidth,
  viewportHeight = window.innerHeight,
  scale = 2,
  offsetX = 0,
  offsetY = 0,
  onMove = null
}) => {
  const [tiles, setTiles] = useState([]);
  const [showDebug, setShowDebug] = useState(false);
  const [error, setError] = useState(null);
  const [useCanvas, setUseCanvas] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [showJumpDialog, setShowJumpDialog] = useState(false);
  const [jumpCoords, setJumpCoords] = useState("0,0");
  const [loadAllTiles, setLoadAllTiles] = useState(true);
  const [showZoomChangeNotice, setShowZoomChangeNotice] = useState(false);

  const isMounted = useRef(true);
  const tileCache = useRef(new Map());
  const canvasRef = useRef(null);
  const lastRenderTime = useRef(Date.now());
  const frameRequest = useRef(null);
  const loadedImages = useRef(new Map());
  const cachedCanvasPatterns = useRef(new Map());
  const lastZoomLevel = useRef(null);
  const fpsHistory = useRef([]);
  const lastFpsUpdate = useRef(Date.now());
  const MAX_TILES_TEMP = useRef(null);
  const isRecovering = useRef(false);


  const lastOffsetX = useRef(offsetX);
  const lastOffsetY = useRef(offsetY);
  const isMoving = useRef(false);
  const movementVector = useRef({ x: 0, y: 0 });
  const movementSpeed = useRef(0);
  const movementThreshold = 3;
  const movementTimeout = useRef(null);


  const dragDistance = useRef(0);
  const dragStartPosition = useRef({ x: 0, y: 0 });
  const dragVelocity = useRef({ x: 0, y: 0 });
  const lastMousePosition = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  const debugPortalRef = useRef(null);
  const warningPortalRef = useRef(null);
  const loadAllWarningRef = useRef(null);
  const zoomChangePortalRef = useRef(null);

  const TILE_SIZE = 512;
  const TILE_BASE_URL = 'https://joric.github.io/stalker2_tileset/tiles';
  const MAX_TILES = 100;

  const MAP_BOUNDS = {
    minX: 0,
    minY: 0,
    maxX: 50,
    maxY: 50
  };

  const resetToOrigin = useCallback(() => {
    if (isRecovering.current || !onMove) return;

    try {
      console.warn("Emergency reset to origin due to invalid coordinates or severe lag");
      setError("Reset to origin (0,0) due to calculation error");

      isRecovering.current = true;

      loadedImages.current.clear();
      cachedCanvasPatterns.current.clear();
      tileCache.current.clear();

      const safeScale = scale <= 0 || !Number.isFinite(scale) ? 1 : scale;
      const centeredOffsetX = viewportWidth / 2;
      const centeredOffsetY = viewportHeight / 2;

      onMove(centeredOffsetX, centeredOffsetY);

      setShowZoomChangeNotice(true);

      setTimeout(() => {
        if (isMounted.current) {
          isRecovering.current = false;
          setShowZoomChangeNotice(false);
        }
      }, 3000);

    } catch (err) {
      console.error("Error during emergency reset:", err);
    }
  }, [viewportWidth, viewportHeight, scale, onMove]);

  const calculateFPS = useCallback(() => {
    const now = Date.now();
    const elapsed = now - lastFpsUpdate.current;

    if (elapsed > 500) {
      const fps = 1000 / Math.max(16, now - lastRenderTime.current);
      fpsHistory.current.push(fps);
      if (fpsHistory.current.length > 5) fpsHistory.current.shift();
      lastFpsUpdate.current = now;
    }

    return fpsHistory.current.length === 0 ? 60 :
      fpsHistory.current.reduce((sum, fps) => sum + fps, 0) / fpsHistory.current.length;
  }, []);
  const safeCalculateTileCoord = useCallback((viewportDim, offset, currentScale) => {
    try {
      if (typeof viewportDim !== 'number' || typeof offset !== 'number' ||
        typeof currentScale !== 'number' || !currentScale || currentScale <= 0) {
        return 0;
      }

      const result = Math.floor(((viewportDim / 2) - offset) / (currentScale * TILE_SIZE));

      if (!Number.isFinite(result)) return 0;

      return Math.max(MAP_BOUNDS.minX, Math.min(MAP_BOUNDS.maxX, result));
    } catch (err) {
      console.error("Error calculating tile coordinate:", err);
      return 0;
    }
  }, [TILE_SIZE, MAP_BOUNDS]);
  const clearCacheOnZoomChange = useCallback(() => {
    const currentZoom = getZoomLevel(scale);

    if (lastZoomLevel.current !== null && currentZoom !== lastZoomLevel.current) {
      console.log(`Zoom level changed from ${lastZoomLevel.current} to ${currentZoom}. Clearing tile cache.`);

      loadedImages.current.clear();
      cachedCanvasPatterns.current.clear();
      tileCache.current.clear();

      setShowZoomChangeNotice(true);
      setTimeout(() => {
        if (isMounted.current) {
          setShowZoomChangeNotice(false);
        }
      }, 3000);

      lastRenderTime.current = 0;
    }

    lastZoomLevel.current = currentZoom;
  }, [scale]);


  const jumpToLocation = useCallback((x, y) => {
    if (!onMove) return;

    try {
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        console.error(`Invalid jump coordinates: ${x},${y}`);
        setError(`Invalid coordinates: ${x},${y}`);
        return;
      }

      x = Math.max(MAP_BOUNDS.minX, Math.min(MAP_BOUNDS.maxX, x));
      y = Math.max(MAP_BOUNDS.minY, Math.min(MAP_BOUNDS.maxY, y));

      const worldX = x * TILE_SIZE;
      const worldY = y * TILE_SIZE;

      if (!scale || scale <= 0) {
        console.error("Scale is invalid for jump:", scale);
        return;
      }

      const newOffsetX = viewportWidth / 2 - worldX * scale;
      const newOffsetY = viewportHeight / 2 - worldY * scale;

      if (!Number.isFinite(newOffsetX) || !Number.isFinite(newOffsetY)) {
        console.error(`Calculated invalid offsets: ${newOffsetX},${newOffsetY}`);
        return;
      }

      console.log(`Jumping to tile ${x},${y} (offset: ${newOffsetX.toFixed(0)},${newOffsetY.toFixed(0)})`);

      onMove(newOffsetX, newOffsetY);

      lastRenderTime.current = 0;
    } catch (err) {
      console.error("Error during jump:", err);
      setError(`Jump failed: ${err.message}`);
    }
  }, [viewportWidth, viewportHeight, scale, onMove, TILE_SIZE, MAP_BOUNDS]);

  const handleJumpConfirm = useCallback(() => {
    const coords = jumpCoords.split(',').map(coord => parseInt(coord.trim()));
    if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
      jumpToLocation(coords[0], coords[1]);
    }
    setShowJumpDialog(false);
  }, [jumpCoords, jumpToLocation]);

  useEffect(() => {
    if (!document.getElementById('debug-overlay-portal')) {
      const debugContainer = document.createElement('div');
      debugContainer.id = 'debug-overlay-portal';
      document.body.appendChild(debugContainer);
      debugPortalRef.current = debugContainer;
    } else {
      debugPortalRef.current = document.getElementById('debug-overlay-portal');
    }

    if (!document.getElementById('warning-overlay-portal')) {
      const warningContainer = document.createElement('div');
      warningContainer.id = 'warning-overlay-portal';
      document.body.appendChild(warningContainer);
      warningPortalRef.current = warningContainer;
    } else {
      warningPortalRef.current = document.getElementById('warning-overlay-portal');
    }

    if (!document.getElementById('load-all-warning-portal')) {
      const loadAllContainer = document.createElement('div');
      loadAllContainer.id = 'load-all-warning-portal';
      document.body.appendChild(loadAllContainer);
      loadAllWarningRef.current = loadAllContainer;
    } else {
      loadAllWarningRef.current = document.getElementById('load-all-warning-portal');
    }

    if (!document.getElementById('zoom-change-portal')) {
      const zoomChangeContainer = document.createElement('div');
      zoomChangeContainer.id = 'zoom-change-portal';
      document.body.appendChild(zoomChangeContainer);
      zoomChangePortalRef.current = zoomChangeContainer;
    } else {
      zoomChangePortalRef.current = document.getElementById('zoom-change-portal');
    }

    return () => {
      if (debugPortalRef.current) {
        document.body.removeChild(debugPortalRef.current);
      }
      if (warningPortalRef.current) {
        document.body.removeChild(warningPortalRef.current);
      }
      if (loadAllWarningRef.current) {
        document.body.removeChild(loadAllWarningRef.current);
      }
      if (zoomChangePortalRef.current) {
        document.body.removeChild(zoomChangePortalRef.current);
      }
    };
  }, []);


  useEffect(() => {

    if (!Number.isFinite(offsetX) || !Number.isFinite(offsetY) ||
      Math.abs(offsetX) > 1000000 || Math.abs(offsetY) > 1000000) {
      console.error("Movement detected invalid coordinates:", { offsetX, offsetY });
      resetToOrigin();
      return;
    }

    const deltaX = offsetX - lastOffsetX.current;
    const deltaY = offsetY - lastOffsetY.current;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);


    movementVector.current = { x: deltaX, y: deltaY };
    movementSpeed.current = distance;


    if (distance > movementThreshold) {
      isMoving.current = true;


      if (movementTimeout.current) {
        clearTimeout(movementTimeout.current);
      }


      movementTimeout.current = setTimeout(() => {
        isMoving.current = false;
      }, 100);
    }


    lastOffsetX.current = offsetX;
    lastOffsetY.current = offsetY;
  }, [offsetX, offsetY]);


  useEffect(() => {
    const handleMouseDown = (e) => {
      dragStartPosition.current = { x: e.clientX, y: e.clientY };
      lastMousePosition.current = { x: e.clientX, y: e.clientY };
      dragDistance.current = 0;
      isDragging.current = true;
    };

    const handleMouseMove = (e) => {
      if (!isDragging.current) return;


      const dx = e.clientX - dragStartPosition.current.x;
      const dy = e.clientY - dragStartPosition.current.y;
      dragDistance.current = Math.sqrt(dx * dx + dy * dy);


      const timeDelta = 16;
      const currentFps = calculateFPS();
      const fpsRatio = 60 / currentFps;


      let velX = (e.clientX - lastMousePosition.current.x) / timeDelta;
      let velY = (e.clientY - lastMousePosition.current.y) / timeDelta;


      const maxVelocity = 20 / fpsRatio;
      const velocityMagnitude = Math.sqrt(velX * velX + velY * velY);

      if (velocityMagnitude > maxVelocity) {

        const scale = maxVelocity / velocityMagnitude;
        velX *= scale;
        velY *= scale;
      }

      dragVelocity.current = { x: velX, y: velY };


      lastMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = (e) => {
      isDragging.current = false;


      const velocityMagnitude = Math.sqrt(
        dragVelocity.current.x * dragVelocity.current.x +
        dragVelocity.current.y * dragVelocity.current.y
      );

      if (velocityMagnitude > 1) {

        const multiplier = Math.min(20, velocityMagnitude * 10);
        const moveAheadX = dragVelocity.current.x * multiplier;
        const moveAheadY = dragVelocity.current.y * multiplier;


        movementVector.current = {
          x: dragVelocity.current.x * 100,
          y: dragVelocity.current.y * 100
        };


        lastRenderTime.current = 0;
      }
    };


    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);


  const getZoomLevel = useCallback((scale) => {
    if (scale <= 0.25) return 0;
    if (scale <= 0.5) return 2;
    if (scale <= 0.75) return 2;
    if (scale <= 1) return 3;
    if (scale <= 2) return 4;
    return 5;
  }, []);


  useEffect(() => {
    clearCacheOnZoomChange();
  }, [scale, clearCacheOnZoomChange]);


  useEffect(() => {
    return () => {
      isMounted.current = false;


      loadedImages.current.clear();
      cachedCanvasPatterns.current.clear();
      tileCache.current.clear();


      if (movementTimeout.current) {
        clearTimeout(movementTimeout.current);
      }
    };
  }, []);


  useEffect(() => {

    const shouldUseCanvas = scale > 3.5;

    if (shouldUseCanvas !== useCanvas) {
      setUseCanvas(shouldUseCanvas);


      if (shouldUseCanvas && !showWarning) {
        setShowWarning(true);
        setTimeout(() => {
          if (isMounted.current) {
            setShowWarning(false);
          }
        }, 3000);
      }
    }
  }, [scale, useCanvas, showWarning]);


  useEffect(() => {
    const handleKeyDown = (e) => {

      if (e.ctrlKey && e.key === 'd') {
        setShowDebug(prev => !prev);
        e.preventDefault();
      }

      if (e.ctrlKey && e.key === 'v') {
        setUseCanvas(prev => !prev);
        console.log("Manually toggling canvas mode");
        setShowZoomChangeNotice(true);
        setTimeout(() => {
          if (isMounted.current) {
            setShowZoomChangeNotice(false);
          }
        }, 3000);
        e.preventDefault();
      }


      if (e.ctrlKey && e.key === 'g') {
        setShowJumpDialog(true);
        e.preventDefault();
      }


      if (e.ctrlKey && e.key === 'l') {
        setLoadAllTiles(prev => !prev);
        e.preventDefault();


        lastRenderTime.current = 0;
      }


      if (e.ctrlKey && e.key === 'c') {
        loadedImages.current.clear();
        cachedCanvasPatterns.current.clear();
        tileCache.current.clear();

        setShowZoomChangeNotice(true);
        setTimeout(() => {
          if (isMounted.current) {
            setShowZoomChangeNotice(false);
          }
        }, 3000);


        lastRenderTime.current = 0;
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  const loadImage = useCallback((url) => {
    return new Promise((resolve, reject) => {

      if (loadedImages.current.has(url)) {
        resolve(loadedImages.current.get(url));
        return;
      }

      const img = new Image();
      img.crossOrigin = 'Anonymous';


      const coordMatch = url.match(/\/(\d+)\/(\d+)\/(\d+)\.jpg$/);
      if (coordMatch) {
        const tileZoom = parseInt(coordMatch[1]);
        const tileX = parseInt(coordMatch[2]);
        const tileY = parseInt(coordMatch[3]);


        if (isMoving.current || (isDragging.current && dragDistance.current > 100) || loadAllTiles) {
          img.fetchPriority = 'high';
        }
      }

      img.onload = () => {
        if (isMounted.current) {
          loadedImages.current.set(url, img);
          resolve(img);
        }
      };

      img.onerror = () => {
        reject(new Error(`Failed to load image: ${url}`));
      };

      img.src = url;
    });
  }, [loadAllTiles]);


  const createCanvasPattern = useCallback(async (ctx, tileKey, url, priority = 0) => {
    try {

      if (cachedCanvasPatterns.current.has(tileKey)) {
        return cachedCanvasPatterns.current.get(tileKey);
      }


      const img = await loadImage(url);


      const pattern = ctx.createPattern(img, 'repeat');
      cachedCanvasPatterns.current.set(tileKey, pattern);
      return pattern;
    } catch (err) {
      console.error(`Error creating pattern for ${tileKey}:`, err);
      return null;
    }
  }, [loadImage]);


  const calculatePriority = useCallback((x, y, centerTileX, centerTileY) => {

    if (loadAllTiles) {
      return 0.1;
    }


    const distX = x - centerTileX;
    const distY = y - centerTileY;


    const distance = Math.sqrt(distX * distX + distY * distY);
    let priority = Math.log(1 + distance) / Math.log(10);


    if (isMoving.current) {
      const alignmentWithMovement =
        distX * Math.sign(movementVector.current.x) +
        distY * Math.sign(movementVector.current.y);

      if (alignmentWithMovement > 0) {
        priority -= alignmentWithMovement * 0.5;
      }
    }


    if (isDragging.current && dragDistance.current > 100) {
      const dragDirX = Math.sign(dragVelocity.current.x);
      const dragDirY = Math.sign(dragVelocity.current.y);

      const alignmentWithDrag = distX * dragDirX + distY * dragDirY;

      if (alignmentWithDrag > 0) {
        priority -= alignmentWithDrag * 0.8;
      }
    }

    return priority;
  }, [loadAllTiles]);


  const drawCanvas = useCallback(async () => {
    if (!canvasRef.current || !isMounted.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');


    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const zoomLevel = getZoomLevel(scale);


    const viewportCenterX = viewportWidth / 2;
    const viewportCenterY = viewportHeight / 2;
    const worldCenterX = (viewportCenterX - offsetX) / scale;
    const worldCenterY = (viewportCenterY - offsetY) / scale;


    const centerTileX = Math.floor(worldCenterX / TILE_SIZE);
    const centerTileY = Math.floor(worldCenterY / TILE_SIZE);

    let tilesToDraw = [];
    let drawnTiles = 0;

    if (loadAllTiles) {




      const tilesInViewX = Math.ceil(viewportWidth / (TILE_SIZE * scale)) + 1;
      const tilesInViewY = Math.ceil(viewportHeight / (TILE_SIZE * scale)) + 1;


      const loadRadius = Math.min(10, Math.max(5, Math.floor(15 / scale)));


      for (let y = centerTileY - loadRadius; y <= centerTileY + loadRadius; y++) {
        for (let x = centerTileX - loadRadius; x <= centerTileX + loadRadius; x++) {

          if (x < MAP_BOUNDS.minX || y < MAP_BOUNDS.minY) continue;
          if (x > MAP_BOUNDS.maxX || y > MAP_BOUNDS.maxY) continue;

          const tileWorldX = x * TILE_SIZE;
          const tileWorldY = y * TILE_SIZE;


          const screenX = tileWorldX * scale + offsetX;
          const screenY = tileWorldY * scale + offsetY;


          const isVisible = !(
            screenX + TILE_SIZE * scale < -viewportWidth ||
            screenY + TILE_SIZE * scale < -viewportHeight ||
            screenX > viewportWidth * 2 ||
            screenY > viewportHeight * 2
          );

          const tileWidth = TILE_SIZE * scale;
          const tileHeight = TILE_SIZE * scale;
          const tileKey = `${zoomLevel}_${x}_${y}`;
          const url = `${TILE_BASE_URL}/${zoomLevel}/${x}/${y}.jpg`;


          const distX = x - centerTileX;
          const distY = y - centerTileY;
          const distanceFromCenter = Math.sqrt(distX * distX + distY * distY);


          tilesToDraw.push({
            x, y, screenX, screenY, tileWidth, tileHeight, tileKey, url,
            priority: distanceFromCenter,
            isVisible
          });
        }
      }
    } else {


      if (!Number.isFinite(offsetX) || !Number.isFinite(offsetY) ||
        !Number.isFinite(scale) || scale <= 0) {
        console.error("Detected invalid coordinates:", { offsetX, offsetY, scale });
        resetToOrigin();
        return;
      }
      const tilesInViewX = Math.ceil(viewportWidth / (TILE_SIZE * scale)) + 1;
      const tilesInViewY = Math.ceil(viewportHeight / (TILE_SIZE * scale)) + 1;


      const maxTilesX = Math.min(7, tilesInViewX);
      const maxTilesY = Math.min(7, tilesInViewY);


      let movementOffsetX = 0;
      let movementOffsetY = 0;

      if (isMoving.current) {

        movementOffsetX = Math.sign(movementVector.current.x) *
          Math.min(3, Math.floor(Math.abs(movementVector.current.x) / (TILE_SIZE * scale) * 4));

        movementOffsetY = Math.sign(movementVector.current.y) *
          Math.min(3, Math.floor(Math.abs(movementVector.current.y) / (TILE_SIZE * scale) * 4));
      }


      const predictedCenterTileX = centerTileX + movementOffsetX;
      const predictedCenterTileY = centerTileY + movementOffsetY;


      const startTileX = Math.max(0, predictedCenterTileX - Math.floor(maxTilesX / 2));
      const startTileY = Math.max(0, predictedCenterTileY - Math.floor(maxTilesY / 2));
      const endTileX = startTileX + maxTilesX;
      const endTileY = startTileY + maxTilesY;


      for (let y = startTileY; y <= endTileY; y++) {
        for (let x = startTileX; x <= endTileX; x++) {
          const tileWorldX = x * TILE_SIZE;
          const tileWorldY = y * TILE_SIZE;


          const screenX = tileWorldX * scale + offsetX;
          const screenY = tileWorldY * scale + offsetY;


          const isVisible = !(
            screenX + TILE_SIZE * scale < -50 ||
            screenY + TILE_SIZE * scale < -50 ||
            screenX > viewportWidth + 50 ||
            screenY > viewportHeight + 50
          );

          const tileWidth = TILE_SIZE * scale;
          const tileHeight = TILE_SIZE * scale;
          const tileKey = `${zoomLevel}_${x}_${y}`;
          const url = `${TILE_BASE_URL}/${zoomLevel}/${x}/${y}.jpg`;


          let priority = calculatePriority(x, y, centerTileX, centerTileY);


          if (isVisible) {
            priority -= 100;
          }

          tilesToDraw.push({
            x, y, screenX, screenY, tileWidth, tileHeight, tileKey, url, priority, isVisible
          });
        }
      }
    }


    tilesToDraw.sort((a, b) => a.priority - b.priority);


    if (tilesToDraw.length > MAX_TILES) {
      tilesToDraw = tilesToDraw.slice(0, MAX_TILES);
    }


    for (const tile of tilesToDraw) {

      if (!loadAllTiles && !tile.isVisible) continue;

      try {

        ctx.fillStyle = (tile.x + tile.y) % 2 === 0 ? '#333' : '#3a3a3a';
        ctx.fillRect(tile.screenX, tile.screenY, tile.tileWidth, tile.tileHeight);


        const pattern = await createCanvasPattern(ctx, tile.tileKey, tile.url, tile.priority);

        if (pattern) {
          ctx.save();
          ctx.translate(tile.screenX, tile.screenY);
          ctx.scale(scale, scale);
          ctx.fillStyle = pattern;
          ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
          ctx.restore();


          tileCache.current.set(tile.tileKey, Date.now());
        }


        if (showDebug) {
          ctx.strokeStyle = loadAllTiles ?
            'rgba(255, 163, 163, 0.5)' :
            'rgba(163, 255, 163, 0.5)';

          ctx.strokeRect(tile.screenX, tile.screenY, tile.tileWidth, tile.tileHeight);


          ctx.fillStyle = loadAllTiles ? '#ffa3a3' : '#a3ffa3';
          ctx.font = '10px monospace';
          ctx.fillText(`${tile.x},${tile.y}`, tile.screenX + 5, tile.screenY + 15);
        }

        drawnTiles++;
      } catch (err) {
        console.error(`Error drawing tile ${tile.tileKey}:`, err);
      }
    }

    if (showDebug) {

      ctx.fillStyle = 'red';
      ctx.beginPath();
      ctx.arc(viewportWidth / 2, viewportHeight / 2, 5, 0, 2 * Math.PI);
      ctx.fill();


      if (isMoving.current) {
        const speed = Math.min(50, movementSpeed.current * 2);
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(viewportWidth / 2, viewportHeight / 2);
        ctx.lineTo(
          viewportWidth / 2 + (movementVector.current.x / Math.abs(movementVector.current.x || 1) * speed),
          viewportHeight / 2 + (movementVector.current.y / Math.abs(movementVector.current.y || 1) * speed)
        );
        ctx.stroke();
      }


      if (isDragging.current && dragDistance.current > 10) {
        const dragSpeed = Math.min(50, dragDistance.current / 2);
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(viewportWidth / 2, viewportHeight / 2);
        ctx.lineTo(
          viewportWidth / 2 + (dragVelocity.current.x / Math.max(0.1, Math.abs(dragVelocity.current.x)) * dragSpeed),
          viewportHeight / 2 + (dragVelocity.current.y / Math.max(0.1, Math.abs(dragVelocity.current.y)) * dragSpeed)
        );
        ctx.stroke();
      }
    }

    return drawnTiles;
  }, [
    viewportWidth,
    viewportHeight,
    scale,
    offsetX,
    offsetY,
    getZoomLevel,
    createCanvasPattern,
    showDebug,
    calculatePriority,
    loadAllTiles,
    MAX_TILES
  ]);


  useEffect(() => {
    if (!useCanvas || !isMounted.current) return;


    if (canvasRef.current) {
      canvasRef.current.width = viewportWidth;
      canvasRef.current.height = viewportHeight;
    }


    const render = async () => {
      const now = Date.now();


      const throttleTime = loadAllTiles ? 500 :
        (isMoving.current ? 16 : 100);

      if (now - lastRenderTime.current < throttleTime) {
        frameRequest.current = requestAnimationFrame(render);
        return;
      }

      lastRenderTime.current = now;

      try {
        const drawnTiles = await drawCanvas();

        if (showDebug) {
          console.log(`Canvas rendered ${drawnTiles} tiles`);
        }
      } catch (err) {
        console.error("Canvas rendering error:", err);
        setError("Canvas error: " + err.message);
      }

      if (isMounted.current) {
        frameRequest.current = requestAnimationFrame(render);
      }
    };

    frameRequest.current = requestAnimationFrame(render);

    return () => {
      if (frameRequest.current) {
        cancelAnimationFrame(frameRequest.current);
      }
    };
  }, [useCanvas, viewportWidth, viewportHeight, scale, offsetX, offsetY, showDebug, drawCanvas, loadAllTiles]);


  useEffect(() => {
    if (useCanvas || !isMounted.current) return;

    const calculateTiles = () => {
      const now = Date.now();


      const throttleTime = loadAllTiles ? 500 :
        (isMoving.current ? 16 : 100);

      if (now - lastRenderTime.current < throttleTime) {
        frameRequest.current = requestAnimationFrame(calculateTiles);
        return;
      }

      lastRenderTime.current = now;

      try {
        const zoomLevel = getZoomLevel(scale);


        const viewportCenterX = viewportWidth / 2;
        const viewportCenterY = viewportHeight / 2;
        const worldCenterX = (viewportCenterX - offsetX) / scale;
        const worldCenterY = (viewportCenterY - offsetY) / scale;

        const centerTileX = Math.floor(worldCenterX / TILE_SIZE);
        const centerTileY = Math.floor(worldCenterY / TILE_SIZE);

        let newTiles = [];

        if (loadAllTiles) {


          const loadRadius = Math.min(10, Math.max(5, Math.floor(15 / scale)));


          for (let y = centerTileY - loadRadius; y <= centerTileY + loadRadius; y++) {
            for (let x = centerTileX - loadRadius; x <= centerTileX + loadRadius; x++) {

              if (x < MAP_BOUNDS.minX || y < MAP_BOUNDS.minY) continue;
              if (x > MAP_BOUNDS.maxX || y > MAP_BOUNDS.maxY) continue;

              addTile(x, y);
            }
          }
        } else {


          const tilesInViewX = Math.ceil(viewportWidth / (TILE_SIZE * scale)) + 1;
          const tilesInViewY = Math.ceil(viewportHeight / (TILE_SIZE * scale)) + 1;


          let movementOffsetX = 0;
          let movementOffsetY = 0;

          if (isMoving.current && Math.abs(movementVector.current.x) + Math.abs(movementVector.current.y) > 3) {

            movementOffsetX = Math.sign(movementVector.current.x) *
              Math.min(3, Math.floor(Math.abs(movementVector.current.x) / (TILE_SIZE * scale) * 4));

            movementOffsetY = Math.sign(movementVector.current.y) *
              Math.min(3, Math.floor(Math.abs(movementVector.current.y) / (TILE_SIZE * scale) * 4));
          }


          const predictedCenterTileX = centerTileX + movementOffsetX;
          const predictedCenterTileY = centerTileY + movementOffsetY;


          const tileLimit = isMoving.current
            ? (scale > 1.5 ? 49 : 64)
            : (scale > 1.5 ? 64 : 81);


          const maxTilesPerSide = Math.floor(Math.sqrt(tileLimit));
          const halfTiles = Math.floor(maxTilesPerSide / 2);

          const startTileX = Math.max(0, predictedCenterTileX - halfTiles);
          const startTileY = Math.max(0, predictedCenterTileY - halfTiles);
          const endTileX = startTileX + maxTilesPerSide - 1;
          const endTileY = startTileY + maxTilesPerSide - 1;


          addTile(centerTileX, centerTileY);


          for (let ring = 1; ring <= halfTiles && newTiles.length < tileLimit; ring++) {

            for (let x = predictedCenterTileX - ring; x <= predictedCenterTileX + ring && newTiles.length < tileLimit; x++) {
              addTile(x, predictedCenterTileY - ring);
            }


            for (let y = predictedCenterTileY - ring + 1; y <= predictedCenterTileY + ring && newTiles.length < tileLimit; y++) {
              addTile(predictedCenterTileX + ring, y);
            }


            for (let x = predictedCenterTileX + ring - 1; x >= predictedCenterTileX - ring && newTiles.length < tileLimit; x--) {
              addTile(x, predictedCenterTileY + ring);
            }


            for (let y = predictedCenterTileY + ring - 1; y >= predictedCenterTileY - ring + 1 && newTiles.length < tileLimit; y--) {
              addTile(predictedCenterTileX - ring, y);
            }
          }
        }

        function addTile(x, y) {
          if (x < MAP_BOUNDS.minX || y < MAP_BOUNDS.minY) return;
          if (x > MAP_BOUNDS.maxX || y > MAP_BOUNDS.maxY) return;

          const tileWorldX = x * TILE_SIZE;
          const tileWorldY = y * TILE_SIZE;
          const screenX = tileWorldX * scale + offsetX;
          const screenY = tileWorldY * scale + offsetY;
          const tileWidth = TILE_SIZE * scale;
          const tileHeight = TILE_SIZE * scale;


          if (!loadAllTiles) {
            const buffer = isMoving.current ? 20 : 100;


            if (
              screenX + tileWidth < -buffer ||
              screenY + tileHeight < -buffer ||
              screenX > viewportWidth + buffer ||
              screenY > viewportHeight + buffer
            ) {
              return;
            }
          }

          const tileKey = `${zoomLevel}_${x}_${y}`;
          const url = `${TILE_BASE_URL}/${zoomLevel}/${x}/${y}.jpg`;


          tileCache.current.set(tileKey, Date.now());


          const isVisible = !(
            screenX + tileWidth < 0 ||
            screenY + tileHeight < 0 ||
            screenX > viewportWidth ||
            screenY > viewportHeight
          );


          let priority = calculatePriority(x, y, centerTileX, centerTileY);


          if (!loadAllTiles && isVisible) {
            priority -= 100;
          }

          newTiles.push({
            key: tileKey,
            url: url,
            left: screenX,
            top: screenY,
            width: tileWidth,
            height: tileHeight,
            priority: priority,
            gridX: x,
            gridY: y,
            isVisible
          });
        }


        newTiles.sort((a, b) => a.priority - b.priority);


        if (newTiles.length > MAX_TILES) {
          newTiles = newTiles.slice(0, MAX_TILES);
        }

        if (isMounted.current) {
          setTiles(newTiles);
        }
      } catch (err) {
        console.error("Error calculating tiles:", err);
        setError("Error: " + err.message);
      }

      frameRequest.current = requestAnimationFrame(calculateTiles);
    };

    frameRequest.current = requestAnimationFrame(calculateTiles);

    return () => {
      if (frameRequest.current) {
        cancelAnimationFrame(frameRequest.current);
      }
    };
  }, [useCanvas, viewportWidth, viewportHeight, scale, offsetX, offsetY, getZoomLevel, calculatePriority, loadAllTiles, MAX_TILES]);


  useEffect(() => {

    if (useCanvas && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');


      ctx.strokeStyle = 'red';
      ctx.lineWidth = 10;
      ctx.strokeRect(0, 0, viewportWidth, viewportHeight);


      ctx.fillStyle = 'white';
      ctx.font = '20px Arial';
      ctx.fillText('CANVAS MODE ACTIVE', 20, 30);

      console.log('Canvas mode initialized', {
        width: viewportWidth,
        height: viewportHeight,
        scale: scale
      });
    }
  }, [useCanvas, canvasRef, viewportWidth, viewportHeight, scale]);
  const debugInfo = useMemo(() => {

    const safeFormat = (value, decimals = 0) => {
      if (value === undefined || value === null || Number.isNaN(value) || !Number.isFinite(value)) {
        return 0;
      }
      try {
        return Number(value).toFixed(decimals);
      } catch (err) {
        return 0;
      }
    };


    let dragSpeedValue = '0';
    try {
      if (isDragging.current) {
        const velX = dragVelocity.current?.x || 0;
        const velY = dragVelocity.current?.y || 0;
        dragSpeedValue = safeFormat(Math.sqrt(velX * velX + velY * velY), 1);
      }
    } catch {
      dragSpeedValue = '0';
    }


    const tileX = safeCalculateTileCoord(viewportWidth, offsetX, scale);
    const tileY = safeCalculateTileCoord(viewportHeight, offsetY, scale);

    return {
      viewport: `${safeFormat(viewportWidth)}x${safeFormat(viewportHeight)}`,
      position: `${safeFormat(offsetX)},${safeFormat(offsetY)}`,
      tileCoords: `${tileX},${tileY}`,
      scale: safeFormat(scale, 2),
      zoomLevel: safeFormat(getZoomLevel(scale)),
      renderMode: useCanvas ? 'CANVAS' : 'DIVS',
      loadMode: loadAllTiles ? 'LOAD ALL' : 'NORMAL',
      moving: isMoving.current ? 'YES' : 'NO',
      moveSpeed: isMoving.current ? safeFormat(movementSpeed.current, 1) : '0',
      dragging: isDragging.current ? 'YES' : 'NO',
      dragSpeed: dragSpeedValue,
      dragDist: safeFormat(dragDistance.current, 0),
      tiles: safeFormat(tiles?.length),
      cached: safeFormat(loadedImages.current?.size),
      memory: window.performance?.memory ?
        `${safeFormat(Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024)))}MB` :
        'N/A',
      fps: safeFormat(calculateFPS(), 0)
    };
  }, [viewportWidth, viewportHeight, offsetX, offsetY, scale, getZoomLevel, useCanvas,
    tiles?.length, loadAllTiles, safeCalculateTileCoord, calculateFPS]);
  return (
    <>
      { }
      {showDebug && debugPortalRef.current && ReactDOM.createPortal(
        <DebugOverlay>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
            S.T.A.L.K.E.R. TILE DEBUG
          </div>

          {Object.entries(debugInfo).map(([key, value]) => (
            <div key={key}>{key}: {value}</div>
          ))}

          {error && (
            <div style={{ color: '#ff9999', marginTop: '5px' }}>{error}</div>
          )}

          <div style={{ fontSize: '10px', marginTop: '10px' }}>
            Press Ctrl+D to hide debug
            <br />
            Press Ctrl+G to jump to coordinates
            <br />
            Press Ctrl+L to toggle load all tiles mode
            <br />
            Press Ctrl+C to clear tile cache
          </div>
        </DebugOverlay>,
        debugPortalRef.current
      )}

      { }
      {loadAllTiles && loadAllWarningRef.current && ReactDOM.createPortal(
        <LoadAllWarning>
          LOAD ALL TILES MODE ACTIVE - Performance may be degraded
        </LoadAllWarning>,
        loadAllWarningRef.current
      )}

      { }
      {showZoomChangeNotice && zoomChangePortalRef.current && ReactDOM.createPortal(
        <ZoomChangeNotice style={{ opacity: showZoomChangeNotice ? 1 : 0 }}>
          Tile cache cleared
        </ZoomChangeNotice>,
        zoomChangePortalRef.current
      )}

      { }
      {showJumpDialog && debugPortalRef.current && ReactDOM.createPortal(
        <JumpDialog onClick={e => e.stopPropagation()}>
          <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>
            Jump to Coordinates
          </div>
          <div>
            Enter tile coordinates (x,y):
          </div>
          <input
            type="text"
            value={jumpCoords}
            onChange={e => setJumpCoords(e.target.value)}
            placeholder="0,0"
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter') handleJumpConfirm();
              if (e.key === 'Escape') setShowJumpDialog(false);
            }}
          />
          <div>
            <button onClick={handleJumpConfirm}>Jump</button>
            <button onClick={() => setShowJumpDialog(false)}>Cancel</button>
          </div>
        </JumpDialog>,
        debugPortalRef.current
      )}

      { }
      {showWarning && warningPortalRef.current && ReactDOM.createPortal(
        <WarningOverlay>
          High zoom level detected. Using optimized canvas renderer.
        </WarningOverlay>,
        warningPortalRef.current
      )}

      {useCanvas ? (
        <CanvasContainer>
          <canvas
            ref={canvasRef}
            width={viewportWidth}
            height={viewportHeight}
            style={{ display: 'block', width: '100%', height: '100%' }}
          />
        </CanvasContainer>
      ) : (
        <TileContainer>
          {tiles.map(tile => (
            <MapTile
              key={tile.key}
              style={{
                backgroundImage: `url(${tile.url})`,
                left: tile.left,
                top: tile.top,
                width: tile.width,
                height: tile.height,
                backgroundColor: (tile.gridX + tile.gridY) % 2 === 0 ? '#333' : '#3a3a3a'
              }}
              debug={showDebug}
            />
          ))}
        </TileContainer>
      )}
    </>
  );
};

export default TileRenderer;