import React from 'react';
import { Container, Button } from '@/components/common';

interface PlanningSectionProps {
  className?: string;
}

export const PlanningSection: React.FC<PlanningSectionProps> = ({ className = '' }) => {
  return (
    <div className={`relative h-[521px] overflow-hidden ${className}`}>
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url('/images/planning/planning-bg.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      
      {/* Content Overlay */}
      <div className="relative z-10 h-full flex items-center justify-end">
        <Container size="xl" className="h-full flex items-center">
          <div className="flex justify-end w-full">
            {/* Right Content Box */}
            <div className="bg-[#1e3b32] h-[352px] w-[359px] flex flex-col items-center justify-center p-8 relative">
              {/* Title */}
              <h2 className="text-3xl font-['Montaga'] text-white text-center mb-8 leading-tight">
                Plan your trip in China with Korascale
              </h2>
              
              {/* Button */}
              <Button 
                variant="outline" 
                size="lg"
                className="border-white text-white hover:bg-white hover:text-[#1e3b32] transition-colors duration-300 px-8 py-4 text-lg font-['Monda']"
              >
                EXPLORE NOW
              </Button>
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
};

export default PlanningSection;
