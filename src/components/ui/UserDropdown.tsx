"use client";

import React from 'react';
import { useWishlist } from '@/context/WishlistContext';
import { useUser } from '@/context/UserContext';
import { Heart, Trash2, ExternalLink, Calendar, Users } from 'lucide-react';
import Link from 'next/link';

export function UserDropdown() {
  const { items, removeFromWishlist, clearWishlist } = useWishlist();
  const { user, logout } = useUser();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="bg-white p-6 min-w-[320px] max-w-[400px] shadow-lg border border-gray-200 rounded-lg">
      {/* 用户信息头部 */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{user?.name}</h3>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Wishlist 内容 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            <h4 className="font-semibold text-gray-900">My Wishlist</h4>
            <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
              {items.length}
            </span>
          </div>
          {items.length > 0 && (
            <button
              onClick={clearWishlist}
              className="text-xs text-gray-500 hover:text-red-500 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Wishlist 项目列表 */}
        <div className="max-h-64 overflow-y-auto">
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Heart className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No items in wishlist</p>
              <Link 
                href="/journeys" 
                className="text-primary-500 text-sm hover:underline mt-2 inline-block"
              >
                Browse Journeys
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-3 mb-2">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-sm text-gray-900 truncate">
                        {item.title}
                      </h5>
                      <p className="text-xs text-gray-500 truncate">{item.location}</p>
                      {item.type === 'accommodation' && item.bookingDetails && (
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {item.bookingDetails.checkIn?.toLocaleDateString()}
                          </span>
                          <Users className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {item.bookingDetails.adults} adults
                          </span>
                        </div>
                      )}
                      {item.price && (
                        <p className="text-xs font-medium text-primary-500 mt-1">
                          {item.price}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => removeFromWishlist(item.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <Link
                        href={`/${item.type}s`}
                        className="p-1 text-gray-400 hover:text-primary-500 transition-colors"
                        title="View details"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                  {/* 预订按钮 */}
                  <div className="flex gap-2 mt-2">
                    <Link
                      href="/checkout"
                      className="flex-1 bg-primary-500 text-white text-xs py-2 px-3 rounded-lg hover:bg-primary-600 transition-colors text-center flex items-center justify-center gap-1"
                    >
                      <Calendar className="w-3 h-3" />
                      REQUEST TO BOOK
                    </Link>
                    <Link
                      href={`/${item.type}s`}
                      className="flex-1 bg-gray-200 text-gray-700 text-xs py-2 px-3 rounded-lg hover:bg-gray-300 transition-colors text-center"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex gap-2">
          {items.length > 0 && (
            <Link
              href="/checkout"
              className="flex-1 bg-primary-500 text-white text-sm py-2 px-4 rounded-lg hover:bg-primary-600 transition-colors text-center flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Book All ({items.length})
            </Link>
          )}
          <button
            onClick={handleLogout}
            className={`${items.length > 0 ? 'flex-1' : 'w-full'} bg-gray-100 text-gray-700 text-sm py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors`}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
