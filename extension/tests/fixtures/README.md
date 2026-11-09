# Sanitized fixtures

These pages are **hand-written stand-ins**, not copies of partner pages. GlobTrek
does not scrape Booking.com, GetYourGuide or OpenTable. Each fixture reproduces
only the form structure an adapter targets (field names, ids, autocomplete
tokens and labels in the shape the adapter's selectors expect) with no partner
branding, scripts, prices or personal data.

Because they are stand-ins, passing tests prove the **engine** and the
**adapter's field map** behave as designed — not that a partner's live markup
still matches. Before enabling or releasing an adapter, a person must open a real
checkout page and confirm each selector (see `docs/PARTNERS.md`).

Every form here has a submit handler that marks the page `data-submitted="true"`.
Tests assert it never fires.
