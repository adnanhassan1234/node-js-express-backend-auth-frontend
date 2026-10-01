/**
 * Mulkon ki list — dropdown ke liye.
 *
 * Playbook ke markets upar alag rakhe hain, kyunke 90% kaam inhi me hota hai
 * aur har dafa poori list me dhoondna waqt ka zaya hai. Baqi list poori hai,
 * taake kisi bhi mulk ka buyer add ho sake.
 */

/** Playbook ke markets — UK, Ireland, Australia, USA, Canada, UAE, Qatar, Gulf */
export const PRIMARY_MARKETS = [
  'United Kingdom',
  'United States',
  'Ireland',
  'Australia',
  'Canada',
  'New Zealand',
  'United Arab Emirates',
  'Qatar',
  'Saudi Arabia',
  'Kuwait',
  'Oman',
  'Bahrain',
];

export const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda',
  'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain',
  'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
  'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria',
  'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada', 'Cape Verde',
  'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros',
  'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark',
  'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador',
  'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji',
  'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece',
  'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras',
  'Hong Kong', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
  'Israel', 'Italy', 'Ivory Coast', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan',
  'Kenya', 'Kiribati', 'Kosovo', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon',
  'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Macau',
  'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands',
  'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia',
  'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal',
  'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea',
  'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama',
  'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
  'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia',
  'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe',
  'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore',
  'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea',
  'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland',
  'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo',
  'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu',
  'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States',
  'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam',
  'Yemen', 'Zambia', 'Zimbabwe',
];

/**
 * Jo log "UK", "USA", "UAE" likhte hain — unhein poore naam par le aata hai.
 *
 * Zaroori hai kyunke sheet se import hui rows me chhote naam aate hain, aur
 * phir dropdown unhein pehchanta nahi.
 */
export const COUNTRY_ALIASES = {
  uk: 'United Kingdom',
  'u.k.': 'United Kingdom',
  gb: 'United Kingdom',
  britain: 'United Kingdom',
  'great britain': 'United Kingdom',
  england: 'United Kingdom',
  scotland: 'United Kingdom',
  wales: 'United Kingdom',
  'northern ireland': 'United Kingdom',
  usa: 'United States',
  'u.s.a.': 'United States',
  us: 'United States',
  'u.s.': 'United States',
  america: 'United States',
  'united states of america': 'United States',
  uae: 'United Arab Emirates',
  'u.a.e.': 'United Arab Emirates',
  emirates: 'United Arab Emirates',
  ksa: 'Saudi Arabia',
  nz: 'New Zealand',
  roi: 'Ireland',
};

/** Jo likha hai usay list wale naam par le aata hai, warna waisa hi chhor deta hai */
export const normalizeCountry = (value) => {
  const v = String(value || '').trim();
  if (!v) return '';

  const alias = COUNTRY_ALIASES[v.toLowerCase()];
  if (alias) return alias;

  const exact = COUNTRIES.find((c) => c.toLowerCase() === v.toLowerCase());
  return exact || v;
};
