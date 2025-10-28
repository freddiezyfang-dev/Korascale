'use client';

import React, { useState } from 'react';
import { Card, Heading, Text, Button } from '@/components/common';
import { useExperienceManagement } from '@/context/ExperienceManagementContext';
import { Plus, Trash2, Edit, Eye } from 'lucide-react';

interface ExperienceSelectorProps {
  selectedExperiences: string[];
  availableExperiences: string[];
  onExperiencesChange: (experiences: string[]) => void;
  onAvailableExperiencesChange: (experiences: string[]) => void;
  isEditing?: boolean;
}

export const ExperienceSelector: React.FC<ExperienceSelectorProps> = ({
  selectedExperiences,
  availableExperiences,
  onExperiencesChange,
  onAvailableExperiencesChange,
  isEditing = false
}) => {
  const { experiences, addExperience } = useExperienceManagement();
  const [showAddForm, setShowAddForm] = useState(false);

  const activeExperiences = experiences.filter(exp => exp.status === 'active');
  const selectedExpObjects = activeExperiences.filter(exp => selectedExperiences.includes(exp.id));
  const availableExpObjects = activeExperiences.filter(exp => availableExperiences.includes(exp.id));

  const handleAddToSelected = (expId: string) => {
    if (!selectedExperiences.includes(expId)) {
      onExperiencesChange([...selectedExperiences, expId]);
    }
  };

  const handleRemoveFromSelected = (expId: string) => {
    onExperiencesChange(selectedExperiences.filter(id => id !== expId));
  };

  const handleToggleAvailable = (expId: string) => {
    const isAvailable = availableExperiences.includes(expId);
    if (isAvailable) {
      onAvailableExperiencesChange(availableExperiences.filter(id => id !== expId));
    } else {
      onAvailableExperiencesChange([...availableExperiences, expId]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Available Experiences Selection */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Heading level={2} className="text-xl font-semibold">
            Available Experiences
          </Heading>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            variant="secondary"
            size="sm"
            disabled={!isEditing}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add New Experience
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4">
          {activeExperiences.map((experience) => (
            <div key={experience.id} className="flex items-center space-x-3">
              <input
                type="checkbox"
                id={`available-exp-${experience.id}`}
                checked={availableExperiences.includes(experience.id)}
                onChange={() => handleToggleAvailable(experience.id)}
                disabled={!isEditing}
                className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor={`available-exp-${experience.id}`} className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <img src={experience.image} alt={experience.title} className="w-8 h-8 rounded object-cover" />
                  <div>
                    <Text className="font-medium text-sm">{experience.title}</Text>
                    <Text className="text-xs text-gray-500">{experience.type} • {experience.duration}</Text>
                  </div>
                </div>
              </label>
              <div className="flex gap-1">
                <Button
                  onClick={() => window.open(`/admin/experiences/edit/${experience.id}`, '_blank')}
                  variant="secondary"
                  size="sm"
                >
                  <Edit className="w-3 h-3" />
                </Button>
                <Button
                  onClick={() => window.open(`/experiences/${experience.slug}`, '_blank')}
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

      {/* Selected Experiences for This Journey */}
      <Card className="p-6">
        <Heading level={2} className="text-xl font-semibold mb-4">
          Selected Experiences for This Journey
        </Heading>
        
        <div className="space-y-2">
          {selectedExpObjects.map((experience) => (
            <div key={experience.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <img src={experience.image} alt={experience.title} className="w-10 h-10 rounded object-cover" />
                <div>
                  <Text className="font-medium">{experience.title}</Text>
                  <Text className="text-sm text-gray-500">{experience.type} • {experience.duration} • ¥{experience.price}</Text>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => window.open(`/experiences/${experience.slug}`, '_blank')}
                  variant="secondary"
                  size="sm"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => handleRemoveFromSelected(experience.id)}
                  variant="secondary"
                  size="sm"
                  disabled={!isEditing}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          
          {selectedExpObjects.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Text>No experiences selected for this journey</Text>
              <Text className="text-sm mt-1">Select from available experiences above</Text>
            </div>
          )}
        </div>
      </Card>

      {/* Quick Add from Available */}
      {availableExpObjects.length > 0 && (
        <Card className="p-6">
          <Heading level={2} className="text-xl font-semibold mb-4">
            Quick Add from Available
          </Heading>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {availableExpObjects
              .filter(exp => !selectedExperiences.includes(exp.id))
              .map((experience) => (
                <Button
                  key={experience.id}
                  onClick={() => handleAddToSelected(experience.id)}
                  variant="secondary"
                  size="sm"
                  disabled={!isEditing}
                  className="justify-start"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {experience.title}
                </Button>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
};





