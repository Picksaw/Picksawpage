export interface Post {
  id: string;
  type: "video" | "image" | "music";
  title: string;
  description: string;
  tags: string[];
  likes: number;
  timestamp: string;
  color: string;
  icon: string;
  mediaUrl?: string;
}

export const typeIcons: Record<Post["type"], string> = {
  video:
    "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  image:
    "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
  music:
    "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3",
};

export const typeColors: Record<Post["type"], string> = {
  video: "from-sky-500/30 via-cyan-400/15 to-transparent",
  image: "from-violet-500/30 via-purple-400/15 to-transparent",
  music: "from-emerald-500/30 via-teal-400/15 to-transparent",
};

export const typeLabels: Record<Post["type"], string> = {
  video: "Video",
  image: "Photo",
  music: "Audio",
};

export function detectType(file: File): Post["type"] {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const mime = file.type;

  if (mime.startsWith("video/") || ["mp4", "webm", "mov", "avi", "mkv", "ogg"].includes(ext)) {
    return "video";
  }
  if (mime.startsWith("audio/") || ["mp3", "wav", "ogg", "flac", "aac", "m4a", "wma"].includes(ext)) {
    return "music";
  }
  return "image";
}

export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
