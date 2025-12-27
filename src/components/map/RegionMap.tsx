'use client';

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import Script from 'next/script';
import { getProvinceColorExpression, getProvinceBorderColorExpression } from '@/lib/provinceColors';
import { getRegionMapping, getPageIdByGeoJsonId, getCategoryIds } from '@/lib/regionMapping';

interface RegionData {
  id: string;
  name: string;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
}

interface RegionMapProps {
  regions?: RegionData[];
  geojsonUrl?: string;
  defaultCenter?: [number, number];
  defaultZoom?: number;
  defaultPitch?: number;
  defaultBearing?: number;
  currentCategory?: string; // 当前页面类别（如 'northwest', 'southwest'），用于初始过滤
  activeRegionId?: string | null; // 当前激活的 region ID（Single Source of Truth）
  onRegionClick?: (regionId: string) => void; // 地图区域点击回调
}

export interface RegionMapHandle {
  selectRegion: (regionId: string) => void; // 选中一个 region（清除其他 selected，设置新的 selected）
  setHoverState: (adcode: string, hover: boolean) => void; // 设置 hover 状态（只在未 selected 时生效）
  clearAllStates: () => void; // 清除所有 selected 和 hover 状态
  flyToRegion: (bounds: [[number, number], [number, number]]) => void; // 相机动画
  // 保留旧方法以兼容
  highlightRegion: (id: string | string[]) => void;
  clearRegion: (id: string | string[]) => void;
  showOnlyRegion: (id: string | string[]) => void;
  showAllRegions: () => void;
}

declare global {
  interface Window {
    mapboxgl: any;
  }
}

const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

// 递归坐标遍历器：正确处理 Polygon 和 MultiPolygon
const calculateBounds = (geometry: RegionData['geometry']): [[number, number], [number, number]] | null => {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  // 递归遍历坐标数组
  const walkCoordinates = (coords: any): void => {
    if (!Array.isArray(coords) || coords.length === 0) return;

    // 如果第一个元素是数字，说明是 [lng, lat] 坐标对
    if (typeof coords[0] === 'number' && coords.length >= 2) {
      const [lng, lat] = coords;
      if (typeof lng === 'number' && typeof lat === 'number' && !isNaN(lng) && !isNaN(lat)) {
        minLng = Math.min(minLng, lng);
        minLat = Math.min(minLat, lat);
        maxLng = Math.max(maxLng, lng);
        maxLat = Math.max(maxLat, lat);
      }
    } else {
      // 否则递归遍历子数组
      coords.forEach((item: any) => {
        if (Array.isArray(item)) {
          walkCoordinates(item);
        }
      });
    }
  };

  if (!geometry || !geometry.coordinates) {
    return null;
  }

  walkCoordinates(geometry.coordinates);

  // 验证计算结果
  if (!isFinite(minLng) || !isFinite(minLat) || !isFinite(maxLng) || !isFinite(maxLat)) {
    return null;
  }

  if (minLng >= maxLng || minLat >= maxLat) {
    return null;
  }

  return [[minLng, minLat], [maxLng, maxLat]];
};

// 合并多个省份的 bounds
const mergeBounds = (boundsList: Array<[[number, number], [number, number]] | null>): [[number, number], [number, number]] | null => {
  const validBounds = boundsList.filter((b): b is [[number, number], [number, number]] => b !== null);
  
  if (validBounds.length === 0) {
    return null;
  }

  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  validBounds.forEach(([[lng1, lat1], [lng2, lat2]]) => {
    minLng = Math.min(minLng, lng1, lng2);
    minLat = Math.min(minLat, lat1, lat2);
    maxLng = Math.max(maxLng, lng1, lng2);
    maxLat = Math.max(maxLat, lat1, lat2);
  });

  if (!isFinite(minLng) || !isFinite(minLat) || !isFinite(maxLng) || !isFinite(maxLat)) {
    return null;
  }

  if (minLng >= maxLng || minLat >= maxLat) {
    return null;
  }

  return [[minLng, minLat], [maxLng, maxLat]];
};

const RegionMap = forwardRef<RegionMapHandle, RegionMapProps>(({ 
  regions = [],
  geojsonUrl,
  defaultCenter = [104.1954, 35.8617],
  defaultZoom = 5,
  defaultPitch = 0,
  defaultBearing = 0,
  currentCategory,
  activeRegionId,
  onRegionClick
}, ref) => {
  // 添加日志验证 props 变化
  console.log('[RegionMap] Render with activeRegionId:', activeRegionId);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  // 新增：脚本加载状态标记
  const [mapboxScriptLoaded, setMapboxScriptLoaded] = useState(false);
  const mapReadyRef = useRef(false);
  const styleReadyRef = useRef(false); // Style 是否完全加载完成
  const sourceReadyRef = useRef(false); // Source 是否加载完成
  const [mapFullyReady, setMapFullyReady] = useState(false); // 真正的 ready state
  const fullyReadySetRef = useRef(false); // 闸门：确保 mapFullyReady 只设置一次
  const styleLoadBoundRef = useRef(false); // 闸门：确保 style.load 监听只注册一次
  const hoveredIdRef = useRef<string | string[] | null>(null);
  const lockedIdRef = useRef<string | null>(null);
  const hoveredProvinceIdRef = useRef<string | null>(null); // 全局只允许一个 hover 的省份 adcode
  const allProvinceIdsRef = useRef<string[]>([]); // 缓存所有省份 ID
  const regionsDataRef = useRef<Map<string, { bounds: [[number, number], [number, number]] }>>(new Map());
  const visibleIdsRef = useRef<string[] | null>(null); // 当前可见的区域 ID 列表，null 表示全部可见
  const selectedProvinceIdsRef = useRef<Set<string>>(new Set()); // 当前被选中的省份 ID 集合
  const geojsonDataRef = useRef<any>(null); // 缓存 GeoJSON 数据
  const cameraTimeoutRef = useRef<NodeJS.Timeout | null>(null); // 存储相机动画的 timeout，用于清理
  // const cameraLockRef = useRef<boolean>(false); // 相机锁定：当 sidebar 触发 fitBounds 时锁定，防止其他逻辑覆盖
  // const cameraLockTimeoutRef = useRef<NodeJS.Timeout | null>(null); // 相机锁定的超时定时器

  const setFeatureState = (id: string, highlight: boolean) => {
    if (!map.current || !mapReadyRef.current || !id) {
      console.warn(`[RegionMap] Cannot set feature state: map=${!!map.current}, ready=${mapReadyRef.current}, id=${id}`);
      return false;
    }
    try {
      // 确保 id 是字符串
      const featureId = String(id);
      map.current.setFeatureState(
        { source: 'regions', id: featureId },
        { highlight }
      );
      console.log(`[RegionMap] Set feature state: ${featureId} -> ${highlight}`);
      return true;
    } catch (error) {
      console.warn(`[RegionMap] Error setting feature state for ${id}:`, error);
      return false;
    }
  };

  // // 安全的相机控制函数：检查 cameraLock，如果锁定则拒绝执行
  // const safeCameraControl = (
  //   operation: () => void,
  //   options?: { force?: boolean; lockDuration?: number }
  // ): boolean => {
  //   if (!map.current || !mapReadyRef.current) {
  //     console.warn('[RegionMap] Cannot control camera: map not ready');
  //     return false;
  //   }

  //   // 如果强制执行（如初始化），忽略 cameraLock
  //   if (options?.force) {
  //     operation();
  //     return true;
  //   }

  //   // 如果相机被锁定，拒绝执行
  //   if (cameraLockRef.current) {
  //     console.log('[RegionMap] Camera is locked, ignoring camera control request');
  //     return false;
  //   }

  //   // 执行相机操作
  //   operation();
  //   return true;
  // };

  // // 锁定相机（用于 sidebar 触发的 fitBounds）
  // const lockCamera = (duration: number = 3000) => {
  //   cameraLockRef.current = true;
  //   console.log(`[RegionMap] Camera locked for ${duration}ms`);

  //   // 清除之前的超时定时器
  //   if (cameraLockTimeoutRef.current) {
  //     clearTimeout(cameraLockTimeoutRef.current);
  //   }

  //   // 设置自动解锁
  //   cameraLockTimeoutRef.current = setTimeout(() => {
  //     cameraLockRef.current = false;
  //     console.log('[RegionMap] Camera lock released');
  //     cameraLockTimeoutRef.current = null;
  //   }, duration);
  // };

  // // 手动解锁相机
  // const unlockCamera = () => {
  //   cameraLockRef.current = false;
  //   if (cameraLockTimeoutRef.current) {
  //     clearTimeout(cameraLockTimeoutRef.current);
  //     cameraLockTimeoutRef.current = null;
  //   }
  //   console.log('[RegionMap] Camera manually unlocked');
  // };

  // 检查并更新 mapFullyReady 状态（只执行一次）
  const checkAndSetFullyReady = () => {
    if (fullyReadySetRef.current) return;

    if (
      mapReadyRef.current &&
      styleReadyRef.current &&
      sourceReadyRef.current
    ) {
      // 延迟设置 mapFullyReady，使用两个 requestAnimationFrame 确保 Mapbox 内部稳定
      // 这确保相机操作不会在与源/样式更新相同的帧中运行
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (fullyReadySetRef.current) return; // 双重检查，防止重复设置
          fullyReadySetRef.current = true;
          setMapFullyReady(true);
          console.log('[RegionMap] Map fully ready (set after 2 RAF)');
        });
      });
    }
  };

  // 加载 GeoJSON 数据
  useEffect(() => {
    const loadGeoJSON = async () => {
      if (geojsonDataRef.current) return; // 已加载，跳过

      if (geojsonUrl) {
        try {
          console.log('[RegionMap] Loading GeoJSON from:', geojsonUrl);
          const response = await fetch(geojsonUrl);
          
          if (!response.ok) {
            throw new Error(`Failed to load GeoJSON: ${response.status} ${response.statusText}`);
          }

          const geojson = await response.json();
          
          // 验证 GeoJSON 格式
          if (!geojson || geojson.type !== 'FeatureCollection' || !Array.isArray(geojson.features)) {
            throw new Error('Invalid GeoJSON format: expected FeatureCollection with features array');
          }

          console.log('[RegionMap] Loaded GeoJSON with', geojson.features.length, 'features');

          // 将 feature.id 移到 properties 中，并强制确保 adcode 是字符串
          geojson.features = geojson.features.map((feature: any) => {
            const featureId = feature.id;
            if (!feature.properties) {
              feature.properties = {};
            }
            
            // 优先使用 feature.id，如果没有则使用 properties.adcode
            let adcodeValue = featureId;
            if (adcodeValue === undefined || adcodeValue === null) {
              adcodeValue = feature.properties?.adcode;
            }
            
            // 强制转换为字符串，确保类型一致
            if (adcodeValue !== undefined && adcodeValue !== null) {
              const idString = String(adcodeValue);
              feature.properties.adcode = idString;
              // 保留 id 作为字符串，Mapbox 可能需要
              feature.id = idString;
            } else {
              console.warn('[RegionMap] Feature missing both id and adcode:', feature);
            }
            
            return feature;
          });

          // 缓存 GeoJSON 数据
          geojsonDataRef.current = geojson;

          // 缓存所有省份 ID（统一转换为字符串）
          allProvinceIdsRef.current = geojson.features
            .map((f: any) => {
              const adcode = f.properties?.adcode;
              return adcode ? String(adcode) : null;
            })
            .filter(Boolean) as string[];
          
          console.log('[RegionMap] Cached province IDs:', allProvinceIdsRef.current);
          console.log(`[RegionMap] Total provinces loaded: ${allProvinceIdsRef.current.length}`);

          // 🔍 验证关键省份是否存在
          const requiredProvinces = ['440000', '500000', '510000', '520000', '530000', '540000', '630000', '650000', '620000', '610000', '110000', '150000', '140000', '230000', '220000', '210000', '430000', '450000', '350000', '420000', '310000', '330000', '320000', '340000'];
          const missingProvinces = requiredProvinces.filter(id => !allProvinceIdsRef.current.includes(id));
          if (missingProvinces.length > 0) {
            console.warn(`[RegionMap] ⚠️ Missing provinces in GeoJSON:`, missingProvinces);
            console.warn(`[RegionMap] Please ensure your GeoJSON file contains all Chinese provinces.`);
          } else {
            console.log(`[RegionMap] ✅ All required provinces found in GeoJSON`);
          }

          // 立即计算并缓存每个省份的 bounds（keyed by adcode 字符串）
          let boundsCacheCount = 0;
          geojson.features.forEach((feature: any) => {
            const adcode = feature.properties?.adcode;
            if (adcode && feature.geometry) {
              const adcodeString = String(adcode); // 统一转换为字符串
              const bounds = calculateBounds(feature.geometry);
              if (bounds) {
                regionsDataRef.current.set(adcodeString, { bounds });
                boundsCacheCount++;
                // 只记录前几个，避免日志过多
                if (boundsCacheCount <= 5) {
                  console.log(`[RegionMap] Computed bounds for province ${adcodeString}`);
                }
              } else {
                console.warn(`[RegionMap] Failed to compute bounds for province ${adcodeString}`);
              }
            } else {
              console.warn(`[RegionMap] Feature missing adcode or geometry:`, feature);
            }
          });
          
          console.log(`[RegionMap] ✅ Cached bounds for ${boundsCacheCount}/${geojson.features.length} provinces`);
          
          // 验证是否所有省份都有 bounds
          if (boundsCacheCount < geojson.features.length) {
            console.warn(`[RegionMap] ⚠️ Some provinces missing bounds: ${geojson.features.length - boundsCacheCount} failed`);
          }
        } catch (error) {
          console.error('[RegionMap] Error loading GeoJSON:', error);
        }
      } else if (regions && regions.length > 0) {
        const features = regions
          .filter(region => {
            if (!region.id || typeof region.id !== 'string') {
              console.error('[RegionMap] Region missing valid string id:', region);
              return false;
            }
            return true;
          })
          .map(region => {
            const regionId = String(region.id);
            // 立即计算并缓存 bounds
            const bounds = calculateBounds(region.geometry);
            if (bounds) {
              regionsDataRef.current.set(regionId, { bounds });
              console.log(`[RegionMap] Computed bounds for region ${regionId}:`, bounds);
            } else {
              console.warn(`[RegionMap] Failed to compute bounds for region ${regionId}`);
            }

            return {
              type: 'Feature' as const,
              properties: {
                adcode: regionId,
                name: region.name || ''
              },
              geometry: region.geometry
            };
          });

        if (features.length > 0) {
          const geoJson = {
            type: 'FeatureCollection' as const,
            features
          };

          // 缓存 GeoJSON 数据
          geojsonDataRef.current = geoJson;

          // 缓存所有省份 ID
          allProvinceIdsRef.current = geoJson.features.map(f => f.properties.adcode).map(String);
          console.log('[RegionMap] Cached province IDs:', allProvinceIdsRef.current);
        }
      }
    };

    loadGeoJSON();
  }, [geojsonUrl, regions]);

  // 初始化 Source 和 Layer（集中处理地图结构）
  const initSourcesAndLayers = () => {
    if (!map.current) return;
    if (!geojsonDataRef.current) {
      console.warn('[RegionMap] GeoJSON data not loaded yet');
      return;
    }

    // Source
    if (!map.current.getSource('regions')) {
      // 🔍 在添加 Source 前，再次确保所有 adcode 都是字符串
      const normalizedGeoJSON = {
        ...geojsonDataRef.current,
        features: geojsonDataRef.current.features.map((feature: any) => {
          if (feature.properties?.adcode !== undefined) {
            feature.properties.adcode = String(feature.properties.adcode);
          }
          if (feature.id !== undefined) {
            feature.id = String(feature.id);
          }
          return feature;
        })
      };
      
      map.current.addSource('regions', {
        type: 'geojson',
        data: normalizedGeoJSON,
        promoteId: 'adcode'
      });
      console.log('[RegionMap] Source "regions" added with normalized adcode types');
    }

    // Layer: regions-fill（稳定基础版）
    if (!map.current.getLayer('regions-fill')) {
      map.current.addLayer({
        id: 'regions-fill',
        type: 'fill',
        source: 'regions',
        paint: {
          'fill-color': '#c9b27c',
          'fill-opacity': 0.25
        }
      });
      console.log('[RegionMap] Layer "regions-fill" added');
    }

    // Layer: regions-border
    if (!map.current.getLayer('regions-border')) {
      map.current.addLayer({
        id: 'regions-border',
        type: 'line',
        source: 'regions',
        paint: {
          'line-color': '#9e8756',
          'line-width': 1,
          'line-opacity': 1
        }
      });
      console.log('[RegionMap] Layer "regions-border" added');
    }

    // 监听 source 加载完成
    map.current.on('sourcedata', (e: any) => {
      if (
        e.sourceId === 'regions' &&
        e.isSourceLoaded &&
        !sourceReadyRef.current
      ) {
        sourceReadyRef.current = true;
        console.log('[RegionMap] Source "regions" loaded');
        checkAndSetFullyReady();
      }
    });

    // 注册交互事件监听器
    map.current.on('mouseenter', 'regions-fill', (e: any) => {
      const id = e.features?.[0]?.id;
      if (!id) return;

      if (hoveredProvinceIdRef.current && hoveredProvinceIdRef.current !== id) {
        try {
          map.current.setFeatureState(
            { source: 'regions', id: hoveredProvinceIdRef.current },
            { hover: false }
          );
        } catch (error) {
          console.warn(`[RegionMap] Error clearing previous hover state for ${hoveredProvinceIdRef.current}:`, error);
        }
      }

      if (selectedProvinceIdsRef.current.has(id)) {
        return;
      }

      try {
        map.current.setFeatureState(
          { source: 'regions', id },
          { hover: true }
        );
        hoveredProvinceIdRef.current = id;
        map.current.getCanvas().style.cursor = 'pointer';
      } catch (error) {
        console.warn(`[RegionMap] Error setting hover state for ${id}:`, error);
      }
    });

    map.current.on('mouseleave', 'regions-fill', () => {
      const id = hoveredProvinceIdRef.current;
      if (!id) {
        map.current.getCanvas().style.cursor = '';
        return;
      }

      if (!selectedProvinceIdsRef.current.has(id)) {
        try {
          map.current.setFeatureState(
            { source: 'regions', id },
            { hover: false }
          );
        } catch (error) {
          console.warn(`[RegionMap] Error clearing hover state for ${id}:`, error);
        }
      }

      hoveredProvinceIdRef.current = null;
      map.current.getCanvas().style.cursor = '';
    });

    map.current.on('click', 'regions-fill', (e: any) => {
      if (e.features.length === 0) return;

      e.originalEvent.stopPropagation();

      const feature = e.features[0];
      const featureId = feature.id;

      if (!featureId || typeof featureId !== 'string') return;

      const pageId = getPageIdByGeoJsonId(featureId);
      if (pageId && onRegionClick) {
        console.log('[Map] click region', pageId);
        onRegionClick(pageId);
      }
    });
  };

  useImperativeHandle(ref, () => ({
    selectRegion: (regionId: string) => {
      if (!map.current || !mapReadyRef.current || !styleReadyRef.current) return;
      if (!sourceReadyRef.current) return; // 等待 source 加载完成

      // 检查 source 是否存在
      if (!map.current.getSource('regions')) {
        // 静默返回，不打印警告（source 可能还在加载中）
        return;
      }

      const mapping = getRegionMapping(regionId);
      if (!mapping) {
        console.warn(`[RegionMap] No mapping found for region: ${regionId}`);
        return;
      }

      // 1. 清除所有省份的 selected 状态
      allProvinceIdsRef.current.forEach(id => {
        try {
          map.current.setFeatureState(
            { source: 'regions', id },
            { selected: false }
          );
        } catch (error) {
          // 忽略错误
        }
      });

      // 2. 设置当前 region 的 selected（可以是多个省）
      selectedProvinceIdsRef.current = new Set(mapping.geojsonIds);
      mapping.geojsonIds.forEach(id => {
        try {
          map.current.setFeatureState(
            { source: 'regions', id },
            { selected: true }
          );
        } catch (error) {
          console.warn(`[RegionMap] Error setting selected state for ${id}:`, error);
        }
      });

      // 3. 清掉 hover（防止 hover 叠加）
      if (hoveredProvinceIdRef.current) {
        try {
          map.current.setFeatureState(
            { source: 'regions', id: hoveredProvinceIdRef.current },
            { hover: false }
          );
        } catch (error) {
          console.warn(`[RegionMap] Error clearing hover state for ${hoveredProvinceIdRef.current}:`, error);
        }
        hoveredProvinceIdRef.current = null;
      }

      console.log(`[RegionMap] Selected region: ${regionId} -> provinces: ${mapping.geojsonIds.join(', ')}`);
    },
    setHoverState: (adcode: string, hover: boolean) => {
      if (!map.current || !mapReadyRef.current || !styleReadyRef.current) return;
      if (!sourceReadyRef.current) return; // 等待 source 加载完成

      // 检查 source 是否存在
      if (!map.current.getSource('regions')) {
        // 静默返回，不打印警告（source 可能还在加载中）
        return;
      }

      // 只在未 selected 的省份上设置 hover
      if (selectedProvinceIdsRef.current.has(adcode)) {
        return; // 已选中的省份不响应 hover
      }

      // 如果设置新的 hover，先清除之前的 hover（全局只允许一个 hover）
      if (hover) {
        const previousHovered = hoveredProvinceIdRef.current;
        if (previousHovered && previousHovered !== adcode) {
          try {
            map.current.setFeatureState(
              { source: 'regions', id: previousHovered },
              { hover: false }
            );
          } catch (error) {
            console.warn(`[RegionMap] Error clearing previous hover state for ${previousHovered}:`, error);
          }
        }
        hoveredProvinceIdRef.current = adcode;
      } else {
        // 清除 hover
        if (hoveredProvinceIdRef.current === adcode) {
          hoveredProvinceIdRef.current = null;
        }
      }

      try {
        map.current.setFeatureState(
          { source: 'regions', id: adcode },
          { hover }
        );
      } catch (error) {
        console.warn(`[RegionMap] Error setting hover state for ${adcode}:`, error);
      }
    },
    clearAllStates: () => {
      if (!map.current || !mapReadyRef.current || !styleReadyRef.current) return;
      if (!sourceReadyRef.current) return; // 等待 source 加载完成

      // 检查 source 是否存在
      if (!map.current.getSource('regions')) {
        // 静默返回，不打印警告（source 可能还在加载中）
        return;
      }

      const allAdcodes = allProvinceIdsRef.current;

      allAdcodes.forEach(adcode => {
        try {
          map.current.setFeatureState(
            { source: 'regions', id: adcode },
            { selected: false, hover: false }
          );
        } catch (error) {
          // 忽略错误
        }
      });

      selectedProvinceIdsRef.current.clear();
      hoveredProvinceIdRef.current = null; // 清除 hover ref
      console.log('[RegionMap] Cleared all states');
    },
    highlightRegion: (id: string | string[]) => {
      if (!map.current || !mapReadyRef.current || !id) return;

      const ids = Array.isArray(id) ? id : [id];
      const currentHovered = hoveredIdRef.current;
      const currentLocked = lockedIdRef.current;

      // 清除之前的高亮（如果不是锁定的）
      if (currentHovered && currentHovered !== currentLocked) {
        const previousIds = Array.isArray(currentHovered) ? currentHovered : [currentHovered];
        previousIds.forEach(prevId => {
          if (typeof prevId === 'string' && !ids.includes(prevId)) {
            setFeatureState(prevId, false);
          }
        });
      }

      // 高亮新的区域（多个 feature）
      const highlightedIds: string[] = [];
      ids.forEach(featureId => {
        if (typeof featureId === 'string' && featureId !== currentLocked) {
          if (setFeatureState(featureId, true)) {
            highlightedIds.push(featureId);
          }
        }
      });

      if (highlightedIds.length > 0) {
        hoveredIdRef.current = highlightedIds.length === 1 ? highlightedIds[0] : highlightedIds;
      }
    },
    clearRegion: (id: string | string[]) => {
      if (!map.current || !mapReadyRef.current || !id) return;

      const ids = Array.isArray(id) ? id : [id];
      const currentHovered = hoveredIdRef.current;
      const currentLocked = lockedIdRef.current;

      ids.forEach(featureId => {
        if (typeof featureId === 'string' && featureId !== currentLocked) {
          const hoveredIds = Array.isArray(currentHovered) ? currentHovered : (currentHovered ? [currentHovered] : []);
          if (hoveredIds.includes(featureId)) {
            setFeatureState(featureId, false);
          }
        }
      });

      // 如果所有高亮都被清除，重置 hoveredIdRef
      const hoveredIds = Array.isArray(currentHovered) ? currentHovered : (currentHovered ? [currentHovered] : []);
      const remainingIds = hoveredIds.filter(hid => !ids.includes(hid));
      if (remainingIds.length === 0) {
        hoveredIdRef.current = null;
      } else if (remainingIds.length === 1) {
        hoveredIdRef.current = remainingIds[0];
      } else {
        hoveredIdRef.current = remainingIds;
      }
    },
    flyToRegion: (bounds: [[number, number], [number, number]]) => {
      if (!map.current || !mapReadyRef.current || !styleReadyRef.current || !bounds) return;

      // // 使用 safeCameraControl 检查 cameraLock
      // safeCameraControl(() => {
        try {
          map.current.fitBounds(bounds, {
            padding: { top: 80, bottom: 80, left: 80, right: 80 },
            duration: 1500,
            easing: easeInOutCubic,
            pitch: defaultPitch,
            bearing: defaultBearing,
            maxZoom: 10
          });
        } catch (error) {
          console.warn('[RegionMap] Error flying to region:', error);
        }
      // });
    },
    showOnlyRegion: (id: string | string[]) => {
      if (!map.current || !mapReadyRef.current || !id) return;

      const ids = Array.isArray(id) ? id : [id];
      const idStrings = ids.map(id => String(id));
      
      // 保存当前可见的区域
      visibleIdsRef.current = idStrings;
      
      // 设置 filter：只显示指定的区域
      // 使用 ['in', ['id'], ['literal', [...]]] 语法
      const filter: any[] = ['in', ['id'], ['literal', idStrings]];
      
      try {
        // 更新填充图层 filter
        const fillLayer = map.current.getLayer('regions-fill');
        const borderLayer = map.current.getLayer('regions-border');
        
        if (fillLayer) {
          map.current.setFilter('regions-fill', filter);
          console.log('[RegionMap] Set filter on regions-fill:', filter);
        } else {
          console.warn('[RegionMap] regions-fill layer not found');
        }
        
        // 更新边界图层 filter
        if (borderLayer) {
          map.current.setFilter('regions-border', filter);
          console.log('[RegionMap] Set filter on regions-border:', filter);
        } else {
          console.warn('[RegionMap] regions-border layer not found');
        }
        
        console.log('[RegionMap] Showing only regions:', idStrings);
        
        // 注意：如果需要在 filter 生效后执行 fitBounds，应该使用 map.once('idle')
        // 例如：
        // map.current.once('idle', () => {
        //   // 在这里执行 fitBounds 或其他操作
        // });
      } catch (error) {
        console.error('[RegionMap] Error setting filter:', error);
      }
    },
    showAllRegions: () => {
      if (!map.current || !mapReadyRef.current) return;

      // 清除 filter，显示所有区域
      visibleIdsRef.current = null;
      
      try {
        if (map.current.getLayer('regions-fill')) {
          map.current.setFilter('regions-fill', null);
        }
        if (map.current.getLayer('regions-border')) {
          map.current.setFilter('regions-border', null);
        }
        
        console.log('[RegionMap] Showing all regions');
      } catch (error) {
        console.warn('[RegionMap] Error clearing filter:', error);
      }
    }
  }));

  // 地图初始化 effect（只负责创建 map 和注册事件监听器）
  useEffect(() => {
    // 1. 如果 Mapbox 脚本没加载完，或者容器没准备好，或者地图已经创建了，就跳过
    if (!mapboxScriptLoaded) return;
    if (!mapContainer.current) return;
    if (map.current) return;

    // 2. 安全检查 window 对象
    if (!(window as any).mapboxgl) {
      console.warn('[RegionMap] mapboxgl script loaded but window object missing');
      return;
    }

    console.log('[RegionMap] Initializing Mapbox...');

    const mapboxgl = (window as any).mapboxgl;
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

    // 3. 创建地图
    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: defaultCenter, // 使用 props
        zoom: defaultZoom,     // 使用 props
        pitch: defaultPitch,
        bearing: defaultBearing,
        projection: 'mercator' // 建议显式指定投影，或是 'globe'
      });
    } catch (err) {
      console.error('[RegionMap] Error creating map instance:', err);
      return;
    }

    console.log('[RegionMap] map created', map.current);

    // 暴露地图实例到 window 对象，方便调试
    (window as any).__MAP__ = map.current;
    console.log('[RegionMap] Map instance exposed to window.__MAP__');

    // 立即注册错误监听器（非常重要）
    map.current.on('error', (e: any) => {
      console.error('[Mapbox error]', e?.error || e);
    });

    // 立即注册 style.load 监听器（用于调试）
    map.current.on('style.load', () => {
      console.log('[Mapbox] style.load fired');
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      mapReadyRef.current = true;
      console.log('[RegionMap] Map loaded event');
      checkAndSetFullyReady();
      // 强制 resize 一次，防止 flex 布局导致的尺寸计算错误
      map.current.resize();
    });

    map.current.on('style.load', () => {
      if (styleReadyRef.current) return;
      styleReadyRef.current = true;
      console.log('[RegionMap] style.load');
      initSourcesAndLayers(); // 👈 关键：在 style.load 时初始化 source 和 layer
    });

    return () => {
      map.current?.remove();
      map.current = null;
      
      // 只有在 map.remove() 后才 reset refs
      mapReadyRef.current = false;
      styleReadyRef.current = false;
      sourceReadyRef.current = false;
      fullyReadySetRef.current = false; // 重置闸门
      styleLoadBoundRef.current = false; // 重置 style.load 监听闸门
      // mapFullyReady 是地图生命周期状态，只在 map.remove 时 reset
      setMapFullyReady(false);
      
      hoveredIdRef.current = null;
      lockedIdRef.current = null;
      hoveredProvinceIdRef.current = null;
      allProvinceIdsRef.current = [];
      regionsDataRef.current.clear();
      geojsonDataRef.current = null;
    };
    // ⚠️ 关键点：这里不要放 defaultCenter, defaultZoom 等！
    // 只要 mapboxScriptLoaded 变了（脚本加载好了），尝试初始化一次即可。
    // 即使 ESLint 警告你缺少依赖，也不要加 defaultCenter 进去，
    // 因为我们不希望 center 变化时导致地图被销毁重建。
  }, [mapboxScriptLoaded]);

  // -----------------------------------------------------------------------------
  // 📍 初始 Category 过滤：根据 currentCategory 过滤并 fitBounds
  // -----------------------------------------------------------------------------
  useEffect(() => {
    if (!map.current || !mapFullyReady || !currentCategory) return;

    // 1. 强制 resize 以处理布局变化（解决留白问题）
    // resize() 是同步操作，立即执行以确保地图容器尺寸正确
    if (mapReadyRef.current) {
      map.current.resize();
      console.log('[RegionMap] Map resized after category change');
    }

    // 2. 获取该 category 的所有 geojsonIds（确保是字符串数组）
    const categoryIds = getCategoryIds(currentCategory).map(String);
    
    if (categoryIds.length === 0) {
      console.warn(`[RegionMap] No provinces found for category: ${currentCategory}`);
      return;
    }

    console.log(`[RegionMap] Initializing category filter: ${currentCategory} (${categoryIds.length} provinces)`);

    // 3. 应用过滤器：只显示该 category 的省份
    try {
      const filterExpression = ['in', ['get', 'adcode'], ['literal', categoryIds]];
      map.current.setFilter('regions-fill', filterExpression);
      map.current.setFilter('regions-border', filterExpression);
      
      // 设置默认的 paint properties
      map.current.setPaintProperty('regions-fill', 'fill-opacity', 0.25);
      map.current.setPaintProperty('regions-border', 'line-opacity', 1.0);
      map.current.setPaintProperty('regions-fill', 'fill-color', '#c9b27c');
      
      console.log(`[RegionMap] Applied category filter for ${currentCategory}`);
    } catch (error) {
      console.error('[RegionMap] Error setting category filter:', error);
    }

    // 4. 计算整个 category 的 bounds 并 fitBounds（使用字符串 ID）
    const categoryBounds = categoryIds
      .map(id => regionsDataRef.current.get(String(id))?.bounds)
      .filter(Boolean) as Array<[[number, number], [number, number]]>;

    const mergedBounds = mergeBounds(categoryBounds);

    if (mergedBounds) {
      map.current.stop(); // 停止当前动画

      // 根据 category 确定合适的 maxZoom
      // 小区域（如北京）使用较小的 maxZoom，大区域使用较大的 maxZoom
      const maxZoom = categoryIds.length <= 1 ? 7 : categoryIds.length <= 3 ? 6.5 : 5.5;

      map.current.fitBounds(mergedBounds, {
        padding: { top: 100, bottom: 100, left: 100, right: 100 },
        duration: 1500,
        maxZoom: maxZoom
      });

      console.log(`[RegionMap] Fitted bounds for category ${currentCategory} with maxZoom ${maxZoom}`);
    } else {
      console.warn('[RegionMap] Could not calculate bounds for category:', currentCategory);
    }
  }, [currentCategory, mapFullyReady]);

  // -----------------------------------------------------------------------------
  // 📍 核心交互逻辑：监听 activeRegionId 变化（子区域级别）
  // -----------------------------------------------------------------------------
  useEffect(() => {
    if (!map.current || !mapFullyReady || !currentCategory) return;

    // 1. 强制 resize 以处理布局变化（解决留白问题）
    // resize() 是同步操作，立即执行以确保地图容器尺寸正确
    if (mapReadyRef.current) {
      map.current.resize();
      console.log('[RegionMap] Map resized after activeRegionId change');
    }

    // 2. 如果没有 activeRegionId，显示整个 category 的全景
    if (!activeRegionId) {
      console.log('[RegionMap] No active sub-region, showing category-level view for:', currentCategory);
      
      // 获取该 category 的所有 geojsonIds
      const allIdsInCategory = getCategoryIds(currentCategory);
      
      if (allIdsInCategory.length === 0) {
        console.warn(`[RegionMap] No provinces found for category: ${currentCategory}`);
        return;
      }

      // 应用 category 级别的过滤（统一转换为字符串）
      const categoryIdsString = allIdsInCategory.map(String);
      
      try {
        const filterExpression = ['in', ['get', 'adcode'], ['literal', categoryIdsString]];
        map.current.setFilter('regions-fill', filterExpression);
        map.current.setFilter('regions-border', filterExpression);
        
        // 重置 paint properties 为默认值（所有省份同等显示）
        // 使用表达式确保所有省份使用相同样式
        map.current.setPaintProperty('regions-fill', 'fill-opacity', 0.25);
        map.current.setPaintProperty('regions-border', 'line-opacity', 1.0);
        map.current.setPaintProperty('regions-fill', 'fill-color', '#c9b27c');
        map.current.setPaintProperty('regions-border', 'line-color', '#9e8756');
        map.current.setPaintProperty('regions-border', 'line-opacity', 1.0);
        
        console.log(`[RegionMap] Applied category filter for ${currentCategory} (${categoryIdsString.length} provinces)`);
      } catch (error) {
        console.error('[RegionMap] Error setting category filter:', error);
        return;
      }

      // 计算整个 category 的 bounds 并 fitBounds（统一使用字符串 ID）
      const categoryBounds = categoryIdsString
        .map(id => regionsDataRef.current.get(String(id))?.bounds)
        .filter(Boolean) as Array<[[number, number], [number, number]]>;

      const mergedBounds = mergeBounds(categoryBounds);

      if (mergedBounds) {
        map.current.stop();
        const maxZoom = allIdsInCategory.length <= 1 ? 7 : allIdsInCategory.length <= 3 ? 6.5 : 5.5;
        
        map.current.fitBounds(mergedBounds, {
          padding: { top: 100, bottom: 100, left: 100, right: 100 },
          duration: 1200,
          maxZoom: maxZoom
        });
        
        console.log(`[RegionMap] Fitted bounds for category ${currentCategory}`);
      }
      
      return;
    }

    // 3. 如果有 activeRegionId，获取映射关系 (pageId -> geojsonIds)
    const mapping = getRegionMapping(activeRegionId);
    
    if (!mapping) {
      console.warn(`[RegionMap] No mapping found for activeRegionId: ${activeRegionId}`);
      return;
    }

    // 4. 验证该 sub-region 是否属于当前 category
    if (mapping.category !== currentCategory) {
      console.warn(`[RegionMap] ⚠️ Sub-region ${activeRegionId} (category: ${mapping.category}) does not match current category: ${currentCategory}`);
      // 仍然允许显示，但记录警告
    }

    // 🔍 确保 targetIds 是字符串数组
    const targetIds = mapping.geojsonIds.map(String); // 统一转换为字符串
    console.log(`[RegionMap] Focusing on sub-region: ${mapping.name} (IDs: ${targetIds.join(', ')})`);

    // 5. 检查数据是否存在
    const hasData = targetIds.some(id => regionsDataRef.current.has(id));
    
    if (!hasData) {
      console.error(`[RegionMap] ⚠️ 数据缺失！GeoJSON 中找不到以下 ID: ${targetIds.join(', ')}`);
      console.error(`[RegionMap] 请检查 GeoJSON 文件是否包含所有省份数据。`);
      console.error(`[RegionMap] 当前已加载的省份:`, Array.from(regionsDataRef.current.keys()));
      return;
    }

    // 6. 使用双层 Filter + Paint Property 实现高亮效果
    // 逻辑：选中的省份 100% 不透明，未选中的省份 20% 不透明（但仍在 category 范围内）
    try {
      // 首先应用 filter：只显示当前 category 的省份
      const categoryIds = getCategoryIds(currentCategory).map(String);
      const categoryFilter = ['in', ['get', 'adcode'], ['literal', categoryIds]];
      map.current.setFilter('regions-fill', categoryFilter);
      map.current.setFilter('regions-border', categoryFilter);

      // 然后使用 paint property 控制颜色和透明度：选中的浅棕色高亮，未选中的保持白色底色
      // ⚠️ 重要：fill-color 必须在 fill-opacity 之前设置，确保高亮效果正确
      map.current.setPaintProperty('regions-fill', 'fill-color', [
        'case',
        ['in', ['get', 'adcode'], ['literal', targetIds]], 
        '#c9b27c',  // 选中的省份：浅棕色（高亮）
        '#ffffff'   // 未选中的省份：白色（保持底色）
      ]);

      // 控制透明度：选中的高亮，未选中的保持底色
      map.current.setPaintProperty('regions-fill', 'fill-opacity', [
        'case',
        ['in', ['get', 'adcode'], ['literal', targetIds]], 
        1.0,  // 选中的省份：100% 不透明（高亮）
        0.0   // 未选中的省份：完全透明（显示白色底色）
      ]);

      // 边框也做类似处理
      map.current.setPaintProperty('regions-border', 'line-color', [
        'case',
        ['in', ['get', 'adcode'], ['literal', targetIds]], 
        '#9e8756',  // 选中的省份：棕色边框
        '#9e8756'   // 未选中的省份：默认边框颜色
      ]);

      map.current.setPaintProperty('regions-border', 'line-opacity', [
        'case',
        ['in', ['get', 'adcode'], ['literal', targetIds]], 
        1.0,  // 选中的省份：100% 不透明
        0.5   // 未选中的省份：50% 不透明
      ]);

      map.current.setPaintProperty('regions-border', 'line-width', [
        'case',
        ['in', ['get', 'adcode'], ['literal', targetIds]], 
        2,    // 选中的省份：更粗的边框
        1     // 未选中的省份：默认边框宽度
      ]);

      console.log(`[RegionMap] ✅ Applied sub-region filter and highlight for ${mapping.name}`);
    } catch (error) {
      console.error('[RegionMap] Error setting sub-region filter and highlight:', error);
      return;
    }

    // 7. 计算边界并 fitBounds 到该 sub-region（使用字符串 ID）
    const provinceBounds = targetIds
      .map(id => regionsDataRef.current.get(String(id))?.bounds)
      .filter(Boolean) as Array<[[number, number], [number, number]]>;

    const mergedBounds = mergeBounds(provinceBounds);

    if (mergedBounds) {
      map.current.stop(); // 停止当前动画

      // 根据省份数量确定 maxZoom
      const maxZoom = targetIds.length === 1 ? 7 : targetIds.length <= 2 ? 6.5 : 6;

      map.current.fitBounds(mergedBounds, {
        padding: { top: 100, bottom: 100, left: 100, right: 100 },
        duration: 1200,
        maxZoom: maxZoom
      });
      
      // 可选：飞到位后稍微调整角度，增加 3D 感
      if (cameraTimeoutRef.current) clearTimeout(cameraTimeoutRef.current);
      cameraTimeoutRef.current = setTimeout(() => {
        if (!map.current) return;
        map.current.easeTo({ pitch: 45, bearing: 10, duration: 800 });
      }, 1200);
      
      console.log(`[RegionMap] Fitted bounds for sub-region ${mapping.name}`);
    } else {
      console.warn('[RegionMap] Could not calculate bounds for sub-region IDs:', targetIds);
    }

    return () => {
      if (cameraTimeoutRef.current) clearTimeout(cameraTimeoutRef.current);
    };

  }, [activeRegionId, mapFullyReady, currentCategory]); // ⚠️ 必须监听这些变量

  // -----------------------------------------------------------------------------
  // 📍 容器尺寸变化监听：使用 ResizeObserver 确保地图正确调整大小
  // -----------------------------------------------------------------------------
  useEffect(() => {
    if (!mapContainer.current || !map.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (map.current && mapReadyRef.current) {
        // 使用 requestAnimationFrame 确保在下一帧执行，避免频繁调用
        requestAnimationFrame(() => {
          if (map.current) {
            map.current.resize();
            console.log('[RegionMap] Container resized, map.resize() called');
          }
        });
      }
    });

    resizeObserver.observe(mapContainer.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [mapboxScriptLoaded]); // 当脚本加载后开始监听

  return (
    <>
      {/* 1. 引入 CSS (关键修复) */}
      <link href="https://api.mapbox.com/mapbox-gl-js/v3.17.0/mapbox-gl.css" rel="stylesheet" />

      {/* 2. 脚本加载控制 (关键修复) */}
      <Script
        src="https://api.mapbox.com/mapbox-gl-js/v3.17.0/mapbox-gl.js"
        strategy="afterInteractive" // 建议改为 afterInteractive，对性能更好
        onLoad={() => {
          console.log('[RegionMap] Script Loaded');
          setMapboxScriptLoaded(true); // 触发 useEffect
        }}
        onReady={() => {
          // 双重保险，有时候 onLoad 不触发但 onReady 会触发
          if (!mapboxScriptLoaded) setMapboxScriptLoaded(true);
        }}
      />

      {/* 3. 容器 */}
      <div className="w-full h-full relative overflow-hidden">
        {!process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? (
          <div className="text-center p-8">
            <p className="text-gray-600 mb-2" style={{ fontFamily: 'Monda, sans-serif' }}>
              Mapbox token not configured
            </p>
            <p className="text-sm text-gray-500" style={{ fontFamily: 'Monda, sans-serif' }}>
              Please set NEXT_PUBLIC_MAPBOX_TOKEN in your environment variables
            </p>
          </div>
        ) : (
          <div 
            ref={mapContainer} 
            className="absolute inset-0 w-full h-full" // 使用 absolute 铺满，防止尺寸计算差异
          />
        )}
      </div>
    </>
  );
});

RegionMap.displayName = 'RegionMap';

export default RegionMap;
