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
 * -Scroll-     is when the user touches with 2 or 3 fingers, and move up and down with 2 fingers horizontally in parallel.
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
    
    // how long it takes to leave after touching for initiating a trigger to tap 
    const intervalTouchLeaveForSingleTap = 200
    
    // how long it takes to not touch after leaving for triggering a tap/click 
    const intervalTouchLeaveForClick = 100
    
    // The time gap of the first finger that touches followed by the next one for triggering a touch 
    const intervalMultiFingersForTouch = 150
    
    // The time gap from first tap to the second tap for predicting a drag
    const intervalDoubleTapForDrag = 150
    
    // The numbers to swipe to start scrolling
    const intervalScroll = 10
    
    // Prediction code
    const PR_NONE = 0x00, PR_LEFT = 0x01, PR_MIDDLE = 0x02, PR_RIGHT = 0x04, PR_SCROLL = 0x08
    
    touchpad.addEventListener('touchstart', onTouch, { passive: false })
    touchpad.addEventListener('touchend', onLeave, { passive: false })
    touchpad.addEventListener('touchcancel', onCancel, { passive: false })
    touchpad.addEventListener('touchmove', onMove, { passive: false })
    
    let timeStartTouching = null, timeStartClicking = null, lastTimeClickForDragging = null, swipeNum = 0,
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
    
    function _scroll(direction){
        if(typeof ins.onscroll == 'function')
            ins.onscroll(direction)
    }

    function onTouch(ev){
        const t = Date.now()
        
         // one finger
        if(ev.touches.length == 1){
            if(timeStartClicking != null && t - timeStartClicking < intervalTouchLeaveForClick){
                isDragging = true
                prediction = PR_NONE
                timeStartClicking = null
                _press()
            }
            else
                prediction |= PR_LEFT
            timeStartTouching = t
        }
        else if(ev.touches.length == 2){
            if(t - timeStartTouching < intervalMultiFingersForTouch){
                prediction = PR_RIGHT
                timeStartTouching = t
            }
            prediction |= PR_SCROLL
        }
        else if(ev.touches.length == 3){
            if(t - timeStartTouching < intervalMultiFingersForTouch){
                prediction = PR_MIDDLE
                timeStartTouching = t
            }
            prediction |= PR_SCROLL
        }
    }

    function onLeave(ev){
        const t = Date.now()
        
        if(ev.touches.length == 0){
            const t = Date.now()
            
            if(!isScrolling && t - timeStartTouching < intervalTouchLeaveForSingleTap){
                if(prediction & PR_LEFT){
                    setTimeout(()=>{
                        if(!isDragging)
                            _click(Touchpad.LEFT)
                    },
                    intervalTouchLeaveForClick)
                    
                    timeStartClicking = t
                }
                else if(prediction & PR_RIGHT)
                    _click(Touchpad.RIGHT)
            }
            
            timeStartTouching = null
            
            lastPosTouches.reset()
            prediction = PR_NONE
            if(isDragging)
                _release()
            isDragging = false
            isScrolling = false
        } 
        else if(ev.touches.length == 1){
            if(prediction & PR_SCROLL && isScrolling){
                isScrolling = false
                lastPosTouches.reset()
            }
            prediction ^= PR_SCROLL
        }
        // Touched with 3 touches previously
        else if(ev.touches.length == 2){
            if((prediction & PR_MIDDLE) && t - timeStartTouching < intervalTouchLeaveForSingleTap){
                _click(Touchpad.MIDDLE)
                timeStartTouching = null
            }
        }
    }

    function onCancel(ev){
        
    }

    function onMove(ev){
        const t = Date.now()
        
        if(ev.touches.length == 1){
            prediction = PR_NONE
            
            let d = lastPosTouches.dist(ev, t)
            
            // Simulating Acceleration
            // https://stackoverflow.com/a/8773322/10012118
            
            let dr = Math.sqrt(d.x**2 + d.y**2)
            let v = dr/d.t
            let v_new = accelProps.a*v + accelProps.b*(v**2)
            let dr_new = v_new * d.t
            let dx_new = Math.round(d.x * (dr_new / dr))
            let dy_new = Math.round(d.y * (dr_new / dr))
            
            _move(dx_new || 0, dy_new || 0)
            lastPosTouches.set(ev, t)
        }
        else if(ev.touches.length < 4 && (prediction & PR_SCROLL)){
            isScrolling = true
            
            const y = lastPosTouches.dist(ev, t).y / 1.5
            const y_new = y > 0 ? Math.ceil(y) : Math.floor(y)
            
            swipeNum += Math.abs(y_new)
            
            if(swipeNum > intervalScroll){
                const amount = Math.floor(swipeNum / intervalScroll)
                    for(let i = 0; i < amount; i++)
                        _scroll(y_new > 0 ? Touchpad.SCROLLUP : Touchpad.SCROLLDOWN)
                swipeNum -= intervalScroll * amount
            }
            
            lastPosTouches.set(ev, t)
        }
    }
    
    // Event that is called when the user double taps but doesn't leave after the first tap 
    this.onpress = null
    
    // Event that is called when the user ends the press
    this.onrelease = null
    
    // Event that is called when the user tap the touchpad
    this.onclick = null
    
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
