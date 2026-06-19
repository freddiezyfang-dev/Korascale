'use client';

import { useState, type ReactNode } from 'react';

import { PlanTripModal } from '@/components/modals/PlanTripModal';

interface CorporateTravelInquiryButtonProps {
	className: string;
	children: ReactNode;
}

export function CorporateTravelInquiryButton({
	className,
	children,
}: CorporateTravelInquiryButtonProps) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<button type="button" className={className} onClick={() => setIsOpen(true)}>
				{children}
			</button>
			<PlanTripModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
		</>
	);
}
