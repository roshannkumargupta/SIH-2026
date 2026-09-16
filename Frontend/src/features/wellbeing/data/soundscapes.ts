export interface SoundscapeTrack {
  id: string;
  titleKey: string;
  descriptionKey: string;
  src: string;
  loop: boolean;
  theme: "river" | "flute" | "rain" | "bells";
}

export const SOUNDSCAPES: SoundscapeTrack[] = [
  {
    id: "brahmaputra_river",
    titleKey: "dashboard:soundscapeBrahmaputraTitle",
    descriptionKey: "dashboard:soundscapeBrahmaputraDesc",
    src: "/audio/soundscapes/brahmaputra_river.mp3",
    loop: true,
    theme: "river",
  },
  {
    id: "bamboo_flute",
    titleKey: "dashboard:soundscapeFluteTitle",
    descriptionKey: "dashboard:soundscapeFluteDesc",
    src: "/audio/soundscapes/bamboo_flute.mp3",
    loop: true,
    theme: "flute",
  },
  {
    id: "mountain_rain",
    titleKey: "dashboard:soundscapeRainTitle",
    descriptionKey: "dashboard:soundscapeRainDesc",
    src: "/audio/soundscapes/mountain_rain.mp3",
    loop: true,
    theme: "rain",
  },
  {
    id: "temple_bells",
    titleKey: "dashboard:soundscapeBellsTitle",
    descriptionKey: "dashboard:soundscapeBellsDesc",
    src: "/audio/soundscapes/temple_bells.mp3",
    loop: true,
    theme: "bells",
  },
];
