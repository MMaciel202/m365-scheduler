const langToggle = document.getElementById("langToggle");
const typedText = document.getElementById("typedText");
const contactForm = document.getElementById("contactForm");
const resumeLink = document.getElementById("resumeLink");

let currentLang = localStorage.getItem("lang") || "pt";

const typedValues = {
  pt: [
    "IT Support | Infraestrutura | Docker",
    "Troubleshooting | Websites | Automação",
    "Home Hosting | Reverse Proxy | Python"
  ],
  en: [
    "IT Support | Infrastructure | Docker",
    "Troubleshooting | Websites | Automation",
    "Home Hosting | Reverse Proxy | Python"
  ]
};

let currentWordIndex = 0;
let currentCharIndex = 0;
let deleting = false;
let typingTimeout;

const typingSpeed = 90;
const deletingSpeed = 45;
const pauseAtEnd = 2000;
const pauseBeforeTyping = 400;

function updateResumeLink(lang) {
  if (!resumeLink) return;
  resumeLink.href = lang === "pt" ? "curriculo-pt.html" : "resume-en.html";
}

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("lang", lang);

  document.documentElement.lang = lang === "pt" ? "pt-BR" : "en";

  document.querySelectorAll("[data-pt][data-en]").forEach((el) => {
    el.textContent = el.getAttribute(lang === "pt" ? "data-pt" : "data-en");
  });

  document.querySelectorAll("[data-placeholder-pt][data-placeholder-en]").forEach((el) => {
    el.placeholder = el.getAttribute(
      lang === "pt" ? "data-placeholder-pt" : "data-placeholder-en"
    );
  });

  if (langToggle) {
    langToggle.textContent = lang === "pt" ? "EN" : "PT";
  }

  updateResumeLink(lang);
  startTyping();
}

function typeLoop() {
  if (!typedText) return;

  const words = typedValues[currentLang];
  const currentWord = words[currentWordIndex];

  if (!deleting) {
    typedText.textContent = currentWord.substring(0, currentCharIndex + 1);
    currentCharIndex++;

    if (currentCharIndex === currentWord.length) {
      deleting = true;
      typingTimeout = setTimeout(typeLoop, pauseAtEnd);
      return;
    }

    typingTimeout = setTimeout(typeLoop, typingSpeed);
  } else {
    typedText.textContent = currentWord.substring(0, currentCharIndex - 1);
    currentCharIndex--;

    if (currentCharIndex === 0) {
      deleting = false;
      currentWordIndex = (currentWordIndex + 1) % words.length;
      typingTimeout = setTimeout(typeLoop, pauseBeforeTyping);
      return;
    }

    typingTimeout = setTimeout(typeLoop, deletingSpeed);
  }
}

function startTyping() {
  clearTimeout(typingTimeout);
  currentWordIndex = 0;
  currentCharIndex = 0;
  deleting = false;

  if (typedText) {
    typedText.textContent = "";
    typeLoop();
  }
}

/* LANGUAGE BUTTON */
if (langToggle) {
  langToggle.addEventListener("click", () => {
    setLanguage(currentLang === "pt" ? "en" : "pt");
  });
}

/* CONTACT FORM */
if (contactForm) {
  contactForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const name = document.getElementById("name")?.value.trim() || "";
    const email = document.getElementById("email")?.value.trim() || "";
    const message = document.getElementById("message")?.value.trim() || "";

    const subject = encodeURIComponent(`Portfolio Contact - ${name}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
    );

    window.location.href = `mailto:monicatd.maciel@gmail.com?subject=${subject}&body=${body}`;
  });
}

/* INIT */
setLanguage(currentLang);