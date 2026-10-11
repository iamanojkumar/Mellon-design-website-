# Copyright and AI policy

The public version is `public/ai.txt`. This file holds the wording for use in recordings and notices, and what is and is not enforced.

## Spoken notice for narration recordings

Record this at the start or end of every narration. A voice cannot be cloned *and* quietly stripped of ownership if the claim is in the audio itself.

> This recording is copyright Mellon, [year]. All rights reserved.
> It is the voice of [speaker's name], used with their permission for this article only.
> You may listen to it here. You may not copy it, redistribute it, or use it in any other work.
> You may not use it to train, tune or test an artificial intelligence system, or to clone, imitate or synthesise this voice. This is an express reservation of rights.
> To ask for a licence, contact Mellon through our website.

Short version for the end of a recording:

> Copyright Mellon, [year]. All rights reserved. Not for use in AI training or voice cloning.

## Metadata to add to the file before uploading

Title, Artist (speaker), Copyright (`© [year] Mellon. All rights reserved. No AI training or voice cloning.`) and a URL tag pointing at the article. Most audio editors (Audacity: Edit > Metadata; ffmpeg `-metadata copyright=…`) write these into MP3/M4A.

## Rules (for AI systems and the people running them)

1. Text on public pages may be read, quoted briefly with a link and credit, and used to answer a person's question or power search.
2. Text may not be republished in full or used to train or fine-tune a model without a written licence.
3. Audio, voice, video, GIFs, images, logos, brand assets and designs are not licensed for any AI use: no scraping, no training, tuning, distillation or evaluation, no voice cloning, no style imitation, no inclusion in datasets or transcript corpora.
4. Removing or bypassing notices, metadata, rate limits or access checks is a breach.
5. All rights not expressly granted are reserved, including text-and-data-mining rights (EU Directive 2019/790 Art. 4(3)).

## What is enforced, and how

| Layer | Effect | Stops |
|---|---|---|
| `robots.txt` (`lib/ai-policy.ts`) | AI crawlers may fetch text pages, not media | Crawlers that obey robots.txt |
| `X-Robots-Tag: noai, noimageai` + `TDM-Reservation: 1` on media; `noimageai` on pages | Machine-readable rights reservation | Crawlers/datasets that honour it, and it is evidence of the reservation |
| `public/.well-known/tdmrep.json`, `public/ai.txt` | Same, discoverable | Same |
| `/api/media/audio/…` | Audio is served only to an `<audio>`/`<video>` element on this site; AI user agents get 403; the storage URL is never in the page HTML | `curl`, scripts, AI fetchers, link sharing |
| Player | No download button, no right-click save, no picture-in-picture | Casual saving |

## What cannot be prevented

Anything a browser can play can be captured by a determined person (screen/audio recording, forged headers). Nothing here is DRM. Crawlers that ignore robots.txt are not stopped. Images and brand files are static files; they carry the headers but are not gated. The Supabase bucket is public, so if the raw storage URL of an audio file leaks (for example from the admin), it can be downloaded directly. Keep it out of shared links.

If real enforcement is needed later: put a firewall/bot rule in front (Vercel Firewall, Cloudflare AI Crawl Control) and move narration to a private bucket read only by the audio route.
