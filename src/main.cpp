#include "UI.h"
#include "server.h"
#include "aluspointer.h"
#include <thread>

using namespace mobilecursor;

int main()
{
    std::unique_ptr<Server> server(new Server());
    
    aluspointer::initialize();
    
    // Initialize Server at first before UI
//    MobileCursor::UI ui;
//    ui.Run();

    std::shared_ptr<std::thread> http_thread;
    std::shared_ptr<std::thread> ws_thread;
    server->run(http_thread, ws_thread);

    http_thread->join();
    ws_thread->join();
    
    return 0;
}
