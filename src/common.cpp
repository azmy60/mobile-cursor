#include "common.h"
#include <boost/asio.hpp>
#include <boost/filesystem.hpp>
#include <stdexcept>
#include <sstream>
#include <fstream>
#include <vector>
#include <random>
#include <regex>
#include <map>

namespace mobilecursor
{
    const std::map<std::string, std::string> ext_to_mime = {
        {".css", "text/css"},
        {".html", "text/html"},
        {".js", "application/javascript"},
        {".json", "application/json"},
        {".png", "image/png"},
        {".webp", "image/webp"}
    };
    
    using HttpServer = SimpleWeb::Server<SimpleWeb::HTTP>;
    
    void read_and_send(const std::shared_ptr<HttpServer::Response> &response, const std::shared_ptr<std::ifstream> &ifs) {
        // Read and send 128 KB at a time
        static std::vector<char> buffer(131072); // Safe when server is running on one thread
        std::streamsize read_length;
        if((read_length = ifs->read(&buffer[0], static_cast<std::streamsize>(buffer.size())).gcount()) > 0)
        {
            response->write(&buffer[0], read_length);                    
            if(read_length == static_cast<std::streamsize>(buffer.size()))
            {
                response->send([response, ifs](const SimpleWeb::error_code &ec)
                {
                    if(!ec)
                        read_and_send(response, ifs);
                    else
                        std::cerr << "Connection interrupted\n";
                });
            }
        }
    }
    
    void send_file(std::shared_ptr<HttpServer::Response> &response, const std::string &filename)
    {
        SimpleWeb::CaseInsensitiveMultimap header;
        
        auto ifs = std::make_shared<std::ifstream>();
        ifs->open(filename, std::ifstream::in | std::ios::binary | std::ios::ate);
        
        if(*ifs)
        {
            std::string content_type = "text/plain";
            auto ext = boost::filesystem::extension(filename);
            std::cout << ext << std::endl;
            auto mime = ext_to_mime.find(ext);
            if(mime != ext_to_mime.end())
                content_type = mime->first;
            
            auto length = ifs->tellg();
            ifs->seekg(0, std::ios::beg);
            
            header.emplace("Content-Type", content_type);
            header.emplace("Content-Length", std::to_string(length));
            response->write(header);
            
            read_and_send(response, ifs);
        } else
            throw std::invalid_argument("could not read file");
    }
    
    std::string UserAgentParser::get_ua(const SimpleWeb::CaseInsensitiveMultimap &header)
    {
        auto it = header.find("User-Agent");
        return it != header.end() ? it->second : "";
    }
        

    UserAgentParser::UserAgentParser(const SimpleWeb::CaseInsensitiveMultimap &header)
            : ua(get_ua(header)){}
    
    bool UserAgentParser::is_mobile() const
    {
       return true; // x!ua.empty() && (ua.find("Mobi") != std::string::npos);
    }
        
    std::string UserAgentParser::get_device_name() const
    {
        std::string result("Unknown");
        try
        {
            std::smatch sm;
            static const std::regex rx_dev("(iPad|iPhone|SAMSUNG|Galaxy Nexus|HTC|RedMi|Nexus|Pixel)");
            static const std::regex rx_os("(Windows Phone|Android)");
            if(std::regex_search(ua, sm, rx_dev) || std::regex_search(ua, sm, rx_os))
                result = sm[1];                
        }
        catch(...){}
        return result;
    }
    
    uint random_number(uint min, uint max)
    {
        std::random_device dev;
        std::mt19937 rng(dev());
        std::uniform_int_distribution<std::mt19937::result_type> dist(min, max); // distribution in range [min, max]
        return dist(rng);
    }

    // https://stackoverflow.com/a/13445752
//    class RandomGenerator
//    {
//    private:
//        std::mt19937 gen_;
//        std::uniform_int_distribution<size_t> dist_;
//        
//    public:
//        RandomGenerator(size_t min, size_t max, uint seed = std::random_device{}())
//            : gen_{seed}, dist_{min, max} {}
//        void SetSeed(uint seed){ gen_.seed(seed); }
//        size_t operator()(){ return dist_(gen_); }
//    };
}