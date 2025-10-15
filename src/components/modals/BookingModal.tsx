'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button, Heading } from '@/components/common';
import { Stepper } from './Stepper';
import { StayDetails } from './StayDetails';
import { GuestInfo } from './GuestInfo';
import { Confirmation } from './Confirmation';
import { BookingSuccess } from './BookingSuccess';
import { BookingData, BookingStep, StayDetails as StayDetailsType, GuestInfo as GuestInfoType } from '@/types';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  accommodation: {
    id: string;
    title: string;
    location: string;
    image: string;
    price?: string;
  };
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  accommodation,
}) => {
  const [currentStep, setCurrentStep] = useState<BookingStep>('stay-details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingData, setBookingData] = useState<BookingData>({
    accommodation,
    stayDetails: {
      checkIn: null,
      checkOut: null,
      adults: 1,
      children: 0,
    },
    guestInfo: {
      fullName: '',
      email: '',
      phoneNumber: '',
      specialRequests: '',
    },
    totalPrice: 0,
  });

  // Step configuration
  const steps = [
    { key: 'stay-details', label: 'Stay Details' },
    { key: 'guest-info', label: 'Guest Info' },
    { key: 'confirmation', label: 'Confirmation' },
  ];

  const currentStepIndex = steps.findIndex(step => step.key === currentStep) + 1;

  // 重置状态当模态框关闭时
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep('stay-details');
      setIsSubmitting(false);
      setBookingData({
        accommodation,
        stayDetails: {
          checkIn: null,
          checkOut: null,
          adults: 1,
          children: 0,
        },
        guestInfo: {
          fullName: '',
          email: '',
          phoneNumber: '',
          specialRequests: '',
        },
        totalPrice: 0,
      });
    }
  }, [isOpen, accommodation]);

  // 更新总价
  useEffect(() => {
    if (bookingData.stayDetails.checkIn && bookingData.stayDetails.checkOut) {
      const nights = Math.ceil(
        (bookingData.stayDetails.checkOut.getTime() - bookingData.stayDetails.checkIn.getTime()) / (1000 * 60 * 60 * 24)
      );
      const totalPrice = nights * 120; // $120 per night
      setBookingData(prev => ({ ...prev, totalPrice }));
    }
  }, [bookingData.stayDetails.checkIn, bookingData.stayDetails.checkOut]);

  const handleStayDetailsUpdate = (stayDetails: StayDetailsType) => {
    setBookingData(prev => ({ ...prev, stayDetails }));
  };

  const handleGuestInfoUpdate = (guestInfo: GuestInfoType) => {
    setBookingData(prev => ({ ...prev, guestInfo }));
  };

  const handleNext = () => {
    switch (currentStep) {
      case 'stay-details':
        setCurrentStep('guest-info');
        break;
      case 'guest-info':
        setCurrentStep('confirmation');
        break;
      case 'confirmation':
        handleConfirmBooking();
        break;
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'guest-info':
        setCurrentStep('stay-details');
        break;
      case 'confirmation':
        setCurrentStep('guest-info');
        break;
    }
  };

  const handleConfirmBooking = async () => {
    setIsSubmitting(true);
    
    try {
      // 生成预订ID
      const bookingId = 'BNR-' + Math.random().toString(36).substr(2, 8).toUpperCase();
      
      // 更新预订数据
      setBookingData(prev => ({ ...prev, bookingId }));
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 输出到控制台（模拟发送到后端）
      console.log('预订数据已提交:', {
        ...bookingData,
        bookingId,
        submittedAt: new Date().toISOString(),
      });
      
      // 进入成功页面
      setCurrentStep('success');
    } catch (error) {
      console.error('预订提交失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 背景遮罩 - 虚化整个页面背景 */}
      <div 
        className="fixed inset-0 bg-[#f5f1e6] bg-opacity-90 backdrop-blur-md transition-opacity"
        onClick={handleClose}
      />
      
      {/* 模态框内容 */}
      <div className="flex min-h-full items-center justify-center p-4 relative z-10">
        <div className="relative w-full max-w-2xl bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border border-white/20">
          {/* 头部 */}
          {currentStep !== 'success' && (
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <Heading level={2} className="text-xl font-semibold">
                Book {accommodation.title}
              </Heading>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* 步骤指示器 */}
          {currentStep !== 'success' && (
            <div className="px-6 pt-6">
              <Stepper
                currentStep={currentStepIndex}
                totalSteps={steps.length}
                stepLabels={steps.map(step => step.label)}
              />
            </div>
          )}

          {/* 内容区域 */}
          <div className="p-6">
            {currentStep === 'stay-details' && (
              <StayDetails
                stayDetails={bookingData.stayDetails}
                onUpdate={handleStayDetailsUpdate}
                onNext={handleNext}
                pricePerNight={120}
              />
            )}

            {currentStep === 'guest-info' && (
              <GuestInfo
                guestInfo={bookingData.guestInfo}
                onUpdate={handleGuestInfoUpdate}
                onBack={handleBack}
                onNext={handleNext}
              />
            )}

            {currentStep === 'confirmation' && (
              <Confirmation
                bookingData={bookingData}
                onBack={handleBack}
                onConfirm={handleNext}
                isSubmitting={isSubmitting}
              />
            )}

            {currentStep === 'success' && (
              <BookingSuccess
                bookingData={bookingData}
                onClose={handleClose}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
