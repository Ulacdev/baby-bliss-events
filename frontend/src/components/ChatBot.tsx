import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";

const ChatBot = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I am the Baby Bliss Assistant. How may I assist you today?",
      sender: "bot",
      timestamp: new Date(),
      options: [
        { label: "Book an Event", value: "I want to book a baby shower" },
        { label: "View Themes", value: "Tell me about your themes" },
        { label: "Find Venues", value: "What venues do you offer" },
        { label: "See Events", value: "Show me past events" },
        { label: "Package Pricing", value: "What are your package prices" },
        { label: "Contact Info", value: "How can I contact you" },
        { label: "About Us", value: "Tell me about your company" },
        { label: "Services", value: "What services do you offer" },
        { label: "Location", value: "Where are you located" },
        { label: "Hours", value: "What are your business hours" }
      ]
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getBotResponse = (userMessageLower: string) => {
    let botResponse = "";
    // Check for specific keywords and provide relevant responses
    if (userMessageLower.includes('useful') || userMessageLower.includes('benefit') || userMessageLower.includes('advantage') || userMessageLower.includes('why') && userMessageLower.includes('use')) {
      botResponse = "Baby Bliss provides comprehensive baby shower planning services for families seeking stress-free, memorable celebrations. Our key benefits include:\n\n• Professional Planning: Complete event management from concept to execution\n• High-Quality Photography: Instagram-worthy documentation of your special day\n• Transparent Pricing: Clear package options with no hidden fees\n• Custom Themes: Personalized decorations tailored to your preferences\n• Expert Team: Experienced professionals with attention to detail\n• Prime Locations: Carefully selected venues across Manila\n• Flexible Scheduling: Events ranging from 2 hours to full day\n\nOur services ensure a perfect celebration while saving you time and effort.";
    } else if (userMessageLower.includes('what') && (userMessageLower.includes('can') || userMessageLower.includes('do'))) {
      botResponse = "I can assist you with information about our services. You can inquire about:\n\n• Booking & Packages: Details on our Basic, Premium, and Deluxe packages\n• Themes & Decorations: Available decoration options\n• Venues: Recommended locations in Manila\n• Contact Information: Our hours, phone, and email\n• Pricing: Transparent pricing structure\n• Events: Gallery of past celebrations\n• About Us: Company information and team\n• Services: Complete service offerings\n\nPlease specify what you would like to know.";
    } else if (userMessageLower.includes('book') || userMessageLower.includes('booking') || userMessageLower.includes('reserve') || userMessageLower.includes('schedule')) {
      botResponse = "I can assist you with booking your baby shower. We offer three comprehensive packages:\n\n• Basic Package (₱15,000): Includes venue decoration, basic catering, professional photography, and 2 hours of celebration\n\n• Premium Package (₱25,000): Features full venue setup, premium catering, professional photography, 4 hours of event time, and entertainment\n\n• Deluxe Package (₱40,000): Provides complete venue transformation, gourmet catering, professional videography, full day event coverage, and DJ entertainment\n\nWhich package interests you? I can provide additional details or guide you through the booking process.";
    } else if (userMessageLower.includes('creator') || userMessageLower.includes('developer') || userMessageLower.includes('made') || userMessageLower.includes('who') && (userMessageLower.includes('website') || userMessageLower.includes('site') || userMessageLower.includes('page'))) {
      botResponse = "This website was developed by John Carlo Aganan. You can connect with him on Facebook: https://www.facebook.com/carlo.dronze";
    } else if (userMessageLower.includes('website') || userMessageLower.includes('site') || userMessageLower.includes('page') || userMessageLower.includes('about') && userMessageLower.includes('us')) {
      botResponse = "Baby Bliss is a premier baby shower planning service based in Manila, Philippines. We specialize in creating memorable, professional celebrations for families. Our expert team manages all aspects of event planning, from venue selection to custom themes, ensuring exceptional results. We offer three customizable packages ranging from ₱15,000 to ₱40,000.";
    } else if (userMessageLower.includes('location') || userMessageLower.includes('address') || (userMessageLower.includes('where') && (userMessageLower.includes('are') || userMessageLower.includes('located') || userMessageLower.includes('office')))) {
      botResponse = "We are located in Manila, Philippines. For venue recommendations and our office address, please visit our contact page at /contact.";
    } else if (userMessageLower.includes('hours') || userMessageLower.includes('time') || userMessageLower.includes('open')) {
      botResponse = "Our business hours are Monday to Friday from 9:00 AM to 6:00 PM, and weekends from 10:00 AM to 4:00 PM.";
    } else if (userMessageLower.includes('contact') || userMessageLower.includes('phone') || userMessageLower.includes('email')) {
      botResponse = "You can reach us at hello@babybliss.com or support@babybliss.com. Our phone numbers are (555) 123-4567 and (555) 987-6543. For more details, visit our contact page at /contact.";
    } else if (userMessageLower.includes('basic') || userMessageLower.includes('package')) {
      botResponse = "Our Basic Package at ₱15,000 includes venue decoration, basic catering, professional photography, and 2 hours of celebration time. It is ideal for intimate gatherings.";
    } else if (userMessageLower.includes('premium')) {
      botResponse = "The Premium Package at ₱25,000 includes full venue setup, premium catering, professional photography, 4 hours of event time, and entertainment options.";
    } else if (userMessageLower.includes('deluxe')) {
      botResponse = "Our Deluxe Package at ₱40,000 includes complete venue transformation, gourmet catering, professional videography, full day event coverage, and DJ entertainment.";
    } else if (userMessageLower.includes('price') || userMessageLower.includes('cost') || userMessageLower.includes('fee')) {
      botResponse = "Our packages range from ₱15,000 (Basic) to ₱40,000 (Deluxe). Each package can be customized to meet your specific requirements and budget.";
    } else if (userMessageLower.includes('theme') || userMessageLower.includes('decoration')) {
      botResponse = "We offer a variety of beautiful themes including woodland, garden, princess, little prince, and more. Our team can also create custom themes tailored to your preferences.";
    } else if (userMessageLower.includes('venue') || userMessageLower.includes('place')) {
      botResponse = "We can assist you in finding the perfect venue. Popular options in Manila include Garden Terrace, Rose Hall, and other premium locations.";
    } else if (userMessageLower.includes('event') || userMessageLower.includes('gallery') || userMessageLower.includes('past')) {
      botResponse = "View our gallery of past baby shower events at /gallery. It showcases our work with various themes, venues, and celebrations, each capturing the joy of welcoming a new family member.";
    } else if (userMessageLower.includes('find') || userMessageLower.includes('where') || userMessageLower.includes('navigate') || userMessageLower.includes('page') || userMessageLower.includes('go to')) {
      if (userMessageLower.includes('home') || userMessageLower.includes('index') || userMessageLower.includes('main')) {
        botResponse = "The home page is located at /";
      } else if (userMessageLower.includes('about')) {
        botResponse = "Information about Baby Bliss is available at /about";
      } else if (userMessageLower.includes('contact')) {
        botResponse = "Contact information can be found at /contact";
      } else if (userMessageLower.includes('book') || userMessageLower.includes('booking')) {
        botResponse = "To book an event, please visit /book";
      } else if (userMessageLower.includes('gallery') || userMessageLower.includes('events') || userMessageLower.includes('past events')) {
        botResponse = "Our event gallery is at /gallery";
      } else {
        botResponse = "Please specify which page you are looking for. Available pages include: Home (/), About (/about), Contact (/contact), Book (/book), and Gallery (/gallery).";
      }
    } else {
      // Default responses for general inquiries
      const defaultResponses = [
        "I can assist you with exploring Baby Bliss. You can ask about:\n\n• Booking: Package details and pricing\n• Themes: Decoration options\n• Venues: Locations in Manila\n• Events: Gallery of past celebrations\n• Services: Our complete offerings\n• Contact: How to reach us\n\nWhat would you like to know?",
        "Baby showers are special occasions. I can help you select the perfect theme, venue, and package for your celebration.",
        "Feel free to inquire about our packages, themes, venues, location, hours, or other aspects of baby shower planning.",
        "We specialize in creating memorable moments for families. How can I assist with your baby shower planning?",
        "I am here to help with all your baby shower planning needs. Ask about packages, themes, venues, our gallery, or contact information.",
        "Welcome to Baby Bliss. You can explore our packages, view past events, learn about themes, or inquire about booking your celebration."
      ];
      botResponse = defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
    }
    return botResponse;
  };

  // Don't show chatbot on admin pages only
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  const handleOptionClick = async (optionValue: string) => {
    const userMessage = {
      id: messages.length + 1,
      text: optionValue,
      sender: "user",
      timestamp: new Date(),
      options: undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Process the bot response
    setTimeout(() => {
      const botResponse = getBotResponse(optionValue.toLowerCase());

      const botMessage = {
        id: messages.length + 2,
        text: botResponse,
        sender: "bot",
        timestamp: new Date(),
        options: undefined
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const messageText = inputMessage; // Capture before clearing

    const userMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
      options: undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Process the bot response
    setTimeout(() => {
      const botResponse = getBotResponse(messageText.toLowerCase());

      const botMessage = {
        id: messages.length + 2,
        text: botResponse,
        sender: "bot",
        timestamp: new Date(),
        options: undefined
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-[#006994] hover:bg-[#005577] text-white rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-300 z-50"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-80 h-[500px] shadow-2xl border-2 border-[#006994] z-50 flex flex-col">
          <CardHeader className="bg-[#006994] text-white rounded-t-lg py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                <CardTitle className="text-lg">Baby Bliss Assistant</CardTitle>
              </div>
              <Button
                onClick={() => setIsOpen(false)}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 rounded-full w-8 h-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[350px]">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      message.sender === 'user'
                        ? 'bg-[#006994] text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {message.sender === 'bot' ? (
                        <Bot className="w-3 h-3" />
                      ) : (
                        <User className="w-3 h-3" />
                      )}
                      <span className="text-xs opacity-70">
                        {message.sender === 'bot' ? 'Assistant' : 'You'}
                      </span>
                    </div>
                    <div className="whitespace-pre-line">{message.text}</div>
                    {message.options && message.options.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.options.map((option, index) => (
                          <button
                            key={index}
                            onClick={() => handleOptionClick(option.value)}
                            className="w-full text-left p-2 bg-white/20 hover:bg-white/30 rounded border border-white/30 hover:border-white/50 transition-all duration-200 text-sm"
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 rounded-lg px-3 py-2 text-sm max-w-[80%]">
                    <div className="flex items-center gap-2 mb-1">
                      <Bot className="w-3 h-3" />
                      <span className="text-xs opacity-70">Assistant</span>
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t p-3">
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 text-sm"
                  disabled={isTyping}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  size="sm"
                  className="bg-[#006994] hover:bg-[#005577] text-white"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default ChatBot;