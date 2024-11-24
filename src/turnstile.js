export async function verifyTurnstileToken(token, secretKey, ip) {
  const formData = new FormData();
  formData.append('response', token);
  formData.append('secret', secretKey);
  formData.append('remoteip', ip);

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: formData,
  });
  const data = await response.json();
  console.log(data);
  return data.success;
}
