import { TierListData, Tier } from "@/types";

const STORAGE_KEY = "comick-tierlist-data";
const MAX_COOKIE_SIZE = 4000;

export const defaultTiers: Tier[] = [
  { id: "s", label: "S", color: "#ff7f7f", comics: [] },
  { id: "a", label: "A", color: "#ffbf7f", comics: [] },
  { id: "b", label: "B", color: "#ffdf80", comics: [] },
  { id: "c", label: "C", color: "#ffff7f", comics: [] },
  { id: "d", label: "D", color: "#bfff7f", comics: [] },
  { id: "f", label: "F", color: "#7fff7f", comics: [] },
];

export const saveTierListData = (data: TierListData): void => {
  try {
    const jsonData = JSON.stringify(data);

    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(STORAGE_KEY, jsonData);
    } else {
      if (jsonData.length < MAX_COOKIE_SIZE) {
        document.cookie = `${STORAGE_KEY}=${encodeURIComponent(
          jsonData
        )}; expires=${new Date(
          Date.now() + 365 * 24 * 60 * 60 * 1000
        ).toUTCString()}; path=/; SameSite=Strict`;
      } else {
        console.warn(
          "Data too large for cookie storage and localStorage not available"
        );
      }
    }
  } catch (error) {
    console.error("Failed to save tierlist data:", error);
  }
};

export const loadTierListData = (): TierListData | null => {
  try {
    if (typeof window === "undefined") return null;

    if (window.localStorage) {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    }

    const cookies = document.cookie.split(";");
    const tierListCookie = cookies.find((cookie) =>
      cookie.trim().startsWith(`${STORAGE_KEY}=`)
    );

    if (tierListCookie) {
      const cookieValue = tierListCookie.split("=")[1];
      const data = decodeURIComponent(cookieValue);
      return JSON.parse(data);
    }

    return null;
  } catch (error) {
    console.error("Failed to load tierlist data:", error);
    return null;
  }
};

export const clearTierListData = (): void => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem(STORAGE_KEY);
    }
    document.cookie = `${STORAGE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  } catch (error) {
    console.error("Failed to clear tierlist data:", error);
  }
};
