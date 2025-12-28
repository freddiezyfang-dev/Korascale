'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import Script from 'next/script';

type MapMode = 'single-location' | 'multi-stop-route';

interface JourneyMapProps {
  mode: MapMode;
  locations: {
    id: string;
    lng: number;
    lat: number;
  }[];
  // Day tour mode props
  radius?: number; // Radius in meters for activity range circle
  // Multi-day mode props
  dayLocations?: {
    day: number;
    title?: string;
    locations: { 
      id: string; 
      lng: number; 
      lat: number;
      name?: string;
      label?: string;
      city?: string;
      day?: number;
    }[];
  }[]; // Locations grouped by day
  currentDay?: number; // Current day to display (for progressive rendering)
  activeDay?: number; // Active day from scroll intersection observer
  className?: string;
  routeGeoJsonPath?: string; // Optional GeoJSON path for route visualization
}

declare global {
  interface Window {
    mapboxgl: any;
  }
}

// 唯一 ID 防止多实例冲突
const MAP_CONTAINER_ID = 'itinerary-map-canvas';

export default function JourneyMap({ 
  mode, 
  locations, 
  radius = 5000, 
  dayLocations,
  currentDay,
  activeDay,
  className = '',
  routeGeoJsonPath
}: JourneyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const layersInitializedRef = useRef(false);
  const lastCurrentDayRef = useRef<number | undefined>(undefined);
  const markersRef = useRef<Map<string, any>>(new Map());
  const routeGeoJsonDataRef = useRef<any>(null);

  // Stable reference for locations array (prevents dependency array size changes)
  const locationsLength = locations?.length ?? 0;
  const locationsKey = useMemo(() => {
    if (!locations || locations.length === 0) return '';
    return locations.map(loc => `${loc.id}:${loc.lng},${loc.lat}`).join('|');
  }, [locations]);

  // Single source of truth: Build flattened journeySteps array
  // Ordered by day asc, then stepIndex (location order within day)
  const journeySteps = useMemo(() => {
    if (!dayLocations || dayLocations.length === 0) return [];

    // Clone and sort by day (never mutate props)
    const sortedDays = [...dayLocations].sort((a, b) => a.day - b.day);
    
    const steps: Array<{
      day: number;
      stepIndex: number;
      id: string;
      lng: number;
      lat: number;
      label: string;
      city?: string;
    }> = [];

    sortedDays.forEach((dayData) => {
      dayData.locations.forEach((loc, stepIndex) => {
        const lng = Number(loc.lng);
        const lat = Number(loc.lat);

        // Validate coordinates - 简化逻辑：直接使用原始数值，不进行自动校正
        if (isNaN(lng) || isNaN(lat) || lng < -180 || lng > 180 || lat < -90 || lat > 90) {
          console.warn(`[JourneyMap] Invalid coordinates for ${loc.id}:`, { lng, lat });
          return;
        }

        // 直接使用原始坐标，不进行自动校正（避免误判）
        const finalLng = lng;
        const finalLat = lat;

        // 增强 Marker 标签显示：优先使用 city
        const label = loc.city || 
                     loc.name || 
                     loc.label || 
                     `Day ${dayData.day}`;

        steps.push({
          day: dayData.day,
          stepIndex,
          id: loc.id,
          lng: finalLng,
          lat: finalLat,
          label,
          city: loc.city
        });
      });
    });

    return steps;
  }, [dayLocations]);

  // Stable reference for journeySteps (use length + a content hash to detect changes)
  const journeyStepsLength = journeySteps.length;
  const journeyStepsKey = useMemo(() => {
    if (journeySteps.length === 0) return '';
    return journeySteps.map(step => `${step.day}-${step.stepIndex}-${step.id}`).join('|');
  }, [journeySteps]);

  // 初始化地图
  useEffect(() => {
    if (!isScriptLoaded || !mapContainer.current || map.current) return;

    const mapboxgl = (window as any).mapboxgl;
    if (!mapboxgl) {
      console.error("[JourneyMap] MapboxGL script missing on window");
      return;
    }

    if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
      console.error("[JourneyMap] Mapbox token not configured");
      return;
    }

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    try {
      console.log("[JourneyMap] Initializing Mapbox Instance...");
      // 移除固定的成都经纬度兜底逻辑，使用默认中心点
      const m = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [0, 0], // 默认中心点，后续会根据实际数据计算边界
        zoom: 2,
        attributionControl: false
      });

      map.current = m;
      (window as any).__MAP__ = m;
      console.log("[JourneyMap] Map instance created and assigned to window.__MAP__");

      m.on('load', () => {
        console.log("[JourneyMap] Map Load Success");
        m.resize();
        
        if (mode === 'multi-stop-route' && journeySteps.length > 0) {
          initializeMarkers(m);
          initializeMultiDayLayers(m);
        } else if (mode === 'single-location' && locations && locations.length > 0) {
          updateSingleLocation(m);
        }
      });

      m.on('style.load', () => {
        // 样式加载后重新初始化图层
        layersInitializedRef.current = false;
        if (mode === 'multi-stop-route' && journeySteps.length > 0) {
          initializeMarkers(m);
          initializeMultiDayLayers(m);
        } else if (mode === 'single-location' && locations && locations.length > 0) {
          updateSingleLocation(m);
        }
      });

      m.on('error', (e: any) => {
        console.error('[JourneyMap error]', e?.error || e);
      });

    } catch (err) {
      console.error("[JourneyMap] Initialization Error:", err);
    }

    return () => {
      if (map.current) {
        markersRef.current.forEach(({ marker }) => {
          marker.remove();
        });
        markersRef.current.clear();
        
        map.current.remove();
        map.current = null;
      }
    };
  }, [isScriptLoaded, mode, journeyStepsKey, journeyStepsLength]);

  // 初始化 Marker 函数 - 使用 journeySteps 作为单一数据源
  const initializeMarkers = (m: any) => {
    if (journeySteps.length === 0) {
      console.warn('[JourneyMap] No journeySteps to create markers');
      return;
    }
    
    const mapboxgl = (window as any).mapboxgl;
    if (!mapboxgl) {
      console.error('[JourneyMap] MapboxGL not available');
      return;
    }

    // 清理现有 markers
    markersRef.current.forEach(({ marker }) => {
      marker.remove();
    });
    markersRef.current.clear();

    // 检查 ID 唯一性
    const markerKeys = new Set<string>();
    const duplicateIds: string[] = [];

    // Use journeySteps as single source of truth
    journeySteps.forEach((step) => {
      const markerKey = `${step.day}-${step.id}`;
      
      // 检查 ID 是否重复
      if (markerKeys.has(markerKey)) {
        duplicateIds.push(markerKey);
        console.warn(`[JourneyMap] Duplicate marker key detected: ${markerKey}`);
      }
      markerKeys.add(markerKey);

      // 验证坐标
      if (isNaN(step.lng) || isNaN(step.lat) || step.lng < -180 || step.lng > 180 || step.lat < -90 || step.lat > 90) {
        console.warn(`[JourneyMap] Invalid coordinates for marker ${markerKey}:`, { lng: step.lng, lat: step.lat });
        return;
      }

      const markerContainer = document.createElement('div');
      markerContainer.className = 'custom-marker';
      markerContainer.style.display = 'flex';

      const dot = document.createElement('div');
      dot.className = 'marker-dot';
      
      const label = document.createElement('div');
      label.className = 'marker-label';
      label.textContent = step.label;

      markerContainer.appendChild(dot);
      markerContainer.appendChild(label);

      const marker = new mapboxgl.Marker({
        element: markerContainer,
        anchor: 'bottom'
      })
        .setLngLat([step.lng, step.lat])
        .addTo(m);

      markersRef.current.set(markerKey, {
        marker,
        element: markerContainer,
        day: step.day
      });
    });

    console.log(`[JourneyMap] Markers initialized:`, {
      total: markersRef.current.size,
      expected: journeySteps.length,
      duplicateIds: duplicateIds.length > 0 ? duplicateIds : 'none',
      markerKeys: Array.from(markersRef.current.keys())
    });
  };

  // 创建曲线连线的辅助函数：使用 Turf.js bezier-spline 实现优雅的弧线
  const createCurvedLine = (coords: [number, number][]): [number, number][] => {
    if (coords.length < 2) return coords;
    
    // 尝试使用 Turf.js bezierSpline（如果已安装）
    // 注意：由于是客户端组件，Turf.js 需要在运行时动态导入
    // 这里先使用改进的 fallback 方法，Turf.js 集成可以在后续优化
    
    // Fallback: 使用改进的二次贝塞尔曲线插值（更平滑的弧线，更明显的曲线效果）
    const curved: [number, number][] = [];
    curved.push(coords[0]);
    
    for (let i = 0; i < coords.length - 1; i++) {
      const p1 = coords[i];
      const p2 = coords[i + 1];
      
      // 计算中点
      const midLng = (p1[0] + p2[0]) / 2;
      const midLat = (p1[1] + p2[1]) / 2;
      
      // 增加偏移量以形成更明显的曲线（从 0.1 增加到 0.15）
      const offset = 0.15;
      const controlLng = midLng + (p2[1] - p1[1]) * offset;
      const controlLat = midLat - (p2[0] - p1[0]) * offset;
      
      // 生成更多的中间点以实现更平滑的曲线（从 0.2 步进改为 0.1 步进）
      for (let t = 0.1; t < 1; t += 0.1) {
        const t1 = 1 - t;
        const lng = t1 * t1 * p1[0] + 2 * t1 * t * controlLng + t * t * p2[0];
        const lat = t1 * t1 * p1[1] + 2 * t1 * t * controlLat + t * t * p2[1];
        curved.push([lng, lat]);
      }
    }
    
    curved.push(coords[coords.length - 1]);
    return curved;
  };

  // Single-location mode: 单点 + 圆形活动范围
  const updateSingleLocation = (m: any) => {
    if (!m.isStyleLoaded()) return;

    try {
      const location = locations[0];
      const lng = Number(location.lng);
      const lat = Number(location.lat);

      // 移除现有图层
      if (m.getLayer('day-tour-center')) m.removeLayer('day-tour-center');
      if (m.getLayer('day-tour-circle')) m.removeLayer('day-tour-circle');
      if (m.getSource('day-tour-center')) m.removeSource('day-tour-center');
      if (m.getSource('day-tour-circle')) m.removeSource('day-tour-circle');

      // 添加中心点
      m.addSource('day-tour-center', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [lng, lat] }
        }
      });

      m.addLayer({
        id: 'day-tour-center',
        type: 'circle',
        source: 'day-tour-center',
        paint: {
          'circle-radius': 8,
          'circle-color': '#1e3b32',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      // 添加活动范围圆形
      m.addSource('day-tour-circle', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [lng, lat] }
        }
      });

      const radiusAtZoom9 = radius / 85;
      const radiusAtZoom15 = radius / 2.65;

      m.addLayer({
        id: 'day-tour-circle',
        type: 'circle',
        source: 'day-tour-circle',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            5, Math.max(10, radius / 2700),
            9, radiusAtZoom9,
            15, radiusAtZoom15
          ],
          'circle-color': '#1e3b32',
          'circle-opacity': 0.1,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#1e3b32',
          'circle-stroke-opacity': 0.3
        }
      });

      // 相机移动到位置
      m.easeTo({
        center: [lng, lat],
        zoom: 9,
        pitch: 35,
        bearing: 20,
        duration: 1200
      });

      console.log("[JourneyMap] Single location mode initialized");
    } catch (err) {
      console.error("[JourneyMap] Error updating single location:", err);
    }
  };

  // 加载 GeoJSON 路径数据（可选功能，静默失败）
  useEffect(() => {
    // 更严格的检查：包括 undefined、null、空字符串
    if (!routeGeoJsonPath || routeGeoJsonPath.trim() === '') {
      routeGeoJsonDataRef.current = null;
      return;
    }

    const loadGeoJson = async () => {
      try {
        console.log("[JourneyMap] Loading route GeoJSON from:", routeGeoJsonPath);
        const response = await fetch(routeGeoJsonPath);
        if (!response.ok) {
          // 404 或其他错误：静默失败，不抛出异常（GeoJSON 是可选的）
          console.warn(`[JourneyMap] GeoJSON not found or failed to load: ${response.status} ${response.statusText}. This is optional, continuing without GeoJSON route.`);
          routeGeoJsonDataRef.current = null;
          return;
        }
        const geojson = await response.json();
        
        // 验证 GeoJSON 格式 - 支持 FeatureCollection 或单个 Feature
        if (!geojson) {
          console.warn('[JourneyMap] Invalid GeoJSON: empty data. Continuing without GeoJSON route.');
          routeGeoJsonDataRef.current = null;
          return;
        }
        
        // 如果是 FeatureCollection，提取第一个 LineString feature
        if (geojson.type === 'FeatureCollection' && Array.isArray(geojson.features)) {
          const lineFeature = geojson.features.find((f: any) => 
            f.geometry && f.geometry.type === 'LineString'
          );
          if (lineFeature) {
            routeGeoJsonDataRef.current = lineFeature;
            console.log("[JourneyMap] Route GeoJSON loaded successfully (FeatureCollection)", {
              featuresCount: geojson.features.length,
              usingFeature: lineFeature.id || 'first LineString'
            });
          } else {
            console.warn('[JourneyMap] No LineString feature found in GeoJSON FeatureCollection. Continuing without GeoJSON route.');
            routeGeoJsonDataRef.current = null;
            return;
          }
        } else if (geojson.type === 'Feature' && geojson.geometry && geojson.geometry.type === 'LineString') {
          // 如果是单个 Feature，直接使用
          routeGeoJsonDataRef.current = geojson;
          console.log("[JourneyMap] Route GeoJSON loaded successfully (Feature)");
        } else {
          console.warn('[JourneyMap] Invalid GeoJSON format: expected FeatureCollection with LineString feature or LineString Feature. Continuing without GeoJSON route.');
          routeGeoJsonDataRef.current = null;
          return;
        }
        
        // 如果地图已初始化，立即更新路线
        const m = map.current;
        if (m && m.isStyleLoaded() && mode === 'multi-stop-route') {
          const source = m.getSource('multi-day-route');
          if (source && source.type === 'geojson') {
            (source as any).setData(routeGeoJsonDataRef.current);
            console.log("[JourneyMap] Route updated with GeoJSON data");
          }
        }
      } catch (error) {
        // 网络错误或其他异常：静默失败，不抛出异常
        console.warn("[JourneyMap] Error loading route GeoJSON (this is optional):", error);
        routeGeoJsonDataRef.current = null;
      }
    };

    loadGeoJson();
  }, [routeGeoJsonPath, mode]);

  // Multi-stop route mode: 初始化图层
  const initializeMultiDayLayers = (m: any) => {
    if (!m.isStyleLoaded() || layersInitializedRef.current) return;

    try {
      const sourceId = 'multi-day-route';
      const layerId = 'multi-day-route';

      if (m.getLayer(layerId)) m.removeLayer(layerId);
      if (m.getSource(sourceId)) m.removeSource(sourceId);

      // 如果有 GeoJSON 路径数据，使用它；否则使用空 LineString
      const initialData = routeGeoJsonDataRef.current || {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: []
        }
      };

      m.addSource(sourceId, {
        type: 'geojson',
        data: initialData
      });

      m.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#1e3b32', // 深绿色，与背景形成对比
          'line-width': 5, // 增加到 5 以便观察
          'line-opacity': 1, // 设置为 1 确保完全可见
          'line-dasharray': [2, 2] // 虚线样式
        }
      });

      layersInitializedRef.current = true;
      console.log("[JourneyMap] Multi-day layers initialized", {
        hasGeoJsonRoute: !!routeGeoJsonDataRef.current
      });
    } catch (err) {
      console.error("[JourneyMap] Error initializing multi-day layers:", err);
    }
  };

  // Multi-stop route mode: 更新路线 - 使用 journeySteps 作为单一数据源
  const updateMultiDayRoute = (m: any) => {
    if (!m.isStyleLoaded()) return;

    try {
      const mapboxgl = (window as any).mapboxgl;
      if (!mapboxgl) return;

      const targetDay = activeDay !== undefined ? activeDay : (currentDay !== undefined ? currentDay : undefined);
      
      // Filter steps by targetDay using journeySteps (single source of truth)
      const stepsToShow = targetDay 
        ? journeySteps.filter(step => step.day <= targetDay)
        : journeySteps;

      // 调试：打印当前要绘制的步骤
      console.log('[JourneyMap] Current steps to draw line:', {
        targetDay,
        totalSteps: journeySteps.length,
        stepsToShow: stepsToShow.length,
        steps: stepsToShow.map(s => ({ day: s.day, id: s.id, coords: [s.lng, s.lat] }))
      });

      if (stepsToShow.length === 0) {
        console.warn("[JourneyMap] No valid steps for multi-day route");
        return;
      }

      // Build coordinates array from filtered steps (already sorted by day, then stepIndex)
      const allCoords: [number, number][] = stepsToShow.map(step => [step.lng, step.lat]);
      
      // 检查坐标是否为空
      if (allCoords.length === 0) {
        console.warn("[JourneyMap] allCoords is empty after mapping");
        return;
      }
      
      // 连线至少需要 2 个点，但如果只有 1 个点，也要确保数据源不为空
      if (allCoords.length < 2) {
        console.warn(`[JourneyMap] Not enough points to draw line (need 2, got ${allCoords.length}), but will still update source`);
        // 如果只有一个点，添加一个微小偏移的点，确保可以生成线段
        const singlePoint = allCoords[0];
        allCoords.push([
          singlePoint[0] + 0.0001,
          singlePoint[1] + 0.0001
        ]);
        console.log(`[JourneyMap] Added offset point to single coordinate:`, allCoords);
      }
      
      // 检查所有坐标点是否相同（防止所有点重合）
      const firstCoord = allCoords[0];
      const allSame = allCoords.every(coord => 
        Math.abs(coord[0] - firstCoord[0]) < 0.0001 && 
        Math.abs(coord[1] - firstCoord[1]) < 0.0001
      );
      
      if (allSame && allCoords.length > 1) {
        console.warn("[JourneyMap] All coordinates are the same, adding offset");
        // 为每个点添加微小偏移，确保可以生成路线
        const adjustedCoords: [number, number][] = allCoords.map((coord, idx) => [
          coord[0] + (idx * 0.0001),
          coord[1] + (idx * 0.0001)
        ]);
        allCoords.splice(0, allCoords.length, ...adjustedCoords);
        console.log("[JourneyMap] Adjusted coordinates with offset:", allCoords);
      }

      // Find first step of activeDay for camera anchor
      let activeDayCoords: [number, number] | null = null;
      if (targetDay !== undefined) {
        const firstStepOfDay = journeySteps.find(step => step.day === targetDay);
        if (firstStepOfDay) {
          activeDayCoords = [firstStepOfDay.lng, firstStepOfDay.lat];
        }
      }

      // 生成曲线坐标
      let curvedCoords = allCoords;
      if (allCoords.length >= 2) {
        try {
          curvedCoords = createCurvedLine(allCoords);
        } catch (err) {
          console.warn("[JourneyMap] Error creating curved line, using straight line:", err);
          curvedCoords = allCoords;
        }
      }
      
      // 确保 curvedCoords 不为空
      if (!curvedCoords || curvedCoords.length === 0) {
        console.error("[JourneyMap] curvedCoords is empty, using allCoords");
        curvedCoords = allCoords;
      }

      const sourceId = 'multi-day-route';
      const source = m.getSource(sourceId);

      if (!source) {
        console.warn("[JourneyMap] Source not found, initializing layers");
        initializeMultiDayLayers(m);
        // 等待图层初始化后再次尝试更新
        setTimeout(() => {
          const newSource = m.getSource(sourceId);
          if (newSource && newSource.type === 'geojson') {
            // 如果有预加载的 GeoJSON 路径数据，优先使用它
            const dataToUse = routeGeoJsonDataRef.current || {
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: curvedCoords
              }
            };
            (newSource as any).setData(dataToUse);
          }
        }, 100);
        return;
      }

      if (source && source.type === 'geojson') {
        // 如果有预加载的 GeoJSON 路径数据，优先使用它
        let geoJsonData;
        if (routeGeoJsonDataRef.current) {
          // 使用 GeoJSON 路径数据
          geoJsonData = routeGeoJsonDataRef.current;
          console.log("[JourneyMap] Using preloaded GeoJSON route data");
        } else {
          // 否则使用计算出的曲线坐标
          geoJsonData = {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: curvedCoords
            }
          };
        }
        
        // 强制更新数据源，即使只有一个点也要更新
        (source as any).setData(geoJsonData);
        
        // 确保虚线样式在更新时依然生效
        if (m.getLayer('multi-day-route')) {
          m.setPaintProperty('multi-day-route', 'line-dasharray', [2, 2]);
        }
        
        console.log(`[JourneyMap] Route updated dynamically to day ${targetDay || 'all'}`, {
          originalPoints: allCoords.length,
          curvedPoints: curvedCoords.length,
          firstPoint: curvedCoords[0],
          lastPoint: curvedCoords[curvedCoords.length - 1],
          sourceData: (source as any)._data
        });
        
        // 验证数据源是否正确更新
        const sourceData = (source as any)._data;
        if (sourceData && sourceData.geometry && sourceData.geometry.coordinates) {
          console.log('[JourneyMap] Source data verified:', {
            coordinatesCount: sourceData.geometry.coordinates.length,
            firstCoord: sourceData.geometry.coordinates[0],
            lastCoord: sourceData.geometry.coordinates[sourceData.geometry.coordinates.length - 1]
          });
        }
      }

      // 自动缩放：计算所有点的边界并执行 fitBounds
      if (allCoords.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        allCoords.forEach(c => bounds.extend(c));
        
        m.fitBounds(bounds, { 
          padding: 50, 
          duration: 1200, 
          maxZoom: 10,
          essential: true
        });
        
        console.log("[JourneyMap] Auto-zoom fitBounds completed with padding: 50");
      } else if (activeDayCoords && targetDay) {
        // 当 activeDay 变化时，使用 flyTo
        m.flyTo({
          center: activeDayCoords,
          zoom: 10, // 从 9 改为 10，使镜头聚焦时能更清晰地看到景区
          duration: 1500,
          essential: true
        });
        console.log(`[JourneyMap] Map centered on active day ${targetDay} at:`, activeDayCoords);
      }

      m.resize();
    } catch (err) {
      console.error("[JourneyMap] Error updating multi-day route:", err);
    }
  };

  // Single-location mode: 更新单点地图
  useEffect(() => {
    const m = map.current;
    if (!m || mode !== 'single-location' || !locations || locations.length === 0) return;

    const updateSingle = () => {
      if (!m.isStyleLoaded()) return;
      updateSingleLocation(m);
    };

    if (m.isStyleLoaded()) {
      updateSingle();
    } else {
      m.once('style.load', updateSingle);
    }
  }, [mode, locationsKey, locationsLength, radius, isScriptLoaded]);

  // 标准化依赖项：使用稳定的字符串值，避免数组长度变化
  const routeUrlForUpdate = routeGeoJsonPath || '';
  const mapModeForUpdate = mode || 'single-location';
  const currentDayValue = currentDay !== undefined ? currentDay : -1;
  const activeDayValue = activeDay !== undefined ? activeDay : -1;
  
  // Multi-stop route mode: 更新多日路线 - 使用 journeySteps 作为单一数据源
  useEffect(() => {
    const m = map.current;
    if (!m || mapModeForUpdate !== 'multi-stop-route' || journeyStepsLength === 0) return;

    const updateRoute = () => {
      if (!m.isStyleLoaded()) return;
      
      // 如果 GeoJSON 数据已加载，等待一下确保数据可用
      if (routeUrlForUpdate && !routeGeoJsonDataRef.current) {
        // 等待 GeoJSON 加载完成
        const checkInterval = setInterval(() => {
          if (routeGeoJsonDataRef.current || !routeUrlForUpdate) {
            clearInterval(checkInterval);
            if (!m.getSource('multi-day-route')) {
              initializeMultiDayLayers(m);
            }
            updateMultiDayRoute(m);
          }
        }, 100);
        
        // 超时保护：5秒后即使没有加载也继续
        setTimeout(() => {
          clearInterval(checkInterval);
          if (!m.getSource('multi-day-route')) {
            initializeMultiDayLayers(m);
          }
          updateMultiDayRoute(m);
        }, 5000);
        
        return;
      }
      
      if (!m.getSource('multi-day-route')) {
        initializeMultiDayLayers(m);
      }
      updateMultiDayRoute(m);
    };

    if (m.isStyleLoaded()) {
      updateRoute();
    } else {
      m.once('style.load', updateRoute);
    }
  }, [mapModeForUpdate, journeyStepsKey, journeyStepsLength, currentDayValue, activeDayValue, isScriptLoaded, routeUrlForUpdate]); // 使用稳定的值，确保数组长度固定为 7

  // 监听 journeyData 变化，重新计算边界并执行 fitBounds
  useEffect(() => {
    const m = map.current;
    if (!m || !m.isStyleLoaded()) return;

    const mapboxgl = (window as any).mapboxgl;
    if (!mapboxgl) return;

    // 获取所有行程点的坐标
    let allCoords: [number, number][] = [];

    // 优先从 GeoJSON 路径数据中提取坐标
    if (routeGeoJsonDataRef.current) {
      const geoJsonData = routeGeoJsonDataRef.current;
      if (geoJsonData.geometry && geoJsonData.geometry.type === 'LineString' && Array.isArray(geoJsonData.geometry.coordinates)) {
        allCoords = geoJsonData.geometry.coordinates as [number, number][];
        console.log("[JourneyMap] Extracted coordinates from GeoJSON route data", {
          coordinatesCount: allCoords.length
        });
      }
    }

    // 如果没有从 GeoJSON 获取到坐标，从 journeySteps 或 locations 获取
    if (allCoords.length === 0) {
      if (mapModeForUpdate === 'multi-stop-route' && journeySteps.length > 0) {
        // 多日路线模式：从 journeySteps 获取所有坐标
        allCoords = journeySteps.map(step => [step.lng, step.lat]);
      } else if (mapModeForUpdate === 'single-location' && locations && locations.length > 0) {
        // 单点模式：从 locations 获取坐标
        allCoords = locations.map(loc => [Number(loc.lng), Number(loc.lat)]);
      }
    }

    // 如果有坐标点，计算边界并执行 fitBounds
    if (allCoords.length > 0) {
      try {
        const bounds = new mapboxgl.LngLatBounds();
        allCoords.forEach(c => {
          // 验证坐标有效性
          if (!isNaN(c[0]) && !isNaN(c[1]) && c[0] >= -180 && c[0] <= 180 && c[1] >= -90 && c[1] <= 90) {
            bounds.extend(c);
          }
        });

        // 确保边界有效
        if (bounds.getNorth() !== bounds.getSouth() || bounds.getEast() !== bounds.getWest()) {
          m.fitBounds(bounds, { 
            padding: 80, // 给边缘留点呼吸感，参考 A&K 的精致布局
            duration: 2000, // 平滑飞向新行程所在的区域
            maxZoom: 10,
            essential: true
          });
          console.log("[JourneyMap] fitBounds executed on journeyData change", {
            bounds: {
              north: bounds.getNorth(),
              south: bounds.getSouth(),
              east: bounds.getEast(),
              west: bounds.getWest()
            },
            pointsCount: allCoords.length,
            source: routeGeoJsonDataRef.current ? 'GeoJSON' : 'journeySteps/locations'
          });
        } else {
          // 如果所有点都相同，只移动到该点
          const center = allCoords[0];
          m.easeTo({
            center: center,
            zoom: 9,
            duration: 1200
          });
          console.log("[JourneyMap] All points are the same, centered on single point", center);
        }
      } catch (err) {
        console.error("[JourneyMap] Error calculating bounds:", err);
      }
    }
  }, [routeUrlForUpdate, mapModeForUpdate, journeyStepsKey, locationsKey, isScriptLoaded]); // 使用稳定的字符串值，确保数组长度固定为 5

  // FlyTo 动画：监听 currentDay 变化 - 使用 journeySteps 作为单一数据源
  useEffect(() => {
    const m = map.current;
    if (!m || mapModeForUpdate !== 'multi-stop-route' || journeyStepsLength === 0) return;
    if (!m.isStyleLoaded()) return;

    const targetDay = activeDayValue !== -1 ? activeDayValue : (currentDayValue !== -1 ? currentDayValue : undefined);
    
    if (targetDay === undefined || targetDay === -1 || targetDay === lastCurrentDayRef.current) return;
    
    // Find first step of targetDay using journeySteps (single source of truth)
    const firstStepOfDay = journeySteps.find(step => step.day === targetDay);
    
    if (!firstStepOfDay) {
      console.warn(`[JourneyMap] No step found for day ${targetDay}`);
      return;
    }

    m.flyTo({
      center: [firstStepOfDay.lng, firstStepOfDay.lat],
      zoom: 9, // 从 6 改为 9，使镜头聚焦时能清晰看到景区地形
      pitch: 45,
      bearing: 0,
      duration: 2500,
      essential: true
    });

    lastCurrentDayRef.current = targetDay;
    console.log(`[JourneyMap] FlyTo executed for day ${targetDay} at:`, [firstStepOfDay.lng, firstStepOfDay.lat]);
  }, [mapModeForUpdate, journeyStepsKey, journeyStepsLength, currentDayValue, activeDayValue, isScriptLoaded]); // 使用稳定的值，确保数组长度固定为 6

  // 动态高亮：根据 activeDay 高亮 Marker
  useEffect(() => {
    if (!map.current || mapModeForUpdate !== 'multi-stop-route') return;
    
    const targetDay = activeDayValue !== -1 ? activeDayValue : (currentDayValue !== -1 ? currentDayValue : undefined);

    markersRef.current.forEach(({ element, day }) => {
      if (targetDay !== undefined && targetDay !== -1 && day === targetDay) {
        element.classList.add('is-active');
      } else {
        element.classList.remove('is-active');
      }
    });

    if (targetDay !== undefined && targetDay !== -1) {
      console.log(`[JourneyMap] Markers highlighted for day ${targetDay}`);
    }
  }, [mapModeForUpdate, currentDayValue, activeDayValue]); // 使用稳定的值，确保数组长度固定为 3

  return (
    <>
      <link href="https://api.mapbox.com/mapbox-gl-js/v3.17.0/mapbox-gl.css" rel="stylesheet" />
      <Script
        src="https://api.mapbox.com/mapbox-gl-js/v3.17.0/mapbox-gl.js"
        strategy="afterInteractive"
        onLoad={() => {
          if ((window as any).mapboxgl) {
            setIsScriptLoaded(true);
          }
        }}
      />
      <div 
        className={`relative w-full h-full min-h-[500px] bg-gray-100 ${className}`}
        style={{
          overflow: 'visible',
          position: 'relative',
          zIndex: 1,
          pointerEvents: 'auto'
        }}
      >
        {!process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-4">
              <p className="text-red-600 font-semibold mb-2">Mapbox token not configured</p>
              <p className="text-gray-600 text-sm">
                Please set NEXT_PUBLIC_MAPBOX_TOKEN in your environment variables
              </p>
            </div>
          </div>
        ) : (
          <div 
            id={MAP_CONTAINER_ID}
            ref={mapContainer} 
            className="absolute inset-0 w-full h-full"
            style={{
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0
            }}
          />
        )}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-marker {
          display: flex !important;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          z-index: 10;
          transition: all 0.3s ease;
        }
        .marker-dot {
          width: 10px;
          height: 10px;
          background-color: #1e3b32;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          transition: all 0.3s ease;
        }
        .marker-label {
          background-color: #1e3b32;
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          white-space: nowrap;
          font-family: serif;
          opacity: 0.9;
          transition: all 0.3s ease;
        }
        .custom-marker.is-active {
          transform: scale(1.4);
          z-index: 100;
        }
        .custom-marker.is-active .marker-dot {
          background-color: #d4a574;
          border-color: #d4a574;
        }
        .custom-marker.is-active .marker-label {
          background-color: #d4a574;
          opacity: 1;
        }
      `}} />
    </>
  );
}

