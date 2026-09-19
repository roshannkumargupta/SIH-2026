export class SpeechQueue {
  private queue: string[] = [];
  private isPlaying = false;
  private currentAudio: HTMLAudioElement | null = null;
  private synthesizeCallback: (text: string) => Promise<string | null>;
  private language: string;
  private abortController: AbortController | null = null;
  public onFinish: (() => void) | null = null;

  constructor(synthesizeCallback: (text: string) => Promise<string | null>, language: string) {
    this.synthesizeCallback = synthesizeCallback;
    this.language = language;
  }

  // Split text into chunks based on sentence boundaries
  static chunkText(text: string): string[] {
    // Split by . ? ! and the Indic danda । ॥
    return text
      .split(/([.?!।॥]+)/)
      .reduce((result: string[], part: string, index: number, array: string[]) => {
        if (index % 2 === 0) {
          const sentence = part + (array[index + 1] || "");
          if (sentence.trim()) {
            result.push(sentence.trim());
          }
        }
        return result;
      }, []);
  }

  private async playNext(): Promise<boolean> {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      if (this.onFinish) this.onFinish();
      return true;
    }

    this.isPlaying = true;
    const nextChunk = this.queue.shift()!;
    this.abortController = new AbortController();

    const audioB64 = await this.synthesizeCallback(nextChunk);
    if (!audioB64 || this.abortController.signal.aborted) {
      // Audio synthesis was empty/unavailable for this chunk
      throw new Error(`Speech synthesis returned no audio for chunk: "${nextChunk.slice(0, 20)}..."`);
    }

    let audioSrc = audioB64;
    if (!audioSrc.startsWith("data:")) {
      audioSrc = `data:audio/wav;base64,${audioB64}`;
    }

    return new Promise<boolean>((resolve, reject) => {
      const audio = new Audio(audioSrc);
      this.currentAudio = audio;

      audio.onended = async () => {
        this.currentAudio = null;
        if (!this.abortController?.signal.aborted) {
          try {
            const nextOk = await this.playNext();
            resolve(nextOk);
          } catch (err) {
            reject(err);
          }
        } else {
          resolve(true);
        }
      };

      audio.onerror = (e) => {
        console.warn("[Voice] Audio element playback error:", e);
        this.currentAudio = null;
        reject(new Error("Audio element playback error"));
      };

      audio.play().catch((playErr) => {
        console.warn("[Voice] Audio play() promise rejected (likely browser autoplay policy):", playErr);
        this.currentAudio = null;
        reject(playErr);
      });
    });
  }

  async enqueueAndPlay(text: string): Promise<boolean> {
    this.queue = SpeechQueue.chunkText(text);
    if (this.queue.length === 0) {
      return true;
    }
    return await this.playNext();
  }

  stop() {
    this.queue = [];
    this.isPlaying = false;
    if (this.abortController) {
      this.abortController.abort();
    }
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {
        // ignore
      }
      this.currentAudio = null;
    }
    if (this.onFinish) this.onFinish();
  }
}
