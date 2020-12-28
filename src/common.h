#ifndef COMMON_H
#define COMMON_H

#include <simple-web-server/server_http.hpp>
#include <memory>
#include <string>

namespace mobilecursor
{
    using HttpServer = SimpleWeb::Server<SimpleWeb::HTTP>;
    
    void send_file(std::shared_ptr<HttpServer::Response>& /*response*/, const std::string& /*filename*/);
    
    uint random_number(uint /*min*/, uint /*max*/);
    
    class UserAgentParser
    {
    private:
        const std::string ua;
        static std::string get_ua(const SimpleWeb::CaseInsensitiveMultimap &header);
        
    public:
        UserAgentParser(const SimpleWeb::CaseInsensitiveMultimap &header);
            
        // return true if user-agent is found and match mobile regex
        bool is_mobile() const;
        
        std::string get_device_name() const;
    };
    
    /*
    // Formater usage:
    // throw std::runtime_error(Formatter() << foo << ", bar"); (implicitly cast to std::string)
    // throw std::runtime_error(Formatter() << foo << ", bar" >> Formatter::to_str); (explicitly cast to std::string)
    // source: https://stackoverflow.com/a/12262626/10012118
    class Formatter
    {
    public:
        Formatter() {}
        ~Formatter() {}

        template <typename Type>
        Formatter & operator << (const Type & value)
        {
            stream_ << value;
            return *this;
        }

        std::string str() const         { return stream_.str(); }
        operator std::string () const   { return stream_.str(); }

        enum ConvertToString 
        {
            to_str
        };
        std::string operator >> (ConvertToString) { return stream_.str(); }

    private:
        std::stringstream stream_;

        Formatter(const Formatter &);
        Formatter & operator = (Formatter &);
    };
    */
}

#endif // COMMON_H
