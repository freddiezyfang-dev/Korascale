import { Container, Section, Heading, Button } from '@/components/common';

const imgPlanning = "/images/planning/ciqikou.jpg";

export default function PlanningSectionNew() {
  return (
    <Section background="primary" padding="none" className="relative h-[447px]">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${imgPlanning}')` }}
      />
      <div className="relative z-10 h-full flex items-center justify-end pr-32">
        <div className="bg-tertiary w-[359px] h-[352px] rounded-lg p-8 flex flex-col justify-center">
          <Heading 
            level={2} 
            className="text-4xl font-heading mb-8" 
            style={{ color: '#FFFFFF' }}
          >
            Plan your trip in China with Korascale
          </Heading>
          <Button 
            variant="primary" 
            size="lg" 
            className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-body text-sm hover:bg-white hover:text-tertiary transition-all duration-300"
          >
            EXPLORE NOW
          </Button>
        </div>
      </div>
    </Section>
  );
}
