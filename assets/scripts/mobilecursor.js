'use strict';

const p = document.getElementsByTagName('p')[0]
const reconnectWrapper = document.getElementById('reconnect-wrapper')
const cancelKeyboardArea = document.getElementById('cancel-keyboard-area')
const btnKeyboard = document.getElementById('btn-keyboard')
const btnPointer = document.getElementById('btn-pointer') // TODO
const btnNext = document.getElementById('btn-next')
const btnBack = document.getElementById('btn-back')

const btnPresentation = document.getElementById('btn-presentation-remote')
const btnTouchpad = document.getElementById('btn-touchpad')
const btnWindows = document.getElementById('btn-windows')

const fragmentTouchpad = document.getElementById('fragment-touchpad')
const fragmentWindows = document.getElementById('fragment-windows')
const fragmentRemotePresentation = document.getElementById('fragment-presentation-remote')

const main = document.getElementsByTagName("main")[0];
const nav = document.getElementsByTagName("nav")[0];

const poolThumbnail = document.getElementById("pool-thumbnail")

btnPresentation.addEventListener('click', goToPresentation, false)
btnTouchpad.addEventListener('click', goToTouchpad, false)
btnWindows.addEventListener('click', goToWindows, false)

cancelKeyboardArea.addEventListener('click', closeKeyboard, false)
reconnectWrapper.addEventListener('click', connect, false)
btnKeyboard.addEventListener('click', openKeyboard, false)
btnNext.addEventListener('click', ()=>send(144), false)
btnBack.addEventListener('click', ()=>send(142), false)
btnPointer.addEventListener('click', ()=>{}, false) // TODO

const keyboard = new VirtualKeyboardMapper('form-keyboard', 'input-text')
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
    btnKeyboard.style.visibility = 'hidden'
    cancelKeyboardArea.style.display = 'block'
    keyboard.open()
}

function closeKeyboard(){
    btnKeyboard.style.visibility = 'visible'
    cancelKeyboardArea.style.display = 'none'
    keyboard.close()
}

function goToTouchpad(){
    fragmentTouchpad.style.display = 'grid'
    
    fragmentWindows.style.display = 'none'
    fragmentRemotePresentation.style.display = 'none'

    btnTouchpad.classList.add('focused')
    btnWindows.classList.remove('focused')
    btnPresentation.classList.remove('focused')
}

function goToWindows(){
    fragmentWindows.style.display = 'block'

    fragmentTouchpad.style.display = 'none'
    fragmentRemotePresentation.style.display = 'none'
    
    btnTouchpad.classList.remove('focused')
    btnWindows.classList.add('focused')
    btnPresentation.classList.remove('focused')

    refreshPoolThumbnail()
}

function goToPresentation(){
    fragmentRemotePresentation.style.display = 'block'
    
    fragmentTouchpad.style.display = 'none'
    fragmentWindows.style.display = 'none'
    
    btnTouchpad.classList.remove('focused')
    btnWindows.classList.remove('focused')
    btnPresentation.classList.add('focused')
}

// let port = parseInt(location.port) + 1;
let port =  3001;

function connect(){
	window.ws = new WebSocket('ws://' + location.hostname + ':' + port + '/mobilecursor')
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
 * Buffer format        :   | Type |
 * (Mouse move 8-bit)   :   | Type | xxxxxxxx | yyyyyyyy |
 * (Mouse move 12-bit)  :   | Type | xxxxxxxx | xxxxyyyy | yyyyyyyy |
 * (Mouse move 16-bit)  :   | Type | xxxxxxxx | xxxxxxxx | yyyyyyyy | yyyyyyyy |
 * (String)             :   | Type |   Data   |
 * (Focus window)       :   | Type |    ID    |
 * 
 * The types are:   000 Left Click     007 Middle Down              141 String
 *                  001 Right Click    008 Middle Up                142 Left Arrow
 *                  002 Middle Click   009 Scroll Down              143 Up Arrow
 *                  003 Left Down      010 Scroll Up                144 Right Arrow
 *                  004 Left Up        011-138 Tap ASCII Code       145 Down Arrow
 *                  005 Right Down     139 Mouse Move (8-bit)       146 Focus Window
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
    else if(type == 141)
        buffer = new Blob([new Uint8Array([type]), data1], {type: 'text/plain'})
    else if(type == 146)
        buffer = new Uint8Array([type, data1])
    else
        buffer = new Uint8Array([type]);
    
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

function refreshPoolThumbnail(){
    fetch('/upd')
        .then(resp => resp.json())
        .then(data => {
            if(!data.length)
                return
            
            let r = data.length - poolThumbnail.childElementCount
        
            while(r > 0) {
                poolThumbnail.appendChild(createThumbnail())
                r--
            }
        
            r = 0
            while(r < data.length) {
                modifyThumbnail(poolThumbnail.children[r], r, data[r].name)
                r++
            }
        })
        .catch() // TODO
}

function requestImage(img, id){
    fetch(`/winimg/${id}`)
        .then(resp=>resp.text())
        .then(data=>img.src = data)
        .catch() // TODO store dummy instead
}

function createThumbnail(){
    const thumbnail = document.createElement('thumbnail')
    thumbnail.win_id_ = null
    // thumbnail.isFree_ = true
    thumbnail.onclick = function(){
        if(this.win_id_ != null)
            toggleWindow(this.win_id_)
    }

    const thumbnailWrapperImage = document.createElement('thumbnail-wrapper-image')
    thumbnail.img_ = new Image();

    thumbnail.span_ = document.createElement('span')
    thumbnail.span_.classList.add('title')

    thumbnailWrapperImage.appendChild(thumbnail.img_)
    thumbnail.appendChild(thumbnailWrapperImage)
    thumbnail.appendChild(thumbnail.span_)

    return thumbnail
}

function modifyThumbnail(thumbnail, id, title){
    // if(!thumbnail.isFree_)
    //     return false

    thumbnail.win_id_ = id
    // thumbnail.isFree_ = false
    
    requestImage(thumbnail.img_, id)

    thumbnail.span_.textContent = title
    thumbnail.style.display = 'block'
    
    return true
}

// function freeThumbnail(thumbnail){
//     thumbnail.style.display = 'none'
//     thumbnail.span_.textContent = ''
//     thumbnail.img_.src = ''
//     thumbnail.isFree_ = true
// }

connect()
keyboard.clean()

window.onload = ()=>{
    const contentHeightpx = `${window.innerHeight - nav.offsetHeight}px`
    main.style.height = contentHeightpx;
    fragmentWindows.firstElementChild.style.height = contentHeightpx;
}