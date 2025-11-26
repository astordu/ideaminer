import { NextResponse } from 'next/server';
import { ProxyAgent, setGlobalDispatcher } from 'undici';

// Define interfaces for Reddit data
interface RedditPostData {
  id: string;
  title: string;
  author: string;
  ups: number;
  num_comments: number;
  permalink: string;
  subreddit: string;
  selftext: string;
  created_utc: number;
  body?: string; // For comments
}

interface RedditChild {
  data: RedditPostData;
}

interface RedditResponse {
  data: {
    children: RedditChild[];
  };
}

// Configure proxy agent if needed
// We prioritize env vars, but fallback to the known working proxy from logs (http://127.0.0.1:7890)
// to ensure it works out of the box for this user environment.
const PROXY_URL = process.env.https_proxy || process.env.HTTPS_PROXY || 'http://127.0.0.1:7890';

// Only set global dispatcher if we have a proxy and we are in a Node environment
if (PROXY_URL && typeof global.process !== 'undefined') {
  try {
    const dispatcher = new ProxyAgent(PROXY_URL);
    setGlobalDispatcher(dispatcher);
    console.log(`Using proxy: ${PROXY_URL}`);
  } catch (e) {
    console.error('Failed to set proxy agent:', e);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('q') || 'I hate';
  const minUps = parseInt(searchParams.get('min_ups') || '5');
  const limit = parseInt(searchParams.get('limit') || '10');

  try {
    console.log(`Searching Reddit for: ${keyword} with proxy: ${PROXY_URL}`);
    
    // Step 1: Search Reddit
    // https://www.reddit.com/search.json?q="I hate"&t=day&limit=50
    const searchUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(keyword)}&t=day&limit=50&sort=relevance`;
    
    // Note: In Next.js, standard 'fetch' might not use the global dispatcher automatically if it's heavily patched.
    // But usually setting GlobalDispatcher works for undici-based fetches.
    // We pass 'cache: no-store' to ensure fresh data and avoid some Next.js caching weirdness with proxies.
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'MyIdeaMiner/1.0 (by /u/your_username)'
      },
      cache: 'no-store'
    });

    if (!searchResponse.ok) {
      console.error('Reddit Search API error:', searchResponse.status, searchResponse.statusText);
      const text = await searchResponse.text();
      console.error('Error body:', text);
      throw new Error(`Reddit API error: ${searchResponse.status}`);
    }

    const searchData: RedditResponse = await searchResponse.json();
    
    if (!searchData.data || !searchData.data.children) {
       console.error('Unexpected Reddit API response format:', JSON.stringify(searchData).substring(0, 200));
       return NextResponse.json([]);
    }

    const posts = searchData.data.children;

    // Filter posts
    const filteredPosts = posts
      .filter((item: RedditChild) => {
        const data = item.data;
        // Filter by ups and ensure text content exists and is valid
        return data.ups >= minUps && 
               (data.selftext && data.selftext !== '[removed]' && data.selftext !== '[deleted]'); 
      })
      .slice(0, limit);

    // Step 2: Fetch Comments for each post
    const resultsWithComments = await Promise.all(filteredPosts.map(async (item: RedditChild) => {
      const postData = item.data;
      const permalink = postData.permalink;
      
      try {
        const detailsUrl = `https://www.reddit.com${permalink}.json`;
        const detailsResponse = await fetch(detailsUrl, {
          headers: {
            'User-Agent': 'MyIdeaMiner/1.0'
          },
          cache: 'no-store'
        });

        if (!detailsResponse.ok) {
          return {
            ...formatPostData(postData),
            comments_summary: "Could not fetch comments."
          };
        }

        const detailsData = await detailsResponse.json();
        const commentsData: RedditResponse = detailsData[1];
        
        if (!commentsData || !commentsData.data || !commentsData.data.children) {
            return {
                ...formatPostData(postData),
                comments_summary: "No comments found or invalid format."
            };
        }

        const comments = commentsData.data.children;

        const topComments = comments
          .slice(0, 10)
          .map((c: RedditChild) => c.data.body)
          .filter((body: string | undefined) => body && body !== '[deleted]' && body !== '[removed]')
          .join('\n---\n');

        return {
          ...formatPostData(postData),
          comments_summary: topComments || "No comments found."
        };

      } catch (error) {
        console.error(`Error fetching comments for ${permalink}:`, error);
        return {
          ...formatPostData(postData),
          comments_summary: "Error fetching comments."
        };
      }
    }));

    return NextResponse.json(resultsWithComments);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Search route error:', error);
    // Return a proper JSON error response that the frontend can display or handle
    return NextResponse.json(
      { error: errorMessage || 'Failed to fetch data from Reddit' },
      { status: 500 }
    );
  }
}

function formatPostData(data: RedditPostData) {
  return {
    id: data.id,
    title: data.title,
    author: data.author,
    ups: data.ups,
    num_comments: data.num_comments,
    permalink: data.permalink,
    subreddit: data.subreddit,
    selftext: data.selftext,
    created_utc: data.created_utc
  };
}
