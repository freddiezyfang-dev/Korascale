'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button, Heading, Text } from '@/components/common';
import { Stepper } from './Stepper';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar, MapPin, User, Mail, Phone, MessageSquare } from 'lucide-react';

interface PlanTripModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PlanTripStep = 'departure-date' | 'destinations' | 'customer-info' | 'success';

interface PlanTripData {
  departureDate: Date | null;
  tripDuration: number | null; // 预计旅行天数
  destinations: string;
  customerInfo: {
    fullName: string;
    email: string;
    phoneNumber: string;
    additionalNotes: string;
  };
}

export const PlanTripModal: React.FC<PlanTripModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState<PlanTripStep>('departure-date');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [planTripData, setPlanTripData] = useState<PlanTripData>({
    departureDate: null,
    tripDuration: null,
    destinations: '',
    customerInfo: {
      fullName: '',
      email: '',
      phoneNumber: '',
      additionalNotes: '',
    },
  });

  const [errors, setErrors] = useState<Partial<PlanTripData & { customerInfo: Partial<PlanTripData['customerInfo']>, submit?: string }>>({});

  // Step configuration
  const steps = [
    { key: 'departure-date', label: 'Travel Dates' },
    { key: 'destinations', label: 'Destinations' },
    { key: 'customer-info', label: 'Contact Info' },
  ];

  const currentStepIndex = steps.findIndex(step => step.key === currentStep) + 1;

  // 重置状态当模态框关闭时
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep('departure-date');
      setIsSubmitting(false);
      setPlanTripData({
        departureDate: null,
        tripDuration: null,
        destinations: '',
        customerInfo: {
          fullName: '',
          email: '',
          phoneNumber: '',
          additionalNotes: '',
        },
      });
      setErrors({});
    }
  }, [isOpen]);

  // 验证邮箱格式
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 验证电话号码格式
  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const handleNext = () => {
    // 验证当前步骤
    const newErrors: any = {};

    if (currentStep === 'departure-date') {
      if (!planTripData.departureDate) {
        newErrors.departureDate = 'Please select departure date';
        setErrors(newErrors);
        return;
      }
      if (!planTripData.tripDuration || planTripData.tripDuration <= 0) {
        newErrors.tripDuration = 'Please enter trip duration';
        setErrors(newErrors);
        return;
      }
      setCurrentStep('destinations');
    } else if (currentStep === 'destinations') {
      if (!planTripData.destinations.trim()) {
        newErrors.destinations = 'Please enter your desired destinations';
        setErrors(newErrors);
        return;
      }
      setCurrentStep('customer-info');
    } else if (currentStep === 'customer-info') {
      // 验证客户信息
      if (!planTripData.customerInfo.fullName.trim()) {
        newErrors.customerInfo = { ...newErrors.customerInfo, fullName: 'Please enter your name' };
      }
      if (!planTripData.customerInfo.email.trim()) {
        newErrors.customerInfo = { ...newErrors.customerInfo, email: 'Please enter your email address' };
      } else if (!validateEmail(planTripData.customerInfo.email)) {
        newErrors.customerInfo = { ...newErrors.customerInfo, email: 'Please enter a valid email address' };
      }
      if (!planTripData.customerInfo.phoneNumber.trim()) {
        newErrors.customerInfo = { ...newErrors.customerInfo, phoneNumber: 'Please enter your phone number' };
      } else if (!validatePhone(planTripData.customerInfo.phoneNumber)) {
        newErrors.customerInfo = { ...newErrors.customerInfo, phoneNumber: 'Please enter a valid phone number' };
      }

      if (Object.keys(newErrors.customerInfo || {}).length > 0) {
        setErrors(newErrors);
        return;
      }

      // 提交表单
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep === 'destinations') {
      setCurrentStep('departure-date');
    } else if (currentStep === 'customer-info') {
      setCurrentStep('destinations');
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch('/api/plan-trip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...planTripData,
          departureDate: planTripData.departureDate ? planTripData.departureDate.toISOString() : null,
          tripDuration: planTripData.tripDuration,
        }),
      });

      if (!response.ok) {
        throw new Error('Submission failed, please try again');
      }

      // 进入成功页面
      setCurrentStep('success');
    } catch (error) {
      console.error('Submission failed:', error);
      setErrors({ submit: 'Submission failed, please try again' });
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
      {/* 背景遮罩 - 虚化当前页面背景 */}
      <div 
        className="fixed inset-0 backdrop-blur-md bg-black/20 transition-opacity"
        onClick={handleClose}
      />
      
      {/* 模态框内容 */}
      <div className="flex min-h-full items-center justify-center p-4 relative z-10">
        <div className="relative w-full max-w-2xl bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border border-white/20">
          {/* 头部 */}
          {currentStep !== 'success' && (
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <Heading level={2} className="text-xl font-semibold">
                Plan Your Trip
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
            {/* 第一步：出发时间 */}
            {currentStep === 'departure-date' && (
              <div className="space-y-6">
                <div className="text-center">
                  <Heading level={3} className="text-xl font-semibold mb-2">
                    Select Travel Dates
                  </Heading>
                  <Text size="sm" className="text-gray-600">
                    Please select your departure date and trip duration
                  </Text>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Departure Date *
                    </label>
                    <div className="relative">
                      <DatePicker
                        selected={planTripData.departureDate}
                        onChange={(date) => {
                          setPlanTripData(prev => ({ ...prev, departureDate: date }));
                          setErrors(prev => ({ ...prev, departureDate: undefined }));
                        }}
                        minDate={new Date()}
                        dateFormat="yyyy-MM-dd"
                        className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholderText="Select departure date"
                      />
                      <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    {errors.departureDate && (
                      <Text size="xs" className="text-red-500 mt-1">
                        {errors.departureDate}
                      </Text>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trip Duration (Days) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        value={planTripData.tripDuration || ''}
                        onChange={(e) => {
                          const value = e.target.value ? parseInt(e.target.value) : null;
                          setPlanTripData(prev => ({ ...prev, tripDuration: value }));
                          setErrors(prev => ({ ...prev, tripDuration: undefined }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Enter days"
                      />
                    </div>
                    {errors.tripDuration && (
                      <Text size="xs" className="text-red-500 mt-1">
                        {errors.tripDuration}
                      </Text>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleNext}
                    disabled={!planTripData.departureDate || !planTripData.tripDuration}
                    className="px-8 py-2"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {/* 第二步：想去的城市或景点 */}
            {currentStep === 'destinations' && (
              <div className="space-y-6">
                <div className="text-center">
                  <Heading level={3} className="text-xl font-semibold mb-2">
                    Destinations
                  </Heading>
                  <Text size="sm" className="text-gray-600">
                    Please tell us the cities or attractions you'd like to visit
                  </Text>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Desired Cities or Attractions *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <textarea
                      value={planTripData.destinations}
                      onChange={(e) => {
                        setPlanTripData(prev => ({ ...prev, destinations: e.target.value }));
                        setErrors(prev => ({ ...prev, destinations: undefined }));
                      }}
                      rows={6}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                      placeholder="e.g., Beijing, Shanghai, Xi'an, Jiuzhaigou, etc."
                    />
                  </div>
                  {errors.destinations && (
                    <Text size="xs" className="text-red-500 mt-1">
                      {errors.destinations}
                    </Text>
                  )}
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="px-8 py-2"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={!planTripData.destinations.trim()}
                    className="px-8 py-2"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {/* 第三步：客户信息 */}
            {currentStep === 'customer-info' && (
              <div className="space-y-6">
                <div className="text-center">
                  <Heading level={3} className="text-xl font-semibold mb-2">
                    Contact Information
                  </Heading>
                  <Text size="sm" className="text-gray-600">
                    Please provide your contact details so we can assist you with your customized trip
                  </Text>
                </div>

                <div className="space-y-4">
                  {/* 姓名 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={planTripData.customerInfo.fullName}
                        onChange={(e) => {
                          setPlanTripData(prev => ({
                            ...prev,
                            customerInfo: { ...prev.customerInfo, fullName: e.target.value }
                          }));
                          setErrors(prev => ({
                            ...prev,
                            customerInfo: { ...prev.customerInfo, fullName: undefined }
                          }));
                        }}
                        className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                          errors.customerInfo?.fullName ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter your full name"
                      />
                    </div>
                    {errors.customerInfo?.fullName && (
                      <Text size="xs" className="text-red-500 mt-1">
                        {errors.customerInfo.fullName}
                      </Text>
                    )}
                  </div>

                  {/* 邮箱 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={planTripData.customerInfo.email}
                        onChange={(e) => {
                          setPlanTripData(prev => ({
                            ...prev,
                            customerInfo: { ...prev.customerInfo, email: e.target.value }
                          }));
                          setErrors(prev => ({
                            ...prev,
                            customerInfo: { ...prev.customerInfo, email: undefined }
                          }));
                        }}
                        className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                          errors.customerInfo?.email ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter your email address"
                      />
                    </div>
                    {errors.customerInfo?.email && (
                      <Text size="xs" className="text-red-500 mt-1">
                        {errors.customerInfo.email}
                      </Text>
                    )}
                  </div>

                  {/* 电话号码 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        value={planTripData.customerInfo.phoneNumber}
                        onChange={(e) => {
                          setPlanTripData(prev => ({
                            ...prev,
                            customerInfo: { ...prev.customerInfo, phoneNumber: e.target.value }
                          }));
                          setErrors(prev => ({
                            ...prev,
                            customerInfo: { ...prev.customerInfo, phoneNumber: undefined }
                          }));
                        }}
                        className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                          errors.customerInfo?.phoneNumber ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter your phone number"
                      />
                    </div>
                    {errors.customerInfo?.phoneNumber && (
                      <Text size="xs" className="text-red-500 mt-1">
                        {errors.customerInfo.phoneNumber}
                      </Text>
                    )}
                  </div>

                  {/* 附加说明 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes
                      <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <textarea
                        value={planTripData.customerInfo.additionalNotes}
                        onChange={(e) => {
                          setPlanTripData(prev => ({
                            ...prev,
                            customerInfo: { ...prev.customerInfo, additionalNotes: e.target.value }
                          }));
                        }}
                        rows={4}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                        placeholder="Tell us about any other requirements or special requests..."
                      />
                    </div>
                  </div>
                </div>

                {errors.submit && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <Text size="sm" className="text-red-600">
                      {errors.submit}
                    </Text>
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="px-8 py-2"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={isSubmitting}
                    className="px-8 py-2"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </Button>
                </div>
              </div>
            )}

            {/* 成功页面 */}
            {currentStep === 'success' && (
              <div className="text-center space-y-6 py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <Heading level={3} className="text-2xl font-semibold">
                  Submission Successful!
                </Heading>
                <Text size="base" className="text-gray-600">
                  We have received your travel inquiry. Our customer service team will contact you via email within 24 hours.
                </Text>
                <Button
                  onClick={handleClose}
                  className="px-8 py-2"
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

