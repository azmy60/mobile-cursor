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
#include <cstring>
#include <ifaddrs.h>
#include <netinet/in.h> 
#include <arpa/inet.h>

namespace mobilecursor
{
    const std::map<std::string, std::string> ext_to_mime = {
        {".css", "text/css"},
        {".html", "text/html"},
        {".js", "application/javascript"},
        {".json", "application/json"},
        {".svg", "image/svg+xml"},
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
            auto mime = ext_to_mime.find(ext);
            if(mime != ext_to_mime.end())
                content_type = mime->second;
            
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

    // https://stackoverflow.com/a/265978/10012118
    std::string get_local_ip()
    {
        ifaddrs *if_addrs = nullptr, *ifa = nullptr;
        void *tmpAddrPtr = nullptr;
        char addressBuffer[INET_ADDRSTRLEN];

        getifaddrs(&if_addrs);

        for (ifa = if_addrs; ifa != nullptr; ifa = ifa->ifa_next) {
            if (!ifa->ifa_addr)
                continue;
            if (ifa->ifa_addr->sa_family == AF_INET) { // check it is IP4
                // is a valid IP4 Address
                tmpAddrPtr = &((sockaddr_in *)ifa->ifa_addr)->sin_addr;
                inet_ntop(AF_INET, tmpAddrPtr, addressBuffer, INET_ADDRSTRLEN);
                if(std::strcmp(addressBuffer, "127.0.0.1") > 0)
                    break;
            } 
        }
        
        if (if_addrs) freeifaddrs(if_addrs);
        
        return addressBuffer;
    }

    /* 
       base64.cpp and base64.h

       Copyright (C) 2004-2008 René Nyffenegger

       This source code is provided 'as-is', without any express or implied
       warranty. In no event will the author be held liable for any damages
       arising from the use of this software.

       Permission is granted to anyone to use this software for any purpose,
       including commercial applications, and to alter it and redistribute it
       freely, subject to the following restrictions:

       1. The origin of this source code must not be misrepresented; you must not
          claim that you wrote the original source code. If you use this source code
          in a product, an acknowledgment in the product documentation would be
          appreciated but is not required.

       2. Altered source versions must be plainly marked as such, and must not be
          misrepresented as being the original source code.

       3. This notice may not be removed or altered from any source distribution.

       René Nyffenegger rene.nyffenegger@adp-gmbh.ch

    */

    static const std::string base64_chars = 
                 "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                 "abcdefghijklmnopqrstuvwxyz"
                 "0123456789+/";


    static inline bool is_base64(unsigned char c) {
      return (isalnum(c) || (c == '+') || (c == '/'));
    }

    std::string base64_encode(unsigned char const* bytes_to_encode, unsigned int in_len) {
      std::string ret;
      int i = 0;
      int j = 0;
      unsigned char char_array_3[3];
      unsigned char char_array_4[4];

      while (in_len--) {
        char_array_3[i++] = *(bytes_to_encode++);
        if (i == 3) {
          char_array_4[0] = (char_array_3[0] & 0xfc) >> 2;
          char_array_4[1] = ((char_array_3[0] & 0x03) << 4) + ((char_array_3[1] & 0xf0) >> 4);
          char_array_4[2] = ((char_array_3[1] & 0x0f) << 2) + ((char_array_3[2] & 0xc0) >> 6);
          char_array_4[3] = char_array_3[2] & 0x3f;

          for(i = 0; (i <4) ; i++)
            ret += base64_chars[char_array_4[i]];
          i = 0;
        }
      }

      if (i)
      {
        for(j = i; j < 3; j++)
          char_array_3[j] = '\0';

        char_array_4[0] = (char_array_3[0] & 0xfc) >> 2;
        char_array_4[1] = ((char_array_3[0] & 0x03) << 4) + ((char_array_3[1] & 0xf0) >> 4);
        char_array_4[2] = ((char_array_3[1] & 0x0f) << 2) + ((char_array_3[2] & 0xc0) >> 6);
        char_array_4[3] = char_array_3[2] & 0x3f;

        for (j = 0; (j < i + 1); j++)
          ret += base64_chars[char_array_4[j]];

        while((i++ < 3))
          ret += '=';

      }

      return ret;

    }
    
    std::string base64_decode(std::string const& encoded_string) {
      int in_len = encoded_string.size();
      int i = 0;
      int j = 0;
      int in_ = 0;
      unsigned char char_array_4[4], char_array_3[3];
      std::string ret;

      while (in_len-- && ( encoded_string[in_] != '=') && is_base64(encoded_string[in_])) {
        char_array_4[i++] = encoded_string[in_]; in_++;
        if (i ==4) {
          for (i = 0; i <4; i++)
            char_array_4[i] = base64_chars.find(char_array_4[i]);

          char_array_3[0] = (char_array_4[0] << 2) + ((char_array_4[1] & 0x30) >> 4);
          char_array_3[1] = ((char_array_4[1] & 0xf) << 4) + ((char_array_4[2] & 0x3c) >> 2);
          char_array_3[2] = ((char_array_4[2] & 0x3) << 6) + char_array_4[3];

          for (i = 0; (i < 3); i++)
            ret += char_array_3[i];
          i = 0;
        }
      }

      if (i) {
        for (j = i; j <4; j++)
          char_array_4[j] = 0;

        for (j = 0; j <4; j++)
          char_array_4[j] = base64_chars.find(char_array_4[j]);

        char_array_3[0] = (char_array_4[0] << 2) + ((char_array_4[1] & 0x30) >> 4);
        char_array_3[1] = ((char_array_4[1] & 0xf) << 4) + ((char_array_4[2] & 0x3c) >> 2);
        char_array_3[2] = ((char_array_4[2] & 0x3) << 6) + char_array_4[3];

        for (j = 0; (j < i - 1); j++) ret += char_array_3[j];
      }

      return ret;
    }
    
    
    // See https://github.com/nlohmann/json/blob/ec7a1d834773f9fee90d8ae908a0c9933c5646fc/src/json.hpp#L4604-L4697
    
     /*!
    @brief calculates the extra space to escape a JSON string
    @param[in] s  the string to escape
    @return the number of characters required to escape string @a s
    @complexity Linear in the length of string @a s.
    */
    static std::size_t extra_space(const std::string& s) noexcept
    {
        std::size_t result = 0;

        for (const auto& c : s)
        {
            switch (c)
            {
                case '"':
                case '\\':
                case '\b':
                case '\f':
                case '\n':
                case '\r':
                case '\t':
                {
                    // from c (1 byte) to \x (2 bytes)
                    result += 1;
                    break;
                }

                default:
                {
                    if (c >= 0x00 and c <= 0x1f)
                    {
                        // from c (1 byte) to \uxxxx (6 bytes)
                        result += 5;
                    }
                    break;
                }
            }
        }

        return result;
    }

    /*!
    @brief escape a string
    Escape a string by replacing certain special characters by a sequence of an
    escape character (backslash) and another character and other control
    characters by a sequence of "\u" followed by a four-digit hex
    representation.
    @param[in] s  the string to escape
    @return  the escaped string
    @complexity Linear in the length of string @a s.
    */
    std::string escape_string(const std::string& s) noexcept
    {
        const auto space = extra_space(s);
        if (space == 0)
        {
            return s;
        }

        // create a result string of necessary size
        std::string result(s.size() + space, '\\');
        std::size_t pos = 0;

        for (const auto& c : s)
        {
            switch (c)
            {
                // quotation mark (0x22)
                case '"':
                {
                    result[pos + 1] = '"';
                    pos += 2;
                    break;
                }

                // reverse solidus (0x5c)
                case '\\':
                {
                    // nothing to change
                    pos += 2;
                    break;
                }

                // backspace (0x08)
                case '\b':
                {
                    result[pos + 1] = 'b';
                    pos += 2;
                    break;
                }

                // formfeed (0x0c)
                case '\f':
                {
                    result[pos + 1] = 'f';
                    pos += 2;
                    break;
                }

                // newline (0x0a)
                case '\n':
                {
                    result[pos + 1] = 'n';
                    pos += 2;
                    break;
                }

                // carriage return (0x0d)
                case '\r':
                {
                    result[pos + 1] = 'r';
                    pos += 2;
                    break;
                }

                // horizontal tab (0x09)
                case '\t':
                {
                    result[pos + 1] = 't';
                    pos += 2;
                    break;
                }

                default:
                {
                    if (c >= 0x00 and c <= 0x1f)
                    {
                        // print character c as \uxxxx
                        sprintf(&result[pos + 1], "u%04x", int(c));
                        pos += 6;
                        // overwrite trailing null character
                        result[pos] = '\\';
                    }
                    else
                    {
                        // all other characters are added as-is
                        result[pos++] = c;
                    }
                    break;
                }
            }
        }

        return result;
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