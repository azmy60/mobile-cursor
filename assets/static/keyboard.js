// TODO: Don't clean every time we press space. And still send
// texts when pressing. The prob with that, have to figure 
// when to send <backspace>, which part of texts to send,
// and extra <backspace> because oftentimes the keyboard
// will throw autocorrect.

// The main goal is to simulate the real keyCode of KeyboardEvent 
// that modern mobile browsers can't detect when the user uses
// virtual keyboard. The main problem seems to be the virtual keyboard
// has that autocorrect feature. The current version is not yet implemented.
let VirtualKeyboardMapper = function(formId, inputId){
    const ins = this
    let form = document.getElementById(formId)
    let input = document.getElementById(inputId)
    
    let oldText = ''
    // let sentText = '' (native keyboard 0.2)
    let isBackspace = false, isEnter = false,
        isSpace = false, preventKeyUp = false,
        cleanInKeyUp = false
    
    form.addEventListener('submit', ev=>{
        ev.preventDefault()
    })
    
    function isNullOrWhitespace(s_){
        return !s_ || !s_.trim()
    }
    
    function clean(){
        oldText = ''
        isBackspace = false
        isEnter = false
        isSpace = false
        form.reset() // input.value = ''
    }
    
    function onsubmit_(data, isKey, clean_ = false){
        if(typeof ins.onsubmit === 'function')
            ins.onsubmit(data, isKey)

        if(clean_){
            clean()
            cleanInKeyUp = true
        }
    } 
    
    input.addEventListener('keydown', function(ev){
        isBackspace = (ev.keyCode == 8)
        isEnter = (ev.keyCode == 13)
        isSpace = (ev.keyCode == 32)

        preventKeyUp = isBackspace || isSpace || isEnter 

        if(isBackspace) 
            onsubmit_(VirtualKeyboardMapper.BACKSPACE, true)
        else if(isEnter){
            if(oldText){
                if(ins.spaceWhenEnter)
                    onsubmit_(oldText + ' ', false, true)
                else
                    onsubmit_(oldText, false, true)
            }
            else
                onsubmit_(VirtualKeyboardMapper.RETURN, true, true)
        }
        else if(isSpace){
            if(oldText == '' && !ins.submitWhenPressSpace)
                return
            else if(!isNullOrWhitespace(input.value) && ins.submitWhenPressSpace)
                onsubmit_(input.value + ' ', false, true)
            else
                onsubmit_(VirtualKeyboardMapper.SPACE, true, true)
        }
    }) 
    
    input.addEventListener('keyup', function(ev){
        if(cleanInKeyUp){
            this.value = ''
            cleanInKeyUp = false
        }
            
        if(preventKeyUp)
            return
 
        let newText = ''
        let length = this.value.length - oldText.length

        if(length > 0){ // passes if user adds character
            newText = this.value.substr(oldText.length, length)

            if(newText == ' ' && ins.submitWhenPressSpace) // new text is <space>?
                onsubmit_(this.value, false, true)
        }

        oldText = this.value
    })
    
    // Open keyboard
    this.open = function(){
        clean()
        input.focus()
    }
    
    // Close keyboard
    this.close = function(){
        document.body.focus()
    }
    
    // Event that is called when the user submits the texts
    this.onsubmit = null

    // Submits the text when user presses space and the text is not empty
    this.submitWhenPressSpace = true

    // If the text is exists, space (" ") is added after the text before submits.
    this.spaceWhenEnter = false
}

Object.defineProperties(VirtualKeyboardMapper,{
    BACKSPACE: {value: 0},
    RETURN: {value: 1},
    SPACE: {value: 2},
})