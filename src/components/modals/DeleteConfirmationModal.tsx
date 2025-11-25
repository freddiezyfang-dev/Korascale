'use client';

import React, { useState } from 'react';
import { Container, Section, Heading, Text, Button, Card } from '@/components/common';
import { AlertTriangle, X, Trash2 } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  itemName: string;
  itemType: string;
  isLoading?: boolean;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  itemType,
  isLoading = false
}: DeleteConfirmationModalProps) {
  const [confirmationText, setConfirmationText] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);

  // 需要用户输入确认文本才能删除
  const requiredText = `DELETE ${itemType.toUpperCase()}`;
  const isTextMatch = confirmationText === requiredText;

  const handleConfirm = () => {
    if (isTextMatch && isConfirmed) {
      onConfirm();
      handleClose();
    }
  };

  const handleClose = () => {
    setConfirmationText('');
    setIsConfirmed(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <Heading level={3} className="text-lg font-semibold text-gray-900">
                {title}
              </Heading>
              <Text size="sm" className="text-gray-600">
                {description}
              </Text>
            </div>
          </div>

          {/* Warning Content */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <Text className="font-medium text-red-800 mb-1">
                  This action cannot be undone
                </Text>
                <Text size="sm" className="text-red-700">
                  This will permanently delete <strong>"{itemName}"</strong> and remove all associated data.
                </Text>
              </div>
            </div>
          </div>

          {/* Confirmation Steps */}
          <div className="space-y-4">
            {/* Step 1: Type confirmation text */}
            <div>
              <Text className="font-medium text-gray-900 mb-2">
                To confirm deletion, type: <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">{requiredText}</code>
              </Text>
              <input
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder={`Type ${requiredText} to confirm`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                autoComplete="off"
              />
            </div>

            {/* Step 2: Checkbox confirmation */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="confirm-delete"
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
                className="mt-1 w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <label htmlFor="confirm-delete" className="text-sm text-gray-700">
                I understand that this action cannot be undone and I want to permanently delete this {itemType}.
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleClose}
              variant="secondary"
              className="flex-1"
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              variant="primary"
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              disabled={!isTextMatch || !isConfirmed || isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 mr-1 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete {itemType}
                </>
              )}
            </Button>
          </div>

          {/* Additional Safety Notice */}
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <Text size="sm" className="text-yellow-800">
              <strong>Safety Notice:</strong> This deletion will affect all users and cannot be reversed. 
              Please double-check that you have selected the correct {itemType}.
            </Text>
          </div>
        </div>
      </Card>
    </div>
  );
}










