export const extractUserIdFromUrl = (url: string): string | null => {
  const regex = /comick\.io\/user\/([a-f0-9-]+)/i;
  const match = url.match(regex);
  return match ? match[1] : null;
};

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};
