Comprehensive Implementation Plan: End-to-End Aviation Operations Workflow & System Enhancements
1. Executive Summary & Architecture Overview
This plan unifies the operational lifecycle of private charter flights across both Frontend (Next.js / TypeScript / Tailwind CSS) and Backend (Node.js / Express / MongoDB / Mongoose).

The core principle requested by the client is a Single Source of Truth Trip Lifecycle:

Mermaid diagram
2. Core Domain Models & Schema Upgrades
A. Trip & Revision Hierarchy
Entity	Key Identifier	Description & Lifecycle Rule
Trip	tripId (e.g. TRIP-2026-842)	Immutable global identifier persistent across all quotes, contracts, bookings, and invoices.
Quote Iteration	quoteId (e.g. QUO-842-01, QUO-842-02)	Sequential ascending ID. When a revision is made, previous quote is marked isCancelled: true and locked (paperwork view only).
Booking Iteration	bookingId (e.g. BK-842-01, BK-842-02)	Sequential ascending ID. When booked, the quote moves from Quotes to Bookings. Older quote iterations remain archived under Trip history.
Credit Note	creditNoteNumber (e.g. CN-842-01)	Chronological adjustment note generated whenever booking price changes. Sets previous balance adjustment and reflects delta.
B. Contact Schema (Multi-Part Name & Account Association)
Per client requirements, names must have dedicated separate fields:

prefix: Prefix / Honorific (Mr., Mrs., Ms., Dr., Capt., H.E., Sheikh, etc.)
firstName: Primary given name
middleName1: First middle name
middleName2: Second middle name
lastName1: Primary surname / paternal family name
lastName2: Secondary surname / maternal family name
suffix: Suffix (Jr., Sr., II, III, Esq., etc.)
title: Professional / Executive role (Family Office Principal, Lead Charterer, Signatory)
associatedAccountId: Linked account ID
tripsFlown: Derived array of all trips/bookings where this contact is passenger or signatory.
C. Account Schema (Immutable Account Numbers)
accountNumber: Generated on creation (e.g. ACC-84920). Locked & immutable (cannot be modified after creation).
D. Flight Routing & Leg Timings (Duration Override & Timezones)
flightTimeMinutes: Auto-calculated via Great-Circle distance + aircraft cruise speed, but now equipped with a manual edit/override toggle.
flightTimeFormatted: Updates dynamically (e.g. 01h 45m).
originTz & destTz: Timezone tags for origin and destination (e.g. UTC+1 / CET vs UTC+4 / GST).
tzDiffHours: Automatically computed timezone delta (e.g. +3 hrs).
departureTimeLocal & arrivalTimeLocal: Accounts for departure time + flight duration + timezone difference.
3. Detailed Workflow Implementation Plan
Workflow 1: Agent Request 
→
→ Quote Generation 
→
→ Send to Agent
Agent Requests Queue (AgentRequestsQueueView.tsx):
Clicking on an incoming Agent Request opens the Quote Creator (QuotesView.tsx / NewQuoteModal.tsx) pre-populated with:
Passenger count & manifest hints
Origin & Destination airports
Selected dates & times
Sourced aircraft specs & pricing
Client / Broker contact details & notes.
Sending Quote:
Staff clicks "Send Quote to Agent".
Generates Quote QUO-{tripId}-01, updates request status to quoted, and sends quotation PDF to broker/agent.
Workflow 2: Quote Approval 
→
→ Contract Execution 
→
→ Transition to Bookings
Agent Approval:
When agent accepts the quote, status updates to quote_accepted.
Super Admin Generates Contract:
Super admin pulls up the Contract generator with one click.
Generates the official Charter Agreement attached to tripId.
Signed & Booked Transition:
Once signed, the quote transitions to Bookings (convertQuoteToBooked):
The quote leaves the active Quotes list and moves to the Bookings tab.
All prior unbooked iterations under this tripId are marked cancelled and locked.
The booked iteration becomes the single active master flight record.
Workflow 3: Quotes Sublevel View & Historical Iterations
Quotes Directory Table (QuotesView.tsx):
Primary row displays the Trip (tripId, Client, Route, Dates, Latest Revision Price, Status).
Expandable Sublevel Accordion / Drawer:
Shows all quote iterations for that tripId (QUO-842-01, QUO-842-02, etc.) in chronological order.
Older iterations: Flagged with badge Cancelled / Superseded. Action buttons disabled except "View Quotation PDF" and "View Paperwork".
Latest unbooked iteration: Actionable — "Revise Quote", "Generate Quote PDF", "Proceed to Contract".
When "Revise Quote" is clicked:
Clones the latest quote into a new revision (QUO-842-03).
Marks QUO-842-02 as Cancelled / Superseded.
Preserves the same tripId.
Workflow 4: Bookings Hub — Revisions, Invoices, Briefs, Contracts & Credit Notes
From the Bookings view (BookingsView.tsx and BookingDetailDrawer.tsx), users can access:

Quick Document Modals:
"Flight Brief" Button: Opens the Flight Brief creation/edit modal pre-filled with booking parameters.
"Generate Invoice" Button: Opens the Invoice creation modal directly tied to this booking's numbers.
"Generate Contract" Button: Opens the Contract creation/view modal.
"Create Credit Note" Button: Opens Credit Note modal.
Booking Revisions & Price Changes:
Clicking "Revise Booking":
Cancels previous booking iteration, archives it in history.
Creates new chronological booking ID: BK-842-02.
Recalculates or inputs new price.
If price is altered:
Automatically generates a Credit Note or supplementary debit adjustment.
Sets old iteration price to 0 / credited out, and applies the new price to the active revision.
Multi-Iteration Invoice Generator:
Button: "Generate Consolidated Multi-Iteration Invoice"
Compiles a complete ledger of all revisions, credit notes, and final balance for that tripId.
Workflow 5: Flight Brief Core Locking & Passenger Auto-Sync to Contacts
Locked Core Parameters in Flight Brief (GenerateBriefView.tsx):
Origin Airport and Destination Airport are locked/read-only (derived directly from the booking itinerary to prevent flight dispatch divergence).
Operational items (FBO selection, crew, catering, schedule timing, manifest) remain editable.
Passenger Manifest Auto-Sync:
When passenger details are entered or edited in the Flight Brief:
Automatically creates or updates the passenger in Contacts (contactsData).
Automatically associates the contact with the Account linked to the flight brief (associatedAccountId: booking.accountNumber).
Captures multi-part names, passport/ID details, weight, and DOB.
Workflow 6: Invoices Directory — Client Search & Booking Reflection
Strict Reflection of Bookings:
Invoices cannot have independent route additions or disconnected pricing; they are derived directly from booked trips.
Client Search Filter & Sublevel:
Search by Client Name: lists only booked trips belonging to that client.
Expandable sub-level per trip:
Displays all revision invoices (INV-842-01, INV-842-02) and Credit Notes (CN-842-01).
Button to view individual invoice or Consolidated Trip Invoice.
Workflow 7: Contacts & Passenger Directory Enhancements
Multi-Column Name Grid:
Dedicated fields in modal and forms:
Col 1: Prefix + First Name
Col 2: Middle Name 1 + Middle Name 2
Col 3: Last Name 1 + Last Name 2
Col 4: Suffix + Title / Role
Contact Detail View & Flight History:
Clicking a contact card opens the Contact Inspection Drawer:
Complete bio, credentials, passport status, accompanied pets, and linked Account.
"Trips Flown / Flight History" Section:
Lists every flight the passenger has taken (Trip ID, Date, Route, Aircraft, Role: Lead Pax / Signatory / Guest, Link to paperwork).
Workflow 8: FBOs Integrated Inside Airports
Airport-Centric FBO Management:
FBOs are viewed and managed as facilities inside each airport card and detail modal in AirportsView.tsx.
Routing dropdowns and FBO handlers are directly coupled to the selected airport station.
4. Backend Implementation Plan (backend/)
backend/src/models/Booking.js:
Add fields: tripId, quoteId, bookingRevisionId, isCancelled, cancellationReason, isBooked, manualDurationMinutes, departureTimeUtc, arrivalTimeUtc, originTz, destTz, tzDiffHours, creditNotes.
backend/src/models/Client.js & Contact.js:
Immutable accountNumber validation hook (pre('save') prevents modification once set).
Multi-part name schema (prefix, firstName, middleName1, middleName2, lastName1, lastName2, suffix, title).
backend/src/routes/quotes.js & backend/src/routes/bookings.js:
POST /api/quotes/:id/revise: Creates ascending revision, cancels older iteration.
POST /api/quotes/:id/convert-to-booking: Moves quote to bookings, locks older quotes.
POST /api/bookings/:id/revise: Increments booking revision, generates credit note if price altered.
GET /api/bookings/trip/:tripId/invoices: Returns all iteration invoices + consolidated invoice.
POST /api/flight-briefs/:id/sync-passengers: Upserts passengers into contacts linked to account.
GET /api/contacts/:id/trips: Queries all bookings featuring this contact.
5. Frontend Implementation Plan (src/)
Types (src/types/aviation.ts):
Update Booking, FlightLeg, ContactRecord, AccountRecord, CreditNote.
Context Engine (src/lib/aviationContext.tsx):
Enhance revision engine: reviseQuote, convertQuoteToBooked, reviseBookingWithCreditNote, syncPassengerToContact.
Views:
QuotesView.tsx: Sublevel accordion for revisions, older iteration cancellation lock, "Send to Agent" button.
BookingsView.tsx: Quick-action buttons for Invoice, Brief, Contract, and Credit Note creation modals.
GenerateBriefView.tsx: Lock airport selectors, auto-sync manifest passengers to contacts.
GenerateInvoiceView.tsx / InvoicesView.tsx: Client-centric search, trip sublevel, consolidated invoice button.
ContactsView.tsx: Clean multi-part name inputs (2 middle names, 2 last names, prefix, suffix, title), Contact Detail drawer with flight history.
AccountsView.tsx: Immutable account number locking.
AirportSearchSelect.tsx & AirportsView.tsx: Embedded FBO facilities inspection.
6. Phased Execution Order
Phase 1: Types & Data Layer (aviation.ts, aviationContext.tsx, Backend models).
Phase 2: Quotes Sublevel & Revisions Engine (QuotesView.tsx, ascending Quote IDs, cancellation locks, transition to Bookings).
Phase 3: Bookings Hub & Credit Note / Multi-Invoice Engine (BookingsView.tsx, document modals, booking revisions).
Phase 4: Flight Brief Locking & Passenger-to-Contact Account Sync (GenerateBriefView.tsx).
Phase 5: Contacts Multi-Part Names & Trip History View (ContactsView.tsx).
Phase 6: Invoice Client Filter & Booking Reflection (GenerateInvoiceView.tsx).
Phase 7: Airport & Timing Enhancements (Manual duration override, timezones, FBO inside airports).
Phase 8: Full End-to-End Build Verification & Testing.
