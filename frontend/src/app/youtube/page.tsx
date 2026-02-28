import { redirect } from "next/navigation";

// Placeholder — replace with actual YouTube URL once available
const YOUTUBE_URL = "https://youtu.be/3CcWoG0Nzc4";

export default function YouTubeRedirect() {
  redirect(YOUTUBE_URL);
}
