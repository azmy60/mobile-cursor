'use strict';

const p = document.getElementsByTagName('p')[0]
//let touchpadEl = document.getElementById('touchpad')
const reconnectWrapper = document.getElementById('reconnect-wrapper')
const keyboardButton = document.getElementById('keyboard-button')
const cancelKeyboardArea = document.getElementById('cancel-keyboard-area')
const presentationRemote = document.getElementById('presentation-remote')
const presentationButton = document.getElementById('presentation-button')

//touchpadEl.addEventListener('touchstart', handleStart, false)
//touchpadEl.addEventListener('touchend', handleEnd, false)
//touchpadEl.addEventListener('touchcancel', handleCancel, false)
//touchpadEl.addEventListener('touchmove', handleMove, false)
cancelKeyboardArea.addEventListener('click', closeKeyboard, false)
reconnectWrapper.addEventListener('click', connect, false)
keyboardButton.addEventListener('click', openKeyboard, false)
presentationButton.addEventListener('click', switchRemote, false)

const keyboard = new VirtualKeyboardMapper('keyboard-form', 'text-input')
const touchpad = new Touchpad('touchpad');

//var lastTimeStartTouch = -1, lastTimeEndTouch = -1, lastTimeClickForDragging = -1
//var isDragging = false, isScrolling = false
//var lastPosTouches = {
//	x: -1,
//	y: -1,
//	t: -1,
//	set: function(ev, t){
//		this.x = ev.touches[0].screenX
//		this.y = ev.touches[0].screenY
//		this.t = t
//	},
//	dist: function(ev, t){
//		status(this.t + ' : ' + t)
//		if(this.t == -1){
//			this.set(ev, t)
//			return {x: 0, y: 0, t: 0}
//		}
//			
//		else {
//			return { 
//				x: ev.touches[0].screenX - this.x,
//				y: ev.touches[0].screenY - this.y,
//				t: t - this.t
//			}
//		}
//	},
//	reset: function(){this.x = this.y = this.t = -1}
//}
//var accelProps = {
//	a: 1.5,
//	b: 4
//}
//
//function handleStart(ev){
//	//status('start')
//	ev.preventDefault()
//	if(ev.touches.length == 1) {
//		lastTimeStartTouch = Date.now()
//		if(lastTimeClickForDragging != -1 
//		&& lastTimeStartTouch - lastTimeClickForDragging < 200){
//			leftDown()
//			lastTimeClickForDragging = -1
//			isDragging = true
//		}
//	}
//	else if(ev.touches.length == 2){
//		var t = Date.now()
//		if(t - lastTimeStartTouch < 100){
//			lastTimeStartTouch = t
//		}
//	}
//}
//
//function handleEnd(ev){
//	//status('end')
//	if(ev.touches.length == 1) lastTimeEndTouch = Date.now()
//	else if(ev.touches.length == 0){
//		var t = Date.now()
//		if(lastTimeEndTouch == -1){
//			// One finger tap! because lastTimeEndTouch hasn't
//			// been assigned to its value before now. We know
//			// lastTimeEndTouch is set when ev.touches.length == 1
//				
//			lastTimeEndTouch = t
//			if(lastTimeEndTouch - lastTimeStartTouch < 200){
//				leftClick()
//				lastTimeClickForDragging = Date.now()
//			}
//			lastTimeEndTouch = -1
//		}
//		else if(t - lastTimeEndTouch < 100){
//			// Double fingers tap!
//			
//			lastTimeEndTouch = t
//			if(lastTimeEndTouch - lastTimeStartTouch < 200){
//				rightClick()
//				lastTimeEndTouch = -1
//			}
//		}
//		
//		if(isDragging){
//			leftUp()
//			isDragging = false
//		}
//		
//		status('Resetting lastPosTouches')
//		lastPosTouches.reset()
//	}
//}
//
//function handleCancel(ev){
//	//status('cancel')
//}
//
//function handleMove(ev){
//	if(ev.touches.length == 1){
//		var t = Date.now()
//		if(isDragging){
//			//leftDown()
//			//lastTimeClickForDragging = -1
//			//isDragging = true
//		}
//		
//		var d = lastPosTouches.dist(ev, t)
//		
//		// Simulating Acceleration
//		// https://stackoverflow.com/a/8773322/10012118
//		
//		var dr = Math.sqrt(d.x**2 + d.y**2)
//		var v = dr/d.t
//		var v_new = accelProps.a*v + accelProps.b*(v**2)
//		var dr_new = v_new * d.t
//		var dx_new = Math.round(d.x * (dr_new / dr))
//		var dy_new = Math.round(d.y * (dr_new / dr))
//		
//		move(dx_new || 0, dy_new || 0)
//		lastPosTouches.set(ev, t)
//	}
//}

keyboard.onsubmit = (data, isKey)=>{
    if(isKey){
        switch(data){
            case VirtualKeyboardMapper.BACKSPACE:
                sendASCII(8)
            break
            case VirtualKeyboardMapper.RETURN:
                sendASCII(15)
            break
            case VirtualKeyboardMapper.SPACE:
                sendASCII(32)
            break
        }
    }
    else
        send(141, data)
}

touchpad.onpress = ()=>{
    send(3)
}

touchpad.onrelease = ()=>{
    send(4)
}

touchpad.onclick = (which)=>{
    console.log(2)
    send(which)
}

touchpad.onmove = (x, y)=>{
    if(x || y){
        var b16 = x > 127 || x < -128 || y > 127 || y < -128
        send(b16 ? 140 : 139, x, y)
    }
}

touchpad.onscroll = (direction)=>{
    send(9 + direction)
}

function openKeyboard(){
    keyboard.open()
}

function closeKeyboard(){
    keyboard.close()
}

function openPresentationRemote(){
	
}

function openPresentationRemote(){
	
}

function switchRemote(){
	var toPresentation = presentationRemote.style.display == 'none' 
	presentationRemote.style.display = toPresentation ? 'block' : 'none'
	presentationButton.children[0].style.display = !toPresentation ? 'block' : 'none'
	presentationButton.children[1].style.display = toPresentation ? 'block' : 'none'
	console.log(presentationRemote)
}

function connect(){
	window.ws = new WebSocket('ws://' + location.hostname + ':' + (parseInt(location.port) + 1) + '/mobilecursor')
	ws.onmessage = event => {
		if(event.data == 'reload') 
			return window.location.reload()
		//var data = JSON.parse(event.data)
	}
	ws.onopen = event => {
		status('Tersambung')
		reconnectWrapper.style.display = 'none'
	}
	ws.onclose = event => {
		status('Terputus')
		reconnectWrapper.children[0].innerText = 'Sambungan Terputus. Tekan untuk menyambung ulang.'
		reconnectWrapper.style.display = 'flex'
		closeKeyboard()
	}
	ws.onerror = event => {
		reconnectWrapper.children[0].innerText = 'Tidak dapat menyambung. Pastikan aplikasi menyala dan tersambung pada koneksi yang sama.'
		closeKeyboard()
	}
}

/*
function int12(n){
    s = n & 0b100000000000
    mag = n & 0b011111111111
    if(s) return mag - 0b100000000000
    else return mag
}*/


/* Send event
 * 
 * Buffer format        :   | Type (1 byte) |
 * (mouse move 8-bit)   :   | Type (1 byte) | xxxxxxxx | yyyyyyyy |
 * (mouse move 12-bit)  :   | Type (1 byte) | xxxxxxxx | xxxxyyyy | yyyyyyyy |
 * (string)             :   | Type (1 byte) | data     |
 * 
 * The types are:   000 Left Click     007 Middle Down            141 String
 *                  001 Right Click    008 Middle Up
 *                  002 Middle Click   009 Scroll Down
 *                  003 Left Down      010 Scroll Up
 *                  004 Left Up        011-138 Tap ASCII Code
 *                  005 Right Down     139 Mouse Move (8-bit)
 *                  006 Right Up       140 Mouse Move (16-bit)
 *
 * 
 */
function send(type, data1, data2){
    var buffer = null;
    
    if(type == 139)
        buffer = new Uint8Array([type, data1, data2]);
    else if(type == 140)
        buffer = new Uint8Array([type, data1 >> 8, data1 & 255, data2 >> 8, data2 & 255]);
    else if(type <= 138)
        buffer = new Uint8Array([type]);
    else //if(type >= 141)
        buffer = new Blob([new Uint8Array([type]), data1], {type: 'text/plain'})
    
    ws.send(buffer);
}

function sendASCII(key){
    send(11 + key)
}

function disconnect(){
	ws.close()
}

function reload(){
	location.reload()
}

function status(msg){
	p.innerText = msg
}

connect()