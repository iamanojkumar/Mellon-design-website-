-- Enforce the admin editor's media limits on the bucket itself.
--
-- Uploads used to be proxied through a Server Action, so lib/upload-project-media.ts
-- could inspect every byte before forwarding it. That capped uploads at Vercel's
-- 4.5MB function body limit, so the browser now PUTs files straight to Storage
-- using a short-lived signed URL. A client holding that URL can send whatever it
-- likes, so the 50MB cap and the format allowlist have to live here as well —
-- the checks in TypeScript now only exist to fail fast with a readable message.
--
-- 50MB is the ceiling for video, which is the largest thing the editor accepts.
-- Images are held to 25MB in lib/upload-project-media.ts before a URL is signed,
-- since they also have to fit in memory for the sharp AVIF re-encode. One bucket
-- serves both, so the bucket carries the looser of the two limits.
--
-- image/avif must stay allowed: it is the format every uploaded raster image is
-- re-encoded to. Keep allowed_mime_types in sync with ALLOWED_EXTENSIONS in
-- lib/upload-project-media.ts.
update storage.buckets
set
  file_size_limit = 52428800, -- 50MB
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/avif',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime'
  ]
where id = 'project-media';
