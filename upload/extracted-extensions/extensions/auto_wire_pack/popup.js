const BRIDGE = 'http://127.0.0.1:5005';

async function refreshStatus() {
  try {
    const res = await fetch(`${BRIDGE}/v1/bridge/poll`);
    const data = await res.json();
    document.getElementById('bridge-status').textContent = (data.status || 'IDLE').toUpperCase();
    document.getElementById('project-id').textContent = data.project_id || '---';
    document.getElementById('dot').style.background = '#4ade80';
  } catch (e) {
    document.getElementById('bridge-status').textContent = 'OFFLINE';
    document.getElementById('bridge-status').style.color = '#f87171';
    document.getElementById('dot').style.background = '#f87171';
  }
}

document.getElementById('btn-poll').addEventListener('click', refreshStatus);
document.getElementById('btn-clear').addEventListener('click', async () => {
  await fetch(`${BRIDGE}/v1/bridge/clear`, { method: 'POST' });
  refreshStatus();
});

refreshStatus();
