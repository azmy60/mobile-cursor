'use strict';

const p = document.getElementsByTagName('p')[0]
const reconnectWrapper = document.getElementById('reconnect-wrapper')
const keyboardButton = document.getElementById('keyboard-button')
const cancelKeyboardArea = document.getElementById('cancel-keyboard-area')
const presentationRemote = document.getElementById('presentation-remote')
const presentationButton = document.getElementById('presentation-button')

cancelKeyboardArea.addEventListener('click', closeKeyboard, false)
reconnectWrapper.addEventListener('click', connect, false)
keyboardButton.addEventListener('click', openKeyboard, false)
presentationButton.addEventListener('click', switchRemote, false)

const keyboard = new VirtualKeyboardMapper('keyboard-form', 'text-input')
const touchpad = new Touchpad('touchpad');

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
		reconnectWrapper.style.display = 'none'
	}
	ws.onclose = event => {
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
    p.style.display = 'block'
	p.innerText = msg
}

connect()