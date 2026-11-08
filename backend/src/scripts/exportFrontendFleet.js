const fs = require('fs');
const path = require('path');
const { getFullFleet } = require('../seed/fleetData');

const fleet = getFullFleet();
const tsItems = fleet.map(a => {
  const slug = a.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return {
    id: slug,
    name: a.name,
    manufacturer: a.manufacturer,
    category: a.category,
    categoryLabel: a.categoryLabel,
    registration: '', // No tail numbers
    tagline: a.tagline,
    description: a.description,
    passengers: a.passengers,
    passengersLabel: a.passengersLabel,
    range: a.range,
    rangeLabel: a.rangeLabel,
    cabinHeight: a.cabinHeightM,
    cabinWidth: a.cabinWidthM,
    baggageVolume: `${a.baggageVolumeCuFt} cu ft`,
    cruiseSpeed: `${a.cruiseSpeedKtas} ktas`,
    yearOfManufacture: a.yearManufactured,
    yearOfRefurbishment: a.yearRefurbished,
    pricePerHour: a.pricePerHour,
    toilette: a.toilette,
    smokingCabin: false,
    imageExterior: a.imageExterior,
    imageInterior: a.imageInterior,
    images: a.images,
    additionalImages: a.additionalImages
  };
});

const fileContent = `import { Aircraft } from "@/types/aviation";

export const fleetData: Aircraft[] = ${JSON.stringify(tsItems, null, 2)};

export function getAircraftById(id: string): Aircraft {
  return fleetData.find((a) => a.id === id) || fleetData[0];
}
`;

const targetPath = path.resolve(__dirname, '../../../src/data/fleet.ts');
fs.writeFileSync(targetPath, fileContent, 'utf8');
console.log(`✅ Successfully exported ${tsItems.length} private jets to ${targetPath}`);
