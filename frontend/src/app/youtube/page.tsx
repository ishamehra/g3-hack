import { redirect } from "next/navigation";

// Placeholder — replace with actual YouTube URL once available
const YOUTUBE_URL = "https://www.youtube.com/watch?v=PLACEHOLDER";

export default function YouTubeRedirect() {
  redirect(YOUTUBE_URL);
}
