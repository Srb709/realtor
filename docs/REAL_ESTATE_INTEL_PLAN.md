# Steven Brooks Real Estate Intel — V1

## Goal
Build a local real-estate publishing + nurture engine that turns useful, county-specific market intelligence into organic search traffic and relevant follow-up for existing Follow Up Boss contacts.

## V1 markets
- Philadelphia County
- Montgomery County
- Bucks County
- Delaware County
- Chester County

## Core loop
1. Research real market changes and useful local topics.
2. Publish a full, source-backed article on the website.
3. Classify each article by county, municipality/neighborhood, audience (buyer/seller/investor), price band, and topic.
4. Read FUB contact data server-side.
5. Match contacts to the most relevant article/update.
6. Prepare county/audience-specific email copy.
7. Require Steven approval before sending/publishing automated outreach in V1.
8. Track website visits, replies, leads, and closings attributable to content.

## Content standard
No generic filler. Every market article should contain at least one concrete local fact, data point, comparison, rule/change, or current market observation. Claims that can change must be sourced. Avoid pretending AI estimates are MLS facts.

## FUB integration
Use FUB_API_KEY only in server-side environment variables. Never commit the real key to GitHub or expose it in NEXT_PUBLIC variables.

Initial sync should be read-only. Do not send email, modify contacts, add tags, or trigger automations until the contact-matching logic has been reviewed.

Useful contact dimensions where available:
- stage
- tags
- source
- assigned agent
- buyer/seller intent
- locations/ZIPs/counties inferred from saved/search activity or notes only when reliable
- price range
- last contact/activity

## Safety / quality
- Unsubscribed/do-not-contact records must never receive marketing email.
- Do not infer a county when contact data is ambiguous; place contact in an `unclassified` review queue.
- Keep a human approval step for generated market content and outbound campaigns initially.
- Log why a contact matched a campaign.

## Architecture
Next.js app on Vercel, GitHub source control. Keep the public content site static/server-rendered where possible for SEO. FUB and future AI credentials are server-side secrets.

## Next milestone
Once FUB_API_KEY is stored securely in Vercel, run a read-only sync against a small sample of contacts and report what fields are actually available before designing the final segmentation rules.
