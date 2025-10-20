'use client';

import React, { useState } from 'react';
import { Card, Heading, Text, Button } from '@/components/common';
import { useHotelManagement } from '@/context/HotelManagementContext';
import { Plus, Trash2, Edit, Eye } from 'lucide-react';

interface AccommodationSelectorProps {
  selectedAccommodations: string[];
  availableAccommodations: string[];
  onAccommodationsChange: (accommodations: string[]) => void;
  onAvailableAccommodationsChange: (accommodations: string[]) => void;
  isEditing?: boolean;
}

export const AccommodationSelector: React.FC<AccommodationSelectorProps> = ({
  selectedAccommodations,
  availableAccommodations,
  onAccommodationsChange,
  onAvailableAccommodationsChange,
  isEditing = false
}) => {
  const { hotels, addHotel } = useHotelManagement();
  const [showAddForm, setShowAddForm] = useState(false);

  const activeHotels = hotels.filter(hotel => hotel.status === 'active');
  const selectedHotelObjects = activeHotels.filter(hotel => selectedAccommodations.includes(hotel.id));
  const availableHotelObjects = activeHotels.filter(hotel => availableAccommodations.includes(hotel.id));

  const handleAddToSelected = (hotelId: string) => {
    if (!selectedAccommodations.includes(hotelId)) {
      onAccommodationsChange([...selectedAccommodations, hotelId]);
    }
  };

  const handleRemoveFromSelected = (hotelId: string) => {
    onAccommodationsChange(selectedAccommodations.filter(id => id !== hotelId));
  };

  const handleToggleAvailable = (hotelId: string) => {
    const isAvailable = availableAccommodations.includes(hotelId);
    if (isAvailable) {
      onAvailableAccommodationsChange(availableAccommodations.filter(id => id !== hotelId));
    } else {
      onAvailableAccommodationsChange([...availableAccommodations, hotelId]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Available Accommodations Selection */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Heading level={2} className="text-xl font-semibold">
            Available Accommodations
          </Heading>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            variant="secondary"
            size="sm"
            disabled={!isEditing}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add New Hotel
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4">
          {activeHotels.map((hotel) => (
            <div key={hotel.id} className="flex items-center space-x-3">
              <input
                type="checkbox"
                id={`available-hotel-${hotel.id}`}
                checked={availableAccommodations.includes(hotel.id)}
                onChange={() => handleToggleAvailable(hotel.id)}
                disabled={!isEditing}
                className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor={`available-hotel-${hotel.id}`} className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <img src={hotel.image} alt={hotel.name} className="w-8 h-8 rounded object-cover" />
                  <div>
                    <Text className="font-medium text-sm">{hotel.name}</Text>
                    <Text className="text-xs text-gray-500">{hotel.location} • {hotel.rating}★</Text>
                  </div>
                </div>
              </label>
              <div className="flex gap-1">
                <Button
                  onClick={() => window.open(`/admin/hotels/edit/${hotel.id}`, '_blank')}
                  variant="secondary"
                  size="sm"
                >
                  <Edit className="w-3 h-3" />
                </Button>
                <Button
                  onClick={() => window.open(`/accommodations/${hotel.slug}`, '_blank')}
                  variant="secondary"
                  size="sm"
                >
                  <Eye className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Selected Accommodations for This Journey */}
      <Card className="p-6">
        <Heading level={2} className="text-xl font-semibold mb-4">
          Selected Accommodations for This Journey
        </Heading>
        
        <div className="space-y-2">
          {selectedHotelObjects.map((hotel) => (
            <div key={hotel.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <img src={hotel.image} alt={hotel.name} className="w-10 h-10 rounded object-cover" />
                <div>
                  <Text className="font-medium">{hotel.name}</Text>
                  <Text className="text-sm text-gray-500">{hotel.location} • {hotel.rating}★ • From ¥{hotel.price}/night</Text>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => window.open(`/accommodations/${hotel.slug}`, '_blank')}
                  variant="secondary"
                  size="sm"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => handleRemoveFromSelected(hotel.id)}
                  variant="secondary"
                  size="sm"
                  disabled={!isEditing}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          
          {selectedHotelObjects.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Text>No accommodations selected for this journey</Text>
              <Text className="text-sm mt-1">Select from available accommodations above</Text>
            </div>
          )}
        </div>
      </Card>

      {/* Quick Add from Available */}
      {availableHotelObjects.length > 0 && (
        <Card className="p-6">
          <Heading level={2} className="text-xl font-semibold mb-4">
            Quick Add from Available
          </Heading>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {availableHotelObjects
              .filter(hotel => !selectedAccommodations.includes(hotel.id))
              .map((hotel) => (
                <Button
                  key={hotel.id}
                  onClick={() => handleAddToSelected(hotel.id)}
                  variant="secondary"
                  size="sm"
                  disabled={!isEditing}
                  className="justify-start"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {hotel.name}
                </Button>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
};

