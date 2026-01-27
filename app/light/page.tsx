import { getYouTubeChannel, getYouTubeVideos } from "@/lib/youtube";
import { LightContent } from "./light-content";

export default async function LightPage() {
  const [channel, videos] = await Promise.all([
    getYouTubeChannel(),
    getYouTubeVideos(),
  ]);

  return <LightContent channel={channel} videos={videos} />;
}
