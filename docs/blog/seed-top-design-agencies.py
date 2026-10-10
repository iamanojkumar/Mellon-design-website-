import json, urllib.request, re, sys
env = dict(l.strip().split("=",1) for l in open(".env.local", encoding="utf-8") if "=" in l and not l.startswith("#"))
url, key = env["SUPABASE_URL"].strip('"'), env["SUPABASE_SERVICE_ROLE_KEY"].strip('"')
body = {
 "locale": "en-IN",
 "slug": "top-design-agencies-in-india",
 "title": "Top design agencies in India",
 "summary": "How to shortlist a design agency in India: the three kinds of studio, what each charges in 2026, and the five questions to ask before you sign.",
 "content": open("docs/blog/top-design-agencies-in-india.html", encoding="utf-8").read(),
 "status": "draft",
 "meta_title": "Top design agencies in India: costs and how to choose — Mellon",
 "meta_description": "Compare design agencies in India by type and price. Hourly rates, project costs in rupees, and five questions to ask before you hire.",
 "focus_keyword": "top design agencies in india",
}
req = urllib.request.Request(f"{url}/rest/v1/blog_posts", data=json.dumps(body).encode(), method="POST",
  headers={"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json", "Prefer": "return=minimal"})
try:
    print(urllib.request.urlopen(req).status)
except urllib.error.HTTPError as e:
    print(e.code, e.read().decode()[:300])
