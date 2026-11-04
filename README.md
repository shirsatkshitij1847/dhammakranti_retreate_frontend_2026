# Triratna Akola Retreat Frontend

React + Vite frontend for the Triratna Bauddha Mahasangh, Akola website.

## Run the frontend

```sh
npm install
npm run dev
```

The retreat registration and organization-management pages use the Retreat API. Configure URLs in `.env` (copy `.env.example` if missing):

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_BASE_PATH=/
VITE_FONTS_API_URL=https://fonts.googleapis.com
VITE_FONTS_STATIC_URL=https://fonts.gstatic.com
```

`VITE_API_BASE_URL` is the backend root URL, without `/api`. Endpoint paths remain in code. `VITE_APP_BASE_PATH` is the frontend deployment path (for example `/` or `/retreat/`); public images, video, and favicon follow this path. Font settings configure the external font hosts. Invalid or missing settings stop startup/build with an error.

Restart Vite after editing environment values and rebuild for deployment. `.env.local` and mode-specific files can override `.env`. Environment files are ignored by Git except `.env.example`. All `VITE_` values are public build-time settings: never put database URLs, passwords, JWT secrets, or tokens in them.

Start the API separately with `MONGO_URL`, `JWT_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` configured as described in `../../Backend/API.md`. The API project must allow requests from the frontend origin. The configured admin account is created at backend startup; do not put its credentials or signing secret in the frontend.

### Production

The production frontend origin is `https://dhammakranti.triratnaakolayouth.com`.
Set `VITE_API_BASE_URL=https://dhammakrantiretreat.triratnaakolayouth.com` and
rebuild the frontend. On the backend, set `PORT=7004`,
`FRONTEND_URL=https://dhammakranti.triratnaakolayouth.com`, and
`BACKEND_URL=https://dhammakrantiretreat.triratnaakolayouth.com`, then restart it.
The HTTPS reverse proxy must forward the backend domain to the API on port
`7004`. Do not append `:7004` to the public HTTPS URL; CORS allows the configured
frontend origin and handles JSON/Authorization preflight requests.
Set backend `CORS_ADDITIONAL_ORIGINS=http://localhost:5173,http://127.0.0.1:5173`
to also allow the local Vite frontend to use the production API. Keep Vite on port
`5173`, or explicitly add its different origin to that backend setting. CORS
permissions cannot be configured in the frontend.

## Retreat pages

Login-account signup automatically sends an approval-pending email after saving
the account. Organizer approval automatically attempts the organizer welcome.
Mail failure does not undo signup or approval. Participant registration only
saves the record; it never sends email automatically.
Organizers/admins can explicitly send a participant confirmation after registration
or from the participant list using `POST /api/users/:registrationId/email`.
Admins can send account welcome emails from account management using
`POST /api/accounts/:accountId/email`. Missing participant emails disable the action.
Pending requests block duplicate clicks; requests are never automatically retried.
Successful email notifications dismiss after six seconds across login, signup,
approval, and individual sending. Bulk email results appear in a dismissible
top-right popup after sending finishes; success and failure results disappear
after eight seconds. Other email warnings remain visible for review.
The participant list also offers Send email to all in this list, with confirmation.
It sends one request per eligible registration in the current retreat/filter,
shows individual outcomes, and skips missing email/retreat records. Sending is
sequential to avoid overwhelming SMTP; previously emailed registrations may receive
another message. Keep the page open until sending finishes. Access, rate-limit,
disabled-service, or network failures stop the batch; inspect results before retrying.

The backend attempts an admin welcome on the first successful admin login and an
organizer welcome when approving/changing the role to organizer. These attempts
are once per role, including SMTP failures; `already_attempted` does not mean
delivered and cannot be retried. Visitor account emails are repeatable.
`sent` means SMTP accepted the message, not guaranteed inbox delivery.
`disabled` and `failed` show separate warnings without undoing successful saves,
approval, or login. Configure mail credentials only on the backend.
Do not resubmit saved details because email failed. Run
`node --test src/emailNotification.test.js` to test these statuses.

For local development, the ignored `.env.development.local` sets
`VITE_API_BASE_URL=http://localhost:7004` to use the current local backend.
Restart Vite after changing it. Production builds continue using `.env`.
The backend must allow the actual Vite origin in its CORS configuration.

Admins can create or edit retreat dates and venue in Retreat Setup. New participant confirmations use those saved details and a separate warm welcome message in the same dark Buddhist design. Existing retreats without details show "To be confirmed by the organizer" in email; editing a retreat does not resend past emails.
Retreat creation, updates, and deletion refresh the dashboard totals automatically.
Pending retreat mutations block duplicate submissions.

Timetable and retreat participant PDFs share a green/gold branded layout with logo, entry totals, generation date, and page numbers. Authorized organizers/admins can download the participant register from the participant list; exports include contact, center/payment, address, role, and retreat details and are marked confidential. Keep downloaded participant files private.
PDFs use compact 14px single-line table text, 12px summary/footer text, and 22px headings with a smaller logo.
Landscape A4 exports use more of the page width (4mm outer inset), with twelve
participant records or four timetable entries per page for comfortable reading.

The top-right profile button shows the signed-in user's initial. Hover, keyboard focus, or tap reveals account details and Logout; signed-out visitors see a Login / Sign up link.

Organization/admin, registration, participant, and activity/timetable pages use the stupa image with a dark overlay behind their existing cards for readability.

- `#registration` loads retreats and accepts participant registrations.
- `#organization` provides login/sign-up, an admin approval queue, retreat management, and account controls.
- Admin profile, retreat setup, account management, and pending approvals are
  collapsible. Dashboard shortcuts expand the relevant section automatically.
  Admin panels use translucent teal-blue surfaces and gold primary buttons.
- `#people` displays registrations for organizers and admins; only admins can delete registrations.
- The participant list has a retreat dropdown, including All retreats and an unavailable-retreat option when needed. Counts and PDF downloads reflect the selected retreat, including retreats with no registrations.

Login sessions use `sessionStorage` and the API's one-hour bearer token. The frontend fetches the signed-in account profile from `GET /api/auth/me` and displays its name, email, account ID, and role. Public signup always creates a `visitor`; visitors see “Waiting for admin approval” and are asked to log in again later after their request is approved. Admins can review pending visitors and promote them to `organizer` in the organization dashboard. Organizers and admins can list retreats, register participants, and view registrations. Only admins can create/delete retreats, delete registrations, manage account roles, or reset passwords. The backend enforces these permissions; hiding a page or menu in the frontend is not an access-control boundary.

## Other pages

Home-page retreat reminders appear one at a time as top-left message-style popups on mobile
and desktop. Each appears for four seconds and returns every 30 seconds while
the home page is open. The close button dismisses the current popup. These are
in-page announcements, not OS push notifications; public retreat data still
refreshes every minute.
Only the retreat message card is shown, without a separate heading panel.
Mobile reminders are at most 260px wide and 60px tall; desktop cards are 340px wide and 70px tall.
The left-side placement keeps reminders away from the right-side Buddha artwork.
The popup fades in/out and the Buddha
artwork gently appears on entry; reduced-motion preferences disable these effects.

On each fresh launch/reload from November 3 through November 7, 2026 (India time), the retreat banner appears for 10 seconds before the app opens. Visitors can choose “Continue to app” to skip it. The campaign automatically expires at midnight on November 8; internal navigation does not replay it.

- `#blogs` is the public News & Stories page, visible in the header and readable without login, with pagination. Signed-in organizers/admins can publish a title, formatted text, and one JPEG/PNG/WebP image up to 5 MB. The visual editor supports bold, italic, H2/H3 headings, lists, quotes, paragraph spacing, and undo/redo. Formatting counts towards the 20,000-character limit. Backend and client sanitize HTML; existing plain-text posts remain literal text until edited in the visual editor. Deploy the updated backend before publishing formatted posts. Organizers can edit/delete their own posts; admins can manage all posts. Blog APIs require working backend/MongoDB connectivity; errors are displayed with a retry option.
- Guests and visitors see only story previews (title, image, and text), without upload forms or publishing prompts. “View more” opens the full story; “Back to all stories” returns to the list.
- News & Stories uses translucent reading panels over a darkened stupa background. Expanded stories add a journal-style headline, reading time, publication date when available, and a reduced-motion-aware entrance effect without changing the author's text.
- News & Stories has a compact heading and responsive image-led cards with proportional images and three-line previews: multiple columns on desktop and a single column on mobile, with full-width expanded reading.
- Mobile story cards use a compact 140px image first, two-line titles/previews, and compact metadata; expanded stories retain their full text and larger artwork.
- For older API responses without `textFormat`, complete paragraph/heading/list/quote
  HTML is recognized and sanitized for previews, reading, and editing. Explicit
  `textFormat=plain` always stays literal text, including examples containing tags.

- `#top` is the home page, with a static forest/stupa background, continuously downward-scrolling frameless photos from `photos/` with blurred/fading edges, and stationary standing Buddha artwork with a golden halo. Hover or focus the photo stream to pause; reduced-motion preferences disable its animation.
- Home also has a public Upcoming Retreats mailbox: admin-created dated retreats
  appear as simple cream-and-gold cards on the far-right side, opposite
  the gallery. Cards enter from the top and move downward; on narrow screens
  the compact card list sits at the upper right above the gallery.
  that are future or ongoing (India time) slide downward every 5 seconds. Hover,
  focus, or Pause stops automatic rotation; Next advances manually. Reduced
  motion disables automatic rotation. One retreat is stationary, while an empty
  list and API failures show explicit messages with Retry. Public details come
  from `/api/retreats/upcoming`, refreshed every minute and on opening Home.
  Deploy the updated backend to enable this endpoint. Undated/ended retreats,
  participant records, and account data are not included.
  Empty lists show "No upcoming retreats"; API failures show "Retreats unavailable"
  with Retry, without technical details. Diagnostics are logged to the console.
- Home fits the screen without page scrolling: the photos fill the available vertical space and the Buddha stays anchored at the bottom, including in landscape orientation.
- Top/bottom arrow buttons pause automatic motion and select the previous/next photo, wrapping around the collection. The Play button resumes automatic scrolling.
- `#about` and its chapter links show the Marathi About article with its video background; Home has no video.
- On mobile, Home shows the standing Buddha above the photo stream, and About shows its video above the article. Desktop keeps the side-by-side Home layout and About video background.
- `#tasks` is the login-protected timetable creator; timetable entries remain stored in this browser.
- Timetable activities require a date and start time; end time is optional in creation and editing. A supplied end time must be after the start time. Empty end times remain empty in storage and show a dash in the table and PDF.

Run `npm run lint` and `npm run build` to validate the frontend.
