'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Container, Section, Heading, Button } from '@/components/common';
import JourneyRevisionPreviewPanel from '@/components/admin/JourneyRevisionPreviewPanel';

export default function JourneyRevisionPreviewPage() {
	const params = useParams();
	const revisionId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

	return (
		<Container>
			<Section className="py-8 space-y-6">
				<div className="flex items-center justify-between gap-4">
					<Heading level={2}>Journey Revision</Heading>
					<Link href="/admin/journeys">
						<Button variant="secondary" size="sm">
							Back to Journeys
						</Button>
					</Link>
				</div>
				{revisionId ? (
					<JourneyRevisionPreviewPanel revisionId={revisionId} />
				) : (
					<p className="text-sm text-gray-600">Missing revision id.</p>
				)}
			</Section>
		</Container>
	);
}
