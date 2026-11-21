/* L'OREAL BEAUTY ASSISTANT */

// LINE 4: PASTE YOUR CLOUDFLARE WORKER URL HERE
const WORKER_URL = "08-prj-loreal-chatbot.jialiyahdukes.workers.dev";
// Get HTML elements
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendBtn = document.getElementById("sendBtn");

const latestQuestion = document.getElementById("latestQuestion");
const latestQuestionText = document.getElementById("latestQuestionText");

const suggestionButtons = document.querySelectorAll(".suggestion-btn");

// Keep conversation history during this session
const conversationHistory = [];

// Create chat bubbles
function addMessage(text, sender) {
  const bubble = document.createElement("div");

  bubble.classList.add("msg", sender);
  bubble.textContent = text;

  chatWindow.appendChild(bubble);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  return bubble;
}

// Show only the latest question above the chat
function updateLatestQuestion(question) {
  latestQuestionText.textContent = question;
  latestQuestion.hidden = false;
}

// Welcome message
addMessage(
  "Hi beautiful! 💗 Welcome to your L'Oréal Beauty " +
    "Assistant! I'm here to help you find skincare, " +
    "makeup, and haircare recommendations. " +
    "What's your beauty goal today?",
  "ai",
);

// Send a question to the AI
async function sendMessage(question) {
  const userMessage = question.trim();

  if (!userMessage || sendBtn.disabled) {
    return;
  }

  // Show the latest question
  updateLatestQuestion(userMessage);

  // Add user's message bubble
  addMessage(userMessage, "user");

  // Clear and disable the input
  userInput.value = "";
  sendBtn.disabled = true;
  userInput.disabled = true;

  const loadingBubble = addMessage(
    "✨ Finding your perfect beauty advice...",
    "ai",
  );

  try {
    // Include previous messages for context
    const requestMessages = [
      ...conversationHistory,
      {
        role: "user",
        content: userMessage,
      },
    ];

    // Connect to Cloudflare Worker
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: requestMessages,
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      const errorMessage =
        typeof data.error === "string" ? data.error : data.error?.message;

      throw new Error(errorMessage || "Unable to connect to the AI.");
    }

    // Read the AI's answer
    const aiReply = data.choices?.[0]?.message?.content;

    if (!aiReply) {
      throw new Error("The AI returned an empty response.");
    }

    // Replace loading message with the answer
    loadingBubble.textContent = aiReply;

    // Save both messages for future questions
    conversationHistory.push(
      {
        role: "user",
        content: userMessage,
      },
      {
        role: "assistant",
        content: aiReply,
      },
    );

    // Keep the last 30 messages
    if (conversationHistory.length > 30) {
      conversationHistory.splice(0, conversationHistory.length - 30);
    }
  } catch (error) {
    console.error("Chatbot error:", error);

    loadingBubble.textContent =
      "Sorry! 💗 I couldn't connect right now. " +
      "Please try again in a moment.";
  } finally {
    sendBtn.disabled = false;
    userInput.disabled = false;
    userInput.focus();

    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
}

// Send typed questions
chatForm.addEventListener("submit", function (event) {
  event.preventDefault();
  sendMessage(userInput.value);
});

// Suggested question buttons
suggestionButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    sendMessage(button.dataset.question || "");
  });
});
