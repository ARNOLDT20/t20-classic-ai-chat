import { Bot, User, Download, Play, Pause, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { useState, useRef } from "react";

export interface SongResult {
  id: string;
  title: string;
  artist: string;
  duration: number;
  thumbnail: string;
}

interface ChatMessageProps {
  content: string;
  isUser: boolean;
  isError?: boolean;
  images?: string[];
  audioUrl?: string;
  audioTitle?: string;
  songResults?: SongResult[];
  onDownloadAd?: () => void;
  onPlaySong?: (song: SongResult) => void;
}

const handleDownload = async (url: string, index: number) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `t20-classic-image-${Date.now()}-${index}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(url, "_blank");
  }
};

const handleAudioDownload = async (audioUrl: string, title?: string) => {
  try {
    const response = await fetch(audioUrl);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `${title || "t20-classic-music"}-${Date.now()}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch {
    // For data URIs, download directly
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = `${title || "t20-classic-music"}-${Date.now()}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
};

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export const ChatMessage = ({
  content, isUser, isError = false, images, audioUrl, audioTitle,
  songResults, onDownloadAd, onPlaySong
}: ChatMessageProps) => {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current && audioUrl) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setPlaying(false);
    }
    if (audioRef.current) {
      if (playing) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setPlaying(!playing);
    }
  };

  return (
    <div className={cn("max-w-[80%] animate-fade-in group", isUser ? "self-end" : "self-start")}>
      <div className="flex items-start gap-3">
        {!isUser && (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 mt-1 shadow-md shadow-primary/15">
            <Bot className="w-4 h-4 text-primary-foreground" />
          </div>
        )}
        <div
          className={cn(
            "rounded-2xl px-5 py-4 shadow-sm transition-all duration-200",
            isUser
              ? "bg-gradient-to-br from-primary to-[hsl(190,90%,35%)] text-primary-foreground rounded-br-md glow-sm"
              : isError
              ? "bg-destructive/10 text-destructive border border-destructive/20 rounded-bl-md"
              : "glass-effect rounded-bl-md"
          )}
        >
          {!isUser && !isError && (
            <span className="text-[9px] font-bold text-primary/80 uppercase tracking-[0.2em] mb-1.5 block">
              T20-CLASSIC AI
            </span>
          )}
          {isUser && (
            <span className="text-[9px] font-bold text-primary-foreground/60 uppercase tracking-[0.2em] mb-1.5 block">
              You
            </span>
          )}

          {images && images.length > 0 && (
            <div className="mb-3 space-y-2">
              {images.map((src, i) => (
                <div key={i} className="relative group/img overflow-hidden rounded-xl">
                  <img src={src} alt="AI generated image" className="rounded-xl max-w-full w-full shadow-lg border border-border/10" loading="lazy" />
                  <button
                    onClick={() => { onDownloadAd?.(); handleDownload(src, i); }}
                    className="absolute top-2 right-2 p-2 rounded-lg bg-background/70 backdrop-blur-sm border border-border/30 opacity-0 group-hover/img:opacity-100 transition-all duration-200 hover:bg-primary hover:text-primary-foreground hover:border-primary/50"
                    aria-label="Download image"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Audio player for generated/streamed music */}
          {audioUrl && (
            <div className="mb-3 flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/20">
              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 hover:opacity-90 transition-all shadow-md shadow-primary/20"
                aria-label={playing ? "Pause" : "Play"}
              >
                {playing ? <Pause className="w-4 h-4 text-primary-foreground" /> : <Play className="w-4 h-4 text-primary-foreground ml-0.5" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-foreground/80 truncate">{audioTitle ? `🎵 ${audioTitle}` : "🎵 Generated Music"}</div>
                <div className="text-[10px] text-muted-foreground">Tap play to listen</div>
              </div>
              <button
                onClick={() => { onDownloadAd?.(); handleAudioDownload(audioUrl, audioTitle); }}
                className="p-2 rounded-lg bg-background/50 border border-border/30 hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                aria-label="Download music"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Song search results */}
          {songResults && songResults.length > 0 && (
            <div className="mb-3 space-y-1.5">
              {songResults.map((song) => (
                <div
                  key={song.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/20 border border-border/15 hover:bg-secondary/40 transition-all group/song cursor-pointer"
                  onClick={() => onPlaySong?.(song)}
                >
                  {song.thumbnail && (
                    <img src={song.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-foreground/90 truncate">{song.title}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{song.artist} • {formatDuration(song.duration)}</div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); onPlaySong?.(song); }}
                      className="p-1.5 rounded-lg bg-primary/20 hover:bg-primary text-primary hover:text-primary-foreground transition-all"
                      aria-label="Play & download"
                    >
                      <Play className="w-3.5 h-3.5 ml-0.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {content && (
            <div className={cn("text-sm leading-relaxed prose prose-sm max-w-none", isUser ? "prose-invert" : "prose-invert")}>
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          )}
        </div>
        {isUser && (
          <div className="w-8 h-8 rounded-xl bg-secondary/80 flex items-center justify-center flex-shrink-0 mt-1 border border-border/30">
            <User className="w-4 h-4 text-foreground/70" />
          </div>
        )}
      </div>
    </div>
  );
};
