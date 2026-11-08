process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const fs = require('fs');
const path = require('path');

const RAW_AIRCRAFT_FILES = {
  turboprop: {
    exteriors: [
      'Piaggio p 180 03.jpg',
      'Piaggio P-180 Avanti Rennes 2010.jpg',
      'Piaggio P 180 Avanti at Paris Air Show 2009.jpg',
      'Italian Turboprop Aircraft Piaggio P.180 Avanti. MAKS 2011 Airshow. Moscow.jpg',
      'Pilatus PC-12-45 N292P (630) (4691709427).jpg',
      'Pilatus PC-12-45 N644SD (644) (4874549786).jpg',
      'Beechcraft B200 Super King Air, Flight Precision JP6047307.jpg',
    ],
    cabins: [
      'Pilatus PC-12 cabin interior.jpg',
      'Pilatus PC-12 interior cabin.jpg',
      'Pilatus PC 12 N777JZ interior photo Don Ramey Logan.jpg',
      'Beechcraft King Air 350i interior.jpg',
      'Beechcraft King Air 350i interior 2.jpg',
      'King Air 360 cabin.jpg',
      'Daher-Socata TBM-850 cabin interior.jpg',
      'Piaggio P180 Avanti cabin interior facing forward.jpg',
      'Interior of Piaggio P180 Avanti cabin facing aft.jpg',
    ],
    cockpits: [
      'Cockpit PC-12 linke Seite.JPG',
      '2007 Pilatus PC-12 panel photo Don Ramey Logan.jpg',
    ]
  },

  piston: {
    exteriors: [
      'G-DVOR - Diamond DA62 - Flight Calibration Services (36251498543).jpg',
      'G-TACN Diamond DA62 (Flight Calibration Services) (46974301492).jpg',
      'Cirrus.sr22.n147vc.arp.jpg',
      'Cirrus SR22 KVGT (3334257735).jpg',
    ],
    cabins: [
      'Cirrus SR22 interior.jpg',
      'Beechcraft A36 Bonanza Interior (52468161179).jpg',
      'Beechcraft Bonanza (52464504586).jpg',
      'Beechcraft Bonanza (52465044153).jpg',
    ],
    cockpits: [
      'Cessna T182T Cockpit - Garmin G1000.jpg',
      'Garmin G1000 Diamond DA-42.jpg',
    ]
  },

  'entry-level': {
    exteriors: [
      'HondaJet Ryabtsev.jpg',
      'HondaJetFormation.jpg',
      'VH-PNM Embraer 500 Phenom 100 (6485946457).jpg',
      'N600HT Embraer EMB-500 Phenom 100 s-n 50000036 (34669037592).jpg',
      '45 (R) Squadron, Embraer Phenom 100 MOD 45164817.jpg',
    ],
    cabins: [
      'Citation Mustang Int.jpg',
      'Cessna Citation Mustang cabin interior.jpg',
      'HA420 HondaJet N719SJ cabin.jpg',
      'HondaJet cabin mockup, EBACE 2018, Le Grand-Saconnex (BL7C0448).jpg',
      'HondaJet cabin mockup, EBACE 2018, Le Grand-Saconnex (BL7C0447).jpg',
      'Embraer Phenom 100 cabin (45 (R) Squadron).jpg',
      'Embraer Phenom 100, EBACE 2019, Le Grand-Saconnex (EB190457).jpg',
    ],
    cockpits: [
      'Embraer Phenom 100 cockpit (45 (R) Squadron).jpg',
      'Cessna Citation Mustang interior cabin and cockpit.jpg',
    ]
  },

  light: {
    exteriors: [
      'Learjet 45 of the Irish Air Corps in flight.jpg',
      'Embraer 505 Phenom 300, Private JP7321031.jpg',
      'Private flight Netjets to FLL airplane N423QS Embraer Phenom 300.jpg',
    ],
    cabins: [
      'EBACE 2019, Le Grand-Saconnex (EB190537).jpg',
      'Embraer Phenom 300 cabin, EBACE 2019 (EB190435, cropped).jpg',
      'Embraer EMB-505 Phenom 300 cabin forward view.jpg',
      'Cabin Phenom 300.jpg',
      'Citation CJ3+ cabin, EBACE 2023, Le Grand-Saconnex (EB237565).jpg',
      'Cabin of Cessna 525B CitationJet 3.jpg',
      'Cessna Citation CJ3 Cabin.JPG',
      'Cessna Citation CJ3 Cabin 2.JPG',
    ],
    cockpits: [
      'Embraer EMB-505 Phenom 300 cockpit.jpg',
      'Cessna Citation CJ4 cockpit.jpg',
    ]
  },

  'super-light': {
    exteriors: [
      'Pilatus PC-24, P01, HB-VXA (18743050229).jpg',
      'Pilatus PC-24, P01, HB-VXA (18743050229) (cropped).jpg',
    ],
    cabins: [
      'EBACE 2019, Le Grand-Saconnex (EB190537).jpg',
      'EBACE 2023, Le Grand-Saconnex (EB237695).jpg',
      'EBACE 2023, Le Grand-Saconnex (EB237697).jpg',
      'Embraer EMB-505 Phenom 300 cabin forward view.jpg',
    ],
    cockpits: [
      'MFD-Cessna Citation XLS.jpg',
      'Embraer EMB-505 Phenom 300 cockpit.jpg',
    ]
  },

  midsize: {
    exteriors: [
      'Untitled Learjet 60 ES-III.jpg',
      'EBACE 2023, Le Grand-Saconnex (EB237617).jpg',
    ],
    cabins: [
      'Cessna Citation Sovereign interior.jpg',
      'Cessna Citation Sovereign cabin interior.jpg',
      'Interior Cessna Citation Sovereign cabin.jpg',
      'Citation Latitude, EBACE 2019, Le Grand-Saconnex (EB190627).jpg',
      'EBACE 2019, Le Grand-Saconnex (EB190620).jpg',
      'EBACE 2019, Le Grand-Saconnex (EB190622).jpg',
      'EBACE 2019, Le Grand-Saconnex (EB190628).jpg',
    ],
    cockpits: [
      'Citation Latitude Cockpit, EBACE 2023, Le Grand-Saconnex (EB237584).jpg',
    ]
  },

  'super-midsize': {
    exteriors: [
      'Gulfstream G280, EBACE 2018, Le Grand-Saconnex (BL7C0664).jpg',
      'Gulfstream G280, EBACE 2018, Le Grand-Saconnex (BL7C0663).jpg',
      'Gulfstream G280, EBACE 2018, Le Grand-Saconnex (BL7C0660).jpg',
      'Gulfstream G280, EBACE 2018, Le Grand-Saconnex (BL7C0637).jpg',
    ],
    cabins: [
      'Gulfstream G280 cabin interior with divan.JPG',
      'Gulfstream G280 cabin interior aft view.JPG',
      'Gulfstream G280, EBACE 2018, Le Grand-Saconnex (BL7C0661).jpg',
      'Gulfstream G280, EBACE 2018, Le Grand-Saconnex (BL7C0660).jpg',
      'Embraer, EBACE 2019, Le Grand-Saconnex (EB190431).jpg',
      'Embraer, EBACE 2019, Le Grand-Saconnex (EB190432).jpg',
    ],
    cockpits: [
      'Citation Latitude Cockpit, EBACE 2023, Le Grand-Saconnex (EB237584).jpg',
    ]
  },

  heavy: {
    exteriors: [
      'N483CM Gulfstream G IV-X G450 GLF4 (14259085846).jpg',
      'Gulfstream G550 (4919721649).jpg',
    ],
    cabins: [
      'Gulfstream G550 cabin interior.JPG',
      'Gulfstream G550, EBACE 2018, Le Grand-Saconnex (BL7C0727).jpg',
      'Gulfstream G550, EBACE 2018, Le Grand-Saconnex (BL7C0719).jpg',
      'Gulfstream G550, EBACE 2018, Le Grand-Saconnex (BL7C0715).jpg',
      'Embraer, EBACE 2019, Le Grand-Saconnex (EB190423).jpg',
      'Embraer, EBACE 2019, Le Grand-Saconnex (EB190421).jpg',
    ],
    cockpits: [
      'Gulfstream G550 flight deck in 2011.jpg',
      'Gulfstream G550 flight deck.jpg',
    ]
  },

  'ultra-long-range': {
    exteriors: [
      'Paris Air Show 2017 Falcon 8X inflight.jpg',
      'Dassault Falcon 8X F-WWQA Bourget 2017 n2.jpg',
      'Dassault Falcon 8X F-WWQA Bourget 2017 n3.jpg',
      'Dassault Falcon 8X, Paris Air Show 2019, Le Bourget (SIAE8623).jpg',
      'Global 7500, EBACE 2018, Le Grand-Saconnex (BL7C0584).jpg',
    ],
    cabins: [
      'Gulfstream G650ER, EBACE 2018, Le Grand-Saconnex (BL7C0752).jpg',
      'Gulfstream G650ER, EBACE 2018, Le Grand-Saconnex (BL7C0749).jpg',
      'Gulfstream G650ER, EBACE 2018, Le Grand-Saconnex (BL7C0744).jpg',
      'Gulfstream G650ER, EBACE 2018, Le Grand-Saconnex (BL7C0740).jpg',
      'Qatar Executive G650, EBACE 2019, Le Grand-Saconnex (EB190516).jpg',
      'Dassault Falcon 7X forward cabin interior 2.JPG',
      'Interior of Dassault Falcon 7X aft cabin and bedroom.JPG',
      'Dassault Falcon 7X aft cabin and bedroom.JPG',
      'Bombardier Global 6000 interior.JPG',
      'Bombardier Global 6000 bedroom.JPG',
      'Bombardier Global 6000, EBACE 2019, Le Grand-Saconnex (EB190597).jpg',
    ],
    cockpits: [
      'Cockpit G650 N520GA.jpg',
      'Gulfstream G650ER, EBACE 2018, Le Grand-Saconnex (BL7C0736).jpg',
      'Bombardier Global 6000 N835GL cockpit.jpg',
    ]
  },

  'vip-airliner': {
    exteriors: [
      'Airbus A319-133 ACJ ‘VP-BMH’ (55230489180).jpg',
      'A7-MED JFK Park On JAT Ramp Private A319 133 ACJ Qatar Amiri Flight Small.png',
      '9H-AFK A319-115X ACJ Comlux Malta TLS 07SEP10 (4979481371).jpg',
      'HZ-101 Boeing 737 BBJ (7420269408).jpg',
    ],
    cabins: [
      'Interior of Boeing 727-76 2-MMTT, November 2026.jpg',
      '9H-AFK Airbus A319 Comlux Interior (7608259550).jpg',
      'ACJ319neo, EBACE 2023, Le Grand-Saconnex (EB237727).jpg',
      'Bombardier Global 6000 bedroom.JPG',
      'Interior of Dassault Falcon 7X aft cabin and bedroom.JPG',
    ],
    cockpits: [
      'Bombardier Global 6000 N835GL cockpit.jpg',
      'Cockpit G650 N520GA.jpg',
    ]
  },

  // Lavatories / Toilets
  lavatories: [
    'Bombardier Global 6000 lavatory with shower.JPG',
    'Bombardier Global 6000 shower.JPG',
    'Gulfstream G280 lavatory sink.JPG',
    'EBACE 2019, Le Grand-Saconnex (EB190446).jpg',
    'EBACE 2019, Le Grand-Saconnex (EB190456).jpg',
    'EBACE 2019, Le Grand-Saconnex (EB190453).jpg',
    'EBACE 2019, Le Grand-Saconnex (EB190626).jpg',
    'First class Lavatory with Window.jpg',
    'Lavatory in Sukhoi Superjet 100.jpg',
    'Sukhoi Superjet 100 lavatory (6389156637).jpg',
    'Gulfstream G600, EBACE 2018, Le Grand-Saconnex (BL7C0696).jpg',
    'Gulfstream G280, EBACE 2018, Le Grand-Saconnex (BL7C0657).jpg',
  ],

  // Galleys / Refreshment Center
  galleys: [
    'Gulfstream G550, EBACE 2018, Le Grand-Saconnex (BL7C0715).jpg',
    'Embraer, EBACE 2019, Le Grand-Saconnex (EB190427).jpg',
    'Vistajet, EBACE 2019, Le Grand-Saconnex (EB190483).jpg',
    'Bombardier Global 6000, EBACE 2019, Le Grand-Saconnex (EB190597).jpg',
    'Gulfstream G650ER, EBACE 2018, Le Grand-Saconnex (BL7C0740).jpg',
  ]
};

async function resolveWikimediaFiles(filenames) {
  const urlMap = {};
  const chunks = [];
  const chunkSize = 25;

  for (let i = 0; i < filenames.length; i += chunkSize) {
    chunks.push(filenames.slice(i, i + chunkSize));
  }

  for (const chunk of chunks) {
    const titles = chunk.map(f => `File:${f}`).join('|');
    const params = new URLSearchParams({
      action: 'query',
      titles,
      prop: 'imageinfo',
      iiprop: 'url',
      iiurlwidth: '1280',
      format: 'json',
    });

    try {
      const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params.toString()}`, {
        headers: { 'User-Agent': 'OrbeloApp/1.0 (aviation-system@orbelo.com)' }
      });
      const data = await res.json();
      const pages = Object.values(data.query?.pages || {});
      pages.forEach(p => {
        const titleWithoutFile = p.title.replace(/^File:/, '');
        if (p.imageinfo?.[0]?.thumburl) {
          urlMap[titleWithoutFile] = p.imageinfo[0].thumburl;
        } else if (p.imageinfo?.[0]?.url) {
          urlMap[titleWithoutFile] = p.imageinfo[0].url;
        }
      });
    } catch (err) {
      console.warn('Chunk resolution error:', err.message);
    }
    await new Promise(r => setTimeout(r, 350));
  }

  return urlMap;
}

async function main() {
  const allFiles = new Set();
  for (const cat of Object.keys(RAW_AIRCRAFT_FILES)) {
    if (Array.isArray(RAW_AIRCRAFT_FILES[cat])) {
      RAW_AIRCRAFT_FILES[cat].forEach(f => allFiles.add(f));
    } else {
      ['exteriors', 'cabins', 'cockpits'].forEach(k => {
        (RAW_AIRCRAFT_FILES[cat][k] || []).forEach(f => allFiles.add(f));
      });
    }
  }

  console.log(`Resolving ${allFiles.size} unique authentic aircraft photos...`);
  const resolved = await resolveWikimediaFiles([...allFiles]);
  console.log(`Successfully resolved ${Object.keys(resolved).length} of ${allFiles.size}`);

  // Test all resolved URLs with HEAD requests
  console.log('Testing image URLs...');
  let validCount = 0;
  for (const [file, url] of Object.entries(resolved)) {
    try {
      const res = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': 'OrbeloValidator/1.0' } });
      if (res.ok) {
        validCount++;
      } else {
        console.warn(`[FAIL] ${file} (${res.status}): ${url}`);
      }
    } catch (e) {
      console.warn(`[ERROR] ${file}: ${e.message}`);
    }
  }

  console.log(`Validation complete: ${validCount} of ${Object.keys(resolved).length} are live and accessible!`);

  fs.writeFileSync(path.resolve(__dirname, 'verifiedAviationUrlMap.json'), JSON.stringify(resolved, null, 2), 'utf8');
}

main().catch(console.error);
