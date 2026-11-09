const data = window.CSM_DATA;
const informationUpdated = document.querySelector('#information-updated');
if (informationUpdated && data.informationLastUpdated) {
  const updatedDate = new Date(`${data.informationLastUpdated}T00:00:00Z`);
  if (Number.isFinite(updatedDate.getTime())) {
    informationUpdated.textContent = `Info updated: ${new Intl.DateTimeFormat('en-IE', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(updatedDate)}`;
  }
}

const sections = {
  destinations: { title: 'Destination Guide', desc: 'Airport, station and hotel details for each destination.' },
  aircraft: { title: 'Aircraft Types', desc: 'Aircraft Seating Capacity and Registrations' },
  flightInfo: { title: 'Flight Information', desc: '' },
  flight: {
    title: 'Flight & Duty', desc: 'Flight & Duty Information',
    cards: [
      ['BASIC', 'Basic Maximum Daily FDP', 'Basic Maximum FDP is calculated from each crew member’s report time. It is then reduced according to the number of sectors operated as per the table.'],
      ['ACCLIMATISATION', 'Acclimatisation Checker', 'Check the acclimatisation state for a crew member leaving Dublin.'],
      ['NINTH CREW MEMBER', '9th Crew Member Protocol', 'When a transatlantic FDP is expected to exceed 13 hours, the CSM / No. 1 contacts the on-duty OCM and Crew Control to request a ninth crew member.']
    ]
  },
  ife: {
    title: 'IFE & Wi-Fi Quick Reference', desc: 'IFE Useful Guide & Troubleshooting',
    cards: [
      ['IFE', 'IFE system overview', 'Identify the system by aircraft and configuration, with links to current manuals.'],
      ['FLIGHT SETUP', 'Opening & closing a flight', 'Current approved steps for preparing the IFE system for each flight.'],
      ['TROUBLESHOOTING', 'IFE troubleshooting', 'Seat reset, media support, equipment power controls and escalation guidance. Verify against current manuals.'],
      ['WI-FI', 'Wi-Fi access & troubleshooting', 'Passenger access guidance, service status and current Wi-Fi troubleshooting instructions.']
    ]
  },
  crew: {
    title: 'Crew Admin', desc: 'Crew payments, credits, expenses and admin references.',
    cards: [
      ['CREDITS', 'Credits & payment dates', 'Current credit rules, values, payroll periods and payment dates.'],
      ['COMMISSION', 'Commission', 'Current commission policy, calculation and payroll timing.'],
      ['EXPENSES', 'Expenses & allowances', 'Current expense rates, receipts, claim process and overnight allowances.'],
      ['ADMIN', 'Other crew admin', 'Current MyView, roster, swaps and trip trade guidance.']
    ]
  },
  contacts: { title: 'Useful Contacts & Links', desc: '' }
};

const content = document.querySelector('#content-area');
const search = document.querySelector('#search');
const results = document.querySelector('#search-results');
let destinationClockTimer;

const destinationTimeZones = {
  DUB: 'Europe/Dublin',
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
  return `<div class="section-head"><div>${kicker ? `<span class="section-kicker">${escapeHtml(kicker)}</span>` : ''}<h2>${escapeHtml(title)}</h2></div>${description ? `<p>${escapeHtml(description)}</p>` : ''}</div>`;
}

function caution(text) {
  return `<div class="notice">${escapeHtml(text)}</div>`;
}

function renderUsefulContacts() {
  const renderGroup = (title, entries) => `<section class="useful-link-card"><h3>${escapeHtml(title)}</h3><div class="useful-link-list">${entries.map(entry => `<a class="useful-resource-link" href="${escapeHtml(entry.url)}" target="_blank" rel="noopener noreferrer"><span>${escapeHtml(entry.title)}</span><b aria-hidden="true">↗</b></a>`).join('')}</div></section>`;
  const contacts = (data.usefulContacts || []).map(contact => {
    const validPhone = contact.phone && /^[+()\d\s-]+$/.test(contact.phone);
    const routes = `${contactAction('EMAIL', contact.email, 'email')}${validPhone ? contactAction('CALL', contact.phone, 'phone') : contact.phone ? `<div class="contact-action contact-action-unverified"><span>PHONE · CHECK SOURCE</span><strong>${escapeHtml(contact.phone)}</strong></div>` : ''}`;
    return `<article class="useful-person-card"><h4>${escapeHtml(contact.name)}</h4><div class="contact-actions">${routes || '<span class="contact-missing">No contact route entered</span>'}</div></article>`;
  }).join('');
  content.innerHTML = heading('', sections.contacts.title, '')
    + `<div class="useful-link-grid">${renderGroup('Useful Links', data.usefulLinks || [])}${renderGroup('Useful Forms', data.usefulForms || [])}</div><section class="useful-contact-panel"><h3>Telephone &amp; Email Contacts</h3><div class="useful-contact-grid">${contacts}</div></section>`;
}

function renderCards(cards) {
  return `<div class="card-grid">${cards.map(card => {
    if (card[0] === 'BASIC') return renderBasicFdpCard(card);
    if (card[0] === 'ACCLIMATISATION') return renderAcclimatisationCard(card);
    if (card[0] === 'NINTH CREW MEMBER') return renderNinthCrewCard(card);
    return `<article class="card"><span class="card-tag">${escapeHtml(card[0])}</span><h3>${escapeHtml(card[1])}</h3><p>${escapeHtml(card[2])}</p><div class="card-foot">NOT POPULATED FROM THE PROVIDED WORKBOOKS</div></article>`;
  }).join('')}</div>`;
}

const basicFdpRows = [
    ['06:00–13:29', '13:00', '12:30', '12:00'], ['13:30–13:59', '12:45', '12:15', '11:45'],
    ['14:00–14:29', '12:30', '12:00', '11:30'], ['14:30–14:59', '12:15', '11:45', '11:15'],
    ['15:00–15:29', '12:00', '11:30', '11:00'], ['15:30–15:59', '11:45', '11:15', '10:45'],
    ['16:00–16:29', '11:30', '11:00', '10:30'], ['16:30–16:59', '11:15', '10:45', '10:15'],
    ['17:00–04:59', '11:00', '10:30', '10:00'], ['05:00–05:14', '12:00', '11:30', '11:00'],
    ['05:15–05:29', '12:15', '11:45', '11:15'], ['05:30–05:44', '12:30', '12:00', '11:30'],
    ['05:45–05:59', '12:45', '12:15', '11:45']
];

function renderBasicFdpCard(card) {
  const reportOptions = basicFdpRows.map(([reportTime], index) => `<option value="${index}">${reportTime}</option>`).join('');
  return `<article class="card fdp-card"><span class="card-tag">${escapeHtml(card[0])}</span><h3>${escapeHtml(card[1])}</h3><p>Select the report-time band in the applicable reference time zone (Dublin for B, outstation local time for D), then choose the number of sectors operated.</p><form class="acclim-checker" id="basic-fdp-checker"><label class="acclim-field"><span>Report time (reference time)</span><select name="reportTime" required><option value="">Select report-time band</option>${reportOptions}</select></label><label class="acclim-field"><span>Sectors operated</span><select name="sectors" required><option value="">Select sectors</option><option value="1">1–2 sectors</option><option value="2">3 sectors</option><option value="3">4 sectors</option></select></label><div class="acclim-actions"><button class="acclim-calculate" type="submit">Check maximum FDP</button><button class="acclim-reset" type="reset">Reset</button></div><div class="acclim-result fdp-basic-result" id="basic-fdp-result" role="status" aria-live="polite" hidden></div></form><p class="acclim-note">For an X (unknown) acclimatisation result, use the sector-based FDP caps shown in the acclimatisation checker.</p></article>`;
}

function renderAcclimatisationCard(card) {
  return `<article class="card fdp-card"><span class="card-tag">${escapeHtml(card[0])}</span><h3>${escapeHtml(card[1])}</h3><p>When reporting for duty in Dublin, assume you are acclimatised to Dublin local time (your home-base reference time). The time from that report until your next report at an outstation, together with the time difference at the next report, determines your acclimatisation state.</p><form class="acclim-checker" id="acclim-checker"><label class="acclim-field"><span>Time difference: Dublin to next duty local time</span><select name="difference" required><option value="">Select time difference</option><option value="0">Less than 4 hours</option><option value="1">4 hours but less than 6 hours</option><option value="2">6 hours but less than 9 hours</option><option value="3">9 hours but less than 12 hours</option></select></label><label class="acclim-field"><span>Time from Dublin report to next report</span><select name="elapsed" required><option value="">Select elapsed time</option><option value="0">Less than 48 hours</option><option value="1">48 to 71 hours 59 minutes</option><option value="2">72 to 95 hours 59 minutes</option><option value="3">96 to 119 hours 59 minutes</option><option value="4">120 hours or more</option></select></label><div class="acclim-actions"><button class="acclim-calculate" type="submit">Check acclimatisation</button><button class="acclim-reset" type="reset">Reset</button></div><div class="acclim-result" id="acclim-result" role="status" aria-live="polite" hidden></div></form><p class="acclim-note">This checker uses the information from EASA ORO.FTL.105 Definitions.</p></article>`;
}

content.addEventListener('submit', event => {
  if (event.target.id === 'basic-fdp-checker') {
    event.preventDefault();
    const reportTime = event.target.elements.reportTime.value;
    const sectors = event.target.elements.sectors.value;
    const result = event.target.querySelector('#basic-fdp-result');
    if (reportTime === '' || sectors === '') return;
    const maximumFdp = basicFdpRows[Number(reportTime)][Number(sectors)];
    result.innerHTML = `<div class="acclim-result-copy"><strong>Maximum Basic FDP</strong><p class="fdp-basic-result-time">${maximumFdp}</p></div>`;
    result.hidden = false;
    return;
  }
  if (event.target.id !== 'acclim-checker') return;
  event.preventDefault();
  const form = event.target;
  const difference = form.elements.difference.value;
  const elapsed = form.elements.elapsed.value;
  const result = form.querySelector('#acclim-result');
  if (difference === '' || elapsed === '') return;
  const matrix = [['B','D','D','D','D'],['B','X','D','D','D'],['B','X','X','D','D'],['B','X','X','X','D']];
  const code = matrix[Number(difference)][Number(elapsed)];
  const meanings = {
    B: ['Use Dublin home-base time', 'You are acclimatised to Dublin time. Use Dublin local time as your reference when determining the maximum daily FDP.'],
    D: ['Use outstation local time', 'You are acclimatised to the local time where your next duty starts. Use that local time when determining the maximum daily FDP.'],
    X: ['Unknown acclimatisation state', 'Your acclimatisation state is unknown. The duty start time no longer determines the maximum daily FDP; apply the sector-based cap below.']
  };
  const [title, description] = meanings[code];
  result.dataset.state = code;
  const sectorCaps = code === 'X' ? '<p class="acclim-cap-title"><strong>Maximum daily FDP cap</strong></p><ul class="acclim-cap-list"><li><b>1–2 sectors</b><span>11:00</span></li><li><b>3 sectors</b><span>10:30</span></li><li><b>4 sectors</b><span>10:00</span></li></ul>' : '';
  result.innerHTML = `<span class="acclim-result-code">${code}</span><div class="acclim-result-copy"><strong>${title}</strong><p>${description}</p>${sectorCaps}</div>`;
  result.hidden = false;
});
content.addEventListener('reset', event => {
  if (event.target.id !== 'acclim-checker' && event.target.id !== 'basic-fdp-checker') return;
  const result = event.target.querySelector(event.target.id === 'acclim-checker' ? '#acclim-result' : '#basic-fdp-result');
  result.hidden = true;
  delete result.dataset.state;
  result.textContent = '';
});

function renderNinthCrewCard(card) {
  return `<article class="card fdp-card"><span class="card-tag">${escapeHtml(card[0])}</span><h3>${escapeHtml(card[1])}</h3><p>The 9th Crew Member Protocol applies to transatlantic flights when it becomes apparent that the FDP will exceed 13 hours.</p><div class="protocol-steps"><section><h4>Starting the Process</h4><p>When this is known, the CSM / No. 1 should liaise with the on-duty Operations Crew Manager (OCM) and Crew Control to advise them that a 9th Crew Member is required.</p></section><section><h4>Required Information</h4><p>When contacting the OCM and Crew Control, provide all relevant information available, such as:</p><ul class="protocol-info-list"><li>Nature of the delay</li><li>Expected duration of the delay</li><li>Planned flight time</li><li>Planned taxi time for departure and arrival</li><li>Any other relevant information</li></ul></section><section><h4>When the ninth is provided</h4><p>The ninth crew member is surplus to the operating crew and should be used to support in-flight rest. Duty and rest should remain balanced among the operating cabin crew.</p></section><section><h4>If a 9th Crew Member is <em>NOT</em> Provided</h4><p>The CSM should inform the remaining operating crew and explain why a 9th Crew Member may not be available. If none is available, each operating crew member will receive the applicable approved short-crew credit shown below.</p></section><section><h4>Short-Crew Credits</h4><div class="fdp-table-scroll"><table class="fdp-table protocol-credit-table"><thead><tr><th scope="col">Situation in the protocol</th><th scope="col">Credits per crew member</th></tr></thead><tbody><tr><th scope="row">Known delay: FDP exceeds 13 hours and no 9th Crew Member is provided when requested</th><td>28</td></tr><tr><th scope="row">Unknown delay: maximum FDP exceeds 13 h 15 min</th><td>28</td></tr><tr><th scope="row">Unknown delay: maximum FDP is less than 13 h 15 min</th><td>10</td></tr></tbody></table></div></section></div><small class="fdp-source-note">Protocol dated 14 December 2018 · addendum dated 12 September 2019.</small></article>`;
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
    + `<div class="destination-heading"><div><span class="section-kicker">${escapeHtml(destination.code)} · OUTSTATION</span><h2>${escapeHtml(destination.name)}</h2></div><div class="destination-meta"><div><span>COUNTRY</span><strong>${escapeHtml(destination.country)}</strong></div><div><span>OPERATES</span><strong>${escapeHtml(destination.routeStatus)}</strong></div></div></div>`
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
    const nonBusinessSeats = zones.filter(([name]) => name !== 'Business').reduce((sum, [, seats]) => sum + seats, 0);
    const bar = zones.map(([name, seats]) => {
      const visualShare = name === 'Business' ? 25 : (nonBusinessSeats ? 75 * seats / nonBusinessSeats : 75);
      return `<div class="seat-zone${name === 'Business' ? ' seat-zone-business' : ''}" style="--zone:${visualShare.toFixed(2)}%"><strong>${seats}</strong></div>`;
    }).join('');
    const registrations = aircraft.registrations.join(', ');
    return `<article class="card aircraft-card" id="${aircraftId(aircraft)}"><div class="aircraft-card-head"><span class="card-tag">${escapeHtml(aircraft.type)}</span><strong class="aircraft-total">${aircraft.total}<small> seats</small></strong></div><div class="seat-bar" aria-label="Approximate cabin class visual; exact seat counts are listed below">${bar}</div><div class="seat-legend">${zones.map(([name, seats]) => `<span>${escapeHtml(name)} <b>${seats}</b></span>`).join('')}</div><div class="aircraft-stats"><div><span>CABIN CREW SEATS</span><strong>${aircraft.cabinCrewSeats}</strong></div><div><span>FLIGHT DECK REST</span><strong>${escapeHtml(aircraft.flightDeckRest)}</strong></div><div><span>CABIN CREW REST</span><strong>${escapeHtml(aircraft.cabinCrewRest)}</strong></div></div><div class="registration-list"><span>REGISTRATIONS</span><p>${escapeHtml(registrations)}</p></div></article>`;
  }).join('');
  content.innerHTML = heading('FLEET QUICK REFERENCE', sections.aircraft.title, sections.aircraft.desc)
    + caution(`${data.aircraft.length} aircraft across ${new Set(data.aircraft.map(item => item.type)).size} types. Configurations are grouped by seating and crew-seat details.`)
    + `<div class="card-grid aircraft-grid">${cards}</div>`;
}

const flightInfoStorageKey = 'csm-flight-information-v2';
const legacyFlightInfoStorageKey = 'csm-flight-information-v1';

function renderFlightInformation() {
  const destinationOptions = [{ name: 'Dublin', code: 'DUB' }, ...data.destinations].sort((a, b) => a.name.localeCompare(b.name))
    .map(destination => `<option value="${escapeHtml(destination.code)}">${escapeHtml(destination.name)} (${escapeHtml(destination.code)})</option>`).join('');
  content.innerHTML = heading('', sections.flightInfo.title, sections.flightInfo.desc)
    + `<form class="flight-form" id="flight-information-form" autocomplete="off">
      <div class="flight-form-grid">
        <section class="flight-panel"><div class="flight-panel-head"><h3>Destination &amp; Timings</h3></div>
          <div class="flight-fields">
            <label class="flight-field"><span>Destination</span><select name="destination"><option value="">Select destination</option>${destinationOptions}</select></label>
            <label class="flight-field"><span>Push Back Time (Dublin local)</span><input name="pushback" type="datetime-local"></label>
            <div class="flight-duration-pair">
              <label class="flight-field taxi-minutes-field"><span>Taxi (mins)</span><input name="taxiMinutes" type="number" min="0" step="1" inputmode="numeric" placeholder="10"></label>
              <fieldset class="flight-field duration-field"><legend>Flight Time</legend><div><label><input name="flightHours" type="number" min="0" max="30" inputmode="numeric" placeholder="0"><small>hours</small></label><b>:</b><label><input name="flightMinutes" type="number" min="0" max="59" inputmode="numeric" placeholder="00"><small>minutes</small></label></div></fieldset>
            </div>
          </div>
          <div class="arrival-summary"><span>ESTIMATED TIME OF ARRIVAL</span><div class="arrival-time"><small>DUBLIN LOCAL TIME</small><strong id="estimated-arrival-dublin">Enter push back time, taxi time and flight time</strong></div><div class="arrival-time"><small id="destination-arrival-label">DESTINATION LOCAL TIME</small><strong id="estimated-arrival-destination">Select destination</strong></div></div>
        </section>
        <section class="flight-panel"><div class="flight-panel-head"><h3>Passenger Figures</h3></div>
          <div class="passenger-counts">
            <label class="flight-field"><span>Business Class</span><input name="business" type="number" min="0" inputmode="numeric" placeholder="0"></label>
            <label class="flight-field"><span>Premium Economy</span><input name="premiumEconomy" type="number" min="0" inputmode="numeric" placeholder="0"></label>
            <label class="flight-field"><span>Economy</span><input name="economy" type="number" min="0" inputmode="numeric" placeholder="0"></label>
          </div>
          <div class="flight-fields passenger-extra">
            <label class="flight-field"><span>Number of Infants</span><input name="infants" type="number" min="0" inputmode="numeric" placeholder="0"></label>
            <label class="flight-field"><span>Number of PRMs</span><input name="prms" type="number" min="0" inputmode="numeric" placeholder="0"></label>
          </div>
          <div class="passenger-total"><span>TOTAL PASSENGERS</span><strong id="passenger-total">0</strong></div>
        </section>
        <section class="flight-panel notes-panel"><div class="flight-panel-head"><span class="card-tag">IN-FLIGHT</span><h3>Weather &amp; Other Information</h3></div>
          <div class="flight-fields notes-fields">
            <label class="flight-field"><span>Weather Inflight</span><textarea name="weather" rows="3" placeholder="Enter relevant in-flight weather information"></textarea></label>
            <label class="flight-field"><span>Other Notes or Information</span><textarea name="notes" rows="3" placeholder="Add any other flight information"></textarea></label>
          </div>
        </section>
      </div>
      <div class="flight-form-footer"><small id="flight-save-status" role="status">Entries are saved on this device only. Clear the sheet before the next flight.</small><button class="clear-flight-button" type="button" id="clear-flight-information">Clear Flight Information</button></div>
    </form>`;

  const form = content.querySelector('#flight-information-form');
  const saveStatus = content.querySelector('#flight-save-status');
  let restoredSavedInfo = false;
  try {
    const currentSave = localStorage.getItem(flightInfoStorageKey);
    const usingLegacySave = currentSave === null;
    const saved = JSON.parse(currentSave || localStorage.getItem(legacyFlightInfoStorageKey) || '{}');
    if (usingLegacySave && saved.takeoff && !saved.pushback) saved.pushback = saved.takeoff;
    if (Object.hasOwn(saved, 'taxiHours')) {
      const taxiHoursValue = saved.taxiHours;
      const taxiMinutesValue = saved.taxiMinutes;
      saved.taxiMinutes = taxiHoursValue === '' && taxiMinutesValue === ''
        ? ''
        : String((Number(taxiHoursValue) || 0) * 60 + (Number(taxiMinutesValue) || 0));
      delete saved.taxiHours;
    }
    delete saved.registration;
    delete saved.takeoff;
    Object.entries(saved).forEach(([name, value]) => {
      if (form.elements[name]) form.elements[name].value = value;
    });
    restoredSavedInfo = Object.keys(saved).length > 0;
    if (restoredSavedInfo) saveStatus.textContent = 'Saved flight information restored from this device. Clear before the next flight.';
  } catch {
    saveStatus.textContent = 'Local storage is unavailable in this browser session.';
  }

  const updateFlightSummary = () => {
    const total = ['business', 'premiumEconomy', 'economy'].reduce((sum, name) => sum + Math.max(0, Number(form.elements[name].value) || 0), 0);
    content.querySelector('#passenger-total').textContent = total.toLocaleString('en-IE');

    const pushbackValue = form.elements.pushback.value;
    const flightHours = Number(form.elements.flightHours.value) || 0;
    const flightMinutes = Number(form.elements.flightMinutes.value) || 0;
    const taxiMinutes = Number(form.elements.taxiMinutes.value) || 0;
    const hasFlightTime = form.elements.flightHours.value !== '' || form.elements.flightMinutes.value !== '';
    const hasTaxiTime = form.elements.taxiMinutes.value !== '';
    const estimatedDublin = content.querySelector('#estimated-arrival-dublin');
    const estimatedDestination = content.querySelector('#estimated-arrival-destination');
    const destination = data.destinations.find(item => item.code === form.elements.destination.value)
      || (form.elements.destination.value === 'DUB' ? { name: 'Dublin', code: 'DUB' } : null);
    content.querySelector('#destination-arrival-label').textContent = destination
      ? `ESTIMATED ARRIVAL · ${destination.name.toUpperCase()} LOCAL TIME`
      : 'DESTINATION LOCAL TIME';

    if (!pushbackValue || !hasFlightTime || !hasTaxiTime) {
      estimatedDublin.textContent = 'Enter push back time, taxi time and flight time';
      estimatedDestination.textContent = destination ? 'Enter timings to calculate' : 'Select destination';
      return;
    }

    const pushback = new Date(pushbackValue);
    const invalidDuration = flightHours < 0 || flightHours > 30 || flightMinutes < 0 || flightMinutes > 59
      || taxiMinutes < 0 || !Number.isInteger(taxiMinutes);
    if (!Number.isFinite(pushback.getTime()) || invalidDuration) {
      estimatedDublin.textContent = 'Check the push back time and durations';
      estimatedDestination.textContent = 'Check the push back time and durations';
      return;
    }

    const arrival = new Date(pushback.getTime() + (flightHours * 60 + flightMinutes + taxiMinutes) * 60_000);
    const formatArrival = timeZone => new Intl.DateTimeFormat('en-IE', {
      timeZone, weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
      hourCycle: 'h23', timeZoneName: 'short'
    }).format(arrival);
    estimatedDublin.textContent = formatArrival('Europe/Dublin');
    const destinationTimeZone = destinationTimeZones[destination?.code];
    estimatedDestination.textContent = destination
      ? (destinationTimeZone ? formatArrival(destinationTimeZone) : 'Time zone unavailable')
      : 'Select destination';
  };

  form.addEventListener('input', () => {
    updateFlightSummary();
    try {
      const values = Object.fromEntries(new FormData(form).entries());
      localStorage.setItem(flightInfoStorageKey, JSON.stringify(values));
      localStorage.removeItem(legacyFlightInfoStorageKey);
      saveStatus.textContent = 'Changes saved on this device. Clear the sheet before the next flight.';
    } catch {
      saveStatus.textContent = 'Could not save in this browser session.';
    }
  });
  updateFlightSummary();

  content.querySelector('#clear-flight-information').addEventListener('click', () => {
    if (!window.confirm('Clear all saved flight information from this device?')) return;
    form.reset();
    try { localStorage.removeItem(flightInfoStorageKey); } catch {}
    saveStatus.textContent = 'Flight information cleared from this device.';
    updateFlightSummary();
  });
}

function openSection(id) {
  clearInterval(destinationClockTimer);
  setActive(id);
  if (id === 'destinations') return renderDestinations();
  if (id === 'aircraft') return renderAircraft();
  if (id === 'flightInfo') return renderFlightInformation();
  if (id === 'contacts') return renderUsefulContacts();
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
  ...Object.entries(sections).flatMap(([id, section]) => (section.cards || []).map(card => ({ id, title: card[1], tag: card[0], detail: card[2] }))),
  ...(data.usefulLinks || []).map(link => ({ id: 'contacts', title: link.title, tag: 'USEFUL LINK', detail: 'Company website or service' })),
  ...(data.usefulForms || []).map(form => ({ id: 'contacts', title: form.title, tag: 'USEFUL FORM', detail: 'Online form' })),
  ...(data.usefulContacts || []).map(contact => ({ id: 'contacts', title: contact.name, tag: 'CONTACT', detail: [contact.phone, contact.email].filter(Boolean).join(' · ') }))
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
openSection('flightInfo');

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
