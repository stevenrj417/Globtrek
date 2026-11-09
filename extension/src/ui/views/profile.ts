import type { ViewContext } from "../assistant.ts";
import { h, announce, nextId } from "../dom.ts";
import { areas, isUnlocked, lockVault, onLockChange, readPassports, saveProfile, unlockVault, writePassports } from "../state.ts";
import { emptyProfile, emptyTraveler, type PassportRecord, type Profile, type Traveler, type TravelerType } from "../../profile/types.ts";
import { PaymentDataError } from "../../security/payment-guard.ts";

// The traveler-profile editor: one form, saved locally, used for every booking.

type Tab = "party" | "contact" | "stay" | "flights" | "passports";
const TABS: [Tab, string][] = [["party", "Travelers"], ["contact", "Contact"], ["stay", "Stay & dining"], ["flights", "Flights"], ["passports", "Passports"]];

interface FieldOptions {
  type?: string;
  autocomplete?: string;
  hint?: string;
  placeholder?: string;
  inputmode?: string;
  maxLength?: number;
}

function input(label: string, value: string, onInput: (value: string) => void, options: FieldOptions = {}): HTMLElement {
  const id = nextId("f");
  const hintId = options.hint ? `${id}-hint` : undefined;
  return h("label", { class: "field", htmlFor: id },
    h("span", { class: "label" }, label),
    h("input", { id, type: options.type ?? "text", value, autocomplete: options.autocomplete ?? "off", placeholder: options.placeholder, inputMode: options.inputmode, maxLength: options.maxLength ?? 120, "aria-describedby": hintId, on: { input: (event: Event) => onInput((event.target as HTMLInputElement).value) } }),
    options.hint ? h("span", { class: "hint", id: hintId }, options.hint) : null,
  );
}

function textarea(label: string, value: string, onInput: (value: string) => void, hint?: string): HTMLElement {
  const id = nextId("f");
  return h("label", { class: "field", htmlFor: id },
    h("span", { class: "label" }, label),
    h("textarea", { id, value, maxLength: 500, "aria-describedby": hint ? `${id}-hint` : undefined, on: { input: (event: Event) => onInput((event.target as HTMLTextAreaElement).value) } }),
    hint ? h("span", { class: "hint", id: `${id}-hint` }, hint) : null,
  );
}

function select<T extends string>(label: string, value: T, options: [T, string][], onChange: (value: T) => void, hint?: string): HTMLElement {
  const id = nextId("f");
  return h("label", { class: "field", htmlFor: id },
    h("span", { class: "label" }, label),
    h("select", { id, "aria-describedby": hint ? `${id}-hint` : undefined, on: { change: (event: Event) => onChange((event.target as HTMLSelectElement).value as T) } },
      options.map(([optionValue, text]) => h("option", { value: optionValue, selected: optionValue === value }, text))),
    hint ? h("span", { class: "hint", id: `${id}-hint` }, hint) : null,
  );
}

function checkbox(label: string, checked: boolean, onChange: (checked: boolean) => void): HTMLElement {
  return h("label", { class: "check" }, h("input", { type: "checkbox", checked, on: { change: (event: Event) => onChange((event.target as HTMLInputElement).checked) } }), h("span", null, label));
}

function numberField(label: string, value: number | null, onInput: (value: number | null) => void, hint?: string): HTMLElement {
  return input(label, value === null ? "" : String(value), (text) => onInput(text.trim() ? Number(text) : null), { type: "number", inputmode: "numeric", ...(hint ? { hint } : {}) });
}

function loyaltyEditor(title: string, list: Traveler["airlineLoyalty"], redraw: () => void): HTMLElement {
  return h("div", { class: "stack" },
    h("p", { class: "micro" }, title),
    list.map((entry, index) => h("div", { class: "grid-2" },
      input("Program", entry.program, (value) => { entry.program = value; }, { placeholder: "e.g. Delta SkyMiles" }),
      h("div", { class: "row", style: "align-items: flex-end" },
        h("div", { style: "flex: 1" }, input("Member number", entry.number, (value) => { entry.number = value; }, { maxLength: 40 })),
        h("button", { type: "button", class: "btn btn-quiet", on: { click: () => { list.splice(index, 1); redraw(); } } }, "Remove"),
      ),
    )),
    h("button", { type: "button", class: "btn btn-secondary btn-sm", on: { click: () => { list.push({ program: "", number: "" }); redraw(); } } }, `Add ${title.toLowerCase().replace(/ programs?$/, "")}`),
  );
}

export async function renderProfile({ root, state, navigate }: ViewContext, param: string): Promise<() => void> {
  const draft: Profile = structuredClone(state.profile ?? emptyProfile());
  const returnTo = param.startsWith("return-") ? param.slice("return-".length) : null;
  let tab: Tab = "party";
  let status = "";
  let passports: PassportRecord[] | null = null;
  const panel = h("div", { class: "stack-lg", role: "tabpanel" });
  const statusLine = h("p", { class: "small", role: "status", "aria-live": "polite" });
  const tabButtons = new Map<Tab, HTMLButtonElement>();

  const tabList = h("div", { class: "tabs", role: "tablist", "aria-label": "Profile sections" }, TABS.map(([key, label]) => {
    const button = h("button", { type: "button", role: "tab", id: `tab-${key}`, "aria-controls": "profile-panel", "aria-selected": key === tab ? "true" : "false", tabIndex: key === tab ? 0 : -1, on: { click: () => select_(key) } }, label);
    tabButtons.set(key, button);
    return button;
  }));
  tabList.addEventListener("keydown", (event: KeyboardEvent) => {
    const index = TABS.findIndex(([key]) => key === tab);
    const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const nextTab = TABS[(index + delta + TABS.length) % TABS.length]![0];
    select_(nextTab);
    tabButtons.get(nextTab)?.focus();
  });
  panel.id = "profile-panel";

  function select_(next: Tab): void {
    tab = next;
    for (const [key, button] of tabButtons) { button.setAttribute("aria-selected", key === tab ? "true" : "false"); button.tabIndex = key === tab ? 0 : -1; }
    panel.setAttribute("aria-labelledby", `tab-${tab}`);
    draw();
  }

  const save = async () => {
    try {
      const saved = await saveProfile(areas, draft);
      state.profile = saved;
      status = state.settings.storageMode === "device" ? "Saved on this device." : "Saved for this browser session only.";
      statusLine.textContent = status;
      statusLine.className = "small";
      announce(status);
      if (returnTo) navigate(`#/session/${returnTo}`);
    } catch (error) {
      statusLine.textContent = error instanceof PaymentDataError ? error.message : "Couldn't save. Check the highlighted fields.";
      statusLine.className = "small error-text";
    }
  };

  function travelerCard(traveler: Traveler, index: number): HTMLElement {
    const isLead = traveler.id === draft.leadTravelerId;
    const adults = draft.travelers.filter((entry) => entry.type === "adult" && entry.id !== traveler.id);
    return h("fieldset", { class: "stack" },
      h("legend", null, traveler.label || `Traveler ${index + 1}`, isLead ? " · lead traveler" : ""),
      h("div", { class: "grid-2" },
        input("Label", traveler.label, (value) => { traveler.label = value; }, { placeholder: "Me, Partner, Maya…", maxLength: 40 }),
        select<TravelerType>("Traveler type", traveler.type, [["adult", "Adult"], ["child", "Child (2–11)"], ["infant", "Infant (under 2)"]], (value) => { traveler.type = value; draw(); }),
        input("Legal first name", traveler.legalFirstName, (value) => { traveler.legalFirstName = value; }, { autocomplete: isLead ? "given-name" : "off", hint: "Exactly as on the passport or ID used to travel." }),
        input("Middle name(s)", traveler.legalMiddleName, (value) => { traveler.legalMiddleName = value; }, { autocomplete: isLead ? "additional-name" : "off" }),
        input("Legal last name", traveler.legalLastName, (value) => { traveler.legalLastName = value; }, { autocomplete: isLead ? "family-name" : "off" }),
        input("Preferred name", traveler.preferredName, (value) => { traveler.preferredName = value; }, { hint: "For greetings only — bookings use legal names." }),
        input("Date of birth", traveler.dateOfBirth, (value) => { traveler.dateOfBirth = value; }, { type: "date", autocomplete: isLead ? "bday" : "off" }),
        select("Gender", traveler.gender, [["", "Only if an airline requires it"], ["female", "Female"], ["male", "Male"], ["unspecified", "Unspecified (X)"], ["undisclosed", "Undisclosed"]], (value) => { traveler.gender = value; }, "Airlines collect this for government Secure Flight checks. Never used elsewhere."),
        traveler.type !== "adult" ? input("Relationship", traveler.relationship, (value) => { traveler.relationship = value; }, { placeholder: "Daughter, nephew…" }) : null,
        traveler.type !== "adult" ? select("Guardian traveling", traveler.guardianTravelerId, [["", "Choose an adult"], ...adults.map((adult): [string, string] => [adult.id, adult.label || `${adult.legalFirstName} ${adult.legalLastName}`.trim() || "Adult"])], (value) => { traveler.guardianTravelerId = value; }) : null,
        input("Known Traveler Number / TSA PreCheck", traveler.knownTravelerNumber, (value) => { traveler.knownTravelerNumber = value; }, { maxLength: 25 }),
        input("Redress number", traveler.redressNumber, (value) => { traveler.redressNumber = value; }, { maxLength: 25 }),
        select("Seat", traveler.seatPosition, [["", "No preference"], ["window", "Window"], ["aisle", "Aisle"], ["middle", "Middle"]], (value) => { traveler.seatPosition = value; }),
        select("Seat area", traveler.seatZone, [["", "No preference"], ["front", "Front"], ["rear", "Rear"], ["exit_row", "Exit row (adults only)"]], (value) => { traveler.seatZone = value; }),
        input("Meal preference", traveler.mealPreference, (value) => { traveler.mealPreference = value; }, { placeholder: "Vegetarian, kosher…" }),
      ),
      textarea("Accessibility or mobility assistance", traveler.accessibility, (value) => { traveler.accessibility = value; }, "Wheelchair to the gate, step-free room, visual assistance… Shared only with partners you open."),
      loyaltyEditor("Airline loyalty programs", traveler.airlineLoyalty, draw),
      loyaltyEditor("Hotel loyalty programs", traveler.hotelLoyalty, draw),
      h("div", { class: "row" },
        !isLead ? h("button", { type: "button", class: "btn btn-quiet", on: { click: () => { draft.leadTravelerId = traveler.id; draw(); } } }, "Make lead traveler") : null,
        draft.travelers.length > 1 ? h("button", { type: "button", class: "btn btn-quiet", on: { click: () => {
          draft.travelers.splice(index, 1);
          if (isLead) draft.leadTravelerId = draft.travelers[0]!.id;
          draft.groups.forEach((group) => { group.travelerIds = group.travelerIds.filter((id) => id !== traveler.id); });
          draw();
        } } }, "Remove traveler") : null,
      ),
    );
  }

  function partyTab(): HTMLElement[] {
    return [
      h("p", { class: "muted small" }, "Add everyone traveling. Each person keeps their own legal name, birth date, loyalty numbers and seat preferences."),
      ...draft.travelers.map(travelerCard),
      h("div", { class: "row" },
        h("button", { type: "button", class: "btn btn-secondary btn-sm", on: { click: () => { draft.travelers.push(emptyTraveler("adult")); draw(); } } }, "Add adult"),
        h("button", { type: "button", class: "btn btn-secondary btn-sm", on: { click: () => { draft.travelers.push(emptyTraveler("child")); draw(); } } }, "Add child"),
        h("button", { type: "button", class: "btn btn-secondary btn-sm", on: { click: () => { draft.travelers.push(emptyTraveler("infant")); draw(); } } }, "Add infant"),
      ),
      h("fieldset", { class: "stack" },
        h("legend", null, "Saved groups"),
        h("p", { class: "small muted", style: "margin: 0" }, "Quick sets like “Me”, “Partner” or “Family” for future trips."),
        ...draft.groups.map((group, index) => h("div", { class: "stack" },
          h("div", { class: "row" },
            h("div", { style: "flex: 1" }, input("Group name", group.name, (value) => { group.name = value; }, { maxLength: 40 })),
            h("button", { type: "button", class: "btn btn-quiet", on: { click: () => { draft.groups.splice(index, 1); draw(); } } }, "Remove group"),
          ),
          h("div", { class: "row" }, draft.travelers.map((traveler) => checkbox(traveler.label || traveler.legalFirstName || "Traveler", group.travelerIds.includes(traveler.id), (checked) => {
            group.travelerIds = checked ? [...group.travelerIds, traveler.id] : group.travelerIds.filter((id) => id !== traveler.id);
          }))),
        )),
        h("button", { type: "button", class: "btn btn-secondary btn-sm", on: { click: () => { draft.groups.push({ id: `g_${Date.now().toString(36)}`, name: draft.groups.length ? "Family" : "Me", travelerIds: draft.travelers.map((traveler) => traveler.id) }); draw(); } } }, "Add group"),
      ),
    ];
  }

  function contactTab(): HTMLElement[] {
    const c = draft.contact;
    return [
      h("p", { class: "muted small" }, "For the lead traveler. Partners use these for confirmations and updates."),
      h("div", { class: "grid-2" },
        input("Email", c.email, (value) => { c.email = value; }, { type: "email", autocomplete: "email" }),
        input("Phone country code", c.phoneCountryCode, (value) => { c.phoneCountryCode = value; }, { placeholder: "+1", autocomplete: "tel-country-code", maxLength: 5 }),
        input("Phone number", c.phoneNumber, (value) => { c.phoneNumber = value; }, { type: "tel", autocomplete: "tel-national", maxLength: 25 }),
        input("Country of residence", c.countryOfResidence, (value) => { c.countryOfResidence = value; }, { autocomplete: "country-name" }),
        input("Nationality", c.nationality, (value) => { c.nationality = value; }),
      ),
      h("fieldset", { class: "grid-2" },
        h("legend", null, "Home address"),
        input("Address line 1", c.address.line1, (value) => { c.address.line1 = value; }, { autocomplete: "address-line1" }),
        input("Address line 2", c.address.line2, (value) => { c.address.line2 = value; }, { autocomplete: "address-line2" }),
        input("City", c.address.city, (value) => { c.address.city = value; }, { autocomplete: "address-level2" }),
        input("State or region", c.address.region, (value) => { c.address.region = value; }, { autocomplete: "address-level1" }),
        input("Postal code", c.address.postalCode, (value) => { c.address.postalCode = value; }, { autocomplete: "postal-code", maxLength: 20 }),
        input("Country", c.address.country, (value) => { c.address.country = value; }, { autocomplete: "country-name" }),
      ),
      h("fieldset", { class: "grid-2" },
        h("legend", null, "Emergency contact"),
        input("Name", c.emergencyName, (value) => { c.emergencyName = value; }),
        input("Relationship", c.emergencyRelationship, (value) => { c.emergencyRelationship = value; }),
        input("Phone (with country code)", c.emergencyPhone, (value) => { c.emergencyPhone = value; }, { type: "tel", maxLength: 30 }),
      ),
    ];
  }

  function stayTab(): HTMLElement[] {
    const s = draft.stay;
    return [
      h("div", { class: "grid-2" },
        input("Room preference", s.roomPreference, (value) => { s.roomPreference = value; }, { placeholder: "High floor, quiet room…" }),
        select("Bed", s.bedPreference, [["", "No preference"], ["king", "King"], ["queen", "Queen"], ["double", "Double"], ["twin", "Twin beds"]], (value) => { s.bedPreference = value; }),
        input("Usual arrival time", s.arrivalTime, (value) => { s.arrivalTime = value; }, { placeholder: "e.g. 3 PM or 15:00" }),
        input("Dietary preferences", s.dietary, (value) => { s.dietary = value; }, { placeholder: "Vegetarian, nut allergy…" }),
      ),
      textarea("Special requests", s.specialRequests, (value) => { s.specialRequests = value; }, "Sent as a request; the property or restaurant decides whether it can be met."),
    ];
  }

  function flightsTab(): HTMLElement[] {
    const f = draft.flight;
    return [
      h("p", { class: "notice small" }, "These are preferences. A seat, meal, bag allowance or fare rule is only confirmed when the airline or booking partner confirms it."),
      h("fieldset", { class: "grid-2" },
        h("legend", null, "Route and dates"),
        select("Trip type", f.tripType, [["", "Choose"], ["round_trip", "Round trip"], ["one_way", "One way"], ["multicity", "Multi-city"]], (value) => { f.tripType = value; }),
        input("From (airport code)", f.origin, (value) => { f.origin = value; }, { placeholder: "JFK", maxLength: 3 }),
        input("To (airport code)", f.destination, (value) => { f.destination = value; }, { placeholder: "LIS", maxLength: 3 }),
        checkbox("Include nearby airports", f.includeNearbyAirports, (value) => { f.includeNearbyAirports = value; }),
        input("Depart", f.departureDate, (value) => { f.departureDate = value; }, { type: "date" }),
        input("Return", f.returnDate, (value) => { f.returnDate = value; }, { type: "date" }),
        numberField("Flexible by ± days", f.flexibleDays, (value) => { f.flexibleDays = value ?? 0; }),
        select("Cabin", f.cabin, [["", "Any"], ["economy", "Economy"], ["premium_economy", "Premium economy"], ["business", "Business"], ["first", "First"]], (value) => { f.cabin = value; }),
      ),
      h("fieldset", { class: "grid-2" },
        h("legend", null, "Airlines"),
        input("Preferred airlines", f.preferredAirlines, (value) => { f.preferredAirlines = value; }),
        input("Preferred alliances", f.preferredAlliances, (value) => { f.preferredAlliances = value; }, { placeholder: "Star Alliance, oneworld…" }),
        input("Airlines to avoid", f.avoidAirlines, (value) => { f.avoidAirlines = value; }),
      ),
      h("fieldset", { class: "grid-2" },
        h("legend", null, "Stops and timing"),
        checkbox("Nonstop only", f.nonstopOnly, (value) => { f.nonstopOnly = value; }),
        numberField("Maximum stops", f.maxStops, (value) => { f.maxStops = value; }),
        numberField("Maximum total journey (hours)", f.maxJourneyHours, (value) => { f.maxJourneyHours = value; }),
        numberField("Maximum layover (hours)", f.maxLayoverHours, (value) => { f.maxLayoverHours = value; }),
        numberField("Minimum connection (minutes)", f.minConnectionMinutes, (value) => { f.minConnectionMinutes = value; }),
        input("Departure window", f.departWindow, (value) => { f.departWindow = value; }, { placeholder: "08:00–14:00" }),
        input("Arrival window", f.arriveWindow, (value) => { f.arriveWindow = value; }, { placeholder: "before 22:00" }),
        checkbox("Overnight flights are fine", f.overnightOk, (value) => { f.overnightOk = value; }),
      ),
      h("fieldset", { class: "grid-2" },
        h("legend", null, "Bags, fare and seats"),
        numberField("Carry-on bags per person", f.carryOnBags, (value) => { f.carryOnBags = value ?? 0; }),
        numberField("Checked bags per person", f.checkedBags, (value) => { f.checkedBags = value ?? 0; }),
        select("Fare flexibility", f.fareFlexibility, [["", "No preference"], ["refundable", "Refundable"], ["changeable", "Changeable"], ["any", "Cheapest, any rules"]], (value) => { f.fareFlexibility = value; }),
        numberField("Maximum flight budget (total)", f.maxBudget, (value) => { f.maxBudget = value; }),
      ),
      h("fieldset", { class: "stack" },
        h("legend", null, "Who must sit together"),
        h("div", { class: "row" }, draft.travelers.map((traveler) => checkbox(traveler.label || traveler.legalFirstName || "Traveler", f.seatTogether.includes(traveler.id), (checked) => {
          f.seatTogether = checked ? [...f.seatTogether, traveler.id] : f.seatTogether.filter((id) => id !== traveler.id);
        }))),
        h("p", { class: "subtle", style: "margin: 0" }, "Seat position, meal, loyalty and Known Traveler numbers are set per traveler on the Travelers tab."),
      ),
    ];
  }

  function passportsTab(): HTMLElement[] {
    const mode = state.settings.passportMode;
    if (mode === "off") return [
      h("p", { class: "title" }, "Passport storage is off"),
      h("p", { class: "muted small", style: "max-width: 62ch" }, "That's the default. You can keep passports for this browser session only, or save them encrypted on this device with a passphrase. Either way they're only typed into a page after you confirm, and never sent to GlobTrek."),
      h("a", { class: "btn btn-secondary", href: "#/privacy" }, "Change in Privacy & data"),
    ];
    const ids = new Set(draft.travelers.map((traveler) => traveler.id));
    if (mode === "encrypted" && !isUnlocked()) {
      const pass = h("input", { type: "password", id: "unlock-pass", autocomplete: "current-password", minLength: 10 });
      const error = h("p", { class: "error-text", role: "alert" });
      return [h("form", { class: "stack", style: "max-width: 420px", on: { submit: async (event: Event) => {
        event.preventDefault();
        try { passports = await unlockVault(pass.value); pass.value = ""; draw(); } catch (failure) { error.textContent = failure instanceof Error ? failure.message : "Couldn't unlock."; }
      } } },
        h("p", { class: "title" }, "Unlock passports"),
        h("p", { class: "small muted" }, "Enter your passport passphrase. The first time, this sets it — GlobTrek can't recover it if forgotten. Locks again after inactivity."),
        h("label", { class: "field", htmlFor: "unlock-pass" }, h("span", { class: "label" }, "Passphrase (10+ characters)"), pass),
        error,
        h("button", { type: "submit", class: "btn btn-primary" }, "Unlock"),
      )];
    }
    if (passports === null) {
      void readPassports(state.settings, ids).then((records) => { passports = records ?? []; draw(); });
      return [h("p", { class: "muted" }, h("span", { class: "spinner", "aria-hidden": "true" }), " Loading…")];
    }
    const records = passports;
    return [
      h("p", { class: "notice small" }, mode === "encrypted" ? "Encrypted on this device with your passphrase (AES-256). Unlocked now; locks after inactivity." : "Kept for this browser session only. Erased when Chrome closes."),
      ...draft.travelers.map((traveler) => {
        let record = records.find((entry) => entry.travelerId === traveler.id);
        const ensure = () => { if (!record) { record = { travelerId: traveler.id, number: "", issuingCountry: "", nationality: "", issueDate: "", expiryDate: "" }; records.push(record); } return record; };
        return h("fieldset", { class: "grid-2" },
          h("legend", null, traveler.label || `${traveler.legalFirstName} ${traveler.legalLastName}`.trim() || "Traveler"),
          input("Passport number", record?.number ?? "", (value) => { ensure().number = value; }, { maxLength: 20 }),
          input("Issuing country", record?.issuingCountry ?? "", (value) => { ensure().issuingCountry = value; }),
          input("Nationality", record?.nationality ?? "", (value) => { ensure().nationality = value; }),
          input("Issue date", record?.issueDate ?? "", (value) => { ensure().issueDate = value; }, { type: "date" }),
          input("Expiry date", record?.expiryDate ?? "", (value) => { ensure().expiryDate = value; }, { type: "date" }),
        );
      }),
      h("div", { class: "row" },
        h("button", { type: "button", class: "btn btn-primary", on: { click: async () => {
          try { await writePassports(state.settings, records, ids); statusLine.textContent = "Passports saved."; announce("Passports saved"); }
          catch (failure) { statusLine.textContent = failure instanceof Error ? failure.message : "Couldn't save passports."; }
        } } }, "Save passports"),
        mode === "encrypted" ? h("button", { type: "button", class: "btn btn-secondary", on: { click: () => { lockVault(); passports = null; draw(); } } }, "Lock now") : null,
        h("a", { class: "btn btn-quiet", href: "#/privacy" }, "Delete passports"),
      ),
    ];
  }

  function draw(): void {
    panel.replaceChildren(...({ party: partyTab, contact: contactTab, stay: stayTab, flights: flightsTab, passports: passportsTab } as const)[tab]());
  }

  root.append(h("div", { class: "stack-lg" },
    h("div", { class: "stack" },
      h("p", { class: "eyebrow" }, "My details"),
      h("h1", { class: "display" }, "Enter it once."),
      h("p", { class: "muted", style: "max-width: 62ch" }, state.settings.storageMode === "device" ? "Saved on this device only. No GlobTrek account, nothing uploaded. Never add card numbers or passwords — partners and Chrome handle payment." : "Use-once mode: kept in memory for this browser session, then forgotten."),
    ),
    tabList,
    panel,
    h("div", { class: "row", style: "position: sticky; bottom: 0; background: var(--bg); padding: 14px 0; border-top: 1px solid var(--border-mid)" },
      h("button", { type: "button", class: "btn btn-primary", on: { click: save } }, returnTo ? "Save and return to my trip" : "Save my details"),
      statusLine,
    ),
  ));
  select_("party");
  const unsubscribe = onLockChange(() => { if (tab === "passports" && !isUnlocked()) { passports = null; draw(); } });
  return unsubscribe;
}
