import './styles.css';

let currentBridgeMode: 'CLIPBOARD' | 'LOCALHOST' | null = null;

const btnClipboard = document.getElementById('btn-clipboard') as HTMLButtonElement;
const btnLocalhost = document.getElementById('btn-localhost') as HTMLButtonElement;
const statusContainer = document.getElementById('status-container') as HTMLDivElement;
const statusText = document.getElementById('status-text') as HTMLParagraphElement;

function setStatus(message: string, isError: boolean = false) {
  statusContainer.classList.remove('hidden');
  statusText.textContent = message;
  statusText.style.color = isError ? '#FF8A8A' : '#A7F3D0';
}

function triggerExport(mode: 'CLIPBOARD' | 'LOCALHOST') {
  currentBridgeMode = mode;
  setStatus('Analyzing selection...', false);
  parent.postMessage({ pluginMessage: { type: 'EXPORT_UI' } }, '*');
}

btnClipboard.addEventListener('click', () => triggerExport('CLIPBOARD'));
btnLocalhost.addEventListener('click', () => triggerExport('LOCALHOST'));

window.onmessage = async (event) => {
  const msg = event.data.pluginMessage;
  if (!msg) return;

  switch (msg.type) {
    case 'STATUS':
      setStatus(msg.message, false);
      break;
      
    case 'ERROR':
      setStatus(msg.message, true);
      break;

    case 'EXPORT_SUCCESS':
      const jsonPayload = JSON.stringify(msg.payload);
      
      if (currentBridgeMode === 'CLIPBOARD') {
        try {
          // Creating a temporary textarea for clipboard copy due to Figma iframe restrictions
          const textArea = document.createElement("textarea");
          textArea.value = jsonPayload;
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          
          setStatus('✅ Copied to clipboard! Ready to paste in Studio.', false);
        } catch (err) {
          setStatus('Failed to copy to clipboard.', true);
          console.error(err);
        }
      } else if (currentBridgeMode === 'LOCALHOST') {
        setStatus('Sending to local bridge...', false);
        try {
          const response = await fetch('http://localhost:3000/export', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: jsonPayload
          });
          
          if (response.ok) {
            setStatus('✅ Synced with Roblox Studio!', false);
          } else {
            setStatus('❌ Local server rejected payload.', true);
          }
        } catch (err) {
          setStatus('❌ Connection refused. Is the bridge running?', true);
          console.error(err);
        }
      }
      break;
  }
};