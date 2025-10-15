'use client';

import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Button, Heading, Text } from '@/components/common';
import { Calendar, Users, Minus, Plus } from 'lucide-react';
import { StayDetails as StayDetailsType } from '@/types';

interface StayDetailsProps {
  stayDetails: StayDetailsType;
  onUpdate: (details: StayDetailsType) => void;
  onNext: () => void;
  pricePerNight?: number;
}

export const StayDetails: React.FC<StayDetailsProps> = ({
  stayDetails,
  onUpdate,
  onNext,
  pricePerNight = 120,
}) => {
  const [isValid, setIsValid] = useState(false);

  // Validate form
  useEffect(() => {
    const valid = 
      stayDetails.checkIn !== null &&
      stayDetails.checkOut !== null &&
      stayDetails.checkIn < stayDetails.checkOut &&
      stayDetails.adults > 0;
    setIsValid(valid);
  }, [stayDetails]);

  // Calculate total price
  const calculateTotalPrice = () => {
    if (!stayDetails.checkIn || !stayDetails.checkOut) return 0;
    
    const nights = Math.ceil(
      (stayDetails.checkOut.getTime() - stayDetails.checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );
    return nights * pricePerNight;
  };

  const handleDateChange = (field: 'checkIn' | 'checkOut', date: Date | null) => {
    onUpdate({
      ...stayDetails,
      [field]: date,
    });
  };

  const handleGuestChange = (field: 'adults' | 'children', delta: number) => {
    const newValue = Math.max(0, stayDetails[field] + delta);
    onUpdate({
      ...stayDetails,
      [field]: newValue,
    });
  };

  const totalPrice = calculateTotalPrice();
  const nights = stayDetails.checkIn && stayDetails.checkOut 
    ? Math.ceil((stayDetails.checkOut.getTime() - stayDetails.checkIn.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Heading level={3} className="text-xl font-semibold mb-2">
          Select Stay Details
        </Heading>
        <Text size="sm" className="text-gray-600">
          Please select your check-in and check-out dates, and number of guests
        </Text>
      </div>

      {/* Date Selection */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Check-in Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Check-in Date *
            </label>
            <div className="relative">
              <DatePicker
                selected={stayDetails.checkIn}
                onChange={(date) => handleDateChange('checkIn', date)}
                selectsStart
                startDate={stayDetails.checkIn}
                endDate={stayDetails.checkOut}
                minDate={new Date()}
                dateFormat="yyyy-MM-dd"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholderText="Select check-in date"
              />
              <Calendar className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Check-out Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Check-out Date *
            </label>
            <div className="relative">
              <DatePicker
                selected={stayDetails.checkOut}
                onChange={(date) => handleDateChange('checkOut', date)}
                selectsEnd
                startDate={stayDetails.checkIn}
                endDate={stayDetails.checkOut}
                minDate={stayDetails.checkIn || new Date()}
                dateFormat="yyyy-MM-dd"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholderText="Select check-out date"
              />
              <Calendar className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Guest Count */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-5 h-5 text-gray-600" />
          <Text size="sm" className="font-medium text-gray-700">
            Number of Guests
          </Text>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Adults */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <Text size="sm" className="font-medium text-gray-700">
                Adults
              </Text>
              <Text size="xs" className="text-gray-500">
                18 years and above
              </Text>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleGuestChange('adults', -1)}
                disabled={stayDetails.adults <= 1}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-medium">
                {stayDetails.adults}
              </span>
              <button
                onClick={() => handleGuestChange('adults', 1)}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Children */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <Text size="sm" className="font-medium text-gray-700">
                Children
              </Text>
              <Text size="xs" className="text-gray-500">
                0-17 years
              </Text>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleGuestChange('children', -1)}
                disabled={stayDetails.children <= 0}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-medium">
                {stayDetails.children}
              </span>
              <button
                onClick={() => handleGuestChange('children', 1)}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Price Preview */}
      {nights > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <Text size="sm" className="text-gray-600">
              {nights} nights × ${pricePerNight}/night
            </Text>
            <Text size="sm" className="font-medium">
              ${nights * pricePerNight}
            </Text>
          </div>
          <div className="border-t border-gray-200 pt-2">
            <div className="flex justify-between items-center">
              <Text size="base" className="font-semibold">
                Total Price
              </Text>
              <Text size="lg" className="font-bold text-accent">
                ${totalPrice}
              </Text>
            </div>
          </div>
        </div>
      )}

      {/* Continue Button */}
      <div className="flex justify-end pt-4">
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
