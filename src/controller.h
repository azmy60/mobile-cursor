#ifndef CONTROLLER_H
#define CONTROLLER_H

#include <string>

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
            STRING
        };
        void handle_event(std::string &event);
    };

}

#endif // CONTROLLER_H
