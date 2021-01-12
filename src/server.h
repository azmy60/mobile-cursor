#ifndef SERVER_H
#define SERVER_H

#include "common.h"
#include <simple-web-server/server_http.hpp>
#include <simple-websocket-server/server_ws.hpp>
#include <thread>
#include <string>
#include <mutex>
#include <condition_variable>

namespace mobilecursor
{
    using HttpServer = SimpleWeb::Server<SimpleWeb::HTTP>;
    using WsServer = SimpleWeb::SocketServer<SimpleWeb::WS>;
    
    class Server
    {
    public:
        Server();
        ~Server();

    protected:
        std::mutex m;
        std::condition_variable cv;
        std::shared_ptr<std::thread> http_thread_;
        std::shared_ptr<std::thread> ws_thread_;
        bool isOn = false;
        bool isWsOn = false;
        bool isServerOn = false;
        bool stopThread = false;
        
        class Ticket
        {
        private:
            static std::string get_addr(const std::shared_ptr<HttpServer::Request> &request)
            {
                return request->remote_endpoint().address().to_string();
            }
            
            const std::string address;
            const uint pairing_code;
            bool accepted = false;
            
        public:
            Ticket(const std::shared_ptr<HttpServer::Request> &request): 
                address(get_addr(request)), pairing_code(random_number(0, 100))
            {
            }
            
            void accept()
            {
                accepted = true;
            }
            
            void unaccept()
            {
                accepted = false;
            }
            
            bool match(const std::shared_ptr<HttpServer::Request> &request) const 
            {
                return address.compare(get_addr(request)) == 0;
            }
    
            bool match_and_accepted(const std::shared_ptr<HttpServer::Request> &request) const 
            {
                return address.compare(get_addr(request)) == 0 && accepted;
            }
            
            uint get_pairing_code() const
            {
                return pairing_code;
            }
            
            std::string get_address() const
            {
                return address;
            }
        };
        
        std::shared_ptr<Ticket> ticket;
        
        class Connected
        {
        private:
            static std::string get_addr(const std::shared_ptr<WsServer::Connection> &connection_)
            {
                return connection_->remote_endpoint().address().to_string();
            }

            const std::string address;
            std::shared_ptr<WsServer::Connection> connection; // WebSocket connection
        
        public:
            Connected(){}
            Connected(std::shared_ptr<WsServer::Connection> &connection_)
                : address(get_addr(connection_)), connection(connection_)
            {
            }
        
            void close()
            {
                if(connection.get() != nullptr)
                    connection->send_close(1000);
            }
            
            void disconnect()
            {
            }
        };
        std::shared_ptr<WsServer::Connection> active_connection;
        
    public:
        static Server *getIns()
        {
            return new Server();
        }
    
        void start();
        void run(std::shared_ptr<std::thread> &http_thread, 
            std::shared_ptr<std::thread> &ws_thread,
            std::shared_ptr<std::thread> &alus_thread);

    protected:
        HttpServer http_server;
        WsServer ws_server;
        
        ushort http_port = 3000;
        ushort ws_port = 3001;
        
    public:
        void stop();
        
        friend class UI;
    };
}

#endif // SERVERAPP_H
