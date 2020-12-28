'use strict';

var pairingCodeEl = document.getElementById('pairing-code')

function getTicket(){
	fetch('/ticket')
		.then(resp => resp.json())
		.then(data => {pairingCodeEl.innerText = data.pairingCode})
}

function initWs(){
	new WebSocket('ws://' + location.hostname + ':' + (parseInt(location.port) + 1))
		.onmessage = event => {
			if(event.data == 'reload') 
				window.location.reload()
		}
}

getTicket()
initWs()
