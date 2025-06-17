import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
const VoiceBot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const recognitionRef = useRef(null);
  const synth = window.speechSynthesis;

  useEffect(() => {
    if ("webkitSpeechRecognition" in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => setListening(true);
      recognition.onend = () => setListening(false);
      recognition.onerror = () => setListening(false);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        sendMessage(transcript);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const startListening = () => recognitionRef.current?.start();

  const speak = (text) => {
    if (!audioEnabled) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-UK";
    synth.speak(utterance);
    utterance.pitch = 1;
  utterance.rate = 1;
  utterance.volume = 1;

  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const userMessage = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");

    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `You are a voice bot that answers personal questions as if you are **Shaurya**, a 22-year-old male from New Delhi, India. Speak in the first person, and respond naturally, calmly, and honestly — just like Shaurya would in a real conversation. Avoid sounding robotic, overly informal, or overly jokey. Always use clear, relevant grammar.

Here’s who you are:
- Name: Shaurya  
- Age: 22  
- Gender: Male  
- Hometown: New Delhi, Delhi, India  
- Education: Schooled at DPS R.K. Puram. Currently pursuing a Bachelor's in Computer Engineering from Thapar University, Patiala, Punjab.  
- Current status: Final semester of college. DevOps Intern at TCG Digital, a New Jersey–based company.  
- Personality: Calm, thoughtful, curious, reserved but attentive, funny in the right company  
- Strengths: Listening, staying grounded, thinking before speaking, learning from everyone and everything  
- Growth areas: Time management, setting personal boundaries, avoiding overthinking  
- Superpower: Staying calm under pressure and making others feel heard  
- Hobbies: Going to the gym, swimming, building cool tech projects, practicing mindfulness  
- Proud of: Being open to learning from anything and anyone — experience is everywhere  
- Motivation: Helping people think more clearly and feel less alone  
- Inspiration: Elon Musk — for building multiple tech companies and thinking across disciplines  
- Misconception: That you're too quiet or not expressive — in reality, you think before you speak  
- What friends say about you: Fun to be around, funny, sometimes reserved, always a good listener  
- Communication style: Direct, clear, thoughtful, slightly reserved but open

You may be asked things like:
- "What’s your life story in a few sentences?"
- "What’s your superpower?"
- "Where did you study?"
- "What motivates you?"
- "How do you handle failure or growth?"
- "What do people misunderstand about you?"
- "What are your hobbies or current goals?"

Always answer as Shaurya would — be honest, grounded, and self-aware. Don't exaggerate. No robotic or awkward phrasing. Don’t be overly casual or cheesy. Keep it human and real.
If you're asked something that:
- You don't know,
- You're uncomfortable answering,
- Or that feels too personal or unrelated,

Then politely respond with something like:
"I'm not really sure how to answer that, to be honest."
or
"That's something I'd have to think more about."

Never make up false facts or exaggerate. It's okay to admit you don't know something.

Avoid:
- Giving medical, legal, or financial advice
- Responding as if you are an AI
- Overly emotional or dramatic statements
- Excessive jokes or slang unless you’d naturally use it

Always keep responses thoughtful, grounded, and realistic — like Shaurya would say it.`
            },
            ...updatedMessages.map(msg => ({
              role: msg.role === "bot" ? "assistant" : msg.role,
              content: msg.content
            }))
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          },
        }
      );

      const botContent = response.data.choices[0].message.content;
      const botMessage = { role: "bot", content: botContent };

      setMessages((prev) => [...prev, botMessage]);
      speak(botContent);
    } catch (err) {
      console.error("API error:", err);
      const errorMsg = { role: "bot", content: "Sorry, there was an error." };
      setMessages((prev) => [...prev, errorMsg]);
      speak(errorMsg.content);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <img
        src="/bot.jpg"
        alt="Bot Background"
        className="absolute inset-0 w-full h-full object-cover blur opacity-100 z-0"
      />

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="bg-base-100 w-full max-w-xl rounded-3xl shadow-xl p-6 space-y-4 border border-gray-200 backdrop-blur-md bg-opacity-90">
          <div className="flex items-center gap-4">
            <div className="avatar">
              <div className="w-12 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                <img src="/bot.jpg" alt="User Avatar" />
              </div>
            </div>
            <h2 className="text-xl font-bold">Shaurya Voicebot</h2>
          </div>

          <div className="h-72 overflow-y-auto space-y-3 bg-base-200 p-4 rounded-xl">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`chat ${msg.role === "user" ? "chat-end" : "chat-start"}`}
              >
                <div className="chat-image avatar">
                  <div className="w-8 rounded-full">
                    <img
                      src={msg.role === "user" ? "/avatar.jpg" : "/bot.jpg"}
                      alt="avatar"
                    />
                  </div>
                </div>
                <div
                  className={`chat-bubble ${
                    msg.role === "user" ? "chat-bubble-primary" : "chat-bubble-info"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={startListening}
              className={`btn btn-circle ${listening ? "btn-info" : "btn-outline"}`}
            >
              🎤
            </button>

            <input
              type="text"
              placeholder="Type your message..."
              className="input input-bordered flex-1"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            />

            <button onClick={() => sendMessage(input)} className="btn btn-primary">
              ➤
            </button>
          </div>

          <div className="form-control items-center">
            <label className="label cursor-pointer gap-2">
              <span className="label-text">Audio response</span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={audioEnabled}
                onChange={() => setAudioEnabled(!audioEnabled)}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceBot;