const ICON_PATHS: Record<string, string> = {
  all: '<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  gates:
    '<path d="M4 21V10a8 8 0 0 1 16 0v11"/><path d="M12 21V10"/><path d="M4 14.5h16"/><path d="M2 21h20"/>',
  mosques:
    '<path d="M12 3c2.5 1.8 3.6 3.7 3.6 5.5H8.4C8.4 6.7 9.5 4.8 12 3z"/><path d="M8.4 8.5h7.2V21H8.4z"/><path d="M5 21V9.5"/><path d="M19 21V9.5"/><path d="M3 21h18"/>',
  sports:
    '<circle cx="12" cy="12" r="9"/><path d="M3.2 9.2h17.6"/><path d="M3.2 14.8h17.6"/><path d="M12 3a13 13 0 0 0 0 18"/><path d="M12 3a13 13 0 0 1 0 18"/>',
  hostels:
    '<path d="M2 5v15"/><path d="M2 9h16a4 4 0 0 1 4 4v7"/><path d="M2 16h20"/><path d="M6.5 9V6.5"/>',
  schools:
    '<path d="M22 9.5 12 5 2 9.5l10 4.5 10-4.5z"/><path d="M6.5 11.7V17c0 1.7 2.5 3 5.5 3s5.5-1.3 5.5-3v-5.3"/>',
  cafes:
    '<path d="M18 9h1.5a2.75 2.75 0 0 1 0 5.5H18"/><path d="M3 9h15v5.5a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V9z"/><path d="M7 3v2.5"/><path d="M11 3v2.5"/><path d="M15 3v2.5"/>',
  banks:
    '<path d="M12 3 3 8.5h18L12 3z"/><path d="M3 8.5h18"/><path d="M6 11.5v6"/><path d="M10 11.5v6"/><path d="M14 11.5v6"/><path d="M18 11.5v6"/><path d="M3 21h18"/>',
  facilities:
    '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3"/><path d="M12 18.5v3"/><path d="M2.5 12h3"/><path d="M18.5 12h3"/><path d="m5.3 5.3 2.1 2.1"/><path d="m16.6 16.6 2.1 2.1"/><path d="m18.7 5.3-2.1 2.1"/><path d="m7.4 16.6-2.1 2.1"/>',
};

const iconPath = (category: string) => ICON_PATHS[category] ?? ICON_PATHS.all;

export function categoryIconSvg(category: string, size: number, color: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconPath(category)}</svg>`;
}

export function CategoryIcon({
  category,
  size = 14,
  className = "",
  style,
}: {
  category: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
      style={style}
      dangerouslySetInnerHTML={{ __html: iconPath(category) }}
    />
  );
}
