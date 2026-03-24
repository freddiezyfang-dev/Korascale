'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import Script from 'next/script';
import { GEOGRAPHY_DATABASE } from '@/lib/geographyDatabase';

type MapMode = 'single-location' | 'multi-stop-route';

interface JourneyMapProps {
  mapId?: string;
  journeySteps?: any[];
  mode?: MapMode;
  locations?: {
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
const ROUTE_LAYER_ID = 'route';
const ROUTE_SOURCE_ID = 'route';
const LEGACY_ROUTE_LAYER_ID = 'multi-day-route';
const LEGACY_ROUTE_SOURCE_ID = 'multi-day-route';

export default function JourneyMap({ 
  mapId,
  journeySteps: rawJourneySteps = [],
  mode: requestedMode = 'multi-stop-route', 
  locations: requestedLocations = [], 
  radius = 5000, 
  dayLocations: requestedDayLocations,
  currentDay,
  activeDay,
  className = '',
  routeGeoJsonPath
}: JourneyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const scriptRetryCountRef = useRef<number>(0);
  const scriptRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isContainerReady, setIsContainerReady] = useState(false);
  const layersInitializedRef = useRef(false);
  const markersRef = useRef<Map<string, any>>(new Map());
  const routeGeoJsonDataRef = useRef<any>(null);
  const hasShownOverviewRef = useRef(false);
  const mapContainerId = mapId || MAP_CONTAINER_ID;

  const removeMarkers = () => {
    markersRef.current.forEach(({ marker }) => {
      try {
        marker.remove();
      } catch (error) {
        console.warn('[JourneyMap] Error removing marker:', error);
      }
    });
    markersRef.current.clear();
  };

  const removeRouteArtifacts = (m: any) => {
    if (!m) return;

    if (m.getLayer(ROUTE_LAYER_ID)) m.removeLayer(ROUTE_LAYER_ID);
    if (m.getSource(ROUTE_SOURCE_ID)) m.removeSource(ROUTE_SOURCE_ID);

    if (m.getLayer(LEGACY_ROUTE_LAYER_ID)) m.removeLayer(LEGACY_ROUTE_LAYER_ID);
    if (m.getSource(LEGACY_ROUTE_SOURCE_ID)) m.removeSource(LEGACY_ROUTE_SOURCE_ID);
  };

  const isValidLineCoordinate = (coord: unknown): coord is [number, number] => {
    if (!Array.isArray(coord) || coord.length < 2) return false;

    const lng = Number(coord[0]);
    const lat = Number(coord[1]);

    return Number.isFinite(lng) && Number.isFinite(lat) && lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
  };

  const sanitizeLineCoordinates = (coords: unknown): [number, number][] => {
    if (!Array.isArray(coords)) return [];

    return coords
      .filter(isValidLineCoordinate)
      .map((coord) => [Number(coord[0]), Number(coord[1])] as [number, number]);
  };

  const dedupeConsecutiveCoordinates = (coords: [number, number][]): [number, number][] => {
    return coords.filter((coord, index) => {
      if (index === 0) return true;

      const prev = coords[index - 1];
      return !(coord[0] === prev[0] && coord[1] === prev[1]);
    });
  };

  const extractCoordsFromKeywordText = (...values: unknown[]): [number, number] | null => {
    const haystack = values
      .flatMap((value) => {
        if (Array.isArray(value)) return value;
        return [value];
      })
      .filter(Boolean)
      .map((value) => String(value).toLowerCase())
      .join(' ');

    if (!haystack) return null;

    const matchedFallback = Object.entries(GEOGRAPHY_DATABASE).find(([keyword]) =>
      haystack.includes(keyword.toLowerCase())
    );

    return matchedFallback?.[1] || null;
  };

  const extractCoordsFromValue = (value: unknown): [number, number] | null => {
    if (!value) return null;

    if (typeof value === 'string') {
      const matches = value.match(/-?\d+(?:\.\d+)?/g);
      if (matches && matches.length >= 2) {
        const coords = sanitizeLineCoordinates([[Number(matches[0]), Number(matches[1])]]);
        return coords[0] || null;
      }
    }

    if (Array.isArray(value)) {
      const coords = sanitizeLineCoordinates([value]);
      return coords[0] || null;
    }

    if (typeof value === 'object') {
      const candidate = value as {
        lng?: unknown;
        lat?: unknown;
        lon?: unknown;
        latitude?: unknown;
        longitude?: unknown;
        coords?: unknown;
        coordinates?: unknown;
        mapCenter?: unknown;
        center?: unknown;
        position?: unknown;
        geo?: unknown;
        point?: unknown;
      };

      const lng = Number(candidate.lng ?? candidate.lon ?? candidate.longitude);
      const lat = Number(candidate.lat ?? candidate.latitude);

      if (
        Number.isFinite(lng) &&
        Number.isFinite(lat) &&
        lng >= -180 &&
        lng <= 180 &&
        lat >= -90 &&
        lat <= 90
      ) {
        return [lng, lat];
      }

      return (
        extractCoordsFromValue(candidate.coords) ||
        extractCoordsFromValue(candidate.coordinates) ||
        extractCoordsFromValue(candidate.mapCenter) ||
        extractCoordsFromValue(candidate.center) ||
        extractCoordsFromValue(candidate.position) ||
        extractCoordsFromValue(candidate.geo) ||
        extractCoordsFromValue(candidate.point)
      );
    }

    return null;
  };

  const extractCoordsFromStep = (step: any): [number, number] | null => {
    const directLng = Number(step?.longitude ?? step?.lng);
    const directLat = Number(step?.latitude ?? step?.lat);

    if (
      Number.isFinite(directLng) &&
      Number.isFinite(directLat) &&
      directLng >= -180 &&
      directLng <= 180 &&
      directLat >= -90 &&
      directLat <= 90
    ) {
      return [directLng, directLat];
    }

    const structuredCoords =
      extractCoordsFromValue(step?.location) ||
      extractCoordsFromValue(step?.coords) ||
      extractCoordsFromValue(step?.coordinates) ||
      extractCoordsFromValue(step?.mapCenter) ||
      extractCoordsFromValue(step?.center) ||
      extractCoordsFromValue(step?.position) ||
      extractCoordsFromValue(step?.geo) ||
      extractCoordsFromValue(step?.point);

    if (structuredCoords) {
      return structuredCoords;
    }

    if (!step?.location) {
      return extractCoordsFromKeywordText(
        step?.title,
        step?.description,
        step?.city,
        step?.label,
        step?.name,
        step?.place,
        step?.region
      );
    }

    return extractCoordsFromKeywordText(
      step?.location,
      step?.title,
      step?.description,
      step?.city,
      step?.label,
      step?.name,
      step?.place,
      step?.region
    );
  };

  const getActualCoords = (step: any): [number, number] | null => {
    return (
      extractCoordsFromValue(step?.extractedCoords) ||
      extractCoordsFromKeywordText(step?.title) ||
      extractCoordsFromStep(step)
    );
  };

  const getForcedCoordsForStep = (step: any): [number, number] => {
    const haystack = [
      step?.title,
      step?.label,
      step?.city,
      step?.name,
      typeof step?.location === 'string' ? step.location : '',
      step?.description,
      step?.place,
      step?.region,
    ]
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .join(' ')
      .toLowerCase();

    const matchedGeography = Object.entries(GEOGRAPHY_DATABASE).find(([keyword]) =>
      haystack.includes(keyword.toLowerCase())
    );

    if (matchedGeography) {
      return matchedGeography[1];
    }

    return (
      extractCoordsFromValue(step?.extractedCoords) ||
      getActualCoords(step) ||
      [121.4737, 31.2304]
    );
  };

  const getForcedRouteCoords = (steps: any[]): [number, number][] => {
    return dedupeConsecutiveCoordinates(
      sanitizeLineCoordinates(
        steps.map((step) => getForcedCoordsForStep(step)) as [number, number][]
      )
    );
  };

  const getMarkerLabelText = (step: any): string => {
    const candidates = [
      step?.title,
      step?.label,
      step?.city,
      step?.name,
      step?.location,
      `Day ${step?.day ?? ''}`.trim(),
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string') {
        const trimmed = candidate.trim();
        if (trimmed && trimmed !== '[object Object]') {
          return trimmed;
        }
      }
    }

    return 'Journey Stop';
  };

  const buildLineStringFeature = (coordinates: [number, number][]) => ({
    type: 'Feature' as const,
    geometry: {
      type: 'LineString' as const,
      coordinates,
    },
  });

  const sanitizeRouteFeature = (feature: any) => {
    if (!feature?.geometry || feature.geometry.type !== 'LineString') return null;

    const coordinates = sanitizeLineCoordinates(feature.geometry.coordinates);
    if (coordinates.length < 2) return null;

    return {
      ...feature,
      geometry: {
        ...feature.geometry,
        type: 'LineString',
        coordinates,
      },
    };
  };

  const drawRouteLayer = (m: any, feature: any) => {
    removeRouteArtifacts(m);

    const finalRouteCoords = sanitizeLineCoordinates(feature?.geometry?.coordinates);
    console.log('Final Route Coords:', finalRouteCoords);

    if (finalRouteCoords.length < 2) {
      console.warn('[JourneyMap] Skipping route draw because final coords are insufficient');
      return;
    }

    m.addSource(ROUTE_SOURCE_ID, {
      type: 'geojson',
      data: buildLineStringFeature(finalRouteCoords),
    });

    m.addLayer({
      id: ROUTE_LAYER_ID,
      type: 'line',
      source: ROUTE_SOURCE_ID,
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#1e3b32',
        'line-width': 5,
        'line-opacity': 1,
        'line-dasharray': [2, 2],
      },
    });

    m.moveLayer(ROUTE_LAYER_ID);
    m.setPaintProperty(ROUTE_LAYER_ID, 'line-opacity', 1);

    layersInitializedRef.current = true;
  };

  const derivedDayLocations = useMemo(() => {
    if (!Array.isArray(rawJourneySteps) || rawJourneySteps.length === 0) return undefined;

    return rawJourneySteps
      .map((step: any, index: number) => {
        const coords = getActualCoords(step);

        if (!coords) return null;

        const [lng, lat] = coords;

        const day = typeof step?.day === 'number' ? step.day : index + 1;

        return {
          day,
          title: step?.title,
          locations: [
            {
              id: step?.id || `journey-step-${day}`,
              lng,
              lat,
              extractedCoords: [lng, lat] as [number, number],
              city: step?.city || step?.location,
              label: step?.city || step?.location || step?.title || `Day ${day}`,
            },
          ],
        };
      })
      .filter(Boolean) as JourneyMapProps['dayLocations'];
  }, [rawJourneySteps]);

  const dayLocations = requestedDayLocations?.length
    ? requestedDayLocations
    : derivedDayLocations;

  const locations = requestedLocations?.length
    ? requestedLocations
    : dayLocations?.flatMap((day) => day.locations.map((loc) => ({
        id: loc.id,
        lng: loc.lng,
        lat: loc.lat,
      }))) || [];

  const mode: MapMode =
    requestedMode ||
    ((dayLocations?.length || locations.length) > 1 ? 'multi-stop-route' : 'single-location');

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
      extractedCoords?: [number, number];
      title?: string;
      label: string;
      city?: string;
    }> = [];

    sortedDays.forEach((dayData) => {
      dayData.locations.forEach((loc, stepIndex) => {
        const actualCoords = getActualCoords(loc);
        const lng = Number(actualCoords?.[0] ?? loc.lng);
        const lat = Number(actualCoords?.[1] ?? loc.lat);

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
          extractedCoords: [finalLng, finalLat] as [number, number],
          title: dayData.title,
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

  // 使用 ResizeObserver 检测容器尺寸，确保容器有非零宽高后再初始化
  useEffect(() => {
    if (!mapContainer.current) return;

    const timestamp = Date.now();
    console.log(`[JourneyMap] Container Detection Start @ ${timestamp}`);

    const checkContainerSize = (): boolean => {
      if (!mapContainer.current) return false;
      const width = mapContainer.current.offsetWidth;
      const height = mapContainer.current.offsetHeight;
      const isValid = width > 0 && height > 0;
      console.log(`[JourneyMap] Container size check:`, { width, height, isValid });
      return isValid;
    };

    // 立即检查一次
    if (checkContainerSize()) {
      setIsContainerReady(true);
      console.log(`[JourneyMap] Container ready immediately @ ${Date.now()}`);
      return;
    }

    // 使用 ResizeObserver 监听容器尺寸变化
    resizeObserverRef.current = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          console.log(`[JourneyMap] Container ready via ResizeObserver @ ${Date.now()}`, { width, height });
          setIsContainerReady(true);
          // 一旦检测到有效尺寸，断开观察
          if (resizeObserverRef.current) {
            resizeObserverRef.current.disconnect();
            resizeObserverRef.current = null;
          }
          break;
        }
      }
    });

    resizeObserverRef.current.observe(mapContainer.current);

    // 超时保护：如果 2 秒后容器仍然没有尺寸，强制设置为 ready（可能是 CSS 问题）
    const timeoutId = setTimeout(() => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      setIsContainerReady(true);
      console.warn(`[JourneyMap] Container size check timeout @ ${Date.now()}, proceeding with initialization`);
    }, 2000);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      clearTimeout(timeoutId);
    };
  }, []);

  // 增强的脚本检查：直接检查 window.mapboxgl，带重试机制
  useEffect(() => {
    const checkMapboxScript = (): boolean => {
      return typeof window !== 'undefined' && !!(window as any).mapboxgl;
    };

    if (checkMapboxScript()) {
      setIsScriptLoaded(true);
      scriptRetryCountRef.current = 0;
      return;
    }

    // 如果脚本还没加载，设置重试机制（最多3次）
    if (scriptRetryCountRef.current < 3) {
      scriptRetryTimeoutRef.current = setTimeout(() => {
        scriptRetryCountRef.current += 1;
        console.log(`[JourneyMap] Retrying script check (attempt ${scriptRetryCountRef.current}/3)`);
        if (checkMapboxScript()) {
          setIsScriptLoaded(true);
          scriptRetryCountRef.current = 0;
        } else {
          // 递归重试
          const checkInterval = setInterval(() => {
            if (checkMapboxScript()) {
              setIsScriptLoaded(true);
              scriptRetryCountRef.current = 0;
              clearInterval(checkInterval);
            } else if (scriptRetryCountRef.current >= 3) {
              clearInterval(checkInterval);
              console.error("[JourneyMap] Mapbox script failed to load after 3 retries");
            }
          }, 200);
          
          setTimeout(() => clearInterval(checkInterval), 2000);
        }
      }, 100);
    }

    return () => {
      if (scriptRetryTimeoutRef.current) {
        clearTimeout(scriptRetryTimeoutRef.current);
        scriptRetryTimeoutRef.current = null;
      }
    };
  }, [isScriptLoaded]);

  // 初始化地图 - 确保所有条件都满足，使用 requestAnimationFrame 包装
  useEffect(() => {
    const timestamp = Date.now();
    
    // 验证所有必要条件
    if (!isScriptLoaded) {
      console.log(`[JourneyMap] Waiting for script to load... @ ${timestamp}`);
      return;
    }

    if (!isContainerReady) {
      console.log(`[JourneyMap] Waiting for container to be ready... @ ${timestamp}`);
      return;
    }

    if (!mapContainer.current) {
      console.error(`[JourneyMap] Map container ref is null @ ${timestamp}`);
      return;
    }

    // DOM 附件检查：确保 ref 已附加到文档
    if (!mapContainer.current.isConnected) {
      console.warn(`[JourneyMap] Container not connected to DOM @ ${timestamp}`);
      // 等待下一帧再检查
      requestAnimationFrame(() => {
        if (mapContainer.current?.isConnected && !map.current) {
          // 重新触发检查
          setIsContainerReady(true);
        }
      });
      return;
    }

    if (map.current) {
      console.log(`[JourneyMap] Map already initialized @ ${timestamp}`);
      return;
    }

    // 验证 Mapbox script 是否已加载到 window（双重检查）
    const mapboxgl = (window as any).mapboxgl;
    if (!mapboxgl) {
      console.error(`[JourneyMap] MapboxGL script missing on window @ ${timestamp}`);
      // 尝试重新设置 isScriptLoaded
      setIsScriptLoaded(false);
      return;
    }

    // 验证 Mapbox token
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.error(`[JourneyMap] Mapbox token not configured @ ${timestamp}`);
      return;
    }

    // 最终验证容器尺寸
    const width = mapContainer.current.offsetWidth;
    const height = mapContainer.current.offsetHeight;
    if (width === 0 || height === 0) {
      console.warn(`[JourneyMap] Container has zero dimensions @ ${timestamp}`, { width, height });
      // 即使尺寸为0也继续，但会在 load 事件中强制 resize
    }

    // 在 requestAnimationFrame 中包装整个初始化逻辑，确保主线程完成初始布局绘制
    const rafId = requestAnimationFrame(() => {
      const constructorStartTime = Date.now();
      console.log(`[JourneyMap] Constructor Start @ ${constructorStartTime}`, {
        containerSize: { width, height },
        isConnected: mapContainer.current?.isConnected,
        mode,
        journeyStepsLength,
        locationsLength
      });

      // 再次验证（在 RAF 回调中）
      if (!mapContainer.current || map.current || !mapContainer.current.isConnected) {
        console.warn(`[JourneyMap] Validation failed in RAF callback @ ${Date.now()}`);
        return;
      }

      try {
        mapboxgl.accessToken = token;

        const m = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [0, 0], // 默认中心点，后续会根据实际数据计算边界
          zoom: 2,
          attributionControl: false
        });

        map.current = m;
        map.current.resize();
        (window as any).__MAP__ = m;
        console.log(`[JourneyMap] Map instance created @ ${Date.now()}`);

        // 地图加载完成后的处理
        m.on('load', () => {
          const loadTime = Date.now();
          console.log(`[JourneyMap] Load Event @ ${loadTime}`, {
            containerSize: {
              width: mapContainer.current?.offsetWidth,
              height: mapContainer.current?.offsetHeight
            }
          });

          // 双重缓冲 Resize：立即调用一次
          if (m && !m.removed) {
            m.resize();
            console.log(`[JourneyMap] First resize (immediate) @ ${Date.now()}`);
          }

          // 第二次 resize：300ms 后调用，处理 CSS 过渡/动画延迟
          setTimeout(() => {
            if (m && !m.removed) {
              m.resize();
              console.log(`[JourneyMap] Post-Load Resize (300ms delay) @ ${Date.now()}`);
            }
          }, 300);

          // 根据模式初始化地图内容
          if (mode === 'multi-stop-route' && journeySteps.length > 0) {
            initializeMarkers(m);
            initializeMultiDayLayers(m);
            updateMultiDayRoute(m);
          } else if (mode === 'single-location' && locations && locations.length > 0) {
            updateSingleLocation(m);
          }

          if (map.current?.getCanvas()) {
            map.current.getCanvas().style.width = '100%';
          }
          map.current?.resize();

          setTimeout(() => {
            if (map.current) {
              map.current.resize();
            }
          }, 300);
        });

        // 样式加载后的处理（可能触发多次）
        m.on('style.load', () => {
          layersInitializedRef.current = false;
          
          // 双重缓冲 Resize
          if (m && !m.removed) {
            m.resize();
          }
          
          setTimeout(() => {
            if (m && !m.removed) {
              m.resize();
            }
          }, 300);

          // 重新初始化图层
          if (mode === 'multi-stop-route' && journeySteps.length > 0) {
            initializeMarkers(m);
            initializeMultiDayLayers(m);
            updateMultiDayRoute(m);
          } else if (mode === 'single-location' && locations && locations.length > 0) {
            updateSingleLocation(m);
          }
        });

        // 错误处理
        m.on('error', (e: any) => {
          console.error(`[JourneyMap error] @ ${Date.now()}`, e?.error || e);
        });

      } catch (err) {
        console.error(`[JourneyMap] Initialization Error @ ${Date.now()}:`, err);
        // 清理失败的实例
        if (map.current) {
          try {
            map.current.remove();
          } catch (e) {
            console.warn("[JourneyMap] Error removing failed map instance:", e);
          }
          map.current = null;
        }
      }
    });

    // 强制清理函数：非常彻底地清理所有资源
    return () => {
      cancelAnimationFrame(rafId);
      
      if (map.current) {
        const cleanupTime = Date.now();
        console.log(`[JourneyMap] Force Cleanup Start @ ${cleanupTime}`);
        
        // 清理所有 markers
        removeMarkers();
        removeRouteArtifacts(map.current);

        // 强制移除地图实例（多次尝试确保成功）
        const mapInstance = map.current;
        map.current = null;
        (window as any).__MAP__ = null;

        try {
          if (mapInstance && typeof mapInstance.remove === 'function') {
            mapInstance.remove();
            console.log(`[JourneyMap] Map instance removed @ ${Date.now()}`);
          }
        } catch (e) {
          console.warn("[JourneyMap] Error removing map (first attempt):", e);
          // 第二次尝试
          try {
            if (mapInstance && typeof mapInstance.remove === 'function') {
              mapInstance.remove();
            }
          } catch (e2) {
            console.error("[JourneyMap] Error removing map (second attempt):", e2);
          }
        }
      }
    };
  }, [isScriptLoaded, isContainerReady, mode, journeyStepsKey, journeyStepsLength, locationsKey, locationsLength]);

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
    removeMarkers();

    // 检查 ID 唯一性
    const markerKeys = new Set<string>();
    const duplicateIds: string[] = [];

    // Use journeySteps as single source of truth
    journeySteps.forEach((step) => {
      try {
        const markerKey = `${step.day}-${step.id}`;
        
        // 检查 ID 是否重复
        if (markerKeys.has(markerKey)) {
          duplicateIds.push(markerKey);
          console.warn(`[JourneyMap] Duplicate marker key detected: ${markerKey}`);
        }
        markerKeys.add(markerKey);

        // 验证坐标
        const markerCoords = getForcedCoordsForStep(step);
        if (!markerCoords) {
          console.warn(`[JourneyMap] Invalid coordinates for marker ${markerKey}:`, {
            lng: step.lng,
            lat: step.lat,
            extractedCoords: step.extractedCoords,
            title: step.title,
          });
          return;
        }

        const markerContainer = document.createElement('div');
        markerContainer.className = 'custom-marker';
        markerContainer.style.display = 'flex';

        const dot = document.createElement('div');
        dot.className = 'marker-dot';
        
        const label = document.createElement('div');
        label.className = 'marker-label';
        label.textContent = getMarkerLabelText(step);

        markerContainer.appendChild(dot);
        markerContainer.appendChild(label);

        const marker = new mapboxgl.Marker({
          element: markerContainer,
          anchor: 'bottom'
        })
          .setLngLat(markerCoords)
          .addTo(m);

        markersRef.current.set(markerKey, {
          marker,
          element: markerContainer,
          day: step.day
        });
      } catch (error) {
        console.warn('[JourneyMap] Failed to render marker, skipping step:', {
          stepId: step?.id,
          day: step?.day,
          lng: step?.lng,
          lat: step?.lat,
          error,
        });
      }
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

  const buildProgressiveRouteFeature = (
    steps: any[],
    endDay?: number
  ) => {
    const filteredSteps =
      endDay === undefined || endDay === -1
        ? steps
        : steps.filter((step) => Number(step?.day) <= endDay);

    const routeCoords = getForcedRouteCoords(filteredSteps);
    if (routeCoords.length === 0) return null;

    if (routeCoords.length < 2) {
      const singlePoint = routeCoords[0];
      routeCoords.push([singlePoint[0], singlePoint[1]]);
    }

    let curvedCoords = routeCoords;
    if (routeCoords.length >= 2) {
      try {
        curvedCoords = createCurvedLine(routeCoords);
      } catch (err) {
        console.warn('[JourneyMap] Error creating progressive curved line, using straight line:', err);
        curvedCoords = routeCoords;
      }
    }

    const sanitizedCurvedCoords = sanitizeLineCoordinates(curvedCoords);
    const feature = buildLineStringFeature(
      sanitizedCurvedCoords.length >= 2 ? sanitizedCurvedCoords : routeCoords
    );

    return sanitizeRouteFeature(feature);
  };

  const upsertRouteFeature = (m: any, feature: any) => {
    const sanitizedFeature = sanitizeRouteFeature(feature);
    if (!sanitizedFeature) return;

    const existingSource = m.getSource(ROUTE_SOURCE_ID);
    const hasRouteLayer = !!m.getLayer(ROUTE_LAYER_ID);

    if (existingSource && hasRouteLayer && typeof existingSource.setData === 'function') {
      existingSource.setData(sanitizedFeature);
      m.moveLayer(ROUTE_LAYER_ID);
      m.setPaintProperty(ROUTE_LAYER_ID, 'line-opacity', 1);
      return;
    }

    drawRouteLayer(m, sanitizedFeature);
  };

  const fitMapToOverview = (m: any) => {
    const mapboxgl = (window as any).mapboxgl;
    if (!m || !mapboxgl) return;

    const overviewCoords = getForcedRouteCoords(journeySteps);
    if (overviewCoords.length === 0) return;

    if (overviewCoords.length === 1) {
      m.flyTo({
        center: overviewCoords[0],
        zoom: 5,
        essential: true,
        duration: 1200,
      });
      return;
    }

    const bounds = new mapboxgl.LngLatBounds();
    overviewCoords.forEach((coord) => bounds.extend(coord));
    m.fitBounds(bounds, {
      padding: 80,
      duration: 1500,
      maxZoom: 10,
      essential: true,
    });
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
          const sanitizedLineFeature = sanitizeRouteFeature(lineFeature);
          if (sanitizedLineFeature) {
            routeGeoJsonDataRef.current = sanitizedLineFeature;
            console.log("[JourneyMap] Route GeoJSON loaded successfully (FeatureCollection)", {
              featuresCount: geojson.features.length,
              usingFeature: sanitizedLineFeature.id || 'first LineString'
            });
          } else {
            console.warn('[JourneyMap] No LineString feature found in GeoJSON FeatureCollection. Continuing without GeoJSON route.');
            routeGeoJsonDataRef.current = null;
            return;
          }
        } else if (geojson.type === 'Feature' && geojson.geometry && geojson.geometry.type === 'LineString') {
          // 如果是单个 Feature，直接使用
          const sanitizedGeoJson = sanitizeRouteFeature(geojson);
          routeGeoJsonDataRef.current = sanitizedGeoJson;
          if (!sanitizedGeoJson) {
            console.warn('[JourneyMap] GeoJSON route coordinates are invalid. Continuing without GeoJSON route.');
            return;
          }
          console.log("[JourneyMap] Route GeoJSON loaded successfully (Feature)");
        } else {
          console.warn('[JourneyMap] Invalid GeoJSON format: expected FeatureCollection with LineString feature or LineString Feature. Continuing without GeoJSON route.');
          routeGeoJsonDataRef.current = null;
          return;
        }
        
        // 如果地图已初始化，立即更新路线
        const m = map.current;
        if (m && m.isStyleLoaded() && mode === 'multi-stop-route') {
          initializeMultiDayLayers(m);
          updateMultiDayRoute(m);
          console.log("[JourneyMap] Route updated with GeoJSON data");
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
    if (!m.isStyleLoaded()) return;

    try {
      const initialData = sanitizeRouteFeature(routeGeoJsonDataRef.current) || buildLineStringFeature([]);
      drawRouteLayer(m, initialData);
      console.log("[JourneyMap] Multi-day layers initialized", {
        hasGeoJsonRoute: !!routeGeoJsonDataRef.current || journeySteps.length > 0
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
      // 调试：打印当前要绘制的步骤
      console.log('[JourneyMap] Current steps to draw line:', {
        totalSteps: journeySteps.length,
        stepsToShow: journeySteps.length,
        steps: journeySteps.map(s => ({ day: s.day, id: s.id, coords: [s.lng, s.lat] }))
      });

      if (journeySteps.length === 0) {
        console.warn("[JourneyMap] No valid steps for multi-day route");
        removeRouteArtifacts(m);
        return;
      }

      // 初始绘制完整路线；滚动时会在 activeDay effect 中裁剪为 progressive route
      const fullRouteFeature = buildProgressiveRouteFeature(journeySteps);
      const routeCoords = sanitizeLineCoordinates(fullRouteFeature?.geometry?.coordinates);
      console.log('Map Points:', routeCoords);

      // 检查坐标是否为空
      if (routeCoords.length === 0 || !fullRouteFeature) {
        console.warn("[JourneyMap] allCoords is empty after mapping");
        removeRouteArtifacts(m);
        return;
      }
      upsertRouteFeature(m, fullRouteFeature);

      console.log('[JourneyMap] Route updated with full itinerary', {
        originalPoints: routeCoords.length,
        curvedPoints: fullRouteFeature.geometry.coordinates.length,
        firstPoint: fullRouteFeature.geometry.coordinates[0],
        lastPoint: fullRouteFeature.geometry.coordinates[fullRouteFeature.geometry.coordinates.length - 1],
      });

      // 初次挂载时先给用户一个全局总览，覆盖整条中国线路
      const routeCoordsForViewport = sanitizeLineCoordinates(fullRouteFeature.geometry.coordinates);
      if (routeCoordsForViewport.length > 0 && !hasShownOverviewRef.current) {
        const bounds = new mapboxgl.LngLatBounds();
        routeCoordsForViewport.forEach(c => bounds.extend(c));
        
        m.fitBounds(bounds, { 
          padding: 80,
          animate: true,
          duration: 1800,
          maxZoom: 10,
          essential: true
        });
        hasShownOverviewRef.current = true;
        console.log("[JourneyMap] Auto-zoom fitBounds completed with padding: 80");
      }

      m.resize();
      map.current?.resize();
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

  useEffect(() => {
    hasShownOverviewRef.current = false;
  }, [journeyStepsKey, routeGeoJsonPath]);
  
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
            updateMultiDayRoute(m);
          }
        }, 100);
        
        // 超时保护：5秒后即使没有加载也继续
        setTimeout(() => {
          clearInterval(checkInterval);
          updateMultiDayRoute(m);
        }, 5000);
        
        return;
      }
      
      updateMultiDayRoute(m);
    };

    if (m.isStyleLoaded()) {
      updateRoute();
    } else {
      m.once('style.load', updateRoute);
    }
  }, [mapModeForUpdate, journeyStepsKey, journeyStepsLength, isScriptLoaded, routeUrlForUpdate]);

  // 监听 journeyData 变化，重新计算边界并执行 fitBounds
  useEffect(() => {
    const m = map.current;
    if (!m || !m.isStyleLoaded() || hasShownOverviewRef.current) return;

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
        // 多日路线模式：强制使用标题兜底后的最终坐标
        allCoords = getForcedRouteCoords(journeySteps);
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
          hasShownOverviewRef.current = true;
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
          hasShownOverviewRef.current = true;
          console.log("[JourneyMap] All points are the same, centered on single point", center);
        }
      } catch (err) {
        console.error("[JourneyMap] Error calculating bounds:", err);
      }
    }
  }, [routeUrlForUpdate, mapModeForUpdate, journeyStepsKey, locationsKey, isScriptLoaded]); // 使用稳定的字符串值，确保数组长度固定为 5

  // 动态高亮：根据 activeDay 高亮 Marker
  useEffect(() => {
    if (!map.current || mapModeForUpdate !== 'multi-stop-route' || !map.current.isStyleLoaded()) return;
    
    const targetDay = activeDayValue !== -1 ? activeDayValue : (currentDayValue !== -1 ? currentDayValue : undefined);

    markersRef.current.forEach(({ element, day }) => {
      if (targetDay !== undefined && targetDay !== -1 && day === targetDay) {
        element.classList.add('is-active');
      } else {
        element.classList.remove('is-active');
      }
    });

    const fullRouteFeature = buildProgressiveRouteFeature(journeySteps);
    const partialRouteFeature = buildProgressiveRouteFeature(journeySteps, targetDay);
    const nextRouteFeature = targetDay !== undefined && targetDay !== -1
      ? partialRouteFeature || fullRouteFeature
      : fullRouteFeature;

    if (nextRouteFeature) {
      upsertRouteFeature(map.current, nextRouteFeature);
    }

    if (targetDay !== undefined && targetDay !== -1) {
      const currentStep =
        journeySteps.find((step) => step?.day === targetDay) ||
        journeySteps.find((step) => Number(step?.day) === targetDay);
      const coords = currentStep ? getForcedCoordsForStep(currentStep) : null;

      if (coords && map.current) {
        map.current.flyTo({
          center: coords,
          zoom: 6,
          essential: true,
          duration: 1500,
        });
      } else if (map.current) {
        fitMapToOverview(map.current);
      }

      console.log(`[JourneyMap] Markers highlighted for day ${targetDay}`);
    } else if (map.current) {
      fitMapToOverview(map.current);
    }
  }, [mapModeForUpdate, currentDayValue, activeDayValue, journeyStepsKey]); // 使用稳定的值，确保数组长度固定

  // 监听窗口大小变化，确保地图正确调整大小
  useEffect(() => {
    if (!map.current) return;

    const handleResize = () => {
      if (map.current && map.current.isStyleLoaded()) {
        setTimeout(() => {
          map.current.resize();
          console.log("[JourneyMap] Map resized on window resize");
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isScriptLoaded]);

  useEffect(() => {
    const timer = setInterval(() => {
      map.current?.resize();
    }, 500);

    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <link href="https://api.mapbox.com/mapbox-gl-js/v3.17.0/mapbox-gl.css" rel="stylesheet" />
      <Script
        src="https://api.mapbox.com/mapbox-gl-js/v3.17.0/mapbox-gl.js"
        strategy="afterInteractive"
        onLoad={() => {
          const loadTime = Date.now();
          // 直接检查 window.mapboxgl，确保脚本真正可用
          if ((window as any).mapboxgl) {
            console.log(`[JourneyMap] Mapbox script loaded @ ${loadTime}`);
            setIsScriptLoaded(true);
            scriptRetryCountRef.current = 0; // 重置重试计数
          } else {
            console.warn(`[JourneyMap] Script onLoad fired but mapboxgl not found @ ${loadTime}`);
            // 触发重试检查
            setIsScriptLoaded(false);
          }
        }}
        onError={(e) => {
          console.error(`[JourneyMap] Failed to load Mapbox script @ ${Date.now()}`, e);
          setIsScriptLoaded(false);
        }}
      />
      <div 
        className={`sticky top-0 w-full h-screen bg-gray-100 ${className}`}
        style={{
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1,
          pointerEvents: 'auto'
        }}
      >
        {!process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-center p-4">
              <p className="text-red-600 font-semibold mb-2">Mapbox token not configured</p>
              <p className="text-gray-600 text-sm">
                Please set NEXT_PUBLIC_MAPBOX_TOKEN in your environment variables
              </p>
            </div>
          </div>
        ) : (
          <div 
            id={mapContainerId}
            ref={mapContainer} 
            className="absolute inset-0 w-full h-full"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 0,
              backgroundColor: '#f0f0f0' // 初始背景色，防止白屏
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

