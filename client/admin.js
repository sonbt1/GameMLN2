const socket = io();
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));
let code = '';
const labels = { rice: 'Lúa', corn: 'Ngô', cotton: 'Bông', iron: 'Sắt', oil: 'Dầu', steel: 'Thép', chip: 'Chip', gold: 'Vàng' };

function showDashboard() {
  $('#setup').hidden = true;
  $('#dashboard').hidden = false;
  $('#roomCode').textContent = code;
  $('#qr').src = `/api/qr/${code}`;
  $('#joinLink').href = `/?room=${code}`;
  $('#joinLink').textContent = `${location.origin}/?room=${code}`;
}

function adminAction(action, value) {
  socket.emit('adminAction', { action, value }, (result) => {
    if (!result.ok) $('#notice').textContent = result.error;
  });
}

$('#create').onclick = () => socket.emit('createRoom', {}, (result) => {
  if (!result.ok) { $('#error').textContent = result.error; return; }
  code = result.code;
  showDashboard();
});

$('#open').onclick = () => {
  code = $('#code').value.trim().toUpperCase();
  socket.emit('adminJoin', { code }, (result) => {
    if (!result.ok) { $('#error').textContent = result.error; return; }
    showDashboard();
  });
};

document.querySelectorAll('[data-action]').forEach((button) => {
  button.onclick = () => adminAction(button.dataset.action, button.dataset.action === 'kick' ? $('#kickName').value : undefined);
});
$('#duration').onchange = () => adminAction('setTime', Number($('#duration').value));

socket.on('adminState', (state) => {
  code = state.code;
  showDashboard();
  $('#roomMeta').textContent = `${state.joined} người chơi · trạng thái ${state.phase}`;
  $('#count').textContent = state.joined;
  $('#day').textContent = state.day || '—';
  $('#phaseLabel').textContent = `Giai đoạn: ${state.phase}`;
  $('#timer').textContent = state.timerMs ? `${Math.ceil(state.timerMs / 1000)} GIÂY` : '—';
  $('#title').textContent = state.market?.title || (state.phase === 'intro' ? 'Giới thiệu luật' : 'Phòng chờ');
  $('#news').textContent = state.introText || [state.market?.news, state.market?.advice ? `Gợi ý: ${state.market.advice}` : null, state.market?.priceEvent?.text ? `Biến động: ${state.market.priceEvent.text}` : null, state.market?.creditDue ? 'Khoản mua chịu đến hạn hôm nay.' : null, state.market?.reveal].filter(Boolean).join('\n\n') || '';
  $('#news').style.whiteSpace = 'pre-line';
  $('#prices').innerHTML = state.market?.prices
    ? Object.entries(state.market.prices).map(([good, price]) => `<span>${labels[good] || good}: ${Number(price).toLocaleString('vi-VN')} xu</span>`).join('') + (state.market.fx ? `<span>USD: ${state.market.fx} xu</span>` : '')
    : 'Bảng giá hiện sau khi MC bắt đầu ngày.';
  $('#knowledge').textContent = state.market?.knowledge
    ? `Kiến thức rút ra · ${state.market.function}: ${state.market.knowledge}${state.market.conclusion ? `\n\n${state.market.conclusion}` : ''}`
    : '';
  $('#rank').innerHTML = (state.leaderboard || []).map((player) => `<li>${escapeHtml(player.name)}: ${Number(player.netWorth).toLocaleString('vi-VN')} xu</li>`).join('');
  $('#players').innerHTML = state.players.map((player) => `<div class="player-chip"><span class="status ${player.connected ? 'online' : ''}"></span>${escapeHtml(player.name)} <small>${player.connected ? 'đang kết nối' : 'mất kết nối'}</small></div>`).join('');
  if (state.tiebreak?.question) $('#notice').textContent = `Câu hỏi phân hạng: ${state.tiebreak.question}`;
  if (state.tiebreak?.unresolved) $('#notice').textContent = 'Câu hỏi phụ vẫn hòa; MC công bố kết quả đồng hạng.';
  if (state.tiebreak?.winner) $('#notice').textContent = `Người thắng câu hỏi phụ: ${state.tiebreak.winner}`;
});
socket.on('notice', (notice) => { $('#notice').textContent = notice.message; });
