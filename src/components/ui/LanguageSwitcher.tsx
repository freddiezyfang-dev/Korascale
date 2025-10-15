type Language = "en" | "zh" | "de";

type LanguageSwitcherProps = {
	value?: Language;
	onChange?: (lang: Language) => void;
};

export default function LanguageSwitcher({ value = "en", onChange }: LanguageSwitcherProps) {
	return (
		<select value={value} onChange={(e) => onChange?.(e.target.value as Language)}>
			<option value="en">EN</option>
			<option value="zh">中文</option>
			<option value="de">DE</option>
		</select>
	);
}

