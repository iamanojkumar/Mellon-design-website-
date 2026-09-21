/**
 * Site-wide <head> tags — the one place to add, change or remove them.
 * Rendered once from app/[locale]/layout.tsx, so they apply to every page in
 * every locale. Add new tags to the list below; keep IDs in the config block.
 */

// ---- Config ---------------------------------------------------------------
const GOOGLE_TAG_MANAGER_ID = "GTM-WXV7X6DT";

// ---- Tags -----------------------------------------------------------------
function GoogleTagManager({ id }: { id: string }) {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${id}');`,
      }}
    />
  );
}

export function SiteHeadTags() {
  return (
    <>
      <GoogleTagManager id={GOOGLE_TAG_MANAGER_ID} />
    </>
  );
}

/** Tags that must sit at the very top of <body> (e.g. GTM's noscript fallback). */
export function SiteBodyStartTags() {
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GOOGLE_TAG_MANAGER_ID}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
      />
    </noscript>
  );
}
