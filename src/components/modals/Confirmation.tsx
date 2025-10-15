'use client';

import React from 'react';
import { Button, Heading, Text } from '@/components/common';
import { Calendar, Users, User, Mail, Phone, MessageSquare, CheckCircle } from 'lucide-react';
import { BookingData } from '@/types';

interface ConfirmationProps {
  bookingData: BookingData;
  onBack: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
}

export const Confirmation: React.FC<ConfirmationProps> = ({
  bookingData,
  onBack,
  onConfirm,
  isSubmitting = false,
}) => {
  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateNights = () => {
    if (!bookingData.stayDetails.checkIn || !bookingData.stayDetails.checkOut) return 0;
    return Math.ceil(
      (bookingData.stayDetails.checkOut.getTime() - bookingData.stayDetails.checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  const nights = calculateNights();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Heading level={3} className="text-xl font-semibold mb-2">
          Confirm Booking Details
        </Heading>
        <Text size="sm" className="text-gray-600">
          Please review your booking information carefully before confirming
        </Text>
      </div>

      <div className="space-y-6">
        {/* 住宿信息 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <Heading level={4} className="text-lg font-semibold mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-accent" />
            住宿信息
          </Heading>
          <div className="flex gap-4">
            <img
              src={bookingData.accommodation.image}
              alt={bookingData.accommodation.title}
              className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
            />
            <div className="flex-1">
              <Text size="base" className="font-medium text-gray-900 mb-1">
                {bookingData.accommodation.title}
              </Text>
              <Text size="sm" className="text-gray-600 mb-2">
                {bookingData.accommodation.location}
              </Text>
              {bookingData.accommodation.price && (
                <Text size="sm" className="text-accent font-medium">
                  {bookingData.accommodation.price}
                </Text>
              )}
            </div>
          </div>
        </div>

        {/* 入住详情 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <Heading level={4} className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-accent" />
            入住详情
          </Heading>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Text size="sm" className="text-gray-600 mb-1">入住日期</Text>
              <Text size="base" className="font-medium">
                {formatDate(bookingData.stayDetails.checkIn)}
              </Text>
            </div>
            <div>
              <Text size="sm" className="text-gray-600 mb-1">退房日期</Text>
              <Text size="base" className="font-medium">
                {formatDate(bookingData.stayDetails.checkOut)}
              </Text>
            </div>
            <div>
              <Text size="sm" className="text-gray-600 mb-1">入住天数</Text>
              <Text size="base" className="font-medium">
                {nights} 晚
              </Text>
            </div>
            <div>
              <Text size="sm" className="text-gray-600 mb-1">住客人数</Text>
              <Text size="base" className="font-medium">
                {bookingData.stayDetails.adults} 成人
                {bookingData.stayDetails.children > 0 && `, ${bookingData.stayDetails.children} 儿童`}
              </Text>
            </div>
          </div>
        </div>

        {/* 住客信息 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <Heading level={4} className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" />
            住客信息
          </Heading>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-gray-500" />
              <Text size="base" className="font-medium">
                {bookingData.guestInfo.fullName}
              </Text>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-gray-500" />
              <Text size="base">
                {bookingData.guestInfo.email}
              </Text>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-gray-500" />
              <Text size="base">
                {bookingData.guestInfo.phoneNumber}
              </Text>
            </div>
            {bookingData.guestInfo.specialRequests && (
              <div className="flex items-start gap-3">
                <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5" />
                <div>
                  <Text size="sm" className="text-gray-600 mb-1">特殊要求</Text>
                  <Text size="base">
                    {bookingData.guestInfo.specialRequests}
                  </Text>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 费用明细 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <Heading level={4} className="text-lg font-semibold mb-3">
            费用明细
          </Heading>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Text size="sm" className="text-gray-600">
                {nights} 晚 × $120/晚
              </Text>
              <Text size="sm" className="font-medium">
                ${nights * 120}
              </Text>
            </div>
            <div className="border-t border-gray-200 pt-2">
              <div className="flex justify-between items-center">
                <Text size="base" className="font-semibold">
                  总价
                </Text>
                <Text size="lg" className="font-bold text-accent">
                  ${bookingData.totalPrice}
                </Text>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 按钮 */}
      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
          className="px-8 py-2"
        >
          返回
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isSubmitting}
          className="px-8 py-2 bg-accent hover:bg-accent/90"
        >
          {isSubmitting ? '提交中...' : '确认预订'}
        </Button>
      </div>
    </div>
  );
};
