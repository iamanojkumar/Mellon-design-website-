-- Audio narration for blog posts, plus the file types the editor now accepts:
-- audio (narration or inline clips) and WebVTT caption files for videos.
--
-- Keep allowed_mime_types in sync with ALLOWED_EXTENSIONS in
-- lib/upload-project-media.ts. The 50MB ceiling is unchanged; a spoken-word MP3
-- is roughly 1MB a minute, so it covers very long narrations.
alter table public.blog_posts
  add column narration_url text;

update storage.buckets
set
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
    'video/quicktime',
    'audio/mpeg',
    'audio/mp4',
    'audio/aac',
    'audio/wav',
    'audio/ogg',
    'audio/webm',
    'text/vtt'
  ]
where id = 'project-media';
