/**
 * Pick front or back camera deviceId when labels are available (after permission granted).
 */
export async function pickCameraDevice(preferBack) {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const inputs = devices.filter(d => d.kind === 'videoinput');
    if (inputs.length === 0) return null;
    if (inputs.length === 1) return inputs[0].deviceId;

    const back = inputs.find(d => /back|rear|environment|wide|tele/i.test(d.label));
    const front = inputs.find(d => /front|user|face|selfie|facetime/i.test(d.label));

    if (preferBack) {
      if (back) return back.deviceId;
      return inputs[inputs.length - 1]?.deviceId ?? null;
    }
    if (front) return front.deviceId;
    return inputs[0]?.deviceId ?? null;
  } catch {
    return null;
  }
}

export function buildVideoConstraints(preferBack, deviceId) {
  if (deviceId) {
    return { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } };
  }
  return preferBack
    ? { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
    : { facingMode: { ideal: 'user' }, width: { ideal: 1280 }, height: { ideal: 720 } };
}

export async function acquireVideoTrack(preferBack) {
  const deviceId = await pickCameraDevice(preferBack);
  const attempts = [
    buildVideoConstraints(preferBack, deviceId),
    preferBack ? { facingMode: 'environment' } : { facingMode: 'user' },
    preferBack ? { facingMode: { ideal: 'environment' } } : { facingMode: { ideal: 'user' } },
  ];

  let lastErr;
  for (const video of attempts) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video, audio: false });
      const track = stream.getVideoTracks()[0];
      if (track) return track;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('Could not access camera');
}

/**
 * Replace video track on an existing stream; stops previous video tracks.
 */
export async function replaceStreamVideoTrack(stream, preferBack) {
  stream?.getVideoTracks().forEach(t => {
    t.stop();
    stream.removeTrack(t);
  });

  const newTrack = await acquireVideoTrack(preferBack);
  stream.addTrack(newTrack);
  return newTrack;
}

/**
 * First-time camera start with audio + front video.
 */
export async function startCameraWithAudio(preferBack = false) {
  const deviceId = await pickCameraDevice(preferBack);
  const video = buildVideoConstraints(preferBack, deviceId);

  try {
    return await navigator.mediaDevices.getUserMedia({ video, audio: true });
  } catch {
    return await navigator.mediaDevices.getUserMedia({
      video: preferBack ? { facingMode: 'environment' } : { facingMode: 'user' },
      audio: true,
    });
  }
}
