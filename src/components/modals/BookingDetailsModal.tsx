'use client';

import React, { useState } from 'react';
import { X, Calendar, Users } from 'lucide-react';
import { Button, Heading, Text, Card } from '@/components/common';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface BookingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (details: BookingDetails) => void;
  hotel: {
    id: string;
    name: string;
    location: string;
    images: string[];
    roomTypes: Array<{
      name: string;
      description: string;
      amenities: string[];
    }>;
  };
}

export interface BookingDetails {
  checkIn: Date | null;
  checkOut: Date | null;
  adults: number;
  children: number;
  selectedRoomType: string;
}

export const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({
  isOpen,
  onClose,
  onContinue,
  hotel,
}) => {
  const [bookingDetails, setBookingDetails] = useState<BookingDetails>({
    checkIn: null,
    checkOut: null,
    adults: 1,
    children: 0,
    selectedRoomType: hotel.roomTypes[0]?.name || '',
  });

  const [isValid, setIsValid] = useState(false);

  // Validate form
  React.useEffect(() => {
    const valid = 
      bookingDetails.checkIn !== null &&
      bookingDetails.checkOut !== null &&
      bookingDetails.checkIn < bookingDetails.checkOut &&
      bookingDetails.adults > 0 &&
      bookingDetails.selectedRoomType !== '';
    setIsValid(valid);
  }, [bookingDetails]);

  const handleDateChange = (field: 'checkIn' | 'checkOut', date: Date | null) => {
    setBookingDetails(prev => ({
      ...prev,
      [field]: date,
    }));
  };

  const handleGuestChange = (field: 'adults' | 'children', delta: number) => {
    const newValue = Math.max(0, bookingDetails[field] + delta);
    setBookingDetails(prev => ({
      ...prev,
      [field]: newValue,
    }));
  };

  const handleRoomTypeChange = (roomType: string) => {
    setBookingDetails(prev => ({
      ...prev,
      selectedRoomType: roomType,
    }));
  };

  const handleContinue = () => {
    if (isValid) {
      onContinue(bookingDetails);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Background Overlay */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden m-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <Heading level={2} className="text-xl font-semibold">
              Booking Details
            </Heading>
            <Text className="text-gray-600">{hotel.name}</Text>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-6">
            {/* Date Selection */}
            <div className="space-y-4">
              <Heading level={3} className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Select Dates
              </Heading>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check-in Date *
                  </label>
                  <DatePicker
                    selected={bookingDetails.checkIn}
                    onChange={(date) => handleDateChange('checkIn', date)}
                    selectsStart
                    startDate={bookingDetails.checkIn}
                    endDate={bookingDetails.checkOut}
                    minDate={new Date()}
                    dateFormat="yyyy-MM-dd"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholderText="Select check-in date"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check-out Date *
                  </label>
                  <DatePicker
                    selected={bookingDetails.checkOut}
                    onChange={(date) => handleDateChange('checkOut', date)}
                    selectsEnd
                    startDate={bookingDetails.checkIn}
                    endDate={bookingDetails.checkOut}
                    minDate={bookingDetails.checkIn || new Date()}
                    dateFormat="yyyy-MM-dd"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholderText="Select check-out date"
                  />
                </div>
              </div>
            </div>

            {/* Guest Count */}
            <div className="space-y-4">
              <Heading level={3} className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" />
                Number of Guests
              </Heading>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <Text className="font-medium text-gray-700">Adults</Text>
                    <Text className="text-sm text-gray-500">18 years and above</Text>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleGuestChange('adults', -1)}
                      disabled={bookingDetails.adults <= 1}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-medium">
                      {bookingDetails.adults}
                    </span>
                    <button
                      onClick={() => handleGuestChange('adults', 1)}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <Text className="font-medium text-gray-700">Children</Text>
                    <Text className="text-sm text-gray-500">0-17 years</Text>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleGuestChange('children', -1)}
                      disabled={bookingDetails.children <= 0}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-medium">
                      {bookingDetails.children}
                    </span>
                    <button
                      onClick={() => handleGuestChange('children', 1)}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Room Type Selection */}
            <div className="space-y-4">
              <Heading level={3} className="text-lg font-semibold">
                Select Room Type
              </Heading>
              <div className="space-y-3">
                {hotel.roomTypes.map((room, index) => (
                  <Card 
                    key={index} 
                    className={`p-4 border cursor-pointer transition-colors ${
                      bookingDetails.selectedRoomType === room.name 
                        ? 'border-primary bg-primary/5' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleRoomTypeChange(room.name)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Heading level={4} className="text-lg font-medium mb-1">
                          {room.name}
                        </Heading>
                        <Text className="text-gray-600 text-sm mb-2">
                          {room.description}
                        </Text>
                        <div className="flex flex-wrap gap-2">
                          {room.amenities.map((amenity, amenityIndex) => (
                            <div
                              key={amenityIndex}
                              className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs"
                            >
                              <span>•</span>
                              <span>{amenity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="ml-4">
                        <input
                          type="radio"
                          name="roomType"
                          value={room.name}
                          checked={bookingDetails.selectedRoomType === room.name}
                          onChange={() => handleRoomTypeChange(room.name)}
                          className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleContinue}
              disabled={!isValid}
              className="flex-1"
            >
              Continue to Checkout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
