# Google Maps reviews

The homepage displays the business's current Google Maps rating, rating count and up to five reviews after the project accordion. Visitors can choose a reviewer, use previous/next controls, expand long reviews, open the author's profile or read the individual review on Google Maps. Selection follows Google's relevance order; the site does not filter by star rating or rewrite review text.

## Configuration

Add these server environment variables locally and to the production host:

```dotenv
GOOGLE_PLACES_API_KEY=your-private-places-key
GOOGLE_PLACES_PLACE_ID=ChIJVynx6aM1DGcR5oq3-3labP8
```

The place ID was verified against the Google listing named **Reliant Renovations Inc**, in Roslyn Heights, whose website is `https://reliantrenovationsinc.com/`. The ID is public; the key is private. Never use a `NEXT_PUBLIC_` prefix for the key or commit `.env.local`.

Enable **Places API (New)** and billing in the key's Google Cloud project. Apply an API restriction for Places API (New) and an application restriction for the production server's outbound IP address. HTTP referrer restrictions are for browser keys and do not fit this server request. A host with changing outbound addresses needs an appropriate fixed-egress/proxy setup. Review the project's usage and request quotas when configuring billing; requesting reviews is a billable Places feature.

- [Places API setup](https://developers.google.com/maps/documentation/places/web-service/get-api-key)
- [Google API key security guidance](https://developers.google.com/maps/api-security-best-practices)
- [Places API billing](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing)

## Request and failure behavior

`lib/google-reviews.ts` is protected by `server-only`. It makes one Place Details (New) request for the configured ID with a limited field mask, `cache: "no-store"`, a three-second timeout and no redirects or retries. Neither credentials nor provider error bodies are sent to the browser or logged. The public component receives only normalized display data.

There is no database, filesystem, ISR or application cache for Google review content, and no background polling. Each homepage render can make a new billable request. Reviews are fetched alongside projects during server rendering, with the complete review list included in the initial HTML so it remains readable without JavaScript. Google's request is bounded by the three-second deadline. Missing credentials, invalid configuration, malformed data, timeouts and API errors omit the optional section; they do not prevent the homepage from rendering. A valid profile with no reviews links visitors to Google without invented testimonials.

The Places API returns a maximum of five reviews. Retrieving a complete review history requires a separate Google Business Profile integration and authorization.

## Attribution and privacy

The display includes the official **Google Maps** attribution, the supplied reviewer name, avatar and profile link, an individual source link for each review, any returned third-party attribution and an explanation of relevance ordering. Google-hosted avatars are loaded directly with no referrer; the CSP permits Google user-content image hosts. The original Google Maps SVGs are stored in `public/images/brand/google-maps-dark.svg` and `google-maps-light.svg`, without changes to their artwork.

The footer links to the site's Privacy and Terms pages, which describe the Google integration and incorporate Google's applicable terms and privacy policy. The integration does not add self-serving rating structured data to the site's organization markup.

- [Google Places policies and attribution](https://developers.google.com/maps/documentation/places/web-service/policies)
- [Official attribution artwork](https://developers.google.com/static/maps/documentation/images/Google_Maps_Attribution_Assets.zip)
- [Maps service-specific terms](https://cloud.google.com/maps-platform/terms/maps-service-terms)

## Verification

`npm test` includes mocked Google response tests for exact review wording, relevance order, low-star reviews, safe links, missing configuration, provider errors and request cancellation. These tests do not contact Google. The test command uses the `react-server` condition to exercise the real `server-only` module.

For a live check, run the site with the two variables configured and inspect the homepage below the projects. Verify both themes, narrow mobile widths, review selection, expanded text, reviewer attribution and Google source links. If the section is absent, confirm the configured place ID, Places API (New) enablement, billing and key restrictions in Google Cloud. Do not print or paste the key into browser diagnostics.
