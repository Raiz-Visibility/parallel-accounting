// Business details used across the site. Address and hours are still to be
// confirmed by the client (they carry the `ph` flag in the markup).
const address = '1002 Wharf Street, Victoria, BC V8W 1T4';

export const site = {
  name: 'Parallel Accounting',
  phone: '250-516-8889',
  tel: 'tel:2505168889',
  email: 'hello@parallelaccounting.co',
  mailto: 'mailto:hello@parallelaccounting.co',
  address,
  hours: 'Monday to Friday, 8:30am to 5:00pm PT',
  directions: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`,
  mapEmbed: `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`,
  // Formspree-style endpoint. Without it the forms fall back to opening an email.
  formEndpoint: import.meta.env.PUBLIC_FORM_ENDPOINT || '',
};

export const services = [
  { slug: 'bookkeeping', name: 'Bookkeeping' },
  { slug: 'accounts-payable', name: 'Accounts payable' },
  { slug: 'accounts-receivable', name: 'Accounts receivable' },
  { slug: 'payroll', name: 'Payroll' },
  { slug: 'controllership', name: 'Controllership' },
  { slug: 'fractional-cfo', name: 'Fractional CFO' },
];

export const nav = [
  { key: 'services', label: 'Services', href: '/services/' },
  { key: 'victoria', label: 'Victoria', href: '/locations/victoria/' },
  { key: 'who', label: 'Who we work with', href: '/about/' },
  { key: 'about', label: 'About', href: '/about/' },
  { key: 'blog', label: 'Blog', href: '/blog/' },
  { key: 'contact', label: 'Contact', href: '/contact/' },
];

// Prefix an internal path with the deploy base (GitHub Pages project sites live under /<repo>/).
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
export const u = (path: string) => base + path;
