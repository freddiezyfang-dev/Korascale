import type { Metadata } from 'next';
import HealthcareAccessChinaClient from './HealthcareAccessChinaClient';

export const metadata: Metadata = {
	title: 'Medical Travel, Reimagined in China - Korascale',
	description:
		'Access China’s top-tier hospitals through a fully managed, English-supported medical journey.',
};

export default function HealthcareAccessChinaPage() {
	return <HealthcareAccessChinaClient />;
}
