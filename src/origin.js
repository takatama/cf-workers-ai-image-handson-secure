export function verifyOrigin(request, allowedOrigin) {
  const origin = request.headers.get('Origin');
  const secFetchSite = request.headers.get('Sec-Fetch-Site');

  if (origin !== allowedOrigin) {
    return false;
  }

  if (secFetchSite && secFetchSite !== 'same-origin') {
    return false;
  }

  return true;
}
