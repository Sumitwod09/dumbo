import { Howl } from "howler";

export interface HowlHandlers {
  onEnd?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onLoadError?: (id: number, err: unknown) => void;
}

export function createTrackHowl(streamUrl: string, handlers: HowlHandlers = {}): Howl {
  return new Howl({
    src: [streamUrl],
    html5: true, // progressive HTML5 audio streaming, crucial for mobile WebViews
    format: ["mp3", "aac", "wav"],
    autoplay: false,
    volume: 0.8,
    onend: () => handlers.onEnd && handlers.onEnd(),
    onplay: () => handlers.onPlay && handlers.onPlay(),
    onpause: () => handlers.onPause && handlers.onPause(),
    onstop: () => handlers.onStop && handlers.onStop(),
    onloaderror: (id, err) => handlers.onLoadError && handlers.onLoadError(id, err),
  });
}
