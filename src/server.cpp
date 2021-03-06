#include "server.h"
#include "controller.h"
#include <algorithm>
#include <boost/filesystem.hpp>
#include <iostream>
#include <condition_variable>

using namespace mobilecursor;

inline void redirect(std::shared_ptr<HttpServer::Response> response,
            const std::string &location,
            SimpleWeb::StatusCode status_code = SimpleWeb::StatusCode::redirection_found)
{
    SimpleWeb::CaseInsensitiveMultimap header;
    header.emplace("Location", location);
    response->write(status_code, header);
}

Server::Server()
{    
    http_server.config.port = http_port;
    ws_server.config.port = ws_port;
    
    http_server.resource["^/mobilecursor$"]["GET"] = [this](
    std::shared_ptr<HttpServer::Response> response, std::shared_ptr<HttpServer::Request> request)
    {
        if(std::make_unique<UserAgentParser>(request->header)->is_mobile() == false)
            return response->write(SimpleWeb::StatusCode::client_error_forbidden, "Please use your phone to access.");
        
        //if(ticket.get() == nullptr || !ticket->match_and_accepted(request))
        //    return redirect(response, "/");
//            WsServer::Connection
        auto path = boost::filesystem::canonical("assets/mobilecursor.html");
        send_file(response, path.string());
    };
    
    // TODO
    http_server.resource["^/disconnect$"]["GET"] = [this](
    std::shared_ptr<HttpServer::Response> response, std::shared_ptr<HttpServer::Request> request)
    {
        if(std::make_unique<UserAgentParser>(request->header)->is_mobile() == false)
            return response->write(SimpleWeb::StatusCode::client_error_forbidden, "Please use your phone to access.");
        
        if(ticket.get() != nullptr && ticket->match(request))
        {
//            ticket->unaccept();
            ticket = nullptr;
        }
//            connected_dev->close();
        
        // Redirect to index
        redirect(response, "/");
    };
    
    // Update window list
    http_server.resource["^/upd$"]["GET"] = [this](
    std::shared_ptr<HttpServer::Response> response, std::shared_ptr<HttpServer::Request> request)
    {
        auto user_agent = std::make_unique<UserAgentParser>(request->header);
        if(user_agent->is_mobile() == false)
            return response->write(SimpleWeb::StatusCode::client_error_forbidden, "Please use your phone to access.");

        auto window_list_json = controller::update_window_list();

        SimpleWeb::CaseInsensitiveMultimap header;

        header.emplace("Content-Type", "application/json");
        header.emplace("Content-Length", std::to_string(window_list_json.length()));
        
        response->write(window_list_json, header);
    };
    
    // Get image of a window
    http_server.resource["^/winimg/([0-9]+)$"]["GET"] = [this](
    std::shared_ptr<HttpServer::Response> response, std::shared_ptr<HttpServer::Request> request)
    {
        auto user_agent = std::make_unique<UserAgentParser>(request->header);
        if(user_agent->is_mobile() == false)
            return response->write(SimpleWeb::StatusCode::client_error_forbidden, "Please use your phone to access.");

        auto id = std::stoi(request->path_match[1].str()); // TODO unsafe
        
        auto buffer = controller::get_window_image(id);
        
        SimpleWeb::CaseInsensitiveMultimap header;
        
        header.emplace("Content-Type", "application/json");
        header.emplace("Content-Length", std::to_string(buffer.length()));
        
        response->write(buffer, header);
    };
    
    // "Ticket"-based authentication system
    // https://devcenter.heroku.com/articles/websocket-security#authentication-authorization
    // .. // TODO
    http_server.resource["^/ticket$"]["GET"] = [this](
    std::shared_ptr<HttpServer::Response> response, std::shared_ptr<HttpServer::Request> request)
    {
        auto user_agent = std::make_unique<UserAgentParser>(request->header);
        if(user_agent->is_mobile() == false)
            return response->write(SimpleWeb::StatusCode::client_error_forbidden, "Please use your phone to access.");

        if(ticket.get() == nullptr)
        {
            ticket = std::make_shared<Ticket>(request);
            // If using console (not GUI), accept automatically
            ticket->accept();
        }
        else if(ticket->match_and_accepted(request))
            return response->write(SimpleWeb::StatusCode::client_error_forbidden, "App is being used.");

        std::cout << "\naddress " << ticket->get_address() << '\n'
            << user_agent->get_device_name() << "(pairing code: "
            << ticket->get_pairing_code() << ") is waiting for verification\n";
        
        SimpleWeb::CaseInsensitiveMultimap header;
        
        std::string json = "{\"pairingCode\":" + std::to_string(ticket->get_pairing_code()) + "}";
        
        header.emplace("Content-Type", "application/json");
        header.emplace("Content-Length", std::to_string(json.length()));
        
        response->write(json, header);
    };
    
    http_server.default_resource["GET"] = [this](std::shared_ptr<HttpServer::Response> response, 
    std::shared_ptr<HttpServer::Request> request)
    {
        if(std::make_unique<UserAgentParser>(request->header)->is_mobile()  == false)
            return response->write(SimpleWeb::StatusCode::client_error_forbidden, "Please use your phone to access.");
            
        try
        {
            auto web_root_path = boost::filesystem::canonical("assets");
            auto path = boost::filesystem::canonical(web_root_path / request->path);
            
            // Check if path is within web_root_path
            if(std::distance(web_root_path.begin(), web_root_path.end()) 
                > std::distance(path.begin(), path.end())
                || !std::equal(web_root_path.begin(), web_root_path.end(), path.begin())
            )
                throw std::invalid_argument("path must be within root path");
                
            if(boost::filesystem::is_directory(path))
            {
                if(true)//if(request->path == "/" && ticket.get() != nullptr && ticket->match_and_accepted(request))
                {
                    // register this requester to connected_dev (CONSIDERED)
                    // connected_dev = std::make_shared<Connected>()
                    //std::cout << "here\n";
                    return redirect(response, "/mobilecursor");
                }
                path /= "index.html";
            }
            
            send_file(response, path.string());
        }
        catch(const std::exception &e)
        {
            response->write(SimpleWeb::StatusCode::client_error_bad_request, "Could not open path " + request->path + ": " + e.what());
        }
    };
    
    // --- WEBSOCKET ---
    
    // /(index) endpoint
//    auto &ws_index = ws_server.endpoint["^/$"];
//    
//    // index - on handshake
//    ws_index.on_handshake = [](std::shared_ptr<WsServer::Connection> /*connection*/, 
//    SimpleWeb::CaseInsensitiveMultimap &/*response_header*/)
//    {
//        return SimpleWeb::StatusCode::information_switching_protocols; // Upgrade to websocket
//    };
//
//    // index - on open
//    ws_index.on_open = [this](std::shared_ptr<WsServer::Connection> connection)
//    {
//        std::cout << "ws_index: Opened connection " << connection.get() << '\n';
//        
////        connection->send("reload", [](const SimpleWeb::error_code &ec)
////        {
////            if(ec)
////                std::cout << "ws_index: Error sending message. " <<
////                "Error: " << ec << ", error message: " << ec.message() << '\n';
////        });
//    };
//    
//    // index - on error
//    ws_index.on_error = [](std::shared_ptr<WsServer::Connection> connection, const SimpleWeb::error_code &ec)
//    {
//        std::cout << "ws_index: Error in connection " << connection.get() << ". "
//            << "Error: " << ec << ", error message: " << ec.message() << '\n';
//    };
//    
//    // index - on close
//    ws_index.on_close = [](
//    std::shared_ptr<WsServer::Connection> connection, 
//    int status, const std::string &/*reason*/)
//    {
//        std::cout << "ws_index: Closed connection " << connection.get() 
//            << " with status code " << status << '\n';
//    };
//    
//    // index - on message
//    ws_index.on_message = [](
//    std::shared_ptr<WsServer::Connection> connection, 
//    std::shared_ptr<WsServer::InMessage> in_message)
//    {
//    };


    // /mobilecursor endpoint
    auto &ws_mobilecursor = ws_server.endpoint["^/mobilecursor$"];

    // mobilecursor - on handshake
    ws_mobilecursor.on_handshake = [](std::shared_ptr<WsServer::Connection> /*connection*/, 
    SimpleWeb::CaseInsensitiveMultimap &/*response_header*/)
    {
        return SimpleWeb::StatusCode::information_switching_protocols; // Upgrade to websocket
    };

    // mobilecursor - on open
    ws_mobilecursor.on_open = [this](std::shared_ptr<WsServer::Connection> connection)
    {
        if(active_connection)
        {
            std::cout << "ws_mobilecursor: New client is connected while there" 
                "is still an active connection. Sending close 103.. " << connection.get() << '\n';
            connection->send_close(1013); // 1013 = Try Again Later
        }
        else
        {
            active_connection = connection;
            std::cout << "ws_mobilecursor: Opened connection " << connection.get() << '\n';
        }
        
    };
    
    // mobilecursor - on error
    ws_mobilecursor.on_error = [](std::shared_ptr<WsServer::Connection> connection, const SimpleWeb::error_code &ec)
    {
        std::cout << "ws_mobilecursor: Error in connection " << connection.get() << ". "
            << "Error: " << ec << ", error message: " << ec.message() << '\n';
    };
    
    // mobilecursor - on close
    ws_mobilecursor.on_close = [this](
    std::shared_ptr<WsServer::Connection> connection, 
    int status, const std::string &/*reason*/)
    {
        if(active_connection.get() == connection.get())
        {
            active_connection.reset();
            std::cout << "ws_mobilecursor: Active connection just closes. "
                "status code " << status << " " << connection.get() << std::endl;
        }
        else
        {
            std::cout << "ws_mobilecursor: Closed connection " << connection.get() 
                << " with status code " << status << std::endl;            
        }
    };
    
    // mobilecursor - on message
    ws_mobilecursor.on_message = [](
    std::shared_ptr<WsServer::Connection> connection, 
    std::shared_ptr<WsServer::InMessage> in_message)
    {
        auto event = in_message->string();
        controller::handle_event(event);
    };

//    std::cout << "Server initialization complete.\n";    
}

Server::~Server()
{
}

void Server::run(std::shared_ptr<std::thread> &http_thread, 
    std::shared_ptr<std::thread> &ws_thread, 
    std::shared_ptr<std::thread> &alus_thread)
{
//    std::mutex m;
//    std::unique_lock<std::mutex> lk(m);
//    std::condition_variable cv;
//    
//    bool ws_ready = false;
    
    http_thread = std::make_shared<std::thread>([this]
    {
//        std::cout << "Running server\n";
        http_server.start([this](const ushort &port){
            std::cout << "Server is running at " << get_local_ip() << ':' 
                << port << std::endl;
        });
        
    });
    
    ws_thread = std::make_shared<std::thread>([this, &alus_thread]
    {
//        std::cout << "Running ws\n";
        ws_server.start([this, &alus_thread](const ushort &port){
//            ws_ready = true;
//            cv.notify_one();
            std::cout << "ws running..\n";
        });
    });
    
//    cv.wait(lk, [&ws_ready]{ return ws_ready; });
    
//    auto alus_thread_ = std::thread(
//        aluspointer::start_listen_to_updated_windows
//        ([this](int id){
//            std::cout << '0' << std::to_string(id) << std::endl;
//            if(active_connection)
//                active_connection->send("0" + std::to_string(id));
//        }),
//        this, this);
//    
//    alus_thread = std::make_shared<std::thread>(alus_thread_);
}

void Server::stop()
{
    http_server.stop();
    ws_server.stop();
}
