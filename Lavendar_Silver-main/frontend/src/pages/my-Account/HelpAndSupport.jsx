import React, { useState, useRef, useEffect } from "react";
import "./HelpAndSupport.css";
import { useUser } from "../../context/UserContext";
import { useNotification } from '../../context/NotificationContext';
import axios from 'axios';
import personImage from '../../assets/img/person.png';

const userAvatarFallback = personImage;
const supportAvatar = personImage;

const API_BASE_URL = import.meta.env.VITE_API_URL;

const SUPPORT_OPTIONS = [
  { label: 'Order Issue', value: 'Order Issue' },
  { label: 'Product Inquiry', value: 'Product Inquiry' },
  { label: 'Payment Problem', value: 'Payment Problem' },
  { label: 'Other', value: 'Other' },
];
const PRIORITY_OPTIONS = [
  { label: 'Low', value: 'Low' },
  { label: 'Medium', value: 'Medium' },
  { label: 'High', value: 'High' },
];

// SVG icon for person
const PersonIcon = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="8" r="4" fill="#bfa16c" />
    <rect x="4" y="16" width="16" height="6" rx="3" fill="#bfa16c" />
  </svg>
);

// SVG icon for history
const HistoryIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#bfa16c" />
  </svg>
);

const HelpAndSupport = () => {
  const { user, token } = useUser();
  const { showNotification } = useNotification();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [raiseTicketOpen, setRaiseTicketOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketTag, setTicketTag] = useState(SUPPORT_OPTIONS[0].value);
  const [ticketPriority, setTicketPriority] = useState(PRIORITY_OPTIONS[0].value);
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketLoading, setTicketLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [currentFollowUps, setCurrentFollowUps] = useState([]);
  const [showMainOptions, setShowMainOptions] = useState(true);
  const [conversationEnded, setConversationEnded] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [interactionCount, setInteractionCount] = useState(0);
  const [ticketHistoryOpen, setTicketHistoryOpen] = useState(false);
  const [userTickets, setUserTickets] = useState([]);
  const [ticketHistoryLoading, setTicketHistoryLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketMessages, setTicketMessages] = useState([]);
  const [ticketMessagesLoading, setTicketMessagesLoading] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [showTicketMessages, setShowTicketMessages] = useState(false);
  const [chatbotData, setChatbotData] = useState({
    welcome_message: "Hello! Welcome to PVJ Jewelry. I'm here to help you with any questions about our jewelry collection, services, or policies. How can I assist you today?",
    fallback_message: "I apologize, but I couldn't understand your question. Could you please choose from the options below?",
    questions: [],
    quick_options: []
  });
  const [dataLoading, setDataLoading] = useState(true);
  const initRef = useRef(false);

  // Fetch chatbot data from API
  const fetchChatbotData = async () => {
    try {
      setDataLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/chatbot/questions/public`);

      if (response.data.success) {
        const questions = response.data.data;

        // Get only main questions (parent_id = NULL) for quick options
        const mainQuestions = questions.filter(q => !q.parent_id);

        // Transform the data to match the expected format
        const transformedQuestions = mainQuestions.map(q => ({
          id: q.id,
          question: q.question,
          answer: q.answer,
          keywords: q.question.toLowerCase().split(' ').filter(word => word.length > 3),
          follow_up: q.children ? q.children.map(child => child.question) : []
        }));

        // Create quick options from main questions only
        const quickOptions = mainQuestions.map(q => q.question);

        // Create follow-up responses mapping
        const followUpResponses = {};
        questions.forEach(q => {
          if (q.children) {
            q.children.forEach(child => {
              followUpResponses[child.question] = child.answer;
            });
          }
        });

        setChatbotData({
          welcome_message: "Hello! Welcome to PVJ Jewelry. I'm here to help you with any questions about our jewelry collection, services, or policies. How can I assist you today?",
          fallback_message: "I apologize, but I couldn't understand your question. Could you please choose from the options below?",
          questions: transformedQuestions,
          quick_options: quickOptions,
          follow_up_responses: followUpResponses
        });
      }
    } catch (error) {
      console.error('Error fetching chatbot data:', error);
      showNotification('Failed to load chatbot data', 'error');
    } finally {
      setDataLoading(false);
    }
  };

  // Initialize chatbot with welcome message
  useEffect(() => {
    fetchChatbotData();
  }, []);

  useEffect(() => {
    if (!initRef.current && messages.length === 0 && !dataLoading && chatbotData.questions.length > 0) {
      initRef.current = true;
      addBotMessage(chatbotData.welcome_message);
      setShowMainOptions(true);
      setInitialized(true);
    }
  }, [chatbotData, dataLoading]);

  // Add bot message helper function
  const addBotMessage = (message, followUps = []) => {
    const botMessage = {
      id: Date.now(),
      message: message,
      from: "bot",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isBot: true
    };
    setMessages(prev => [...prev, botMessage]);

    // Add "End conversation" option to all follow-ups only if conversation hasn't ended
    if (!conversationEnded && followUps.length > 0) {
      const followUpsWithEnd = [...followUps, "End conversation"];
      setCurrentFollowUps(followUpsWithEnd);
    } else {
      setCurrentFollowUps(followUps);
    }
  };

  // Add user message helper function
  const addUserMessage = (message) => {
    const userMessage = {
      id: Date.now(),
      message: message,
      from: "user",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isUser: true
    };
    setMessages(prev => [...prev, userMessage]);
  };

  // Find best matching question based on user input
  const findBestMatch = (userInput) => {
    const input = userInput.toLowerCase().trim();

    // Direct question matching
    const exactMatch = chatbotData.questions.find(q =>
      q.question.toLowerCase().includes(input) ||
      input.includes(q.question.toLowerCase())
    );
    if (exactMatch) return exactMatch;

    // Keyword matching
    let bestMatch = null;
    let highestScore = 0;

    chatbotData.questions.forEach(question => {
      let score = 0;
      question.keywords.forEach(keyword => {
        if (input.includes(keyword.toLowerCase())) {
          score += 1;
        }
      });
      if (score > highestScore) {
        highestScore = score;
        bestMatch = question;
      }
    });

    return bestMatch;
  };

  // Process user input and generate bot response
  const processUserInput = (userInput) => {
    const match = findBestMatch(userInput);

    if (match) {
      addBotMessage(match.answer, match.follow_up);
    } else {
      addBotMessage(chatbotData.fallback_message, chatbotData.quick_options);
    }
  };

  // Handle main option selection
  const handleMainOptionClick = (option, e) => {
    e.preventDefault();
    addUserMessage(option);
    // Keep main options visible when clicking on database options
    setShowMainOptions(true);

    // Increment interaction count
    setInteractionCount(prev => prev + 1);

    setTimeout(() => {
      processUserInput(option);
    }, 800);
  };

  // Handle follow-up question selection
  const handleFollowUpClick = (followUp, e) => {
    e.preventDefault();
    addUserMessage(followUp);

    // Increment interaction count
    setInteractionCount(prev => prev + 1);

    setTimeout(() => {
      // Check if there's a specific response for this follow-up
      if (chatbotData.follow_up_responses[followUp]) {
        const followUps = [
          "Back to main menu"
        ];

        // Add "Raise ticket" option after 4-5 interactions
        if (interactionCount >= 3) {
          followUps.push("Raise a ticket");
        }

        addBotMessage(chatbotData.follow_up_responses[followUp], followUps);
      } else {
        processUserInput(followUp);
      }
    }, 800);
  };

  // Handle "Back to Main Menu" option
  const handleBackToMain = (e) => {
    e.preventDefault();
    addUserMessage("Back to main menu");
    setShowMainOptions(true);
    setCurrentFollowUps([]);
    setConversationEnded(false); // Reset conversation ended state
    setInteractionCount(0); // Reset interaction count

    setTimeout(() => {
      addBotMessage("What would you like to know about?", chatbotData.quick_options);
    }, 800);
  };

  // Handle "Talk to Human" option
  const handleTalkToHuman = (e) => {
    e.preventDefault();
    addUserMessage("I want to talk to a human");
    // Keep main options visible
    setShowMainOptions(true);
    setCurrentFollowUps([]);

    setTimeout(() => {
      addBotMessage("I understand you'd like to speak with a human representative. You can:\n\n• Call us: +919829034926 (24/7)\n• Email us: p.v.jewellersnsons.sks@gmail.com\n• Raise a ticket: For detailed assistance\n\nWould you like me to help you raise a support ticket?", [
        "Yes, raise a ticket",
        "No, I'll call directly",
        "Back to main menu"
      ]);
    }, 800);
  };

  // Handle "End conversation" option
  const handleEndConversation = (e) => {
    e.preventDefault();
    addUserMessage("End conversation");

    setShowMainOptions(true);
    setCurrentFollowUps([]);
    setConversationEnded(true); // Mark conversation as ended

    setTimeout(() => {
      addBotMessage("Thank you for chatting with PVJ Jewelry Assistant! 👋\n\nI hope I was able to help you with your jewelry queries. If you need any further assistance, feel free to:\n\n• Call us: +919829034926 (24/7)\n• Email us: p.v.jewellersnsons.sks@gmail.com\n• Raise a ticket: For detailed assistance\n\nHave a wonderful day!", []);
    }, 800);
  };

  // Fetch user ticket history
  const fetchUserTickets = async () => {
    setTicketHistoryLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/support/tickets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setUserTickets(res.data.data || []);
      } else {
        setUserTickets([]);
        console.error('Failed to fetch tickets:', res.data);
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setUserTickets([]);
      showNotification(err.response?.data?.message || 'Failed to load ticket history', 'error');
    } finally {
      setTicketHistoryLoading(false);
    }
  };

  // Fetch messages for a specific ticket
  const fetchTicketMessages = async (ticketId) => {
    setTicketMessagesLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/support/tickets/${ticketId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setTicketMessages(res.data.data);
      }
    } catch (err) {
      setTicketMessages([]);
      showNotification('Failed to load ticket messages', 'error');
    } finally {
      setTicketMessagesLoading(false);
    }
  };

  // Handle ticket history button click
  const handleTicketHistoryClick = () => {
    setTicketHistoryOpen(true);
    fetchUserTickets();
  };

  // Handle ticket selection
  const handleTicketSelect = (ticket) => {
    setSelectedTicket(ticket);
    setShowTicketMessages(true);
    fetchTicketMessages(ticket.ticket_id);
    setReplyMessage(""); // Clear reply message when selecting new ticket
  };

  // Handle back to ticket list
  const handleBackToTicketList = () => {
    setShowTicketMessages(false);
    setSelectedTicket(null);
    setTicketMessages([]);
    setReplyMessage("");
  };

  // Handle reply to ticket
  const handleReplyToTicket = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;

    setReplyLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/support/tickets/${selectedTicket.ticket_id}/reply`, {
        message: replyMessage,
        ticket_id: selectedTicket.ticket_id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setReplyMessage("");
      showNotification('Reply sent successfully!', 'success');

      // Refresh messages
      fetchTicketMessages(selectedTicket.ticket_id);

      // Refresh ticket list to update last message
      fetchUserTickets();
    } catch (err) {
      showNotification(
        err.response?.data?.message || 'Failed to send reply',
        'error'
      );
    } finally {
      setReplyLoading(false);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'open': return '#28a745';
      case 'in progress': return '#ffc107';
      case 'resolved': return '#17a2b8';
      case 'closed': return '#6c757d';
      default: return '#6c757d';
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return '#dc3545';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  // Raise Ticket logic
  const handleRaiseTicket = async (e) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim() || !user?.id) return;
    setTicketLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/support/admin/tickets`, {
        user_id: user.id,
        subject: ticketSubject,
        tag: ticketTag,
        priority: ticketPriority,
        message: ticketMessage
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRaiseTicketOpen(false);
      setTicketSubject("");
      setTicketTag(SUPPORT_OPTIONS[0].value);
      setTicketPriority(PRIORITY_OPTIONS[0].value);
      setTicketMessage("");
      showNotification('Ticket raised successfully! Check your email for confirmation.', 'success');

      // Refresh ticket list if ticket history modal is open
      if (ticketHistoryOpen) {
        fetchUserTickets();
      }

      // Keep main options visible after successful ticket submission
      setShowMainOptions(true);
      setCurrentFollowUps([]);
      setConversationEnded(true);

      // Add bot confirmation message with conversation ending
      setTimeout(() => {
        addBotMessage("Thank you! Your ticket has been raised successfully and a confirmation email has been sent to your registered email address. Our support team will get back to you within 24 hours.\n\nThank you for chatting with PVJ Jewelry Assistant! 👋\n\nIf you need any further assistance, feel free to:\n\n• Call us: +919829034926 (24/7)\n• Email us: p.v.jewellersnsons.sks@gmail.com\n• Raise a ticket: For detailed assistance\n\nHave a wonderful day!", []);
      }, 800);
    } catch (err) {
      showNotification(
        err.response?.data?.message || 'Failed to raise ticket',
        'error'
      );
    }
    setTicketLoading(false);
  };

  const userAvatar = user?.photo ? (user.photo.startsWith('http') ? user.photo : `${import.meta.env.VITE_API_URL}${user.photo}`) : userAvatarFallback;

  if (dataLoading) {
    return (
      <div className="chat-support-wrapper">
        <div className="chat-support-header">
          <span className="chat-support-title">
            <PersonIcon size={32} />
            <span style={{ marginLeft: '10px' }}>PVJ Jewelry Assistant</span>
          </span>
        </div>
        <div className="chat-support-body">
          <div style={{ textAlign: 'center', color: '#888', marginTop: 40 }}>
            Loading chatbot data...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-support-wrapper">
      <div className="chat-support-header">
        <span className="chat-support-title">
          <PersonIcon size={32} />
          <span style={{ marginLeft: '10px' }}>PVJ Jewelry Assistant</span>
        </span>
        <div className="chat-support-menu" onClick={() => setShowMenu(!showMenu)}>
          <span className="chat-support-dot"></span>
          <span className="chat-support-dot"></span>
          <span className="chat-support-dot"></span>
          {showMenu && (
            <div className="chat-support-dropdown-menu">
              <button onClick={() => { handleTicketHistoryClick(); setShowMenu(false); }}>
                <HistoryIcon size={16} />
                <span style={{ marginLeft: '5px' }}>My Tickets</span>
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="chat-support-body">
        <div className="chat-support-messages">
          {loading ? (
            <div style={{ textAlign: 'center', color: '#888', marginTop: 40 }}>Loading...</div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#888', marginTop: 40 }}>Starting conversation...</div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-support-message-row ${msg.from === "user" ? "user-message" : "support-message"}`}
              >
                <div className="chat-support-message-bubble">
                  <div className="chat-support-message-text">
                    {msg.message.split('\n').map((line, index) => (
                      <div key={index}>
                        {line.startsWith('•') ? (
                          <span style={{ marginLeft: '10px' }}>{line}</span>
                        ) : line.startsWith('**') && line.endsWith('**') ? (
                          <strong style={{ color: '#0E593C' }}>{line.replace(/\*\*/g, '')}</strong>
                        ) : (
                          line
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="chat-support-message-time">{msg.time}</div>
                </div>
              </div>
            ))
          )}

          {/* Follow-up questions */}
          {currentFollowUps.length > 0 && (
            <div className="chat-support-follow-ups">
              {currentFollowUps.map((followUp, index) => (
                <button
                  key={index}
                  className={`chat-support-follow-up-btn ${followUp === "End conversation" ? "chat-support-end-btn" : ""}`}
                  onClick={(e) => {
                    if (followUp === "Back to main menu") {
                      handleBackToMain(e);
                    } else if (followUp === "Talk to human") {
                      handleTalkToHuman(e);
                    } else if (followUp === "Yes, raise a ticket") {
                      e.preventDefault();
                      setRaiseTicketOpen(true);
                    } else if (followUp === "End conversation") {
                      handleEndConversation(e);
                    } else if (followUp === "Raise a ticket") {
                      e.preventDefault();
                      setRaiseTicketOpen(true);
                    } else if (followUp === "View my tickets") {
                      e.preventDefault();
                      handleTicketHistoryClick();
                    } else {
                      handleFollowUpClick(followUp, e);
                    }
                  }}
                >
                  {followUp}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main options at bottom */}
      {showMainOptions && (
        <div className="chat-support-main-options">
          <div className="chat-support-options-list">
            {chatbotData.quick_options.map((option, index) => (
              <button
                key={index}
                className="chat-support-option-btn"
                onClick={(e) => handleMainOptionClick(option, e)}
              >
                {option}
              </button>
            ))}
            <button
              className="chat-support-option-btn chat-support-raise-ticket-btn"
              onClick={(e) => {
                e.preventDefault();
                setRaiseTicketOpen(true);
              }}
            >
              🎫 Raise Ticket
            </button>
            <button
              className="chat-support-option-btn chat-support-history-btn"
              onClick={handleTicketHistoryClick}
            >
              📋 My Tickets
            </button>
          </div>
        </div>
      )}

      {/* Ticket History Modal */}
      {ticketHistoryOpen && (
        <div className="chat-support-modal" onClick={() => setTicketHistoryOpen(false)}>
          <div className="chat-support-modal-content ticket-history-modal" onClick={e => e.stopPropagation()}>
            {!showTicketMessages ? (
              <>
                <h3>My Support Tickets</h3>
                {ticketHistoryLoading ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>Loading tickets...</div>
                ) : userTickets.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                    No tickets found. You haven't raised any support tickets yet.
                  </div>
                ) : (
                  <div className="ticket-list-container">
                    <div className="ticket-list">
                      {userTickets.map((ticket) => (
                        <div
                          key={ticket.ticket_id}
                          className={`ticket-item ${selectedTicket?.ticket_id === ticket.ticket_id ? 'selected' : ''}`}
                          onClick={() => handleTicketSelect(ticket)}
                        >
                          <div className="ticket-header">
                            <span className="ticket-id">{ticket.ticket_id}</span>
                            <span
                              className="ticket-status"
                              style={{ backgroundColor: getStatusColor(ticket.status) }}
                            >
                              {ticket.status || 'Open'}
                            </span>
                          </div>
                          <div className="ticket-subject">{ticket.subject}</div>
                          <div className="ticket-meta">
                            <span
                              className="ticket-priority"
                              style={{ color: getPriorityColor(ticket.priority) }}
                            >
                              {ticket.priority || 'Low'} Priority
                            </span>
                            <span className="ticket-date">
                              {new Date(ticket.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="chat-support-cancel-btn"
                    onClick={() => setTicketHistoryOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <div className="ticket-messages-full-view">
                <div className="ticket-messages-header">
                  <button
                    type="button"
                    className="ticket-back-btn"
                    onClick={handleBackToTicketList}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor" />
                    </svg>
                    Back
                  </button>
                  <div className="ticket-header-info">
                    <h4>Ticket: {selectedTicket?.ticket_id}</h4>
                    <span className="ticket-status-badge" style={{ backgroundColor: getStatusColor(selectedTicket?.status) }}>
                      {selectedTicket?.status || 'Open'}
                    </span>
                  </div>
                </div>
                {ticketMessagesLoading ? (
                  <div className="ticket-loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading messages...</p>
                  </div>
                ) : (
                  <>
                    <div className="messages-container">
                      {ticketMessages.length === 0 ? (
                        <div className="ticket-empty-state">
                          <p>No messages yet. Start the conversation by sending a reply.</p>
                        </div>
                      ) : (
                        ticketMessages.map((msg, index) => {
                          const isUser = msg.sender === 'user';
                          const messageDate = new Date(msg.created_at);
                          const isToday = messageDate.toDateString() === new Date().toDateString();

                          return (
                            <div
                              key={index}
                              className={`ticket-message-wrapper ${isUser ? 'user-message-wrapper' : 'admin-message-wrapper'}`}
                            >
                              {!isUser && (
                                <div className="message-avatar admin-avatar">
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="currentColor" />
                                  </svg>
                                </div>
                              )}
                              <div className={`ticket-message ${isUser ? 'user-message' : 'admin-message'}`}>
                                <div className="message-content">
                                  {!isUser && (
                                    <div className="message-sender-label">Support Team</div>
                                  )}
                                  <div className="message-text">{msg.message}</div>
                                  <div className="message-time">
                                    {isToday
                                      ? messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                      : messageDate.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                                    }
                                  </div>
                                </div>
                              </div>
                              {isUser && (
                                <div className="message-avatar user-avatar">
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="currentColor" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Reply form with input and send icon */}
                    <form onSubmit={handleReplyToTicket} className="ticket-reply-form-inline">
                      <div className="reply-input-wrapper">
                        <input
                          type="text"
                          className="ticket-reply-input-inline"
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          placeholder="Type your message..."
                          required
                        />
                        <button
                          type="submit"
                          className="ticket-reply-send-btn"
                          disabled={replyLoading || !replyMessage.trim()}
                        >
                          {replyLoading ? (
                            <span className="btn-spinner-small"></span>
                          ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {raiseTicketOpen && (
        <div className="chat-support-modal" onClick={() => setRaiseTicketOpen(false)}>
          <div className="chat-support-modal-content" onClick={e => e.stopPropagation()}>
            <h3>Raise a Support Ticket</h3>
            <form onSubmit={handleRaiseTicket}>
              <label>Subject</label>
              <input
                type="text"
                className="chat-support-input"
                value={ticketSubject}
                onChange={e => setTicketSubject(e.target.value)}
                required
              />
              <label>Category</label>
              <select
                className="chat-support-input"
                value={ticketTag}
                onChange={e => setTicketTag(e.target.value)}
              >
                {SUPPORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <label>Priority</label>
              <select
                className="chat-support-input"
                value={ticketPriority}
                onChange={e => setTicketPriority(e.target.value)}
              >
                {PRIORITY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <label>Message</label>
              <textarea
                className="chat-support-input"
                value={ticketMessage}
                onChange={e => setTicketMessage(e.target.value)}
                rows={4}
                required
              />
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="chat-support-cancel-btn" onClick={() => setRaiseTicketOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="chat-support-send-btn" disabled={ticketLoading}>
                  {ticketLoading ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpAndSupport; 