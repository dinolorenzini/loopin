export interface GifItem {
  id: string;
  title: string;
  previewUrl: string;
  url: string;
  width: number;
  height: number;
}

// GIPHY API key configured for Loopin
const DEFAULT_GIPHY_KEY = "vuZtWBSYD8Z1fILeLmVffAthzV4Fy9LO";

// Curated high-resolution, instant-loading reaction GIFs (offline & fallback resilience)
const CURATED_GIFS: Record<string, GifItem[]> = {
  trending: [
    {
      id: "trend-1",
      title: "Party Pop",
      previewUrl: "https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif",
      url: "https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif",
      width: 480,
      height: 270,
    },
    {
      id: "trend-2",
      title: "Mind Blown",
      previewUrl: "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif",
      url: "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif",
      width: 480,
      height: 360,
    },
    {
      id: "trend-3",
      title: "Popcorn Watching",
      previewUrl: "https://media.giphy.com/media/gl0mkIZOW6Nwc/giphy.gif",
      url: "https://media.giphy.com/media/gl0mkIZOW6Nwc/giphy.gif",
      width: 480,
      height: 270,
    },
    {
      id: "trend-4",
      title: "Cat Vibing",
      previewUrl: "https://media.giphy.com/media/jpbnoe3UIa8TU8LM13/giphy.gif",
      url: "https://media.giphy.com/media/jpbnoe3UIa8TU8LM13/giphy.gif",
      width: 480,
      height: 480,
    },
    {
      id: "trend-5",
      title: "Happy Dance",
      previewUrl: "https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif",
      url: "https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif",
      width: 480,
      height: 360,
    },
    {
      id: "trend-6",
      title: "Leonardo Cheers",
      previewUrl: "https://media1.giphy.com/media/yziuK6WtDFMly/100.gif",
      url: "https://media1.giphy.com/media/yziuK6WtDFMly/giphy.gif",
      width: 480,
      height: 260,
    },
    {
      id: "trend-7",
      title: "Nod of Approval",
      previewUrl: "https://media.giphy.com/media/NEvPzZ8bd1V4Y/giphy.gif",
      url: "https://media.giphy.com/media/NEvPzZ8bd1V4Y/giphy.gif",
      width: 480,
      height: 360,
    },
    {
      id: "trend-8",
      title: "This Is Fine",
      previewUrl: "https://media.giphy.com/media/QMHoU66sBXqqLqYvGO/giphy.gif",
      url: "https://media.giphy.com/media/QMHoU66sBXqqLqYvGO/giphy.gif",
      width: 480,
      height: 270,
    },
  ],
  laugh: [
    {
      id: "laugh-1",
      title: "Kangaroo Laugh",
      previewUrl: "https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif",
      url: "https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif",
      width: 480,
      height: 360,
    },
    {
      id: "laugh-2",
      title: "Wheezing Laugh",
      previewUrl: "https://media.giphy.com/media/lw75Al819OAvS/giphy.gif",
      url: "https://media.giphy.com/media/lw75Al819OAvS/giphy.gif",
      width: 480,
      height: 360,
    },
    {
      id: "laugh-3",
      title: "Steve Carell Laugh",
      previewUrl: "https://media.giphy.com/media/dC9DTdqPmRnlS/giphy.gif",
      url: "https://media.giphy.com/media/dC9DTdqPmRnlS/giphy.gif",
      width: 480,
      height: 270,
    },
    {
      id: "laugh-4",
      title: "Giggle Dog",
      previewUrl: "https://media.giphy.com/media/3oEjHAUOqG3lSS0f1C/giphy.gif",
      url: "https://media.giphy.com/media/3oEjHAUOqG3lSS0f1C/giphy.gif",
      width: 480,
      height: 360,
    },
    {
      id: "laugh-5",
      title: "Rolling Laughing",
      previewUrl: "https://media.giphy.com/media/ltIFdjNAasOwVvKhvx/giphy.gif",
      url: "https://media.giphy.com/media/ltIFdjNAasOwVvKhvx/giphy.gif",
      width: 480,
      height: 270,
    },
  ],
  celebrate: [
    {
      id: "celeb-1",
      title: "Confetti Celebration",
      previewUrl: "https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif",
      url: "https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif",
      width: 480,
      height: 270,
    },
    {
      id: "celeb-2",
      title: "Carlton Dance",
      previewUrl: "https://media.giphy.com/media/pa37AAG5KXoek/giphy.gif",
      url: "https://media.giphy.com/media/pa37AAG5KXoek/giphy.gif",
      width: 480,
      height: 360,
    },
    {
      id: "celeb-3",
      title: "Success Kid",
      previewUrl: "https://media.giphy.com/media/nXxOjZrbnbRxS/giphy.gif",
      url: "https://media.giphy.com/media/nXxOjZrbnbRxS/giphy.gif",
      width: 480,
      height: 360,
    },
    {
      id: "celeb-4",
      title: "High Five",
      previewUrl: "https://media.giphy.com/media/pHb82xtBPfqEg/giphy.gif",
      url: "https://media.giphy.com/media/pHb82xtBPfqEg/giphy.gif",
      width: 480,
      height: 270,
    },
  ],
  agree: [
    {
      id: "agree-1",
      title: "Nodding Yes",
      previewUrl: "https://media.giphy.com/media/NEvPzZ8bd1V4Y/giphy.gif",
      url: "https://media.giphy.com/media/NEvPzZ8bd1V4Y/giphy.gif",
      width: 480,
      height: 360,
    },
    {
      id: "agree-2",
      title: "Absolutely",
      previewUrl: "https://media.giphy.com/media/10Jpr9KSaXLchW/giphy.gif",
      url: "https://media.giphy.com/media/10Jpr9KSaXLchW/giphy.gif",
      width: 480,
      height: 270,
    },
    {
      id: "agree-3",
      title: "Thumbs Up",
      previewUrl: "https://media.giphy.com/media/111ebonMs90YLu/giphy.gif",
      url: "https://media.giphy.com/media/111ebonMs90YLu/giphy.gif",
      width: 480,
      height: 360,
    },
    {
      id: "agree-4",
      title: "Double Thumbs",
      previewUrl: "https://media.giphy.com/media/mgqefOvJJToHk2P9Pu/giphy.gif",
      url: "https://media.giphy.com/media/mgqefOvJJToHk2P9Pu/giphy.gif",
      width: 480,
      height: 270,
    },
  ],
  shock: [
    {
      id: "shock-1",
      title: "Mind Blown",
      previewUrl: "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif",
      url: "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif",
      width: 480,
      height: 360,
    },
    {
      id: "shock-2",
      title: "Gasp",
      previewUrl: "https://media.giphy.com/media/PUBxelpjgh5ry/giphy.gif",
      url: "https://media.giphy.com/media/PUBxelpjgh5ry/giphy.gif",
      width: 480,
      height: 360,
    },
    {
      id: "shock-3",
      title: "Surprised Pikachu",
      previewUrl: "https://media.giphy.com/media/6nWhy3ulBL7GSCvKw6/giphy.gif",
      url: "https://media.giphy.com/media/6nWhy3ulBL7GSCvKw6/giphy.gif",
      width: 480,
      height: 360,
    },
  ],
  cat: [
    {
      id: "cat-1",
      title: "Cat Bop",
      previewUrl: "https://media.giphy.com/media/jpbnoe3UIa8TU8LM13/giphy.gif",
      url: "https://media.giphy.com/media/jpbnoe3UIa8TU8LM13/giphy.gif",
      width: 480,
      height: 480,
    },
    {
      id: "cat-2",
      title: "Typing Cat",
      previewUrl: "https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif",
      url: "https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif",
      width: 480,
      height: 360,
    },
    {
      id: "cat-3",
      title: "Shocked Cat",
      previewUrl: "https://media.giphy.com/media/vFKqnCdLPNOKc/giphy.gif",
      url: "https://media.giphy.com/media/vFKqnCdLPNOKc/giphy.gif",
      width: 480,
      height: 360,
    },
  ],
  dance: [
    {
      id: "dance-1",
      title: "Happy Dance",
      previewUrl: "https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif",
      url: "https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif",
      width: 480,
      height: 360,
    },
    {
      id: "dance-2",
      title: "Carlton Dance",
      previewUrl: "https://media.giphy.com/media/pa37AAG5KXoek/giphy.gif",
      url: "https://media.giphy.com/media/pa37AAG5KXoek/giphy.gif",
      width: 480,
      height: 360,
    },
    {
      id: "dance-3",
      title: "Groovy Dance",
      previewUrl: "https://media.giphy.com/media/ujTVMASREzuRbH6zy5/giphy.gif",
      url: "https://media.giphy.com/media/ujTVMASREzuRbH6zy5/giphy.gif",
      width: 480,
      height: 480,
    },
    {
      id: "dance-4",
      title: "Vibing Dance",
      previewUrl: "https://media.giphy.com/media/V7jkATiqn3mRie2LI2/giphy-downsized-medium.gif",
      url: "https://media.giphy.com/media/V7jkATiqn3mRie2LI2/giphy-downsized-medium.gif",
      width: 480,
      height: 360,
    },
  ],
  clap: [
    {
      id: "clap-1",
      title: "Applause Clap",
      previewUrl: "https://media.giphy.com/media/nbvFVPiEiJH6Q/giphy.gif",
      url: "https://media.giphy.com/media/nbvFVPiEiJH6Q/giphy.gif",
      width: 480,
      height: 270,
    },
    {
      id: "clap-2",
      title: "Clap Applause",
      previewUrl: "https://media4.giphy.com/media/Rgn6cUfaN5zW/100.gif",
      url: "https://media4.giphy.com/media/Rgn6cUfaN5zW/giphy.gif",
      width: 480,
      height: 260,
    },
    {
      id: "clap-3",
      title: "Standing Ovation",
      previewUrl: "https://media.giphy.com/media/l4q8cJzGdR9J8w3hS/giphy.gif",
      url: "https://media.giphy.com/media/l4q8cJzGdR9J8w3hS/giphy.gif",
      width: 480,
      height: 270,
    },
    {
      id: "clap-4",
      title: "Enthusiastic Clapping",
      previewUrl: "https://media.giphy.com/media/3o72FcJmLzIdYJdmDe/giphy.gif",
      url: "https://media.giphy.com/media/3o72FcJmLzIdYJdmDe/giphy.gif",
      width: 480,
      height: 360,
    },
  ],
  love: [
    {
      id: "love-1",
      title: "Heart Eyes",
      previewUrl: "https://media.giphy.com/media/R6gVNROjZaHjy/giphy.gif",
      url: "https://media.giphy.com/media/R6gVNROjZaHjy/giphy.gif",
      width: 480,
      height: 360,
    },
    {
      id: "love-2",
      title: "Sending Love",
      previewUrl: "https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif",
      url: "https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif",
      width: 480,
      height: 270,
    },
    {
      id: "love-3",
      title: "Big Hug",
      previewUrl: "https://media.giphy.com/media/l8ooTJxKGMkVW/giphy.gif",
      url: "https://media.giphy.com/media/l8ooTJxKGMkVW/giphy.gif",
      width: 480,
      height: 360,
    },
  ],
  sad: [
    {
      id: "sad-1",
      title: "Crying Tears",
      previewUrl: "https://media.giphy.com/media/26ufcVAp3AiJJsrIs/giphy.gif",
      url: "https://media.giphy.com/media/26ufcVAp3AiJJsrIs/giphy.gif",
      width: 480,
      height: 360,
    },
    {
      id: "sad-2",
      title: "Sad SpongeBob",
      previewUrl: "https://media.giphy.com/media/OPU6wzx8JrHna/giphy.gif",
      url: "https://media.giphy.com/media/OPU6wzx8JrHna/giphy.gif",
      width: 480,
      height: 360,
    },
    {
      id: "sad-3",
      title: "Comfort Hug",
      previewUrl: "https://media.giphy.com/media/EvYHHSntaIl5m/giphy.gif",
      url: "https://media.giphy.com/media/EvYHHSntaIl5m/giphy.gif",
      width: 480,
      height: 270,
    },
  ],
};

function mapGiphyResponse(json: any, fallbackTitle: string): GifItem[] {
  if (!json?.data || !Array.isArray(json.data)) return [];
  return json.data
    .map((item: any) => {
      const previewUrl =
        item.images?.fixed_height_small?.url ||
        item.images?.downsized?.url ||
        item.images?.fixed_height?.url ||
        item.images?.original?.url;
      const url =
        item.images?.downsized_medium?.url ||
        item.images?.downsized?.url ||
        item.images?.original?.url ||
        previewUrl;

      if (!url || !previewUrl) return null;

      return {
        id: item.id || crypto.randomUUID(),
        title: item.title?.trim() || fallbackTitle,
        previewUrl,
        url,
        width: Number(item.images?.original?.width) || 480,
        height: Number(item.images?.original?.height) || 360,
      };
    })
    .filter((g: GifItem | null): g is GifItem => g !== null);
}

export async function searchGifs(query: string, apiKey?: string): Promise<GifItem[]> {
  const cleanQ = query.trim().toLowerCase();
  const effectiveKey = apiKey || DEFAULT_GIPHY_KEY;

  // 1. If empty or "trending", fetch GIPHY trending or fallback to curated trending
  if (!cleanQ || cleanQ === "trending") {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const resp = await fetch(
        `https://api.giphy.com/v1/gifs/trending?api_key=${effectiveKey}&limit=16&rating=g`,
        {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);
      if (resp.ok) {
        const json = await resp.json();
        const items = mapGiphyResponse(json, "Trending");
        if (items.length > 0) return items;
      }
    } catch {
      // Fallback below
    }
    return CURATED_GIFS.trending;
  }

  // 2. Query GIPHY live search API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const resp = await fetch(
      `https://api.giphy.com/v1/gifs/search?api_key=${effectiveKey}&q=${encodeURIComponent(cleanQ)}&limit=16&rating=g`,
      {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);
    if (resp.ok) {
      const json = await resp.json();
      const items = mapGiphyResponse(json, cleanQ);
      if (items.length > 0) {
        return items;
      }
    }
  } catch {
    // Continue to curated fallback
  }

  // 3. Check matching category in curated library
  for (const [category, items] of Object.entries(CURATED_GIFS)) {
    if (category === cleanQ || category.includes(cleanQ) || cleanQ.includes(category)) {
      return items;
    }
  }

  // 4. Search curated library by title keywords
  const filtered = Object.values(CURATED_GIFS)
    .flat()
    .filter(
      (item, idx, arr) =>
        item.title.toLowerCase().includes(cleanQ) &&
        arr.findIndex((x) => x.id === item.id) === idx
    );

  if (filtered.length > 0) {
    return filtered;
  }

  // 5. If specific search term had 0 matches across GIPHY and curated library,
  // return empty array so client can render "No GIFs found for 'query'" rather than confusing trending GIFs
  return [];
}
