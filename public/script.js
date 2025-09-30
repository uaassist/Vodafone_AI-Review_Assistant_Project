document.addEventListener('DOMContentLoaded', () => {
    // --- Element selectors ---
    const contentArea = document.getElementById('content-area');
    const welcomeScreen = document.getElementById('welcome-screen');
    const choiceScreen = document.getElementById('choice-screen');
    const chatView = document.getElementById('chat-view');
    const recoveryScreen = document.getElementById('recovery-screen');
    const chatBody = document.getElementById('chat-body');
    const quickRepliesContainer = document.getElementById('quick-replies-container');
    const progressContainer = document.getElementById('progress-container');

    // --- ЄДИНИЙ ЦЕНТРАЛІЗОВАНИЙ ОБРОБНИК ПОДІЙ ---
    contentArea.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (!button) return; // Якщо клік був не по кнопці, нічого не робимо

        // 1. Тактильний відгук на будь-яке натискання кнопки
        try { navigator.vibrate(10); } catch (e) {}

        // 2. Обробка кнопок мульти-вибору (де потрібен toggle)
        if (button.classList.contains('quick-reply-btn') && !button.hasAttribute('id')) {
            button.classList.toggle('selected');
            return; // Завершуємо обробку тут
        }

        // 3. Обробка всіх інших кнопок за їх ID
        const buttonId = button.id;
        switch (buttonId) {
            // Навігація
            case 'great-btn': welcomeScreen.style.display = 'none'; choiceScreen.classList.remove('hidden'); break;
            case 'okay-btn': case 'bad-btn': welcomeScreen.style.display = 'none'; recoveryScreen.classList.remove('hidden'); break;
            case 'ai-draft-btn': choiceScreen.style.display = 'none'; startConversation("Все було чудово!"); break;
            case 'manual-review-btn': window.open(googleReviewUrl, '_blank'); choiceScreen.innerHTML = `<h1 class="main-title">Дякуємо!</h1><p class="subtitle">Ми відкрили сторінку відгуків Google у новій вкладці.</p>`; break;
            
            // Екран вирішення проблем
            case 'request-assistance-btn': alert('Перенаправлення до чату підтримки...'); break;
            case 'schedule-callback-btn': alert('Перенаправлення на сторінку планування дзвінка...'); break;
            case 'start-return-btn': alert('Перенаправлення на сторінку повернення...'); break;
            case 'google-review-fallback-btn': window.open(googleReviewUrl, '_blank'); recoveryScreen.innerHTML = `<h1 class="main-title">Дякуємо!</h1><p class="subtitle">Ми відкрили сторінку відгуків Google у новій вкладці.</p>`; break;

            // Кнопки дій у чаті
            case 'continue-btn': handleContinueClick(); break;
            case 'regenerate-review-btn': getAIResponse("Це не зовсім те, спробуй, будь ласка, інший варіант.", true); break;
            case 'post-review-btn': handlePostReviewClick(); break;
        }
    });

    function updateProgressBar(step) { /* ... без змін ... */ }
    function startConversation(firstMessage) { /* ... без змін ... */ }

    let conversationHistory = [];
    const placeId = 'Your_Google_Place_ID_Here';
    const googleReviewUrl = `https://search.google.com/local/writereview?placeid=${placeId}`;
    const avatarUrl = 'https://ucarecdn.com/c679e989-5032-408b-ae8a-83c7d204c67d/Vodafonebot.webp';

    function addMessage(sender, text, isHtml = false, isQuestion = false) { /* ... без змін ... */ }
    async function getAIResponse(userMessage) { /* ... без змін ... */ }
    function showTypingIndicator() { /* ... без змін ... */ }
    function removeTypingIndicator() { /* ... без змін ... */ }
    function processAIResponse(text) { /* ... без змін ... */ }
    function handleFinalQuestion(question) { /* ... без змін ... */ }
    function createEditableDraft(reviewText) { /* ... без змін ... */ }
    
    // --- ОНОВЛЕНІ ФУНКЦІЇ СТВОРЕННЯ КНОПОК ---

    function createMultiSelectButtons(options, step) {
        clearQuickReplies();
        options.forEach(optionText => {
            const button = document.createElement('button');
            button.className = 'quick-reply-btn';
            button.innerText = optionText;
            // БІЛЬШЕ НЕМАЄ ПРЯМОГО .onclick
            quickRepliesContainer.appendChild(button);
        });
        const continueButton = document.createElement('button');
        continueButton.className = 'quick-reply-btn continue-btn';
        continueButton.id = 'continue-btn'; // Додаємо ID для обробки
        continueButton.dataset.step = step; // Зберігаємо крок у data-атрибуті
        continueButton.innerText = 'Далі';
        // БІЛЬШЕ НЕМАЄ ПРЯМОГО .onclick
        quickRepliesContainer.appendChild(continueButton);
    }

    function createPostButtons() {
        clearQuickReplies();
        const postButton = document.createElement('button');
        postButton.className = 'quick-reply-btn primary-action choice-button';
        postButton.id = 'post-review-btn'; // Додаємо ID для обробки
        postButton.innerHTML = `<div class="button-main-text">✅ Відкрити Google для публікації</div><div class="button-sub-text">Ваш відгук скопійовано — просто вставте та оцініть</div>`;
        
        const regenerateButton = document.createElement('button');
        regenerateButton.className = 'quick-reply-btn';
        regenerateButton.id = 'regenerate-review-btn'; // Додаємо ID для обробки
        regenerateButton.innerText = '🔄 Інша версія';
        
        quickRepliesContainer.appendChild(regenerateButton);
        quickRepliesContainer.appendChild(postButton);
    }

    // --- НОВІ ФУНКЦІЇ ДЛЯ ОБРОБКИ ДІЙ ---

    function handleContinueClick() {
        const continueButton = document.getElementById('continue-btn');
        const step = continueButton.dataset.step;
        const selectedButtons = quickRepliesContainer.querySelectorAll('.quick-reply-btn.selected');
        const selectedKeywords = Array.from(selectedButtons).map(btn => btn.innerText);
        let combinedMessage = selectedKeywords.length > 0 ? selectedKeywords.join(', ') : "Нічого конкретного не виділено";
        if (step === 'purpose') {
            combinedMessage = `Мета візиту: ${combinedMessage}`;
        } else if (step === 'experience') {
            combinedMessage = `Враження від обслуговування: ${combinedMessage}`;
        }
        getAIResponse(combinedMessage);
    }

    function handlePostReviewClick() {
        const draftText = document.getElementById('review-draft-textarea').value;
        window.open(googleReviewUrl, '_blank');
        navigator.clipboard.writeText(draftText);
        clearQuickReplies();
        addMessage('concierge', "Дякуємо за ваш відгук!");
    }

    function clearQuickReplies() {
        quickRepliesContainer.innerHTML = '';
    }

    // --- ТІЛА ФУНКЦІЙ, ЩО НЕ ЗМІНИЛИСЯ ---
    updateProgressBar = function(step) {
        const segments = progressContainer.querySelectorAll('.progress-segment');
        segments.forEach((segment, index) => { segment.classList.toggle('active', index < step); });
        const labels = progressContainer.querySelectorAll('.progress-label');
        labels.forEach((label, index) => { label.classList.toggle('active', index === step - 1); });
    };
    startConversation = function(firstMessage) {
        welcomeScreen.style.display = 'none';
        choiceScreen.style.display = 'none';
        chatView.classList.remove('hidden');
        if (firstMessage.includes("чудово")) { progressContainer.classList.remove('hidden'); }
        getAIResponse(firstMessage);
    };
    addMessage = function(sender, text, isHtml = false, isQuestion = false) {
        const wrapper = document.createElement('div');
        wrapper.className = `message-wrapper ${sender}`;
        if (sender === 'concierge') {
            const avatarImg = document.createElement('img');
            avatarImg.src = avatarUrl;
            avatarImg.className = 'chat-avatar';
            avatarImg.alt = 'Асистент TOBi';
            wrapper.appendChild(avatarImg);
        }
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        if (isQuestion) { bubble.classList.add('question-bubble'); }
        if (isHtml) { bubble.innerHTML = text; } else { bubble.innerText = text; }
        wrapper.appendChild(bubble);
        chatBody.prepend(wrapper);
    };
    getAIResponse = async function(userMessage) {
        addMessage('user', userMessage);
        conversationHistory.push({ role: 'user', content: userMessage });
        clearQuickReplies();
        showTypingIndicator();
        try {
            const response = await fetch('/api/concierge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: conversationHistory }),
            });
            if (!response.ok) throw new Error('Network response was not ok.');
            const data = await response.json();
            const aiMessage = data.message;
            conversationHistory.push(aiMessage);
            processAIResponse(aiMessage.content);
        } catch (error) {
            console.error("Fetch Error:", error);
            processAIResponse("Вибачте, виникла проблема зі з'єднанням. Спробуйте, будь ласка, пізніше.");
        }
    };
    showTypingIndicator = function() {
        if (document.querySelector('.typing-indicator')) return;
        const wrapper = document.createElement('div');
        wrapper.className = 'message-wrapper concierge typing-indicator';
        wrapper.innerHTML = `<img src="${avatarUrl}" class="chat-avatar" alt="TOBi друкує"><div class="bubble"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>`;
        chatBody.prepend(wrapper);
    };
    removeTypingIndicator = function() {
        const indicator = document.querySelector('.typing-indicator');
        if (indicator) indicator.remove();
    };
    processAIResponse = function(text) {
        if (text.includes("|")) {
            const parts = text.split('|');
            const statement = parts[0].trim();
            const question = parts[1].trim();
            addMessage('concierge', statement, false, false);
            handleFinalQuestion(question);
        } else {
            const quoteRegex = /"(.*?)"/s;
            const matches = text.match(quoteRegex);
            if (matches && matches[1].length > 10) {
                const statementBeforeDraft = text.split('"')[0].trim();
                addMessage('concierge', statementBeforeDraft);
                createEditableDraft(matches[1]);
            } else {
                addMessage('concierge', text, false, false);
            }
        }
        removeTypingIndicator();
    };
    handleFinalQuestion = function(question) {
        addMessage('concierge', question, false, true);
        if (question.includes("мета вашого візиту")) {
            updateProgressBar(1);
            const tier1Options = ["📱 Новий телефон/пристрій", "🔄 Зміна/оновлення тарифу", "🔧 Технічна підтримка", "💳 Оплата рахунку", "👤 Реєстрація нового номера"];
            createMultiSelectButtons(tier1Options, 'purpose');
        } else if (question.includes("враження від обслуговування")) {
            updateProgressBar(2);
            const tier2Options = ["⭐ Компетентні працівники", "💨 Швидке обслуговування", "🏬 Чистота в магазині", "👍 Простий процес", "🤝 Проблему вирішено"];
            createMultiSelectButtons(tier2Options, 'experience');
        }
    };
    createEditableDraft = function(reviewText) {
        updateProgressBar(3);
        clearQuickReplies();
        const container = document.createElement('div');
        container.className = 'review-draft-container';
        container.classList.add('pulsing-highlight');
        container.addEventListener('focusin', () => { container.classList.remove('pulsing-highlight'); }, { once: true });
        const textArea = document.createElement('textarea');
        textArea.id = 'review-draft-textarea';
        textArea.className = 'review-draft-textarea';
        textArea.value = reviewText;
        container.appendChild(textArea);
        chatBody.prepend(container);
        addMessage('concierge', 'Ви можете відредагувати текст. Коли будете готові, натисніть кнопку нижче.', false, true);
        createPostButtons();
    };
});
