#include "controller.h"
#include "aluspointer.h"
#include <iostream>

using namespace mobilecursor;

/*
inline int int12(int n)
{
    static const int max = 0b100000000000; // 2048 or 0b1 << 13 
    int mag = n & 0b011111111111; // ~(0b1 << 13)
    if(n & max)
        return mag - max;
    return mag;
}*/

void controller::handle_event(std::string &event)
{
    const auto type = (uint8_t)event[0];
    switch(type) // TypeEvent
    {
    case LEFTCLK:
        aluspointer::click(aluspointer::MOUSE_LEFT);
    break;
    
    case RIGHTCLK:
        aluspointer::click(aluspointer::MOUSE_RIGHT);
    break;
    
    case MIDDLECLK:
        aluspointer::click(aluspointer::MOUSE_MIDDLE);
    break;
    
    case LEFTDOWN:
        aluspointer::press_mouse(aluspointer::MOUSE_LEFT);
    break;
    
    case LEFTUP:
        aluspointer::release_mouse(aluspointer::MOUSE_LEFT);
    break;
    
    case RIGHTDOWN:
        aluspointer::press_mouse(aluspointer::MOUSE_RIGHT);
    break;
    
    case RIGHTUP:
        aluspointer::release_mouse(aluspointer::MOUSE_RIGHT);
    break;
    
    case MIDDLEDOWN:
        aluspointer::press_mouse(aluspointer::MOUSE_MIDDLE);
    break;
    
    case MIDDLEUP:
        aluspointer::release_mouse(aluspointer::MOUSE_MIDDLE);
    break;
    
    case SCROLLDOWN:
        aluspointer::wheel_down();
    break;
    
    case SCROLLUP:
        aluspointer::wheel_up();
    break;
    
    // mouse move with 1 byte data [-128, 127]
    case MOUSEMOVE8:
        try
        {
            aluspointer::move_mouse((int8_t)event[1], (int8_t)event[2]);
        }
        catch(...)
        {
        }
    break;
    
    /*
    // mouse move with each x and y holding 12 bits [-2,048 , 2,047]
    // 
    // Format:
    //      [TypeEvent, xxxxxxxx, xxxxyyyy, yyyyyyyy] (1 TypeEvent + 3 bytes)
    //      both x and y have signed 12 bits, ranging [-2,048 , 2,047]
    case MOUSEMOVE12:
        try
        {
            auto x = int12((event[1] << 4) | (event[2] >> 4));
            auto y = int12(((event[2] & 0xf) << 8) | event[3]);
            aluspointer::move_mouse(x, y);
        }
        catch(...)
        {
        }
    break;*/
    
    case MOUSEMOVE16:
        try
        {
            int16_t x = (event[1] << 8 | event[2]);
            int16_t y = (event[3] << 8 | event[4]);
            aluspointer::move_mouse(x,y);
        }
        catch(...)
        {
        }
        std::cout << event[2] << ' ' << event[4];
    break;
    
    default:
        if(type >= TAP_ASCII && type < TAP_ASCII + 127)
        {
            char ascii = type - TAP_ASCII;
            aluspointer::tap_key(ascii);
        }
        else // type == STRING
        {
            event.erase(0, 1);
            aluspointer::type_string(event);
        }
    break;
    }
}
