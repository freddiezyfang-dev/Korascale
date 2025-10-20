'use client';

import React from 'react';
import { Card, Heading, Text, Button } from '@/components/common';
import { useJourneyManagement } from '@/context/JourneyManagementContext';

interface RelatedJourneySelectorProps {
  value: string[];
  onChange: (ids: string[]) => void;
  isEditing?: boolean;
}

export const RelatedJourneySelector: React.FC<RelatedJourneySelectorProps> = ({ value, onChange, isEditing = true }) => {
  const { journeys } = useJourneyManagement();

  const toggle = (id: string) => {
    if (!isEditing) return;
    onChange(value.includes(id) ? value.filter(x => x !== id) : [...value, id]);
  };

  const selected = journeys.filter(j => value.includes(j.id));

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <Heading level={2} className="text-xl font-semibold mb-3">Available Journeys</Heading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
          {journeys.map(j => (
            <label key={j.id} className="flex items-center gap-2 p-2 border rounded">
              <input type="checkbox" checked={value.includes(j.id)} onChange={() => toggle(j.id)} disabled={!isEditing} />
              <div className="flex items-center gap-2">
                <img src={j.image} alt={j.title} className="w-8 h-8 rounded object-cover" />
                <div>
                  <Text className="font-medium text-sm">{j.title}</Text>
                  <Text className="text-xs text-gray-500">{j.category} • {j.duration}</Text>
                </div>
              </div>
            </label>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <Heading level={2} className="text-xl font-semibold mb-3">Selected</Heading>
        <div className="space-y-2">
          {selected.map(j => (
            <div key={j.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center gap-2">
                <img src={j.image} alt={j.title} className="w-10 h-10 rounded object-cover" />
                <div>
                  <Text className="font-medium">{j.title}</Text>
                  <Text className="text-sm text-gray-500">{j.duration} • ¥{j.price}</Text>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => toggle(j.id)} disabled={!isEditing}>移除</Button>
            </div>
          ))}
          {selected.length === 0 && (
            <Text className="text-gray-500">尚未选择</Text>
          )}
        </div>
      </Card>
    </div>
  );
};


