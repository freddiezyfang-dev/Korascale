'use client';

import { useState } from 'react';
import { Container, Section, Heading, Button, Text } from '@/components/common';
import { PlanTripModal } from '@/components/modals/PlanTripModal';

const imgLogo = "/logo.png";

export default function PlanningSectionNew() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Section background="secondary" padding="none" className="py-12">
        <Container size="xl" className="px-12">
          {/* 白色背景的内容区域 */}
          <div className="bg-white rounded-lg py-12 px-12">
            {/* Flex 布局：大屏横向，移动端纵向 */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-12">
              {/* 左侧：Logo + 标题 + 副标题 */}
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6 flex-[2]">
                {/* 圆形 Logo 占位符 */}
                <div className="shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                  <img 
                    src={imgLogo} 
                    alt="Korascale Logo" 
                    className="w-full h-full object-contain p-2"
                  />
                </div>
                
                {/* 标题和副标题 */}
                <div className="flex-1 text-center md:text-left">
                  {/* 小标 */}
                  <p className="text-[10px] uppercase text-gray-500 tracking-[0.2em] mb-2 font-body">
                    SPEAK TO AN EXPERT
                  </p>
                  <Heading 
                    level={2} 
                    className="text-2xl md:text-3xl font-heading mb-4 leading-tight"
                  >
                    Connect with our travel experts to begin planning your personalized China trip
                  </Heading>
                  <Text 
                    className="text-sm text-gray-500"
                  >
                    Contact us or schedule a video consultation for inspiration and guidance.
                  </Text>
                </div>
              </div>

              {/* 右侧：Email + 按钮 */}
              <div className="flex flex-col items-center gap-4 flex-[1]">
                {/* Email 地址 */}
                <a 
                  href="mailto:customer-service@korascale.com"
                  className="text-base md:text-lg font-body text-gray-700 hover:text-[#1e3b32] transition-colors"
                >
                  customer-service@korascale.com
                </a>
                
                {/* MAKE AN ENQUIRY 按钮 */}
                <Button 
                  variant="primary" 
                  size="lg" 
                  className="bg-[#1e3b32] text-white px-8 py-3 rounded-lg font-body font-medium uppercase text-xs tracking-widest hover:bg-[#1a342c] transition-all duration-300 w-full md:w-auto"
                  onClick={() => setIsModalOpen(true)}
                >
                  MAKE AN ENQUIRY
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <PlanTripModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
