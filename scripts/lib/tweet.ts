// Adapter for Twitter's unofficial syndication API (the endpoint react-tweet uses).
// Isolated here so it can be swapped for FxTwitter (api.fxtwitter.com) if it breaks.

export interface SyndicationMedia {
  type: "photo" | "video" | "animated_gif";
  media_url_https: string;
  video_info?: {
    variants: Array<{ url: string; content_type: string; bitrate?: number }>;
  };
}

export interface SyndicationTweet {
  __typename?: string;
  text?: string;
  favorite_count?: number;
  user?: { screen_name: string; name: string };
  mediaDetails?: SyndicationMedia[];
}

// Token derivation used by vercel/react-tweet.
function syndicationToken(id: string): string {
  return ((Number(id) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, "");
}

export async function fetchTweet(id: string): Promise<SyndicationTweet | null> {
  const url = `https://cdn.syndication.twimg.com/tweet-result?id=${id}&token=${syndicationToken(id)}&lang=en`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; cafeblr-validator)" },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`syndication API returned ${res.status} for tweet ${id}`);
  const json = (await res.json()) as SyndicationTweet;
  if (!json || json.__typename === "TweetTombstone") return null;
  return json;
}
