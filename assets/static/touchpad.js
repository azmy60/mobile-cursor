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
    
    touchpad.addEventListener('touchstart', onTouch, false)
    touchpad.addEventListener('touchend', onLeave, false)
    touchpad.addEventListener('touchcancel', onCancel, false)
    touchpad.addEventListener('touchmove', onMove, false)
    
    let lastTimeStartTouching = null, lastTimeEndTouch = null, lastTimeClickForDragging = null
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
        if(this.onpress)
            this.onpress()
    }
    
    function _release(){
        if(this.onrelease)
            this.onrelease()
    }
    
    function _click(which){
        if(this.onclick)
            this.onclick(which)
    }
    
    function _move(x, y){
        if(this.onmove)
            this.onmove(x, y)
    }
    
//    function _dblclick(){
//        if(typeof this.ondblclick == 'function')
//            this.ondblclick()
//    }

    function _scroll(direction){
        if(this.onscroll)
            this.onscroll(direction)
    }

    function onTouch(ev){
        ev.preventDefault()
        
         // one finger
        if(ev.touches.length == 1){
            lastTimeStartTouching = Date.now()
            
            // if user initiated to start dragging recently
            if(lastTimeClickForDragging != null
            && lastTimeStartTouching - lastTimeClickForDragging < 200){
//                _press()
                lastTimeClickForDragging = null
                isDragging = false
                readyToDrag = true
            }
        }
        else if(ev.touches.length == 2){
            var t = Date.now()
            if(t - lastTimeStartTouching < 100){
                lastTimeStartTouching = t
            }
        }
    }

    function onLeave(ev){
        // User has touched with 2 fingers, so now the touches.length is 1
        if(ev.touches.length == 1)
            lastTimeEndTouch = Date.now()
        else if(ev.touches.length == 0){
            if(isDragging){
                _release()
                isDragging = false
                readyToDrag = false
            }
            else {
                const t = Date.now()
                if(lastTimeEndTouch == null){
                    // One finger tap! because lastTimeEndTouch hasn't
                    // been assigned to a value. We know lastTimeEndTouch
                    // is set when ev.touches.length == 1
                        
                    lastTimeEndTouch = t
                    if(lastTimeEndTouch - lastTimeStartTouching < 200){
                        _click(Touchpad.LEFT)
                        lastTimeClickForDragging = Date.now()
                    }
                    lastTimeEndTouch = null
                }
                else if(t - lastTimeEndTouch < 100){
                    // Double fingers tap!
                    
                    lastTimeEndTouch = t
                    if(lastTimeEndTouch - lastTimeStartTouching < 200){
                        _click(Touchpad.RIGHT)
                        lastTimeEndTouch = null
                    }
                }                
            }
            
            lastPosTouches.reset()
        }
    }

    function onCancel(ev){
        
    }

    function onMove(ev){
        if(ev.touches.length == 1){
            if(readyToDrag){
                _press()
                readyToDrag = false
                isDragging = true
            }
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