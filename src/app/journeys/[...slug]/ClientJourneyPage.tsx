'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Button,
  Container,
  Heading,
  Text,
} from '@/components/common';
import { useJourneyManagement } from '@/context/JourneyManagementContext';
import { useUser } from '@/context/UserContext';
import { Extension, Journey, JourneyExperience, JourneyHotel } from '@/types';
import {
  getRenderableImageUrl,
  pickFirstValidImagePath,
} from '@/lib/imageUtils';
import {
  generateStandardPageConfig,
  JOURNEY_PAGE_TEMPLATE,
} from '@/lib/journeyPageTemplate';
import InclusionsAndOffers from '@/components/journey/InclusionsAndOffers';
import Extensions from '@/components/journey/Extensions';
import Hotels from '@/components/journey/Hotels';
import Experiences from '@/components/journey/Experiences';
import ExploreTogetherLayout from '@/components/journey/ExploreTogetherLayout';
import JourneyMap from '@/components/map/JourneyMap';
import { JourneyHotelDetailModal } from '@/components/journey/JourneyHotelDetailModal';
import { ExperienceDetailModal } from '@/components/journey/ExperienceDetailModal';
import { LoginModal } from '@/components/modals/LoginModal';
import { PlanTripModal } from '@/components/modals/PlanTripModal';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { JourneyDetailPageSkeleton } from '@/components/journeys/JourneyRouteSkeleton';

const SITE_URL = 'https://www.korascale.com';
const JOURNEY_TYPE_SLUGS = [
  'explore-together',
  'deep-discovery',
  'signature-journeys',
  'group-tours',
] as const;

const GEO_FALLBACKS: Array<
  [keyword: string, coords: { lng: number; lat: number; name: string }]
> = [
  ['jiuzhaigou', { lng: 103.92, lat: 33.26, name: 'Jiuzhaigou' }],
  ['九寨沟', { lng: 103.92, lat: 33.26, name: 'Jiuzhaigou' }],
  ['chengdu', { lng: 104.06, lat: 30.67, name: 'Chengdu' }],
  ['成都', { lng: 104.06, lat: 30.67, name: 'Chengdu' }],
  ['chongqing', { lng: 106.55, lat: 29.56, name: 'Chongqing' }],
  ['重庆', { lng: 106.55, lat: 29.56, name: 'Chongqing' }],
  ['shanghai', { lng: 121.47, lat: 31.23, name: 'Shanghai' }],
  ['上海', { lng: 121.47, lat: 31.23, name: 'Shanghai' }],
  ['hangzhou', { lng: 120.16, lat: 30.29, name: 'Hangzhou' }],
  ['杭州', { lng: 120.16, lat: 30.29, name: 'Hangzhou' }],
  ['huangshan', { lng: 118.34, lat: 29.71, name: 'Huangshan' }],
  ['黄山', { lng: 118.34, lat: 29.71, name: 'Huangshan' }],
  ['yunnan', { lng: 102.71, lat: 25.04, name: 'Yunnan' }],
  ['云南', { lng: 102.71, lat: 25.04, name: 'Yunnan' }],
  ['tibet', { lng: 91.12, lat: 29.65, name: 'Lhasa' }],
  ['西藏', { lng: 91.12, lat: 29.65, name: 'Lhasa' }],
  ['beijing', { lng: 116.41, lat: 39.9, name: 'Beijing' }],
  ['北京', { lng: 116.41, lat: 39.9, name: 'Beijing' }],
];

type GeoCoords = { lng: number; lat: number; name: string };

function isValidCoordinate(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

function inferCoordsFromText(text?: string | null): GeoCoords | null {
  const normalized = text?.toLowerCase().trim();
  if (!normalized) return null;

  for (const [keyword, coords] of GEO_FALLBACKS) {
    if (normalized.includes(keyword)) {
      return coords;
    }
  }

  return null;
}

function inferJourneyBaseCoords(journey?: Journey | null): GeoCoords {
  const journeyWithCoords = journey as (Journey & { longitude?: number; latitude?: number }) | null;
  const lng = journeyWithCoords?.longitude;
  const lat = journeyWithCoords?.latitude;

  if (isValidCoordinate(lng, -180, 180) && isValidCoordinate(lat, -90, 90)) {
    return { lng, lat, name: journey?.city || journey?.title || 'Journey' };
  }

  return (
    inferCoordsFromText([journey?.region, journey?.city, journey?.title].filter(Boolean).join(' ')) || {
      lng: 104.06,
      lat: 30.67,
      name: journey?.city || journey?.title || 'Journey',
    }
  );
}

function extractRawCoordsFromValue(value: unknown): { lng: number; lat: number } | null {
  if (!value) return null;

  if (typeof value === 'string') {
    const matches = value.match(/-?\d+(?:\.\d+)?/g);
    if (matches && matches.length >= 2) {
      const lng = Number(matches[0]);
      const lat = Number(matches[1]);
      if (isValidCoordinate(lng, -180, 180) && isValidCoordinate(lat, -90, 90)) {
        return { lng, lat };
      }
    }
  }

  if (Array.isArray(value) && value.length >= 2) {
    const lng = Number(value[0]);
    const lat = Number(value[1]);
    if (isValidCoordinate(lng, -180, 180) && isValidCoordinate(lat, -90, 90)) {
      return { lng, lat };
    }
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

    const directLng = Number(candidate.lng ?? candidate.lon ?? candidate.longitude);
    const directLat = Number(candidate.lat ?? candidate.latitude);

    if (isValidCoordinate(directLng, -180, 180) && isValidCoordinate(directLat, -90, 90)) {
      return { lng: directLng, lat: directLat };
    }

    return (
      extractRawCoordsFromValue(candidate.coords) ||
      extractRawCoordsFromValue(candidate.coordinates) ||
      extractRawCoordsFromValue(candidate.mapCenter) ||
      extractRawCoordsFromValue(candidate.center) ||
      extractRawCoordsFromValue(candidate.position) ||
      extractRawCoordsFromValue(candidate.geo) ||
      extractRawCoordsFromValue(candidate.point)
    );
  }

  return null;
}

function extractRawCoordsFromStep(step: unknown): { lng: number; lat: number } | null {
  if (!step || typeof step !== 'object') return null;

  const candidate = step as {
    longitude?: unknown;
    latitude?: unknown;
    lng?: unknown;
    lat?: unknown;
    location?: unknown;
    coords?: unknown;
    coordinates?: unknown;
    mapCenter?: unknown;
    center?: unknown;
    position?: unknown;
    geo?: unknown;
    point?: unknown;
  };

  const directLng = Number(candidate.longitude ?? candidate.lng);
  const directLat = Number(candidate.latitude ?? candidate.lat);

  if (isValidCoordinate(directLng, -180, 180) && isValidCoordinate(directLat, -90, 90)) {
    return { lng: directLng, lat: directLat };
  }

  return (
    extractRawCoordsFromValue(candidate.location) ||
    extractRawCoordsFromValue(candidate.coords) ||
    extractRawCoordsFromValue(candidate.coordinates) ||
    extractRawCoordsFromValue(candidate.mapCenter) ||
    extractRawCoordsFromValue(candidate.center) ||
    extractRawCoordsFromValue(candidate.position) ||
    extractRawCoordsFromValue(candidate.geo) ||
    extractRawCoordsFromValue(candidate.point)
  );
}

function getForcedLocationFromTitle(title?: string | null): { lng: number; lat: number } | null {
  const normalizedTitle = title?.toLowerCase().trim();
  if (!normalizedTitle) return null;

  if (normalizedTitle.includes('lhasa') || normalizedTitle.includes('tibet')) {
    return { lng: 91.1322, lat: 29.6604 };
  }

  if (normalizedTitle.includes('yunnan') || normalizedTitle.includes('kunming')) {
    return { lng: 102.7122, lat: 25.0406 };
  }

  if (normalizedTitle.includes('guilin')) {
    return { lng: 110.2902, lat: 25.2736 };
  }

  if (normalizedTitle.includes('shanghai')) {
    return { lng: 121.4737, lat: 31.2304 };
  }

  if (normalizedTitle.includes('beijing')) {
    return { lng: 116.4074, lat: 39.9042 };
  }

  return null;
}

function truncateText(text: string, maxLength: number) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

function getCleanDescription(journey?: Journey | null) {
  const description = journey?.description?.trim() || '';
  const shortDescription = journey?.shortDescription?.trim() || '';

  if (!description) return shortDescription;
  if (description.includes('🏞️')) {
    return shortDescription || truncateText(description.replace(/🏞️/g, '').trim(), 160);
  }

  return description;
}

function DetailsAccordion({
  meals,
  accommodation,
  transportation,
}: {
  meals?: string[];
  accommodation?: string;
  transportation?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const hasDetails = (meals && meals.length > 0) || accommodation || transportation;

  if (!hasDetails) return null;

  return (
    <div className="mt-6 border-t border-gray-200 pt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <span className="font-medium">Details</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>
      {isOpen && (
        <div className="mt-3 space-y-2 text-xs text-gray-500">
          {meals && meals.length > 0 && (
            <div>
              <span className="font-medium text-gray-600">Meals: </span>
              {meals.join(', ')}
            </div>
          )}
          {accommodation && (
            <div>
              <span className="font-medium text-gray-600">Accommodation: </span>
              {accommodation}
            </div>
          )}
          {transportation && (
            <div>
              <span className="font-medium text-gray-600">Transportation: </span>
              {transportation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ClientJourneyPage() {
  const {
    journeys,
    error: journeysError,
    isLoading: journeysLoading,
    clearStorageAndReload,
  } = useJourneyManagement();
  const { user } = useUser();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const [journeyFromApi, setJourneyFromApi] = useState<Journey | null>(null);
  const [isLoadingFromApi, setIsLoadingFromApi] = useState(false);
  const [journeyApiError, setJourneyApiError] = useState<string | null>(null);

  const [extensionsData, setExtensionsData] = useState<Extension[]>([]);
  const [hotelsData, setHotelsData] = useState<JourneyHotel[]>([]);
  const [experiencesData, setExperiencesData] = useState<JourneyExperience[]>([]);
  const [activeHotel, setActiveHotel] = useState<JourneyHotel | null>(null);
  const [activeExperience, setActiveExperience] = useState<JourneyExperience | null>(null);
  const [activeDay, setActiveDay] = useState<number | undefined>(undefined);
  const [currentDay, setCurrentDay] = useState<number | undefined>(undefined);
  const [activeNav, setActiveNav] = useState<string>('overview');
  const [isPlanTripModalOpen, setIsPlanTripModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [pendingBooking, setPendingBooking] = useState<{
    slug: string;
    journeyId: string;
    date: Date;
    price: number;
  } | null>(null);

  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
  const dayRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const itineraryPaneRef = useRef<HTMLDivElement | null>(null);

  const slugArray = params.slug as string[];
  const slugRaw = Array.isArray(slugArray) ? slugArray.join('/') : slugArray || '';
  const slug = slugRaw.replace(/^\/+|\/+$/g, '').trim() || slugRaw;
  const cleanSlug = slug.replace(/^journeys\//, '').replace(/^\//, '').trim() || slug;
  const normalizedSlug =
    (cleanSlug || slug).split('/').filter(Boolean).pop() || cleanSlug || slug;
  const slugApiPath = (cleanSlug || normalizedSlug)
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  const contextJourney = useMemo(
    () => journeys.find((j) => j.slug === normalizedSlug || j.slug === cleanSlug || j.slug === slug),
    [journeys, slug, cleanSlug, normalizedSlug]
  );

  const isJourneyTypeSlug =
    (slug && JOURNEY_TYPE_SLUGS.includes(slug as any)) ||
    (cleanSlug && JOURNEY_TYPE_SLUGS.includes(cleanSlug as any));
  const isTypeRoute =
    (slug && (slug.startsWith('type/') || slug === 'type')) ||
    (cleanSlug && (cleanSlug.startsWith('type/') || cleanSlug === 'type'));

  useEffect(() => {
    if (!isTypeRoute && !isJourneyTypeSlug) return;
    const typeValue = slug.replace('type/', '');
    if (isTypeRoute && typeValue) {
      router.replace(`/journeys/type/${typeValue}`);
      return;
    }
    if (isJourneyTypeSlug) {
      router.replace(`/journeys/type/${slug}`);
    }
  }, [isJourneyTypeSlug, isTypeRoute, router, slug]);

  useEffect(() => {
    if (searchParams.get('clearCache') !== '1') return;
    (async () => {
      await clearStorageAndReload();
      router.replace(`/journeys/${normalizedSlug}`, { scroll: true });
    })();
  }, [clearStorageAndReload, normalizedSlug, router, searchParams]);

  useEffect(() => {
    if (!normalizedSlug || isJourneyTypeSlug || isTypeRoute) return;
    if (
      contextJourney?.id &&
      ((contextJourney.itinerary?.length ?? 0) > 0 ||
        !!contextJourney.description ||
        !!contextJourney.shortDescription)
    ) {
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setIsLoadingFromApi(true);
        setJourneyApiError(null);
        const response = await fetch(`/api/journeys/slug/${slugApiPath}`, {
          cache: 'no-store',
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload?.error || `Failed to fetch journey (HTTP ${response.status})`);
        }
        if (!cancelled) {
          setJourneyFromApi(payload?.journey || null);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('[ClientJourneyPage] Failed to fetch journey:', error);
          if (!contextJourney?.id) {
            setJourneyApiError(
              error instanceof Error ? error.message : 'Journey data not found or API timeout.'
            );
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoadingFromApi(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [contextJourney, isJourneyTypeSlug, isTypeRoute, normalizedSlug, slugApiPath]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [extensionsRes, hotelsRes, experiencesRes] = await Promise.all([
          fetch('/api/extensions', { cache: 'no-store' }),
          fetch('/api/journey-hotels', { cache: 'no-store' }),
          fetch('/api/experiences', { cache: 'no-store' }),
        ]);

        const [extensionsJson, hotelsJson, experiencesJson] = await Promise.all([
          extensionsRes.ok ? extensionsRes.json() : Promise.resolve({ extensions: [] }),
          hotelsRes.ok ? hotelsRes.json() : Promise.resolve({ hotels: [] }),
          experiencesRes.ok ? experiencesRes.json() : Promise.resolve({ experiences: [] }),
        ]);

        if (!cancelled) {
          setExtensionsData(extensionsJson.extensions || []);
          setHotelsData(hotelsJson.hotels || []);
          setExperiencesData(experiencesJson.experiences || []);
        }
      } catch (error) {
        console.error('[ClientJourneyPage] Failed to fetch supporting data:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const resolvedJourney = useMemo(
    () => contextJourney ?? journeyFromApi ?? null,
    [contextJourney, journeyFromApi]
  );

  const displayDescription = useMemo(
    () => getCleanDescription(resolvedJourney),
    [resolvedJourney]
  );
  const truncatedDescription = useMemo(
    () => (displayDescription ? displayDescription.substring(0, 160) : ''),
    [displayDescription]
  );

  const heroImage = getRenderableImageUrl(
    pickFirstValidImagePath(
      resolvedJourney?.image,
      resolvedJourney?.heroImage,
      resolvedJourney?.mainContentImage,
      resolvedJourney?.images?.[0],
      resolvedJourney?.overview?.sideImage
    )
  );

  const overviewImage = getRenderableImageUrl(
    pickFirstValidImagePath(
      resolvedJourney?.overview?.sideImage,
      resolvedJourney?.images?.[1],
      resolvedJourney?.mainContentImage,
      resolvedJourney?.image,
      resolvedJourney?.heroImage
    )
  );

  const safeJourney = useMemo(() => {
    if (!resolvedJourney) return null;

    const safeImages = (resolvedJourney.images || []).map((image) =>
      getRenderableImageUrl(image)
    );

    const safeItinerary =
      resolvedJourney.itinerary?.map((day) => ({
        ...day,
        image: getRenderableImageUrl(
          pickFirstValidImagePath(
            day.image,
            resolvedJourney.images?.[0],
            resolvedJourney.mainContentImage,
            resolvedJourney.image,
            resolvedJourney.heroImage
          )
        ),
        description: truncateText(day.description || '', 1600),
      })) || [];

    const safeDescription = displayDescription || resolvedJourney.shortDescription || '';
    const safeShortDescription =
      resolvedJourney.shortDescription?.trim() ||
      `${truncatedDescription}${safeDescription.length > 160 ? '...' : ''}`;

    return {
      ...resolvedJourney,
      image: heroImage,
      heroImage,
      mainContentImage: getRenderableImageUrl(resolvedJourney.mainContentImage),
      images: safeImages,
      description: safeDescription,
      shortDescription: safeShortDescription,
      overview: {
        ...resolvedJourney.overview,
        description: safeDescription,
        sideImage: overviewImage,
      },
      itinerary: safeItinerary,
    } as Journey;
  }, [displayDescription, heroImage, overviewImage, resolvedJourney, truncatedDescription]);

  const pageConfig = useMemo(() => {
    if (!safeJourney) return null;

    const config = generateStandardPageConfig(safeJourney);
    return {
      ...config,
      hero: {
        ...config.hero,
        image: heroImage,
        title: safeJourney.pageTitle || safeJourney.title,
      },
      overview: {
        ...config.overview,
        description: safeJourney.description,
        sideImage: overviewImage,
      },
      itinerary: safeJourney.itinerary || [],
    };
  }, [heroImage, overviewImage, safeJourney]);

  const selectedExtensions = useMemo(() => {
    const ids = new Set((safeJourney?.extensions || []).filter(Boolean));
    return extensionsData.filter((extension) => ids.has(extension.id));
  }, [extensionsData, safeJourney?.extensions]);

  const selectedHotels = useMemo(() => {
    const ids = new Set([
      ...(safeJourney?.hotels || []),
      ...(safeJourney?.availableAccommodations || []),
    ]);
    return hotelsData.filter((hotel) => ids.has(hotel.id));
  }, [hotelsData, safeJourney?.availableAccommodations, safeJourney?.hotels]);

  const selectedExperiences = useMemo(() => {
    const ids = new Set([
      ...(safeJourney?.experiences || []),
      ...(safeJourney?.availableExperiences || []),
    ]);
    return experiencesData.filter((experience) => ids.has(experience.id));
  }, [experiencesData, safeJourney?.availableExperiences, safeJourney?.experiences]);

  const isDayTour = useMemo(() => {
    const duration = safeJourney?.duration || '';
    return /(^|\b)1\s*day\b/i.test(duration) || (safeJourney?.itinerary?.length ?? 0) <= 1;
  }, [safeJourney?.duration, safeJourney?.itinerary?.length]);

  const journeyMapBaseCoords = useMemo(
    () => inferJourneyBaseCoords(safeJourney),
    [safeJourney]
  );

  const stableMapItinerary = useMemo(() => {
    const itinerary = safeJourney?.itinerary || [];

    return itinerary.map((item) => {
      const itineraryItem = item as typeof item & {
        location?: unknown;
        title?: string;
      };

      if (itineraryItem.location) {
        return itineraryItem;
      }

      const forcedLocation = getForcedLocationFromTitle(itineraryItem.title);
      if (!forcedLocation) {
        return itineraryItem;
      }

      return {
        ...itineraryItem,
        location: forcedLocation,
      };
    });
  }, [safeJourney?.id, safeJourney?.itinerary]);

  const mapJourneySteps = useMemo(() => {
    if (!safeJourney) return [];

    const sourceItinerary = stableMapItinerary;
    const journeyWithCoords = safeJourney as Journey & {
      longitude?: number;
      latitude?: number;
      location?: string;
    };

    if (sourceItinerary.length === 0) {
      const lng = isValidCoordinate(journeyWithCoords.longitude, -180, 180)
        ? journeyWithCoords.longitude
        : journeyMapBaseCoords.lng;
      const lat = isValidCoordinate(journeyWithCoords.latitude, -90, 90)
        ? journeyWithCoords.latitude
        : journeyMapBaseCoords.lat;

      return [
        {
          id: `${safeJourney.id}-map-root`,
          day: 1,
          title: safeJourney.title,
          description: safeJourney.description,
          city: safeJourney.city,
          location: safeJourney.location,
          longitude: lng,
          latitude: lat,
        },
      ];
    }

    return sourceItinerary
      .map((day, index) => {
        const dayWithCoords = day as typeof day & {
          id?: string;
          longitude?: number;
          latitude?: number;
          city?: string;
          location?: string;
        };
        const dayCoords: GeoCoords =
          inferCoordsFromText(
            [
              dayWithCoords.city,
              dayWithCoords.location,
              day.title,
              day.description,
            ]
              .filter(Boolean)
              .join(' ')
          ) || journeyMapBaseCoords;

        const rawCoords = extractRawCoordsFromStep(dayWithCoords);
        const longitude = rawCoords?.lng ?? dayCoords.lng;
        const latitude = rawCoords?.lat ?? dayCoords.lat;

        if (!isValidCoordinate(longitude, -180, 180) || !isValidCoordinate(latitude, -90, 90)) {
          return null;
        }

        return {
          ...day,
          id: dayWithCoords.id || `${safeJourney.id}-map-day-${day.day || index + 1}`,
          day: day.day || index + 1,
          city: dayWithCoords.city || safeJourney.city,
          location: dayWithCoords.location || safeJourney.location,
          longitude,
          latitude,
        };
      })
      .filter(Boolean);
  }, [journeyMapBaseCoords, safeJourney, stableMapItinerary]);

  const pageNavigation = useMemo(() => {
    if (!pageConfig?.navigation) return [];

    const availableSections = new Set<string>(['overview', 'itinerary', 'details']);
    if (selectedExtensions.length > 0) availableSections.add('extensions');
    if (selectedHotels.length > 0) availableSections.add('stays');
    if (selectedExperiences.length > 0) availableSections.add('experiences');
    return pageConfig.navigation.filter((item) =>
      availableSections.has(item.href.replace('#', ''))
    );
  }, [pageConfig?.navigation, selectedExperiences.length, selectedExtensions.length, selectedHotels.length]);

  useEffect(() => {
    const firstDay = pageConfig?.itinerary?.[0]?.day;
    if (typeof firstDay !== 'number') {
      setCurrentDay(undefined);
      setActiveDay(undefined);
      return;
    }

    setCurrentDay((prev) => prev ?? firstDay);
    setActiveDay((prev) => prev ?? firstDay);
  }, [pageConfig?.itinerary]);

  useEffect(() => {
    const handleScroll = () => {
      const entries = Array.from(sectionRefs.current.entries())
        .map(([id, element]) => ({
          id,
          top: element.getBoundingClientRect().top,
        }))
        .filter((entry) => entry.top <= 160);

      if (entries.length === 0) return;

      const current = entries.sort((a, b) => b.top - a.top)[0];
      setActiveNav(current.id);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pageNavigation]);

  useEffect(() => {
    const cards = Array.from(dayRefs.current.values());
    if (cards.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        const primaryEntry = visibleEntries[0];
        if (!primaryEntry) return;

        const day = Number(primaryEntry.target.getAttribute('data-day'));
        if (!Number.isFinite(day)) return;

        setCurrentDay(day);
        setActiveDay(day);
      },
      {
        threshold: [0.35, 0.6, 0.85],
        rootMargin: '-20% 0px -20% 0px',
      }
    );

    cards.forEach((card) => observer.observe(card));

    return () => {
      observer.disconnect();
    };
  }, [pageConfig?.itinerary]);

  const focusItineraryDay = (day: number) => {
    setCurrentDay(day);
    setActiveDay(day);

    const targetCard = dayRefs.current.get(day);
    if (targetCard) {
      targetCard.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  };

  const durationDays = useMemo(() => {
    const raw = safeJourney?.duration || '';
    const match = raw.match(/\d+/);
    return match ? parseInt(match[0], 10) : 1;
  }, [safeJourney?.duration]);

  const tripJsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'Trip',
      name: safeJourney?.pageTitle || safeJourney?.title || normalizedSlug,
      description: displayDescription || safeJourney?.shortDescription || '',
      image: heroImage ? [`${SITE_URL}${heroImage}`] : undefined,
      itinerary: safeJourney?.itinerary?.length
        ? {
            '@type': 'ItemList',
            numberOfItems: safeJourney.itinerary.length,
            itemListElement: safeJourney.itinerary.slice(0, 8).map((day, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: day.title || `Day ${day.day || index + 1}`,
            })),
          }
        : undefined,
      duration: `P${durationDays}D`,
      offers: {
        '@type': 'Offer',
        price: safeJourney?.price ?? 0,
        priceCurrency: 'CNY',
      },
      url: `${SITE_URL}/journeys/${safeJourney?.slug || normalizedSlug}`,
    }),
    [displayDescription, durationDays, heroImage, normalizedSlug, safeJourney]
  );

  const formatLocalYmd = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };

  const handleBookNow = (date: Date, price: number) => {
    if (!safeJourney) return;

    const payload = {
      slug: safeJourney.slug,
      journeyId: safeJourney.id,
      date,
      price,
    };

    setPendingBooking(payload);

    if (!user || user.isLoggedIn !== true) {
      setIsLoginModalOpen(true);
      return;
    }

    const dateStr = formatLocalYmd(date);
    router.prefetch(
      `/booking/review/${safeJourney.slug}?date=${encodeURIComponent(dateStr)}&price=${price}`
    );
    router.push(
      `/booking/review/${safeJourney.slug}?date=${encodeURIComponent(dateStr)}&price=${price}`
    );
  };

  if (isJourneyTypeSlug || isTypeRoute) {
    return <JourneyDetailPageSkeleton />;
  }

  const awaitingJourneyData =
    !!normalizedSlug &&
    (journeysLoading || isLoadingFromApi) &&
    !contextJourney &&
    !journeyFromApi;

  if (awaitingJourneyData) {
    return <JourneyDetailPageSkeleton />;
  }

  if (
    (!safeJourney || !pageConfig) &&
    !journeysLoading &&
    !isLoadingFromApi
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f1e6] px-6">
        <div className="w-full text-center">
          <Heading level={1} className="text-3xl mb-4">Journey Not Found</Heading>
          <Text className="text-gray-600 mb-6">
            {journeysError || journeyApiError || 'Journey data not found or API timeout.'}
          </Text>
          <Button onClick={() => router.push('/journeys')}>Back to Journeys</Button>
        </div>
      </div>
    );
  }

  const currentJourney = safeJourney!;
  const currentPageConfig = pageConfig!;

  if (currentJourney.journeyType === 'Explore Together') {
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(tripJsonLd) }}
        />
        <ExploreTogetherLayout
          journey={currentJourney}
          onBookingClick={handleBookNow}
        />
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => {
            setIsLoginModalOpen(false);
            setPendingBooking(null);
          }}
          onLoginSuccess={() => {
            setIsLoginModalOpen(false);
            if (pendingBooking) {
              const dateStr = formatLocalYmd(pendingBooking.date);
              router.push(
                `/booking/review/${currentJourney.slug}?date=${encodeURIComponent(dateStr)}&price=${pendingBooking.price}`
              );
              setPendingBooking(null);
            }
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(tripJsonLd) }}
      />

      <section className={`relative ${JOURNEY_PAGE_TEMPLATE.hero.height} overflow-hidden`}>
        <div
          className="absolute inset-0 bg-center bg-cover bg-no-repeat"
          style={{ backgroundImage: `url('${currentPageConfig.hero.image}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1e3b32]/90 via-[#1e3b32]/40 to-transparent z-0" />
        <div className="relative z-10 flex items-end h-full pb-16 px-8 lg:px-16">
          <div className="w-full flex flex-col lg:flex-row justify-between items-end gap-8">
            <div className="flex-1 w-full prose-force-wrap">
              <Heading
                level={1}
                className="text-4xl lg:text-5xl xl:text-6xl mb-4 tracking-tight leading-[1.1]"
                style={{
                  fontFamily: 'Playfair Display, serif',
                  fontWeight: 400,
                  letterSpacing: '-0.02em',
                  lineHeight: '1.1',
                  color: '#ffffff',
                }}
              >
                {currentPageConfig.hero.title}
              </Heading>
              <Text className="text-lg lg:text-xl text-white/90 w-full leading-relaxed">
                {currentJourney.shortDescription || `${currentJourney.description?.substring(0, 160) || ''}${currentJourney.description && currentJourney.description.length > 160 ? '...' : ''}`}
              </Text>
            </div>

            <div className="flex flex-row lg:flex-row items-center lg:items-end justify-center lg:justify-end gap-6 lg:gap-8">
              <div className="flex flex-col items-center lg:items-end">
                <div
                  className="text-4xl lg:text-5xl font-light text-white mb-1"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  {currentPageConfig.hero.stats.days}
                </div>
                <div className="text-xs uppercase tracking-widest text-white/80 font-light">
                  DAYS
                </div>
              </div>
              <div className="hidden lg:block h-16 w-px bg-white/30" />
              <div className="flex flex-col items-center lg:items-end">
                <div
                  className="text-4xl lg:text-5xl font-light text-white mb-1"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  {currentPageConfig.hero.stats.destinations}
                </div>
                <div className="text-xs uppercase tracking-widest text-white/80 font-light">
                  DESTINATIONS
                </div>
              </div>
              <div className="hidden lg:block h-16 w-px bg-white/30" />
              <div className="flex flex-col items-center lg:items-end">
                <div
                  className="text-4xl lg:text-5xl font-light text-white mb-1"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  {currentPageConfig.hero.stats.maxGuests}
                </div>
                <div className="text-xs uppercase tracking-widest text-white/80 font-light">
                  GUESTS MAX
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <nav className="bg-tertiary py-4 sticky top-0 z-50 backdrop-blur-sm bg-tertiary/95">
        <Container size="xl">
          <div className="flex justify-center gap-12 overflow-x-auto">
            {pageNavigation.map((item) => {
              const sectionId = item.href.replace('#', '');
              const isActive = activeNav === sectionId;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    relative pb-2 text-white hover:text-accent transition-colors
                    font-medium tracking-widest uppercase text-sm whitespace-nowrap
                    ${isActive ? 'text-white' : 'text-white/80'}
                  `}
                  onClick={(e) => {
                    e.preventDefault();
                    const targetId = item.href.replace('#', '');
                    const targetElement = document.getElementById(targetId);
                    if (targetElement) {
                      const scrollContainer = itineraryPaneRef.current;
                      const isInsidePane = !!scrollContainer && scrollContainer.contains(targetElement);

                      if (isInsidePane && scrollContainer) {
                        const containerRect = scrollContainer.getBoundingClientRect();
                        const targetRect = targetElement.getBoundingClientRect();
                        const nextScrollTop =
                          scrollContainer.scrollTop + (targetRect.top - containerRect.top) - 32;

                        scrollContainer.scrollTo({
                          top: Math.max(0, nextScrollTop),
                          behavior: 'smooth',
                        });
                      } else {
                        const offsetTop = targetElement.offsetTop - 80;
                        window.scrollTo({
                          top: offsetTop,
                          behavior: 'smooth',
                        });
                      }
                      setActiveNav(targetId);
                    }
                  }}
                >
                  {item.name}
                  <span
                    className="
                      absolute bottom-0 left-1/2 w-full h-0.5 bg-white
                      transition-transform duration-300 ease-out origin-center
                    "
                    style={{
                      transform: isActive
                        ? 'translateX(-50%) scaleX(1)'
                        : 'translateX(-50%) scaleX(0)',
                    }}
                  />
                </Link>
              );
            })}
          </div>
        </Container>
      </nav>

      <section
        id="overview"
        ref={(el) => {
          if (el) sectionRefs.current.set('overview', el);
        }}
        className="w-full bg-[#FAF9F6] overflow-hidden"
      >
        <div className="w-full px-12 py-14 lg:py-16 flex flex-col lg:flex-row items-start justify-between gap-8 lg:gap-10">
          <div className="lg:w-[60%] flex flex-col w-full">
            <div className="space-y-5 prose-force-wrap">
              <h2
                className="text-[15px] md:text-[16px] text-gray-900 leading-[1.6] font-normal"
                style={{
                  fontFamily: 'Playfair Display, serif',
                  fontWeight: 400,
                  letterSpacing: '-0.01em',
                }}
              >
                {currentPageConfig.overview.description}
              </h2>
              {currentJourney.shortDescription && (
                <p
                  className="text-[15px] md:text-[16px] text-gray-600 font-light leading-[1.6] prose-force-wrap font-sans"
                  style={{ letterSpacing: '-0.01em' }}
                >
                  {currentJourney.shortDescription}
                </p>
              )}
            </div>

            {(() => {
              const highlights = currentPageConfig.overview?.highlights || [];

              if (highlights.length === 0) {
                return (
                  <div className="text-gray-500 text-sm mt-8">
                    No highlights available. Please add highlights in the admin panel.
                  </div>
                );
              }

              const StarIcon = () => (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="inline-block mr-2"
                >
                  <path
                    d="M8 0L9.5 5.5L15 7L9.5 8.5L8 14L6.5 8.5L1 7L6.5 5.5L8 0Z"
                    stroke="currentColor"
                    strokeWidth="1"
                    fill="none"
                    className="text-gray-900"
                  />
                </svg>
              );

              return (
                <div className="grid grid-cols-2 gap-x-10 gap-y-6 mt-8">
                  {highlights.map((highlight, index) => {
                    const title = highlight.title || `Highlight ${index + 1}`;
                    const description = highlight.description || '';

                    return (
                      <div key={index} className="space-y-2">
                        <h4
                          className="text-xs tracking-widest font-bold text-gray-900 flex items-center uppercase prose-force-wrap"
                          style={{ letterSpacing: '0.1em' }}
                        >
                          <StarIcon />
                          {title}
                        </h4>
                        {description && (
                          <p
                            className="text-sm text-gray-600 leading-[1.6] prose-force-wrap"
                            style={{ letterSpacing: '-0.01em' }}
                          >
                            {description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          <div className="lg:w-[40%] relative flex items-start">
            <div className="w-full aspect-[16/9] lg:h-[700px] relative group">
              <img
                src={currentPageConfig.overview.sideImage}
                alt={currentJourney.title || 'Journey image'}
                className="w-full h-full object-cover shadow-2xl transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      <section
        id="itinerary"
        ref={(el) => {
          if (el) sectionRefs.current.set('itinerary', el);
        }}
        className="relative flex flex-col lg:flex-row w-full lg:h-[calc(100vh-80px)] overflow-hidden"
      >
        <div className="w-full lg:w-1/2 h-[500px] lg:h-full relative border-r">
          <div className="absolute inset-0">
            {mapJourneySteps.length > 0 ? (
              <JourneyMap
                key={`journey-map-${currentJourney.id}`}
                mapId={`journey-map-${currentJourney.id}`}
                journeySteps={mapJourneySteps}
                mode={isDayTour ? 'single-location' : 'multi-stop-route'}
                radius={5000}
                currentDay={currentDay}
                activeDay={activeDay}
                routeGeoJsonPath={
                  (currentPageConfig.overview as { routeGeojson?: string } | undefined)?.routeGeojson ||
                  (currentJourney as Journey & { routeGeojson?: string }).routeGeojson
                }
                className="w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-stone-400 bg-stone-100">
                Map data unavailable
              </div>
            )}
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur px-4 py-2 rounded-full text-xs shadow-sm italic">
            Interactive Route Map
          </div>
        </div>

        <div
          ref={itineraryPaneRef}
          className="w-full lg:w-1/2 h-full overflow-y-auto bg-white p-10"
        >
          <div className="w-full">
            <header className="mb-8">
              <h2
                className="text-3xl text-stone-900 mb-4"
                style={{ fontFamily: 'Montaga, serif', fontWeight: 400 }}
              >
                Daily Itinerary
              </h2>
            </header>

            <div className="space-y-8">
              {currentPageConfig.itinerary.map((day, index) => (
                <div
                  key={index}
                  ref={(el) => {
                    if (el) {
                      dayRefs.current.set(day.day, el);
                    } else {
                      dayRefs.current.delete(day.day);
                    }
                  }}
                  data-day={day.day}
                  onClick={() => focusItineraryDay(day.day)}
                  className={`itinerary-card group bg-white p-8 rounded-2xl shadow-sm border cursor-pointer transition-all duration-300 ${
                    activeDay === day.day || currentDay === day.day
                      ? 'border-[#1e3b32] ring-1 ring-[#1e3b32]/15'
                      : 'border-stone-100'
                  }`}
                >
                  <span className="text-brown-600 font-bold tracking-widest uppercase text-xs text-[#8b6b4a]">
                    Day {index + 1}
                  </span>
                  <h3 className="text-2xl font-bold text-stone-800 mt-2 mb-4">{day.title}</h3>

                  {day.image && (
                    <img
                      src={getRenderableImageUrl(day.image)}
                      className="w-full h-64 object-cover rounded-xl mb-5"
                      alt={day.title || 'Itinerary image'}
                    />
                  )}

                  <p
                    className="text-stone-600 leading-[1.6] whitespace-pre-line text-[15px] md:text-[16px]"
                    style={{ letterSpacing: '-0.01em' }}
                  >
                    {day.description}
                  </p>

                  {((day as any).city || (day as any).location || currentJourney.city) && (
                    <div className="mt-4">
                      <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-[#d4a574] text-white">
                        {(day as any).city || (day as any).location || currentJourney.city}
                      </span>
                    </div>
                  )}

                  {(day as any).activities &&
                  Array.isArray((day as any).activities) &&
                  (day as any).activities.length > 0 ? (
                    <div className="mt-5 space-y-2">
                      {(day as any).activities.map((activity: string, actIndex: number) => (
                        <div key={actIndex} className="flex items-start gap-2">
                          <span className="text-gray-400 mt-1">•</span>
                          <p className="text-sm text-gray-700">{activity}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {((day as any).meals ||
                    (day as any).accommodation ||
                    (day as any).transportation) && (
                    <DetailsAccordion
                      meals={(day as any).meals}
                      accommodation={(day as any).accommodation}
                      transportation={(day as any).transportation}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="booking-section"
        ref={(el) => {
          if (el) sectionRefs.current.set('details', el);
        }}
        className="w-full bg-stone-50 py-20 px-12 border-t border-stone-200"
      >
          <InclusionsAndOffers journey={currentJourney} onBookingClick={handleBookNow} />
      </section>

      <PlanTripModal
        isOpen={isPlanTripModalOpen}
        onClose={() => setIsPlanTripModalOpen(false)}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => {
          setIsLoginModalOpen(false);
          setPendingBooking(null);
        }}
        onLoginSuccess={() => {
          setIsLoginModalOpen(false);
          if (pendingBooking) {
            const dateStr = formatLocalYmd(pendingBooking.date);
            router.push(
                `/booking/review/${currentJourney.slug}?date=${encodeURIComponent(dateStr)}&price=${pendingBooking.price}`
            );
            setPendingBooking(null);
          }
        }}
      />

      {selectedExtensions.length > 0 && (
        <section
          id="extensions"
          ref={(el) => {
            if (el) sectionRefs.current.set('extensions', el);
          }}
        >
          <Extensions extensions={selectedExtensions} />
        </section>
      )}

      {selectedHotels.length > 0 && (
        <section
          id="stays"
          ref={(el) => {
            if (el) sectionRefs.current.set('stays', el);
          }}
        >
          <Hotels hotels={selectedHotels} onHotelClick={setActiveHotel} />
        </section>
      )}

      {activeHotel && (
        <JourneyHotelDetailModal
          hotel={activeHotel}
          onClose={() => setActiveHotel(null)}
        />
      )}

      {selectedExperiences.length > 0 && (
        <section
          id="experiences"
          ref={(el) => {
            if (el) sectionRefs.current.set('experiences', el);
          }}
        >
          <Experiences
            experiences={selectedExperiences}
            onExperienceClick={setActiveExperience}
          />
        </section>
      )}

      {activeExperience && (
        <ExperienceDetailModal
          experience={activeExperience}
          onClose={() => setActiveExperience(null)}
        />
      )}
    </div>
  );
}

