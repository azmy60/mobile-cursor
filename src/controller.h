#ifndef CONTROLLER_H
#define CONTROLLER_H

#include <string>
#include "aluspointer.h"

namespace mobilecursor
{
    namespace controller
    {
        enum EventType
        {
            LEFTCLK, RIGHTCLK, MIDDLECLK,
            LEFTDOWN, LEFTUP, RIGHTDOWN, RIGHTUP,
            MIDDLEDOWN, MIDDLEUP, SCROLLDOWN, SCROLLUP,
            TAP_ASCII, MOUSEMOVE8 = 139, MOUSEMOVE16,
            STRING, LEFT_ARROW, UP_ARROW, RIGHT_ARROW,
            DOWN_ARROW, FOCUS_WINDOW
        };
        void handle_event(std::string &event);
        const std::string update_window_list();
        const std::string get_window_image(uint8_t id);
        void toggle_window(uint8_t id);
    };

}

#endif // CONTROLLER_H
