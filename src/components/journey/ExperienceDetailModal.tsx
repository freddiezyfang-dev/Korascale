'use client';

import React, { useState, useEffect } from 'react';
import { JourneyExperience } from '@/types';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ExperienceDetailModalProps {
  experience: JourneyExperience;
  onClose: () => void;
}

export function ExperienceDetailModal({ experience: initial, onClose }: ExperienceDetailModalProps) {
  const [experience, setExperience] = useState<JourneyExperience | null>(initial);
  const [loading, setLoading] = useState(true);
  const [galleryIndex, setGalleryIndex] = useState(0);

  useEffect(() => {
    if (!initial?.id) {
      setExperience(initial);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setGalleryIndex(0);
    fetch(`/api/experiences/${initial.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.experience) setExperience(data.experience);
        else setExperience(initial);
      })
      .catch(() => { if (!cancelled) setExperience(initial); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [initial.id]);

  const images = experience
    ? (experience.galleryImages?.length ? experience.galleryImages : experience.mainImage ? [experience.mainImage] : [])
    : [];
  const currentImage = images[galleryIndex];
  const hasMultiple = images.length > 1;
  const goPrev = () => hasMultiple && setGalleryIndex((i) => (i - 1 + images.length) % images.length);
  const goNext = () => hasMultiple && setGalleryIndex((i) => (i + 1) % images.length);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 transition-opacity duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="experience-modal-title"
    >
      <button
        className="absolute inset-0 w-full h-full cursor-pointer"
        onClick={onClose}
        aria-label="Close"
      />

      <div
        className="relative z-10 w-full max-w-4xl max-h-[90vh] bg-white rounded-xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'experienceModalIn 0.25s ease-out' }}
      >
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes experienceModalIn {
            from { opacity: 0; transform: scale(0.96); }
            to { opacity: 1; transform: scale(1); }
          }
        `}} />
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 rounded-full bg-black/60 text-white p-1.5 hover:bg-black/80 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 左侧：精选大图 / 多图滑动（从数据库拉取 galleryImages） */}
        <div className="w-full md:w-[45%] flex-shrink-0 bg-gray-100 min-h-[240px] md:min-h-0 relative">
          {loading ? (
            <div className="w-full min-h-[240px] flex items-center justify-center text-gray-400">加载中…</div>
          ) : currentImage ? (
            <div className="relative w-full min-h-[240px] md:min-h-[320px]">
              <img src={currentImage} alt={experience?.title ?? ''} className="w-full h-full object-cover min-h-[240px] md:min-h-[320px]" />
              {hasMultiple && (
                <>
                  <button type="button" onClick={goPrev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70" aria-label="上一张">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={goNext} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70" aria-label="下一张">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, i) => (
                      <span key={i} className={`w-2 h-2 rounded-full ${i === galleryIndex ? 'bg-white' : 'bg-white/40'}`} />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="w-full h-full min-h-[240px] flex items-center justify-center text-gray-400"><span className="text-4xl">✨</span></div>
          )}
        </div>

        {/* 右侧：地点、标题、描述（从数据库拉取）、咨询框 */}
        <div className="w-full md:w-[55%] flex flex-col p-6 md:p-8 overflow-y-auto">
          {experience && (
            <>
              <div className="mb-4">
                {experience.location && (
                  <p className="text-[10px] tracking-widest uppercase text-gray-500 mb-2">{experience.location}</p>
                )}
                <h2
                  id="experience-modal-title"
                  className="text-2xl md:text-3xl text-gray-900"
                  style={{ fontFamily: 'Montaga, serif', fontWeight: 400 }}
                >
                  {experience.title}
                </h2>
              </div>

              <div className="flex-1 text-gray-700 text-sm md:text-base leading-relaxed mb-6">
                {experience.description ? (
                  /^<[a-z]/.test(experience.description.trim()) ? (
                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: experience.description }} />
                  ) : (
                    <p className="whitespace-pre-wrap">{experience.description}</p>
                  )
                ) : (
                  <p className="text-gray-500">暂无详细描述。</p>
                )}
              </div>

              {/* SPEAK TO AN EXPERT 咨询框 - 逻辑保持一致 */}
              <div className="border border-gray-200 rounded-lg p-4 md:p-5 bg-gray-50/80">
                <p className="text-[10px] tracking-widest uppercase text-gray-500 mb-2">
                  SPEAK TO AN EXPERT
                </p>
                <p className="text-sm text-gray-700 mb-4">
                  与我们的旅行顾问沟通，获取专属行程建议与报价。
                </p>
                <a
                  href="/contact"
                  className="inline-block w-full md:w-auto text-center px-6 py-3 bg-gray-900 text-white text-sm font-medium tracking-wide hover:bg-gray-800 transition-colors rounded"
                >
                  ENQUIRE
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
