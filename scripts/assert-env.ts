const prod = process.env.NODE_ENV === 'production';
if (prod && (!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || !process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY.trim())) {
  console.error('Missing NEXT_PUBLIC_RECAPTCHA_SITE_KEY in production.');
  process.exit(1);
}