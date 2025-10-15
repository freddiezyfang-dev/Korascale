'use client';

import React, { useState, useEffect } from 'react';
import { Button, Heading, Text } from '@/components/common';
import { User, Mail, Phone, MessageSquare } from 'lucide-react';
import { GuestInfo as GuestInfoType } from '@/types';

interface GuestInfoProps {
  guestInfo: GuestInfoType;
  onUpdate: (info: GuestInfoType) => void;
  onBack: () => void;
  onNext: () => void;
}

export const GuestInfo: React.FC<GuestInfoProps> = ({
  guestInfo,
  onUpdate,
  onBack,
  onNext,
}) => {
  const [isValid, setIsValid] = useState(false);
  const [errors, setErrors] = useState<Partial<GuestInfoType>>({});

  // Validate email format
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate phone number format (simple validation)
  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  // Validate form
  useEffect(() => {
    const newErrors: Partial<GuestInfoType> = {};
    
    if (!guestInfo.fullName.trim()) {
      newErrors.fullName = 'Please enter your name';
    }
    
    if (!guestInfo.email.trim()) {
      newErrors.email = 'Please enter your email address';
    } else if (!validateEmail(guestInfo.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!guestInfo.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Please enter your phone number';
    } else if (!validatePhone(guestInfo.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    
    const valid = 
      guestInfo.fullName.trim() !== '' &&
      guestInfo.email.trim() !== '' &&
      guestInfo.phoneNumber.trim() !== '' &&
      validateEmail(guestInfo.email) &&
      validatePhone(guestInfo.phoneNumber);
    
    setIsValid(valid);
  }, [guestInfo]);

  const handleInputChange = (field: keyof GuestInfoType, value: string) => {
    onUpdate({
      ...guestInfo,
      [field]: value,
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Heading level={3} className="text-xl font-semibold mb-2">
          Guest Information
        </Heading>
        <Text size="sm" className="text-gray-600">
          Please provide your contact information so we can process your booking
        </Text>
      </div>

      <div className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={guestInfo.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                errors.fullName ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter your full name"
            />
          </div>
          {errors.fullName && (
            <Text size="xs" className="text-red-500 mt-1">
              {errors.fullName}
            </Text>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={guestInfo.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter your email address"
            />
          </div>
          {errors.email && (
            <Text size="xs" className="text-red-500 mt-1">
              {errors.email}
            </Text>
          )}
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number *
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="tel"
              value={guestInfo.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                errors.phoneNumber ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter your phone number"
            />
          </div>
          {errors.phoneNumber && (
            <Text size="xs" className="text-red-500 mt-1">
              {errors.phoneNumber}
            </Text>
          )}
        </div>

        {/* Special Requests */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Special Requests
            <span className="text-gray-400 font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <textarea
              value={guestInfo.specialRequests}
              onChange={(e) => handleInputChange('specialRequests', e.target.value)}
              rows={4}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              placeholder="Tell us about any special requests or preferences..."
            />
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="px-8 py-2"
        >
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!isValid}
          className="px-8 py-2"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};
