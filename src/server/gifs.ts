export interface GifItem {
  id: string;
  title: string;
  previewUrl: string;
  url: string;
  width: number;
  height: number;
}

// Curated high-resolution, instant-loading reaction GIFs
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
      previewUrl: "https://media.giphy.com/media/GCLlQnV7dXZ2E/giphy.gif",
      url: "https://media.giphy.com/media/GCLlQnV7dXZ2E/giphy.gif",
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
};

export async function searchGifs(query: string, apiKey?: string): Promise<GifItem[]> {
  const cleanQ = query.trim().toLowerCase();

  // If query is empty or "trending", return trending list
  if (!cleanQ || cleanQ === "trending") {
    return CURATED_GIFS.trending;
  }

  // Check matching category
  for (const [category, items] of Object.entries(CURATED_GIFS)) {
    if (category.includes(cleanQ) || cleanQ.includes(category)) {
      return items;
    }
  }

  // Filter curated library by title
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

  // If GIPHY / Tenor API key is available in environment:
  if (apiKey) {
    try {
      const resp = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(cleanQ)}&limit=16&rating=g`,
        { headers: { "Accept": "application/json" } }
      );
      if (resp.ok) {
        const json = await resp.json() as any;
        if (json?.data && Array.isArray(json.data)) {
          return json.data.map((item: any) => ({
            id: item.id,
            title: item.title || cleanQ,
            previewUrl: item.images?.fixed_height_small?.url || item.images?.downsized?.url || item.images?.original?.url,
            url: item.images?.downsized_medium?.url || item.images?.original?.url,
            width: Number(item.images?.original?.width) || 480,
            height: Number(item.images?.original?.height) || 360,
          }));
        }
      }
    } catch {
      // Fallback to trending
    }
  }

  // Return trending as friendly fallback
  return CURATED_GIFS.trending;
}
