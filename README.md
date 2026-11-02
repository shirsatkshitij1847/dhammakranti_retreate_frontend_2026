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

- `#registration` loads retreats and accepts participant registrations.
- `#organization` provides login/sign-up, an admin approval queue, retreat management, and account controls.
- `#people` displays registrations for organizers and admins; only admins can delete registrations.

Login sessions use `sessionStorage` and the API's one-hour bearer token. The frontend fetches the signed-in account profile from `GET /api/profile` and displays its name, email, account ID, and role. Public signup always creates a `visitor`; visitors see “Waiting for admin approval” and are asked to log in again later after their request is approved. Admins can review pending visitors and promote them to `organizer` in the organization dashboard. Organizers and admins can list retreats, register participants, and view registrations. Only admins can create/delete retreats, delete registrations, manage account roles, or reset passwords. The backend enforces these permissions; hiding a page or menu in the frontend is not an access-control boundary.

## Other pages

On each fresh launch/reload from November 3 through November 7, 2026 (India time), the retreat banner appears for 10 seconds before the app opens. Visitors can choose “Continue to app” to skip it. The campaign automatically expires at midnight on November 8; internal navigation does not replay it.

- `#blogs` is visible and accessible in the UI only after login and lists posts with pagination. Signed-in organizers/admins can publish a title, plain text, and one JPEG/PNG/WebP image up to 5 MB. Organizers can edit/delete their own posts; admins can manage all posts. The backend read/image endpoints remain public; the UI login gate does not make posts private. Blog APIs require working backend/MongoDB connectivity; errors are displayed with a retry option.

- `#top` is the home page, with a static forest/stupa background, continuously downward-scrolling frameless photos from `photos/` with blurred/fading edges, and stationary standing Buddha artwork with a golden halo. Hover or focus the photo stream to pause; reduced-motion preferences disable its animation.
- Home fits the screen without page scrolling: the photos fill the available vertical space and the Buddha stays anchored at the bottom, including in landscape orientation.
- Top/bottom arrow buttons pause automatic motion and select the previous/next photo, wrapping around the collection. The Play button resumes automatic scrolling.
- `#about` and its chapter links show the Marathi About article with its video background; Home has no video.
- On mobile, Home shows the standing Buddha above the photo stream, and About shows its video above the article. Desktop keeps the side-by-side Home layout and About video background.
- `#tasks` is the login-protected timetable creator; timetable entries remain stored in this browser.

Run `npm run lint` and `npm run build` to validate the frontend.
