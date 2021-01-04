#include "controller.h"
#include "common.h"
#include <iostream>

using namespace mobilecursor;

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
            int16_t x = ((unsigned char)event[1] << 8) | (unsigned char)event[2];
            int16_t y = ((unsigned char)event[3] << 8) | (unsigned char)event[4];
            aluspointer::move_mouse(x,y);
        }
        catch(...)
        {
        }
    break;
    
    case LEFT_ARROW:
        aluspointer::tap_key(aluspointer::XK_Left);
    break;
    
    case UP_ARROW:
        aluspointer::tap_key(aluspointer::XK_Up);
    break;
    
    case RIGHT_ARROW:
        aluspointer::tap_key(aluspointer::XK_Right);
    break;
    
    case DOWN_ARROW:
        aluspointer::tap_key(aluspointer::XK_Down);
    break;
    
    case FOCUS_WINDOW:
        aluspointer::focus_window((uint8_t)event[1]);
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

const std::string controller::update_window_list()
{
    auto window_list = aluspointer::update_window_list();
    std::string json("[");
    
    if(!window_list.empty())
    {
        json += "{\"id\":0,\"name\":\"" + escape_string(window_list[0].name) + "\"}";
        
        std::for_each(window_list.begin() + 1, window_list.end(), 
        [&json](aluspointer::window_client_t win_client)
        {
            json += ",{\"id\":" + std::to_string(win_client.id) + ",\"name\":\"" + escape_string(win_client.name) + "\"}";
        });        
    }
    
    json += "]";
    
    return json;
}

const std::string controller::get_window_image(uint8_t id)
{
    auto raw = aluspointer::get_window_image(id);
    return "data:image/png;base64," + base64_encode(raw.data(), raw.size());
}

void controller::toggle_window(uint8_t id)
{
    // TODO
    aluspointer::focus_window(id);
}