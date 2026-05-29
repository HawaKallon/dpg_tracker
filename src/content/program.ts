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
  eyebrow: 'Sierra Leone · Digital Public Goods program',
  headline: 'DPG by the Numbers',
  tagline:
    'A live tracker for Sierra Leone’s Digital Public Goods program. The numbers update as the work happens.',
  mission:
    'We’re building Sierra Leone’s open-tech workforce. Students learn to ship software anyone can use. The universities and hubs we work with keep teaching after the project ends. Government and community groups walk away owning the tools we build together.',
  whoWeServe: [
    {
      label: 'Students and teachers',
      description: 'Mostly through partner universities and after-school clubs.',
    },
    {
      label: 'Builders and contributors',
      description: 'Developers and maintainers shipping open code.',
    },
    {
      label: 'Government and community groups',
      description: 'Adopting open tools they can run themselves.',
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
