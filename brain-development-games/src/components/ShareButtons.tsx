import React from 'react'

export type ShareProps = {
  gameId: string
  gameName: string
  level: number
  score?: number
}

export default function ShareButtons({ gameId, gameName, level, score }: ShareProps): JSX.Element {
  const url = `${location.origin}/brain-development-games/games/${gameId}?level=${level}`
  const text = `I scored ${score ?? 'a score'} on ${gameName} (Level ${level}) in The Mind Arcade! Try it:`

  const copyLink = (): void => {
    navigator.clipboard?.writeText(`${text} ${url}`)
      .then(() => alert('Link copied to clipboard'))
      .catch(() => alert('Could not copy link'))
  }

  const tweet = (): void => {
    const href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
    window.open(href, '_blank', 'noopener')
  }

  const nativeShare = async (): Promise<void> => {
    if ((navigator as any).share) {
      try {
        await (navigator as any).share({ title: gameName, text: text, url })
      } catch (e) {
        // user cancelled
      }
    } else {
      copyLink()
    }
  }

  return (
    <div className="mt-2 flex gap-2">
      <button onClick={nativeShare} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-lg text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">Share</button>
      <button onClick={tweet} className="px-3 py-1.5 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors">Tweet</button>
      <button onClick={copyLink} className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Copy link</button>
    </div>
  )
}
