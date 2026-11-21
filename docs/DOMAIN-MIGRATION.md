# Confort4 custom domain migration

The destination domain is pending confirmation. Do not change GitHub Pages or DNS
until the exact hostname and existing DNS zone have been reviewed. Hosting remains
GitHub Pages; GoDaddy manages the domain only. This is independent of KWEB.

## Prepared in code

- `content/deployment.json` is the single published site origin. Build derives
  canonicals, Open Graph URLs, JSON-LD, sitemap and robots from it.
- `CONFORT4_SITE_ORIGIN=https://example.com/ node scripts/build-pages.mjs --live`
  can preview a candidate configuration. Do not commit the resulting preview.
- Build generates exact CORS origins into both Edge function folders. The old
  GitHub origin remains allowed during transition. No wildcard or reflected origin.
- Media, fonts, navigation and property routes use relative paths; optimized photo
  assets move with the site. Historic photo allowlist URLs remain supported.
- CMS, inventory, media storage and form endpoints stay on the same Supabase project.
  Domain connection does not require copying data, rotating keys or changing passwords.

## Activation order

1. Confirm apex domain, preferred apex vs www, authoritative nameservers and existing
   A/AAAA/CNAME/MX/TXT/CAA records. Preserve a zone export for rollback.
2. Verify domain ownership in the GitHub account using its exact generated TXT record.
   Do not invent the verification token. Keep the TXT after verification.
3. Update deployment.json with the final HTTPS origin, run full checks and live build.
   Deploy `confort4-site` and `confort4-forms` with generated site-origins.mjs and all
   their relative dependencies, JWT verification true. Validate OPTIONS on both origins.
4. Coordinate cutover: set the custom domain in repository Settings > Pages **before**
   Alberto points DNS there. This repository uses Actions; a CNAME file is not required.
5. Alberto configures the four GitHub Pages apex A addresses and www CNAME listed in
   the delivered guide. Existing conflicting web records require review; keep email.
6. Publish final origin build. Verify GitHub DNS check, certificate and Enforce HTTPS.
   Review Supabase Auth Site URL and redirect whitelist for the new origin without
   removing origins used by KWEB/other applications in this shared project.
7. Verify apex/www redirect, every public route, property gallery, editor login,
   uploads and form OPTIONS. A real form submission requires a coordinated test.
   Check canonicals/sitemap/OG and submit sitemap in Google Search Console.
8. Open old shared property links and verify their redirect destination. Do not
   assume all legacy project-path links redirect correctly without testing them.

## Rollback

Restore the DNS zone's previous **web** records, previous Pages custom-domain
setting and deployment.json together. Rebuild/redeploy and verify original URLs.
Do not remove mail records or delete database content. Existing browser sessions
and saved local preferences are origin-scoped; users may need to log in again.

## Official references

- https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
- https://www.godaddy.com/help/add-an-a-record-19238
- https://www.godaddy.com/help/add-a-cname-record-19236
