const SITE_KEY = '0x4AAAAAAA0xruPPz0mcXmBX';
function onLoadTurnstile() {
  turnstile.render('#turnstile-widget', {
    sitekey: SITE_KEY,
    callback: onTurnstileSuccess,
    'error-callback': onTurnstileError,
    'expired-callback': onTurnstileExpired,
  });
}

async function onTurnstileSuccess(token) {
  const formData = new FormData();
  formData.append('cf-turnstile-response', token);

  const response = await fetch('/auth', {
    method: 'POST',
    body: formData,
  });

  if (response.ok) {
    translateBtn.disabled = false;
    genImageBtn.disabled = false;
  } else {
    alert('認証に失敗しました。再度お試しください。');
  }
}

function onTurnstileError() {
  alert('Turnstileエラーが発生しました。再度お試しください。');
}

function onTurnstileExpired() {
  translateBtn.disabled = true;
  genImageBtn.disabled = true;
  turnstile.reset();
}
