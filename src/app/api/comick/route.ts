import { NextRequest, NextResponse } from "next/server";
import { Comic } from "@/types";

export const runtime = 'edge';

interface ComickManga {
  created_at: string;
  read_at: string | null;
  type: number;
  score: number | null;
  chapter_id: number | null;
  last_chapter_id: number | null;
  md_chapters: {
    hid: string;
    chap: string;
    lang: string;
    vol: string | null;
  } | null;
  md_comics: {
    id: number;
    title: string;
    slug: string;
    bayesian_rating: string | null;
    status: number;
    rating_count: number;
    follow_count: number;
    last_chapter: number;
    uploaded_at: string;
    demographic: number | null;
    country: string;
    genres: number[];
    is_english_title: boolean | null;
    md_titles: Array<{
      title: string;
      lang: string;
    }>;
    translation_completed: boolean | null;
    year: number;
    md_covers: Array<{
      w: number;
      h: number;
      b2key: string;
    }>;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    console.log("Fetching follows for user:", userId);

    const pageResponse = await fetch(`https://comick.dev/user/${userId}/list`, {
      headers: {
        'sec-ch-ua': '"Opera GX";v="109", "Not:A-Brand";v="8", "Chromium";v="123"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'upgrade-insecure-requests': '1',
        'Referer': 'https://comick.dev/home',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
      method: 'GET',
    });
    
    if (!pageResponse.ok) {
      throw new Error(`Failed to fetch user page: ${pageResponse.status} ${pageResponse.statusText}`);
    }

    const pageText = await pageResponse.text();
    const buildIdMatch = pageText.match(/"buildId":"([^"]+)"/);
    
    if (!buildIdMatch || buildIdMatch.length < 2) {
      throw new Error('Unable to find buildId in the HTML');
    }
    
    const buildId = buildIdMatch[1];
    const jsonUrl = `https://comick.dev/_next/data/${buildId}/user/${userId}/list.json?id=${userId}`;

    console.log("Fetching data from:", jsonUrl);

    const jsonResponse = await fetch(jsonUrl, {
      headers: {
        'sec-ch-ua': '"Opera GX";v="109", "Not:A-Brand";v="8", "Chromium";v="123"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'upgrade-insecure-requests': '1',
        'Referer': 'https://comick.dev/home',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
      method: 'GET',
    });

    if (!jsonResponse.ok) {
      throw new Error(`Failed to fetch JSON data: ${jsonResponse.status} ${jsonResponse.statusText}`);
    }

    const jsonData = await jsonResponse.json();

    if (!jsonData.pageProps || !jsonData.pageProps.follows) {
      throw new Error('Unable to find follows data in the response');
    }

    const comics = parseComicsFromData(jsonData.pageProps.follows);
    console.log("Parsed comics count:", comics.length);

    return NextResponse.json({ comics });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      {
        error: `Internal server error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}

function parseComicsFromData(followsData: ComickManga[]): Comic[] {
  const comics: Comic[] = [];

  try {
    followsData.forEach((follow, index) => {
      try {
        const comic = follow.md_comics;

        if (!comic || !comic.title) {
          console.warn("Missing comic data in follow entry:", index);
          return;
        }

        const imageUrl = getComicImageUrl(comic);
        const status = getComicStatus(comic.status);

        comics.push({
          id: comic.id?.toString() || `comic-${index}`,
          title: comic.title,
          imageUrl: imageUrl,
          status: status,
        });
      } catch (error) {
        console.error("Error parsing comic item:", error, follow);
      }
    });
  } catch (error) {
    console.error("Error parsing follows data:", error);
  }

  const uniqueComics = comics.filter(
    (comic, index, self) =>
      index === self.findIndex((c) => c.title === comic.title)
  );

  return uniqueComics;
}

function getComicImageUrl(comic: ComickManga['md_comics']): string {
  try {
    if (
      comic.md_covers &&
      Array.isArray(comic.md_covers) &&
      comic.md_covers.length > 0
    ) {
      const cover = comic.md_covers[0];
      if (cover.b2key) {
        return `https://meo.comick.pictures/${cover.b2key}`;
      }
    }

    return "https://dummyimage.com/160x200/374151/ffffff?text=No+Cover";
  } catch (error) {
    console.error("Error getting image URL:", error);
    return "https://dummyimage.com/160x200/374151/ffffff?text=Error";
  }
}

function getComicStatus(statusCode: number): string {
  switch (statusCode) {
    case 1:
      return "Ongoing";
    case 2:
      return "Completed";
    case 3:
      return "Cancelled";
    case 4:
      return "Hiatus";
    default:
      return "Unknown";
  }
}