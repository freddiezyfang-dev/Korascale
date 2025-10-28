'use client';

import { useState } from 'react';

interface DeleteConfirmationOptions {
  title: string;
  description: string;
  itemName: string;
  itemType: string;
  onConfirm: () => void | Promise<void>;
}

export function useDeleteConfirmation() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteOptions, setDeleteOptions] = useState<DeleteConfirmationOptions | null>(null);

  const confirmDelete = (options: DeleteConfirmationOptions) => {
    setDeleteOptions(options);
    setIsModalOpen(true);
  };

  const handleConfirm = async () => {
    if (!deleteOptions) return;
    
    setIsDeleting(true);
    try {
      await deleteOptions.onConfirm();
    } catch (error) {
      console.error('Delete failed:', error);
      // 可以在这里添加错误提示
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setDeleteOptions(null);
    setIsDeleting(false);
  };

  return {
    isModalOpen,
    isDeleting,
    deleteOptions,
    confirmDelete,
    handleConfirm,
    handleClose
  };
}



