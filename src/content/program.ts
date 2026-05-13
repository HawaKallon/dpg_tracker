// Edit-me: program narrative content shown on the public dashboard.
// This is intentionally a plain TS module — no CMS — so changes ship via PR.

export type ProgramPartner = {
  name: string;
  role?: string;
  url?: string;
  logoUrl?: string;
};

export const programContent = {
  region: 'Sierra Leone',
  programName: 'Digital Public Goods',
  eyebrow: 'Sierra Leone · Digital Public Goods Program',
  headline: 'DPG by the Numbers',
  tagline:
    'A live tracker of participation, reach, and engagement across universities, hubs, and online communities advancing Digital Public Goods in Sierra Leone.',
  mission:
    'The DPG Sierra Leone initiative grows local capacity around open-source software, open data, open AI models, open content, and open standards that solve sustainable development challenges. We train students and developers, support university and hub partners, and connect contributors with the global DPG ecosystem.',
  whoWeServe: [
    {
      label: 'Students & educators',
      description: 'Across partner universities and innovation hubs nationwide.',
    },
    {
      label: 'Developers & contributors',
      description: 'Building, deploying, and maintaining digital public goods locally.',
    },
    {
      label: 'Government & civil society',
      description: 'Adopting open solutions for public-sector challenges.',
    },
  ],
  partners: [
    // Add partner orgs here. Example shape:
    // { name: 'UNICEF', role: 'Founding funder', url: 'https://www.unicef.org' },
  ] as ProgramPartner[],
  funders: [
    // Funder-attribution row. Example:
    // { name: 'Funder Name', logoUrl: '/funders/name.svg', url: 'https://...' },
  ] as ProgramPartner[],
} as const;
