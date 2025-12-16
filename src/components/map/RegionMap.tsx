'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

interface RegionMapProps {
  journeys: Array<{
    id: string;
    title: string;
    image?: string;
    region?: string;
    city?: string;
    location?: string;
    coordinates?: [number, number];
  }>;
  regionName: string;
  defaultCenter?: [number, number];
  defaultZoom?: number;
}

declare global {
  interface Window {
    mapboxgl: any;
  }
}

export default function RegionMap({ 
  journeys, 
  regionName, 
  defaultCenter = [104.1954, 35.8617], // 中国中心坐标
  defaultZoom = 5 
}: RegionMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedJourney, setSelectedJourney] = useState<string | null>(null);

  // 初始化地图
  useEffect(() => {
    if (!mapLoaded || !mapContainer.current || !window.mapboxgl) return;

    // 初始化地图
    map.current = new window.mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: defaultCenter,
      zoom: defaultZoom,
    });

    // 添加导航控件
    map.current.addControl(new window.mapboxgl.NavigationControl(), 'top-right');

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [mapLoaded, defaultCenter, defaultZoom]);

  // 添加标记点
  useEffect(() => {
    if (!map.current || !window.mapboxgl) return;

    // 清除现有标记
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // 添加新标记
    journeys.forEach((journey) => {
      if (journey.coordinates && journey.coordinates.length === 2) {
        const [lng, lat] = journey.coordinates;
        
        // 创建自定义标记
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.style.width = '20px';
        el.style.height = '20px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = selectedJourney === journey.id ? '#000' : '#c0a273';
        el.style.border = '2px solid white';
        el.style.cursor = 'pointer';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        el.style.transition = 'background-color 0.2s';

        // 创建弹出窗口
        const popup = new window.mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <div style="font-family: 'Monda', sans-serif; padding: 8px;">
              <strong style="font-size: 14px; color: #000;">${journey.title}</strong>
              ${journey.city ? `<p style="font-size: 12px; color: #666; margin-top: 4px;">${journey.city}</p>` : ''}
            </div>
          `);

        // 创建标记
        const marker = new window.mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(map.current);

        markersRef.current.push(marker);

        // 点击标记时选中旅程
        el.addEventListener('click', () => {
          setSelectedJourney(journey.id);
          // 滚动到对应的旅程卡片
          const journeyElement = document.getElementById(`journey-${journey.id}`);
          if (journeyElement) {
            journeyElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        });
      }
    });
  }, [journeys, selectedJourney]);

  useEffect(() => {
    // 动态加载 Mapbox CSS
    const link = document.createElement('link');
    link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.17.0/mapbox-gl.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return (
    <>
      {/* 加载 Mapbox JS */}
      <Script
        src="https://api.mapbox.com/mapbox-gl-js/v3.17.0/mapbox-gl.js"
        strategy="lazyOnload"
        onLoad={() => {
          // 设置 Mapbox access token（需要从环境变量获取）
          const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
          if (token) {
            window.mapboxgl.accessToken = token;
            setMapLoaded(true);
          } else {
            console.warn('[RegionMap] NEXT_PUBLIC_MAPBOX_TOKEN is not set. Map will not load.');
            // 即使没有 token 也设置 mapLoaded，让组件显示错误信息
            setMapLoaded(true);
          }
        }}
        onError={() => {
          console.error('[RegionMap] Failed to load Mapbox GL JS');
          setMapLoaded(true); // 设置 loaded 以显示错误信息
        }}
      />

      <div className="w-full h-full min-h-[600px] rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
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
          <div ref={mapContainer} className="w-full h-full" />
        )}
      </div>
    </>
  );
}

