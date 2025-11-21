
const COLORS = ['#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#FF5722', '#795548', '#607D8B'];

export const generateAvatar = (name: string): string => {
    if (!name) return '';

    const initials = name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    const charCodeSum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const color = COLORS[charCodeSum % COLORS.length];

    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect width="100" height="100" fill="${color}" />
        <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-family="Arial, sans-serif" font-size="40" fill="white" font-weight="bold">
            ${initials}
        </text>
    </svg>
    `;

    // Use btoa for Base64 encoding
    return `data:image/svg+xml;base64,${btoa(svg)}`;
};
