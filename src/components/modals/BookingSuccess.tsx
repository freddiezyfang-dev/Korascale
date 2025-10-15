'use client';

import React from 'react';
import { Button, Heading, Text } from '@/components/common';
import { CheckCircle, Calendar, Users, Mail, Hash } from 'lucide-react';
import { BookingData } from '@/types';

interface BookingSuccessProps {
  bookingData: BookingData;
  onClose: () => void;
}

export const BookingSuccess: React.FC<BookingSuccessProps> = ({
  bookingData,
  onClose,
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
    <div className="space-y-6 text-center">
      {/* 成功图标和标题 */}
      <div className="space-y-4">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <div>
          <Heading level={2} className="text-2xl font-bold text-gray-900 mb-2">
            Booking Confirmed!
          </Heading>
          <Text size="base" className="text-gray-600">
            Your booking has been confirmed. We will contact you shortly
          </Text>
        </div>
      </div>

      {/* Booking Confirmation Number */}
      <div className="bg-accent/10 p-4 rounded-lg">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Hash className="w-5 h-5 text-accent" />
          <Text size="sm" className="text-gray-600">
            Booking Confirmation Number
          </Text>
        </div>
        <Text size="lg" className="font-mono font-bold text-accent">
          {bookingData.bookingId || 'BNR-' + Math.random().toString(36).substr(2, 8).toUpperCase()}
        </Text>
      </div>

      {/* 预订摘要 */}
      <div className="bg-gray-50 p-4 rounded-lg text-left">
        <Heading level={4} className="text-lg font-semibold mb-3 text-center">
          预订摘要
        </Heading>
        
        {/* 住宿信息 */}
        <div className="flex gap-3 mb-4">
          <img
            src={bookingData.accommodation.image}
            alt={bookingData.accommodation.title}
            className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
          />
          <div className="flex-1">
            <Text size="base" className="font-medium text-gray-900 mb-1">
              {bookingData.accommodation.title}
            </Text>
            <Text size="sm" className="text-gray-600">
              {bookingData.accommodation.location}
            </Text>
          </div>
        </div>

        {/* 入住详情 */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <Text size="sm" className="text-gray-600">
              {formatDate(bookingData.stayDetails.checkIn)} - {formatDate(bookingData.stayDetails.checkOut)}
            </Text>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500" />
            <Text size="sm" className="text-gray-600">
              {bookingData.stayDetails.adults} 成人
              {bookingData.stayDetails.children > 0 && `, ${bookingData.stayDetails.children} 儿童`}
            </Text>
          </div>
        </div>

        {/* 总价 */}
        <div className="border-t border-gray-200 pt-3">
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

      {/* 确认邮件提示 */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-left">
            <Text size="sm" className="font-medium text-blue-900 mb-1">
              确认邮件已发送
            </Text>
            <Text size="xs" className="text-blue-700">
              确认邮件已发送至 {bookingData.guestInfo.email}。住宿方将尽快与您联系以完成预订。
            </Text>
          </div>
        </div>
      </div>

      {/* 关闭按钮 */}
      <div className="pt-4">
        <Button
          onClick={onClose}
          className="px-8 py-2 bg-primary hover:bg-primary/90"
        >
          完成
        </Button>
      </div>
    </div>
  );
};
