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

## Retreat pages

Welcome/registration emails are sent by the backend after signup, the admin's first login, and retreat registration when an email is supplied. Configure backend SMTP settings as documented in its API reference; never expose mail credentials through frontend environment variables. The former frontend `sendmail.js` sample (which sent a hard-coded OTP on execution) is replaced by the backend mail integration. Email failures are shown without undoing successful registration/login.

Admins can create or edit retreat dates and venue in Retreat Setup. New participant confirmations use those saved details and a separate warm welcome message in the same dark Buddhist design. Existing retreats without details show "To be confirmed by the organizer" in email; editing a retreat does not resend past emails.

Timetable and retreat participant PDFs share a green/gold branded layout with logo, entry totals, generation date, and page numbers. Authorized organizers/admins can download the participant register from the participant list; exports include contact, center/payment, address, role, and retreat details and are marked confidential. Keep downloaded participant files private.

The top-right profile button shows the signed-in user's initial. Hover, keyboard focus, or tap reveals account details and Logout; signed-out visitors see a Login / Sign up link.

Organization/admin, registration, participant, and activity/timetable pages use the stupa image with a dark overlay behind their existing cards for readability.

- `#registration` loads retreats and accepts participant registrations.
- `#organization` provides login/sign-up, an admin approval queue, retreat management, and account controls.
- `#people` displays registrations for organizers and admins; only admins can delete registrations.
- The participant list has a retreat dropdown, including All retreats and an unavailable-retreat option when needed. Counts and PDF downloads reflect the selected retreat, including retreats with no registrations.

Login sessions use `sessionStorage` and the API's one-hour bearer token. The frontend fetches the signed-in account profile from `GET /api/profile` and displays its name, email, account ID, and role. Public signup always creates a `visitor`; visitors see “Waiting for admin approval” and are asked to log in again later after their request is approved. Admins can review pending visitors and promote them to `organizer` in the organization dashboard. Organizers and admins can list retreats, register participants, and view registrations. Only admins can create/delete retreats, delete registrations, manage account roles, or reset passwords. The backend enforces these permissions; hiding a page or menu in the frontend is not an access-control boundary.

## Other pages

On each fresh launch/reload from November 3 through November 7, 2026 (India time), the retreat banner appears for 10 seconds before the app opens. Visitors can choose “Continue to app” to skip it. The campaign automatically expires at midnight on November 8; internal navigation does not replay it.

- `#blogs` is the public News & Stories page, visible in the header and readable without login, with pagination. Signed-in organizers/admins can publish a title, plain text, and one JPEG/PNG/WebP image up to 5 MB. Organizers can edit/delete their own posts; admins can manage all posts. Blog APIs require working backend/MongoDB connectivity; errors are displayed with a retry option.
- Guests and visitors see only story previews (title, image, and text), without upload forms or publishing prompts. “View more” opens the full story; “Back to all stories” returns to the list.
- News & Stories uses translucent reading panels over a darkened stupa background. Expanded stories add a journal-style headline, reading time, publication date when available, and a reduced-motion-aware entrance effect without changing the author's text.
- News & Stories has a compact heading and responsive image-led cards with proportional images and three-line previews: multiple columns on desktop and a single column on mobile, with full-width expanded reading.

- `#top` is the home page, with a static forest/stupa background, continuously downward-scrolling frameless photos from `photos/` with blurred/fading edges, and stationary standing Buddha artwork with a golden halo. Hover or focus the photo stream to pause; reduced-motion preferences disable its animation.
- Home fits the screen without page scrolling: the photos fill the available vertical space and the Buddha stays anchored at the bottom, including in landscape orientation.
- Top/bottom arrow buttons pause automatic motion and select the previous/next photo, wrapping around the collection. The Play button resumes automatic scrolling.
- `#about` and its chapter links show the Marathi About article with its video background; Home has no video.
- On mobile, Home shows the standing Buddha above the photo stream, and About shows its video above the article. Desktop keeps the side-by-side Home layout and About video background.
- `#tasks` is the login-protected timetable creator; timetable entries remain stored in this browser.

Run `npm run lint` and `npm run build` to validate the frontend.
