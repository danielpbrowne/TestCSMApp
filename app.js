const data = window.CSM_DATA;

const sections = {
  destinations: { title: 'Destination Guide', desc: 'Airport, station and hotel details for each destination.' },
  aircraft: { title: 'Aircraft Types', desc: 'Aircraft Seating Capacity and Registrations' },
  flight: {
    title: 'Flight & Duty', desc: 'Flight & Duty Information',
    cards: [
      ['BASIC FDP', 'Basic Maximum Daily FDP', 'Basic maximum FDP by start of FDP at reference time and sector count, for 1–2, 3, or 4 sectors.'],
      ['ACCLIMATISATION', 'Acclimatised Definition', 'Definitions of acclimatised and reference time. State table by time difference under 4, 4–6, over 6–9, over 9–12 hours and elapsed time since reporting: under 48, 48–71:59, 72–95:59, 96–119:59, or 120 hours and over. B, D, X.'],
      ['NINTH CREW MEMBER', '9th Crew Member Protocol', 'Transatlantic, 13-hour FDP threshold, Crew Control, DOM, CBP, eight crew, unknown delay at 13 hours 15 minutes, and short-crew credits of 10 or 28 per crew member.']
    ]
  },
  ife: {
    title: 'IFE & Wi-Fi quick reference', desc: 'Aircraft-specific crew guides and passenger connection help.',
    cards: [
      ['IFE', 'IFE system overview', 'Identify the system by aircraft and configuration, with links to current manuals.'],
      ['FLIGHT SETUP', 'Opening & closing a flight', 'Current approved steps for preparing the IFE system for each flight.'],
      ['TROUBLESHOOTING', 'IFE troubleshooting', 'Seat reset, media support, equipment power controls and escalation guidance. Verify against current manuals.'],
      ['WI-FI', 'Wi-Fi access & troubleshooting', 'Passenger access guidance, service status and current Wi-Fi troubleshooting instructions.']
    ]
  },
  crew: {
    title: 'Crew admin', desc: 'Crew payments, credits, expenses and admin references.',
    cards: [
      ['CREDITS', 'Credits & payment dates', 'Current credit rules, values, payroll periods and payment dates.'],
      ['COMMISSION', 'Commission', 'Current commission policy, calculation and payroll timing.'],
      ['EXPENSES', 'Expenses & allowances', 'Current expense rates, receipts, claim process and overnight allowances.'],
      ['ADMIN', 'Other crew admin', 'Current MyView, roster, swaps and trip trade guidance.']
    ]
  },
  contacts: {
    title: 'Useful contacts & links', desc: 'Verified support contacts and company resources.',
    cards: [
      ['COMPANY LINKS', 'Useful internet links', 'Cabin crew portal, e-Crew, email, staff travel, MyView, CrewBids and training.'],
      ['CREW SUPPORT', 'Crew contacts', 'Current Crew Control, IFS, training, HR and staff travel contact routes.'],
      ['MEDICAL SUPPORT', 'MedAire & MedLink', 'Current crew support and gate-support guidance with verified escalation contacts.'],
      ['TRIP TRADES', 'Swaps & trip trades', 'Current request form and account instructions. Keep any online-only task clearly identified.']
    ]
  }
};

const content = document.querySelector('#content-area');
const search = document.querySelector('#search');
const results = document.querySelector('#search-results');
let destinationClockTimer;

const destinationTimeZones = {
  BOS: 'America/New_York', CUN: 'America/Cancun', ORD: 'America/Chicago', CLE: 'America/New_York',
  BDL: 'America/New_York', IND: 'America/Indiana/Indianapolis', LAX: 'America/Los_Angeles',
  MIA: 'America/New_York', BNA: 'America/Chicago', JFK: 'America/New_York', EWR: 'America/New_York',
  MCO: 'America/New_York', PHL: 'America/New_York', PIT: 'America/New_York', RDU: 'America/New_York',
  SFO: 'America/Los_Angeles', SEA: 'America/Los_Angeles', YYZ: 'America/Toronto', IAD: 'America/New_York'
};

function setActive(id) {
  document.querySelectorAll('.quick-links button').forEach(button => {
    button.classList.toggle('active', button.dataset.section === id);
  });
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function heading(kicker, title, description) {
  return `<div class="section-head"><div><span class="section-kicker">${escapeHtml(kicker)}</span><h2>${escapeHtml(title)}</h2></div><p>${escapeHtml(description)}</p></div>`;
}

function caution(text) {
  return `<div class="notice">${escapeHtml(text)}</div>`;
}

function renderCards(cards) {
  return `<div class="card-grid">${cards.map(card => {
    if (card[0] === 'BASIC FDP') return renderBasicFdpCard(card);
    if (card[0] === 'ACCLIMATISATION') return renderAcclimatisationCard(card);
    if (card[0] === 'NINTH CREW MEMBER') return renderNinthCrewCard(card);
    return `<article class="card"><span class="card-tag">${escapeHtml(card[0])}</span><h3>${escapeHtml(card[1])}</h3><p>${escapeHtml(card[2])}</p><div class="card-foot">NOT POPULATED FROM THE PROVIDED WORKBOOKS</div></article>`;
  }).join('')}</div>`;
}

function renderBasicFdpCard(card) {
  const rows = [
    ['06:00–13:29', '13:00', '12:30', '12:00'], ['13:30–13:59', '12:45', '12:15', '11:45'],
    ['14:00–14:29', '12:30', '12:00', '11:30'], ['14:30–14:59', '12:15', '11:45', '11:15'],
    ['15:00–15:29', '12:00', '11:30', '11:00'], ['15:30–15:59', '11:45', '11:15', '10:45'],
    ['16:00–16:29', '11:30', '11:00', '10:30'], ['16:30–16:59', '11:15', '10:45', '10:15'],
    ['17:00–04:59', '11:00', '10:30', '10:00'], ['05:00–05:14', '12:00', '11:30', '11:00'],
    ['05:15–05:29', '12:15', '11:45', '11:15'], ['05:30–05:44', '12:30', '12:00', '11:30'],
    ['05:45–05:59', '12:45', '12:15', '11:45']
  ];
  const body = rows.map(([time, oneTwo, three, four]) => `<tr><th scope="row">${time}</th><td>${oneTwo}</td><td>${three}</td><td>${four}</td></tr>`).join('');
  return `<article class="card fdp-card"><span class="card-tag">${escapeHtml(card[0])}</span><h3>${escapeHtml(card[1])}</h3><p>${escapeHtml(card[2])} The table shows maximum FDP without extension for acclimatised crew.</p><div class="fdp-table-scroll" role="region" tabindex="0" aria-label="Basic maximum daily FDP table"><table class="fdp-table fdp-basic-table"><thead><tr><th rowspan="2" scope="col">Start of FDP at reference time</th><th colspan="3" scope="colgroup">Sectors</th></tr><tr><th scope="col">1–2</th><th scope="col">3</th><th scope="col">4</th></tr></thead><tbody>${body}</tbody></table></div><small class="fdp-table-hint">Swipe horizontally if needed to view all columns.</small><small class="fdp-source-note">Source: Operations Manual Part A Cabin, PAC 08, Issue 1, Revision 8 · approved 02 April 2025. Sector columns 5 and 6 are omitted as requested.</small></article>`;
}

function renderAcclimatisationCard(card) {
  const rows = [
    ['< 4', 'B', 'D', 'D', 'D', 'D'],
    ['≥ 4 and ≤ 6', 'B', 'X', 'D', 'D', 'D'],
    ['> 6 and ≤ 9', 'B', 'X', 'X', 'D', 'D'],
    ['> 9 and ≤ 12', 'B', 'X', 'X', 'X', 'D']
  ];
  const body = rows.map(([difference, ...states]) => `<tr><th scope="row">${escapeHtml(difference)}</th>${states.map(state => `<td>${state}</td>`).join('')}</tr>`).join('');
  return `<article class="card fdp-card"><span class="card-tag">${escapeHtml(card[0])}</span><h3>${escapeHtml(card[1])}</h3><p><strong>“Acclimatised” means</strong> a state in which a crew member’s circadian biological clock is synchronised to the time zone where the crew member is. A crew member is considered to be acclimatised to a 2-hour wide time zone surrounding the local time at the point of departure. When the local time at the place where a duty commences differs by more than 2 hours from the local time at the place where the next duty starts, the crew member, for the calculation of the maximum daily flight duty period, is considered to be acclimatised in accordance with the values in the table below.</p><p><strong>“Reference time” means</strong> the local time at the reporting point situated in a 2-hour wide time zone band around the local time where a crew member is acclimatised.</p><p>Compare the time difference between reference time and the local time where the crew member starts the next duty with the time elapsed since reporting at reference time.</p><div class="fdp-table-scroll" role="region" tabindex="0" aria-label="Acclimatisation state table"><table class="fdp-table fdp-acclim-table"><thead><tr><th rowspan="2" scope="col">Time difference (h)</th><th colspan="5" scope="colgroup">Time elapsed since reporting at reference time</th></tr><tr><th scope="col">&lt;48</th><th scope="col">48–71:59</th><th scope="col">72–95:59</th><th scope="col">96–119:59</th><th scope="col">≥120</th></tr></thead><tbody>${body}</tbody></table></div><small class="fdp-table-hint">Swipe horizontally to see all time intervals.</small><div class="fdp-code-legend"><span><b>B</b> Acclimatised to the local time of the departure time zone.</span><span><b>D</b> Acclimatised to the local time where the crew member starts the next duty.</span><span><b>X</b> Unknown state of acclimatisation.</span></div><small class="fdp-source-note">Manual reference: Operations Manual Part A Cabin, PAC 08, Issue 1, Revision 8 · approved 02 April 2025.</small></article>`;
}

function renderNinthCrewCard(card) {
  return `<article class="card fdp-card"><span class="card-tag">${escapeHtml(card[0])}</span><h3>${escapeHtml(card[1])}</h3><p>${escapeHtml(card[2])}</p><div class="protocol-steps"><section><h4>When to plan one</h4><p>For transatlantic flights, make every effort to provide a ninth crew member when it is known that the FDP will exceed 13 hours.</p></section><section><h4>Starting the process</h4><p>As soon as it becomes apparent that the maximum FDP will be exceeded and a ninth crew member is required, Crew Control and the Duty Operations Manager (DOM) start the assignment process. The CSM or operating Number 1 liaises with the DOM, gathers delay information and keeps the crew updated.</p></section><section><h4>If a ninth crew member is unavailable</h4><p>The CSM should tell the crew why, actively manage the situation and provide timely information to Crew Control and the DOM. The protocol says a flight may depart with eight crew under its conditions and the referenced CSM guidelines. If adding the ninth would cause further delay because CBP has closed after the flight has cleared, the CSM or operating Number 1 confirms departure with eight after considering those guidelines.</p></section><section><h4>Short-crew credits</h4><div class="fdp-table-scroll"><table class="fdp-table protocol-credit-table"><thead><tr><th scope="col">Situation in the protocol</th><th scope="col">Credits per crew member</th></tr></thead><tbody><tr><th scope="row">Standard short-crew payment</th><td>10</td></tr><tr><th scope="row">Eight operate where a ninth would normally be provided</th><td>28</td></tr><tr><th scope="row">Unknown delay: maximum FDP exceeds 13 h 15 min</th><td>28</td></tr><tr><th scope="row">Unknown delay: maximum FDP is less than 13 h 15 min</th><td>10</td></tr></tbody></table></div><p class="protocol-note">The addendum does not specify the credit at exactly 13 h 15 min.</p></section><section><h4>When the ninth is provided</h4><p>The ninth crew member is surplus to the operating crew and should be used to support in-flight rest. Duty and rest should remain balanced among the operating cabin crew.</p></section></div><div class="protocol-note-box">The protocol refers to a separate “CSM Guideline re Ninth Crew Member” for the decision to depart without a ninth crew member. That guideline was not included in the supplied document.</div><a class="fdp-reference-link" href="./assets/ninth-crew-member-protocol.pdf" target="_blank" rel="noopener"><span>OPEN SOURCE PROTOCOL</span><strong>Execution version and addendum ↗</strong></a><small class="fdp-source-note">Protocol dated 14 December 2018 · addendum dated 12 September 2019.</small></article>`;
}

function renderDestinations() {
  clearInterval(destinationClockTimer);
  const list = [...data.destinations].sort((a, b) => a.name.localeCompare(b.name)).map(destination => {
    return `<button class="destination" data-destination="${escapeHtml(destination.code)}"><strong>${escapeHtml(destination.name)}</strong><span>${escapeHtml(destination.code)}</span></button>`;
  }).join('');
  content.innerHTML = heading('DESTINATIONS', sections.destinations.title, sections.destinations.desc)
    + `<div class="destination-list">${list}</div>`;
  content.querySelectorAll('[data-destination]').forEach(button => button.onclick = () => openDestination(button.dataset.destination));
}

function renderDestinationProfile(destination) {
  const facts = data.destinationFacts.filter(fact => fact.code === destination.code);
  const metadata = `<div class="profile-meta"><div><span>CURRENT TIME IN DUBLIN</span><strong id="dublin-current-time">Calculating…</strong></div><div><span>CURRENT TIME AT DESTINATION</span><strong id="destination-current-time">Calculating…</strong></div></div>`;
  if (!facts.length) {
    return metadata + `<div class="empty"><strong>No destination details entered yet</strong>This location is present in the destination index, but the source register has no detailed records for it.</div>`;
  }
  const grouped = new Map();
  facts.forEach(fact => {
    // Earlier register rows stored these two duty contacts under Handling & Operations.
    const isDutyContact = /^Duty Manager(?: Email| Phone)?$/.test(fact.field);
    const category = fact.category === 'Handling & Operations' && isDutyContact
      ? 'Turnaround Coordination'
      : fact.category;
    if (!grouped.has(category)) grouped.set(category, []);
    grouped.get(category).push(fact);
  });
  const cards = [...grouped.entries()].map(([category, categoryFacts]) => {
    if (category === 'Handling & Operations') return renderHandlingCard(categoryFacts);
    if (category === 'Turnaround Coordination') return renderTurnaroundCard(categoryFacts);
    const records = categoryFacts.map(fact => {
      const mapLink = destinationMapLink(fact, destination);
      return `<div class="profile-record"><div class="profile-record-heading"><strong>${escapeHtml(fact.field)}</strong></div><div class="profile-value">${escapeHtml(fact.value || 'No value entered')}</div>${mapLink}</div>`;
    }).join('');
    return `<article class="card profile-card"><span class="card-tag">${escapeHtml(category)}</span><div class="profile-fields">${records}</div></article>`;
  }).join('');
  return metadata + `<div class="card-grid profile-grid">${cards}</div>`;
}

function destinationMapLink(fact, destination) {
  if (fact.field.trim().toLowerCase() !== 'hotel address') return '';
  const queryParts = [fact.value, destination.name, destination.country];
  const query = [...new Set(queryParts.filter(Boolean))].join(', ');
  const url = `https://maps.apple.com/place?address=${encodeURIComponent(query)}`;
  return `<a class="map-action" href="${escapeHtml(url)}" target="_blank" rel="noopener">OPEN IN MAPS ↗</a>`;
}

function contactAction(label, value, kind) {
  if (!value) return '';
  const href = kind === 'phone'
    ? `tel:${String(value).replace(/[^\d+]/g, '')}`
    : `mailto:${String(value).trim()}`;
  return `<a class="contact-action" href="${escapeHtml(href)}"><span>${label}</span><strong>${escapeHtml(value)}</strong></a>`;
}

function contactCard(role, name, email, phone) {
  const links = `${contactAction('EMAIL', email, 'email')}${contactAction('CALL', phone, 'phone')}`;
  return `<article class="contact-card"><span class="contact-role">${escapeHtml(role)}</span><h3>${escapeHtml(name || 'Contact details')}</h3><div class="contact-actions">${links || '<span class="contact-missing">No contact route entered</span>'}</div></article>`;
}

function renderHandlingCard(facts) {
  const manager = facts.find(fact => fact.field === 'Station Manager');
  const managerEmail = facts.find(fact => fact.field === 'Station Manager Email')?.value;
  const managerPhone = facts.find(fact => fact.field === 'Station Manager Phone')?.value;
  const consumed = new Set(['Station Manager', 'Station Manager Email', 'Station Manager Phone']);
  const records = facts.filter(fact => !consumed.has(fact.field)).map(fact => `<div class="profile-record"><div class="profile-record-heading"><strong>${escapeHtml(fact.field)}</strong></div><div class="profile-value">${escapeHtml(fact.value || 'No value entered')}</div></div>`).join('');
  const managerCard = manager ? contactCard('STATION MANAGER', manager.value, managerEmail, managerPhone) : '';
  return `<article class="card profile-card"><span class="card-tag">Handling &amp; Operations</span><div class="profile-fields">${records}</div>${managerCard}</article>`;
}

function renderTurnaroundCard(facts) {
  const contacts = [];
  const unassigned = [];
  let current = null;
  facts.forEach(fact => {
    if (fact.field === 'Duty Manager') {
      current = { role: fact.field, name: fact.value, email: '', phone: '' };
      contacts.push(current);
    } else if (fact.field === 'Duty Manager Email') {
      if (current && !current.email) current.email = fact.value;
      else unassigned.push(fact);
    } else if (fact.field === 'Duty Manager Phone') {
      if (current && !current.phone) current.phone = fact.value;
      else unassigned.push(fact);
    } else {
      unassigned.push(fact);
    }
  });
  const cards = contacts.map(contact => contactCard(contact.role, contact.name, contact.email, contact.phone)).join('');
  const extras = unassigned.map(fact => `<div class="contact-extra"><strong>${escapeHtml(fact.field)}</strong>${fact.field.toLowerCase().includes('phone') ? contactAction('CALL', fact.value, 'phone') : `<span>${escapeHtml(fact.value)}</span>`}</div>`).join('');
  return `<article class="card profile-card"><span class="card-tag">Turnaround Coordination</span><div class="coordination-grid">${cards}${extras}</div></article>`;
}

function updateDestinationClock(destination) {
  const zone = destinationTimeZones[destination.code];
  const dublinTime = document.querySelector('#dublin-current-time');
  const currentTime = document.querySelector('#destination-current-time');
  const now = new Date();
  if (dublinTime) {
    dublinTime.textContent = new Intl.DateTimeFormat('en-IE', { timeZone: 'Europe/Dublin', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'short' }).format(now);
  }
  if (currentTime) {
    currentTime.textContent = zone
      ? new Intl.DateTimeFormat('en-IE', { timeZone: zone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'short' }).format(now)
      : 'Unavailable';
  }
}

function openDestination(code) {
  const destination = data.destinations.find(item => item.code === code);
  if (!destination) return;
  clearInterval(destinationClockTimer);
  setActive('destinations');
  content.innerHTML = `<button class="back-button" data-back>← ALL DESTINATIONS</button>`
    + heading(`${destination.code} · OUTSTATION`, destination.name, `${destination.country} · ${destination.routeStatus}`)
    + renderDestinationProfile(destination);
  content.querySelector('[data-back]').onclick = renderDestinations;
  updateDestinationClock(destination);
  destinationClockTimer = setInterval(() => updateDestinationClock(destination), 60_000);
}

function aircraftConfigurations() {
  const groups = new Map();
  data.aircraft.forEach(aircraft => {
    const key = [aircraft.type, aircraft.business, aircraft.premiumEconomy, aircraft.economy, aircraft.total, aircraft.cabinCrewSeats, aircraft.flightDeckRest, aircraft.cabinCrewRest].join('|');
    if (!groups.has(key)) groups.set(key, { ...aircraft, registrations: [] });
    groups.get(key).registrations.push(aircraft.registration);
  });
  return [...groups.values()].sort((a, b) => a.type.localeCompare(b.type) || a.cabinCrewSeats - b.cabinCrewSeats);
}

function aircraftId(aircraft) {
  return `aircraft-${aircraft.type}-${aircraft.cabinCrewSeats}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function renderAircraft() {
  const variants = aircraftConfigurations();
  const cards = variants.map(aircraft => {
    const zones = [['Business', aircraft.business], ['Premium Economy', aircraft.premiumEconomy], ['Economy', aircraft.economy]].filter(([, seats]) => seats > 0);
    const bar = zones.map(([, seats]) => `<div class="seat-zone" style="--zone:${(seats / aircraft.total * 100).toFixed(2)}%"><strong>${seats}</strong></div>`).join('');
    const registrations = aircraft.registrations.join(', ');
    return `<article class="card aircraft-card" id="${aircraftId(aircraft)}"><div class="aircraft-card-head"><span class="card-tag">${escapeHtml(aircraft.type)}</span><strong class="aircraft-total">${aircraft.total}<small> seats</small></strong></div><div class="seat-bar" aria-label="Passenger seats by cabin">${bar}</div><div class="seat-legend">${zones.map(([name, seats]) => `<span>${escapeHtml(name)} <b>${seats}</b></span>`).join('')}</div><div class="aircraft-stats"><div><span>CABIN CREW SEATS</span><strong>${aircraft.cabinCrewSeats}</strong></div><div><span>FLIGHT DECK REST</span><strong>${escapeHtml(aircraft.flightDeckRest)}</strong></div><div><span>CABIN CREW REST</span><strong>${escapeHtml(aircraft.cabinCrewRest)}</strong></div></div><div class="registration-list"><span>REGISTRATIONS</span><p>${escapeHtml(registrations)}</p></div></article>`;
  }).join('');
  content.innerHTML = heading('FLEET QUICK REFERENCE', sections.aircraft.title, sections.aircraft.desc)
    + caution(`${data.aircraft.length} aircraft across ${new Set(data.aircraft.map(item => item.type)).size} types. Configurations are grouped by seating and crew-seat details.`)
    + `<div class="card-grid aircraft-grid">${cards}</div>`;
}

function openSection(id) {
  clearInterval(destinationClockTimer);
  setActive(id);
  if (id === 'destinations') return renderDestinations();
  if (id === 'aircraft') return renderAircraft();
  const section = sections[id];
  if (!section) return;
  content.innerHTML = heading('QUICK REFERENCE', section.title, section.desc)
    + (id === 'flight' ? '' : caution('This section has not been populated from the two provided workbooks yet.'))
    + renderCards(section.cards || []);
}

document.querySelectorAll('.quick-links button').forEach(button => {
  button.addEventListener('click', () => {
    openSection(button.dataset.section);
    content.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

const searchable = [
  ...data.destinations.map(destination => ({ id: 'destinations', title: destination.name, tag: destination.code, detail: `${destination.country} · ${destination.routeStatus}`, destinationCode: destination.code })),
  ...data.destinationFacts.map(fact => ({ id: 'destinations', title: fact.field, tag: fact.code, detail: fact.value, destinationCode: fact.code })),
  ...aircraftConfigurations().flatMap(aircraft => [
    { id: 'aircraft', title: aircraft.type, tag: 'AIRCRAFT', detail: `${aircraft.total} passenger seats · ${aircraft.registrations.join(', ')}`, aircraftId: aircraftId(aircraft) },
    ...aircraft.registrations.map(registration => ({ id: 'aircraft', title: registration, tag: aircraft.type, detail: `${aircraft.total} passenger seats · ${aircraft.cabinCrewSeats} cabin crew seats`, aircraftId: aircraftId(aircraft) }))
  ]),
  ...Object.entries(sections).filter(([id]) => !['destinations', 'aircraft'].includes(id)).map(([id, section]) => ({ id, title: section.title, tag: 'SECTION', detail: section.desc })),
  ...Object.entries(sections).flatMap(([id, section]) => (section.cards || []).map(card => ({ id, title: card[1], tag: card[0], detail: card[2] })))
];

function showResults(query) {
  const term = query.trim().toLowerCase();
  if (!term) { results.hidden = true; return; }
  const matches = searchable.filter(item => `${item.title} ${item.tag} ${item.detail}`.toLowerCase().includes(term)).slice(0, 10);
  results.innerHTML = matches.length
    ? matches.map((item, i) => `<button class="result" data-index="${searchable.indexOf(item)}"><span class="result-tag">${escapeHtml(item.tag)}</span><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.detail)}</small></span></button>`).join('')
    : '<div class="result"><span><strong>No matches</strong><small>Try a destination, aircraft registration or topic.</small></span></div>';
  results.hidden = false;
  results.querySelectorAll('[data-index]').forEach(button => button.onclick = () => {
    const item = searchable[Number(button.dataset.index)];
    openSection(item.id);
    if (item.destinationCode) openDestination(item.destinationCode);
    results.hidden = true;
    search.value = '';
    content.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (item.aircraftId) document.getElementById(item.aircraftId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

search.addEventListener('input', () => showResults(search.value));
document.addEventListener('click', event => { if (!event.target.closest('.search-wrap')) results.hidden = true; });
document.addEventListener('keydown', event => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); search.focus(); }
  if (event.key === 'Escape') { results.hidden = true; search.blur(); }
});
openSection('destinations');

let installPrompt;
const installButton = document.querySelector('#install-button');
window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; installButton.hidden = false; });
installButton.addEventListener('click', async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  installButton.hidden = true;
});

const status = document.querySelector('#connection-status');
function updateStatus() { status.textContent = navigator.onLine ? 'Offline ready' : 'Offline mode'; }
window.addEventListener('online', updateStatus);
window.addEventListener('offline', updateStatus);
updateStatus();
const updateButton = document.querySelector('#update-button');
const updateLabel = updateButton.querySelector('.update-label');
let updateResetTimer;
function showUpdateButtonState(label, accessibleLabel = label) {
  updateLabel.textContent = label;
  updateButton.setAttribute('aria-label', accessibleLabel);
  updateButton.title = accessibleLabel;
}
function resetUpdateButton() {
  updateButton.disabled = false;
  showUpdateButtonState('Update', 'Check for updates');
}
updateButton.addEventListener('click', async () => {
  clearTimeout(updateResetTimer);
  if (!navigator.onLine) {
    showUpdateButtonState('Offline', 'Connect to the internet to check for updates');
    updateResetTimer = setTimeout(resetUpdateButton, 3000);
    return;
  }

  updateButton.disabled = true;
  showUpdateButtonState('Checking…', 'Checking for app updates');
  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    if (!registration) throw new Error('The offline app service is not available yet.');

    let updateFound = false;
    let finishUpdateCheck;
    const updateReady = new Promise(resolve => { finishUpdateCheck = resolve; });
    const watchWorker = worker => {
      if (!worker) return;
      updateFound = true;
      if (worker.state === 'activated') { finishUpdateCheck(true); return; }
      worker.addEventListener('statechange', () => {
        if (worker.state === 'activated') finishUpdateCheck(true);
        if (worker.state === 'redundant') finishUpdateCheck(false);
      });
    };
    registration.addEventListener('updatefound', () => watchWorker(registration.installing), { once: true });
    if (registration.installing) watchWorker(registration.installing);
    await registration.update();

    if (registration.installing && !updateFound) watchWorker(registration.installing);
    if (registration.installing || updateFound) {
      const updated = await Promise.race([updateReady, new Promise(resolve => setTimeout(() => resolve(false), 15000))]);
      if (updated) { window.location.reload(); return; }
    }

    showUpdateButtonState('Up to date', 'The app is up to date');
    updateButton.disabled = false;
    updateResetTimer = setTimeout(resetUpdateButton, 3000);
  } catch (error) {
    showUpdateButtonState('Try again', error.message || 'Could not check for updates');
    updateButton.disabled = false;
    updateResetTimer = setTimeout(resetUpdateButton, 4000);
  }
});
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => {}));
