import Link from 'next/link';

export interface EditorialMosaicItem {
	title: string;
	image: string;
	href: string;
	category?: string;
}

interface LayoutSlot {
	colSpan: string;
	heightClass: string;
}

function getLayoutSlots(count: number): LayoutSlot[] {
	switch (Math.min(count, 5)) {
		case 1:
			return [{ colSpan: 'lg:col-span-12', heightClass: 'lg:h-[420px]' }];
		case 2:
			return [
				{ colSpan: 'lg:col-span-6', heightClass: 'lg:h-[420px]' },
				{ colSpan: 'lg:col-span-6', heightClass: 'lg:h-[420px]' },
			];
		case 3:
			return [
				{ colSpan: 'lg:col-span-4', heightClass: 'lg:h-[450px]' },
				{ colSpan: 'lg:col-span-4', heightClass: 'lg:h-[450px]' },
				{ colSpan: 'lg:col-span-4', heightClass: 'lg:h-[450px]' },
			];
		case 4:
			return [
				{ colSpan: 'lg:col-span-6', heightClass: 'lg:h-[380px]' },
				{ colSpan: 'lg:col-span-6', heightClass: 'lg:h-[380px]' },
				{ colSpan: 'lg:col-span-6', heightClass: 'lg:h-[340px]' },
				{ colSpan: 'lg:col-span-6', heightClass: 'lg:h-[340px]' },
			];
		default:
			return [
				{ colSpan: 'lg:col-span-4', heightClass: 'lg:h-[450px]' },
				{ colSpan: 'lg:col-span-4', heightClass: 'lg:h-[450px]' },
				{ colSpan: 'lg:col-span-4', heightClass: 'lg:h-[450px]' },
				{ colSpan: 'lg:col-span-6', heightClass: 'lg:h-[330px]' },
				{ colSpan: 'lg:col-span-6', heightClass: 'lg:h-[330px]' },
			];
	}
}

function MosaicCard({
	item,
	colSpan,
	heightClass,
}: {
	item: EditorialMosaicItem;
	colSpan: string;
	heightClass: string;
}) {
	return (
		<Link
			href={item.href}
			className={`group relative block h-[340px] overflow-hidden rounded-lg ${colSpan} ${heightClass}`}
		>
			{item.image ? (
				<img
					src={item.image}
					alt=""
					className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
				/>
			) : (
				<div className="absolute inset-0 bg-[#173028]" aria-hidden />
			)}
			<div
				className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/10"
				aria-hidden
			/>
			<div className="absolute inset-0 flex flex-col justify-end p-5 md:p-6 lg:p-7">
				{item.category ? (
					<p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-white/70 md:text-xs">
						{item.category}
					</p>
				) : null}
				<h3 className="line-clamp-2 font-serif text-xl leading-snug text-white md:text-2xl">{item.title}</h3>
				<span className="mt-2.5 text-sm text-white/85 underline-offset-4 transition group-hover:underline">
					view more
				</span>
			</div>
		</Link>
	);
}

interface EditorialMosaicProps {
	items: EditorialMosaicItem[];
	title?: string;
}

export default function EditorialMosaic({ items, title = 'Inspirations' }: EditorialMosaicProps) {
	if (items.length === 0) return null;

	const visibleItems = items.slice(0, 5);
	const layoutSlots = getLayoutSlots(visibleItems.length);

	return (
		<div>
			<h2 className="mb-10 text-center font-serif text-3xl text-white md:mb-12 md:text-4xl">{title}</h2>
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
				{visibleItems.map((item, index) => (
					<MosaicCard
						key={item.href + index}
						item={item}
						colSpan={layoutSlots[index]?.colSpan ?? 'lg:col-span-12'}
						heightClass={layoutSlots[index]?.heightClass ?? 'lg:h-[420px]'}
					/>
				))}
			</div>
		</div>
	);
}
