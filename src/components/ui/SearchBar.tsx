type SearchBarProps = {
	placeholder?: string;
	value?: string;
	onChange?: (value: string) => void;
	onSearch?: (value: string) => void;
	className?: string;
};

export default function SearchBar({ 
	placeholder = "Search...", 
	value = "",
	onChange,
	onSearch,
	className = ""
}: SearchBarProps) {
	function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter") {
			onSearch?.((e.target as HTMLInputElement).value);
		}
	}

	function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
		onChange?.(e.target.value);
	}

	return (
		<div className={`relative ${className}`}>
			<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
				<svg className="h-5 w-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
				</svg>
			</div>
			<input 
				type="search" 
				placeholder={placeholder} 
				value={value}
				onChange={handleChange}
				onKeyDown={handleKeyDown}
				className="block w-full pl-10 pr-3 py-3 border border-neutral-300 rounded-lg bg-white text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
			/>
		</div>
	);
}

