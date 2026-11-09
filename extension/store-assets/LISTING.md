# Chrome Web Store listing — draft (not submitted)

**Upload file:** `globtrek-booking-assistant-<version>.zip` (built by `npm run ext:package`).
**Category:** Travel. **Language:** English (United States).

## Name
GlobTrek One Tab Booking Assistant

## Short description (≤132 characters — the manifest description)
Open every booking from your GlobTrek trip and fill your details where partners allow. You review and pay on their site.

## Detailed description
Plan a trip on GlobTrek, choose **Book my trip**, and the assistant takes it from there.

- **One list, every booking.** Your stay, flight, activities and dinners appear in one checklist, each with the exact link GlobTrek chose.
- **See before anything happens.** Before a tab opens, the assistant shows which of your details it will use and which sites will receive them.
- **Guided or all at once.** Open bookings one at a time (recommended) or all together.
- **Fills where partners allow it.** On GetYourGuide checkout, your name, email and phone are filled in for you. Booking.com and OpenTable don't allow automated assistants, so for them the assistant opens the exact link and puts your details one click away with copy buttons.
- **You stay in charge.** The assistant never books, reserves, accepts terms or pays. It stops at the review step and says "Review and pay on the partner site."
- **Clear status.** Each booking shows Opened, Filled, Needs attention, Ready to review or Ready to pay — in the assistant and on your GlobTrek trip page.

**Private by design**
- No GlobTrek account needed.
- Your details stay on your computer — or choose "Use once and forget".
- Card numbers, security codes, bank logins and partner passwords are never stored or read.
- No analytics, no tracking, nothing sent to GlobTrek.
- Passport storage is optional, off by default, and encrypted with your passphrase.
- Export your data or forget everything with one button.

**Affiliate disclosure.** GlobTrek is a Booking.com affiliate partner and may earn a commission on qualifying bookings made through its links, at no extra cost to you. The assistant opens the same links shown on your GlobTrek trip page, and only when you click.

Requires Chrome on a computer. Prices, availability and terms are always confirmed by each partner.

## Single purpose
Help a traveler book the trip they planned on GlobTrek: open each booking GlobTrek selected on the partner's site and fill the traveler's own details into those checkout forms where the partner permits it, stopping before payment.

## Permission justifications
- **storage** — Keeps the traveler's profile (only if they choose "Save on this device") and their trip checklists on the device.
- **scripting** — Injects the extension's packaged fill script into a partner checkout tab the assistant opened, only after the traveler asks, to type their details into the form. No remote code.
- **Host access: https://www.glob-trek.com/\*** (content script) — Lets the GlobTrek site detect the extension, hand over the trip's booking links, and show each booking's status. No traveler data is sent to the site.
- **Optional host access: https://www.getyourguide.com/\*** — Requested when the traveler first fills a GetYourGuide checkout, after a plain-language explanation. Used only to fill that checkout form.
- **Remote code** — None. All logic is in the package; the website can only send a validated description of the trip.

## Privacy practices (dashboard answers — draft)
Data the extension handles (entered by the user, stored only on their device, never transmitted to GlobTrek):
- **Personally identifiable information — Yes:** names, date of birth, email, phone, home address, nationality, emergency contact, Known Traveler/redress numbers, loyalty numbers, passport details (only if the user turns passport storage on).
- **Health information — Yes, if the user enters it:** accessibility or mobility-assistance requests.
- **Financial and payment information — No.** Never collected; card-shaped input is refused.
- **Authentication information — No.** No passwords or codes.
- **Personal communications, location, web history, user activity, website content — No.**

Use: only for the single purpose — filling the user's own booking forms. The data reaches a third party only when the user opens that partner's page and the assistant types it into the partner's form at the user's request.

Certify: not sold to third parties; not used or transferred for purposes unrelated to the single purpose; not used or transferred to determine creditworthiness or for lending.

Privacy policy URL: https://www.glob-trek.com/booking-assistant/privacy

## Support and homepage
- Homepage: https://www.glob-trek.com/booking-assistant
- Support: https://www.glob-trek.com/help (and https://www.glob-trek.com/contact)

## Graphics
- Store icon: `store-icon-128.png` (96×96 artwork, 16 px transparent padding), from GlobTrek's app icon.
- Screenshots (1280×800) in `screenshots/`:
  1. `01-trip-checklist.png` — the trip checklist mid-booking: Booking.com opened with copy buttons, GetYourGuide filled and ready to review.
  2. `02-before-anything-opens.png` — exactly which details go to which partner, and guided vs open-everything.
  3. `03-traveler-profile.png` — the one-time traveler form.
  4. `04-privacy-and-data.png` — stored-field list, storage choice, passports, export, forget all.
  5. `05-welcome.png` — first run: what it does and never does.
  6. `06-globtrek-checklist-status.png` — the GlobTrek trip page with live assistant status.
  Screenshots were captured from the development build against a local, sanitized stand-in for the GetYourGuide checkout (see `tests/fixtures/README.md`); the Booking.com and OpenTable rows show production behaviour (copy buttons only). No partner site was contacted.
- Small promo tile (440×280) and marquee (1400×560): not yet made — optional.

## Test instructions for Chrome reviewers
No account or login is needed.
1. Install the extension. The welcome page opens; choose **Save on this device** and **Continue to my details**.
2. Enter a first and last name; on **Contact** enter an email and phone; **Save my details**. (Try typing `4111 1111 1111 1111` into Special requests and saving: it is refused.)
3. Visit https://www.glob-trek.com, choose **Find my trip**, finish the short quiz and open your trip. Scroll to **Book your trip** and choose **Book my trip**. The assistant opens in a new tab and lists what it will use and which sites receive it.
4. Choose **Open everything**. Each booking opens on the partner's site with GlobTrek's exact link. Booking.com and OpenTable rows offer **Copy my details** (their terms don't allow automated filling). Back on the GlobTrek tab, each booking shows an **Assistant:** status.
5. To see filling: if a trip includes a GetYourGuide activity, open it, proceed to checkout, and choose **Fill this page**; Chrome asks for access to getyourguide.com first. The assistant fills name, email and phone and stops; it never clicks a payment or confirm button.
6. **Privacy & data → Forget all my information** erases everything.

## Claims checklist (keep true)
- No partnership with Booking.com, GetYourGuide or OpenTable beyond GlobTrek's Booking.com affiliate (CJ) relationship is claimed.
- No prices, availability or coverage claims beyond the field matrix in `docs/PARTNERS.md`.
- No security certification is claimed.
