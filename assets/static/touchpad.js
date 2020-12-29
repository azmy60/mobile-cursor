/* little program hints easy to follow ;)
 * 
 * -Click-      is when the user taps the touchpad. Tapping with 1 finger is a left click, 
 *              2 fingers is a right click, and 3 fingers is a middle click.
 * 
 * -Dblclick-   is when the user double tap the touchpad.
 * 
 * -Press-      is when the user double tap the touchpad but doesn't let go after the first tap.
 * 
 * -Release-    is when the user ends the press.
 * 
 * -Move-       is when the user touch and move without leaving the touchpad.
 * 
 * -Scroll-     is when the user uses 2 fingers and move vertically.
 * 
 * ---------
 * 
 * -Tap-        is when the user performs touch and then leave in < 200ms.
 * 
 * -Double tap- is triggered when 2 taps are performed with one finger for < 200ms.
 * 
 * */

let Touchpad = function(touchpadId){
    const ins = this
    
    let touchpad = document.getElementById(touchpadId)
    
    // how long it takes to leave after touching for triggering a tap 
    const intervalTouchLeaveForSingleTap = 200
    
    // The time gap of the first finger that touches followed by the next one for triggering a touch 
    const intervalMultiFingersForTouch = 100
    
    // The time gap from first tap to the second tap for predicting a drag
    const intervalDoubleTapForDrag = 100
    
    // Prediction code
    const PR_NONE = 0x00, PR_LEFT = 0x01, PR_MIDDLE = 0x02, PR_RIGHT = 0x04, PR_DRAG = 0x08
    
    touchpad.addEventListener('touchstart', onTouch, { passive: false })
    touchpad.addEventListener('touchend', onLeave, { passive: false })
    touchpad.addEventListener('touchcancel', onCancel, { passive: false })
    touchpad.addEventListener('touchmove', onMove, { passive: false })
    
    let timeStartTouching = null, timeLeaving = null, lastTimeClickForDragging = null, 
        prediction = PR_NONE
    let isDragging = false, isScrolling = false, readyToDrag = false
    let lastPosTouches = {
        x: -1,
        y: -1,
        t: -1,
        set: function(ev, t){
            this.x = ev.touches[0].screenX
            this.y = ev.touches[0].screenY
            this.t = t
        },
        dist: function(ev, t){
            status(this.t + ' : ' + t)
            if(this.t == -1){
                this.set(ev, t)
                return {x: 0, y: 0, t: 0}
            }
                
            else {
                return { 
                    x: ev.touches[0].screenX - this.x,
                    y: ev.touches[0].screenY - this.y,
                    t: t - this.t
                }
            }
        },
        reset: function(){this.x = this.y = this.t = -1}
    }
    let accelProps = {
        a: 1.5,
        b: 4
    }

    function _press(){
        if(typeof ins.onpress == 'function')
            ins.onpress()
    }
    
    function _release(){
        if(typeof ins.onrelease == 'function')
            ins.onrelease()
    }
    
    function _click(which){
        if(typeof ins.onclick == 'function')
            ins.onclick(which)
    }
    
    function _move(x, y){
        if(typeof ins.onmove == 'function')
            ins.onmove(x, y)
    }
    
//    function _dblclick(){
//        if(typeof this.ondblclick == 'function')
//            this.ondblclick()
//    }

    function _scroll(direction){
        if(typeof ins.onscroll == 'function')
            ins.onscroll(direction)
    }

    function onTouch(ev){
        ev.preventDefault()
        
        const t = Date.now()
        
         // one finger
        if(ev.touches.length == 1){
            if(timeLeaving != null && t - timeLeaving < intervalDoubleTapForDrag){
                prediction = PR_DRAG
                timeLeaving = null
            }
            prediction |= PR_LEFT
            timeStartTouching = t
        }
        else if(ev.touches.length == 2){
            if(t - timeStartTouching < intervalMultiFingersForTouch){
                prediction = PR_RIGHT
                timeStartTouching = t
            }
        }
        else if(ev.touches.length == 3){
            if(t - timeStartTouching < intervalMultiFingersForTouch){
                prediction = PR_MIDDLE
                timeStartTouching = t
            }
        }
    }

    function onLeave(ev){
        ev.preventDefault()
        
        const t = Date.now()
        
        if(ev.touches.length == 0){
            const t = Date.now()
            
            if(t - timeStartTouching < intervalTouchLeaveForSingleTap){
                if(prediction & PR_LEFT)
                    _click(Touchpad.LEFT)
                else if(prediction & PR_RIGHT)
                    _click(Touchpad.RIGHT)
                
                timeStartTouching = null
            }
            
            lastPosTouches.reset()
            prediction = PR_NONE
            timeLeaving = t
            if(isDragging)
                _release()
            isDragging = false
        } 
        else if(ev.touches.length == 1){
//            timeLeaving = t
        }
        // Touched with 3 touches previously
        else if(ev.touches.length == 2){
            if((prediction & PR_MIDDLE) && t - timeStartTouching < intervalTouchLeaveForSingleTap){
                _click(Touchpad.MIDDLE)
                timeStartTouching = null
            }
        }
//        else
//            prediction = PR_NONE;
    }

    function onCancel(ev){
        
    }

    function onMove(ev){
        if(ev.touches.length == 1){
            if(prediction & PR_DRAG){
                _press()
                isDragging = true
            }
            
            prediction = PR_NONE
            
            var t = Date.now()
            var d = lastPosTouches.dist(ev, t)
            
            // Simulating Acceleration
            // https://stackoverflow.com/a/8773322/10012118
            
            var dr = Math.sqrt(d.x**2 + d.y**2)
            var v = dr/d.t
            var v_new = accelProps.a*v + accelProps.b*(v**2)
            var dr_new = v_new * d.t
            var dx_new = Math.round(d.x * (dr_new / dr))
            var dy_new = Math.round(d.y * (dr_new / dr))
            
            _move(dx_new || 0, dy_new || 0)
            lastPosTouches.set(ev, t)
        }
    }
    
    // Event that is called when the user double taps but doesn't leave after the first tap 
    this.onpress = null
    
    // Event that is called when the user ends the press
    this.onrelease = null
    
    // Event that is called when the user tap the touchpad
    this.onclick = null
    
    // Event that is called when the user tap the touchpad
//    this.ondblclick = null
    
    // Event that is called when the user drags with one finger 
    this.onmove = null
    
    // Event that is called when the user drags vertically with two fingers
    this.onscroll = null
};

Object.defineProperties(Touchpad,{
    LEFT:           {value: 0},
    RIGHT:          {value: 1},
    MIDDLE:         {value: 2},
    SCROLLDOWN:     {value: 0},
    SCROLLUP:       {value: 1},
})