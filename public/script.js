document.addEventListener('DOMContentLoaded', () => {
    // ... (всі селектори та початкові слухачі подій залишаються без змін) ...
    
    // ОСНОВНА ЗМІНА ТУТ: ЛОГІКА ОБРОБКИ ВІДПОВІДІ
    async function getAIResponse(userMessage) {
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
            
            // Тепер ми очікуємо JSON об'єкт
            const aiResponseObject = await response.json();
            
            // Ми не додаємо весь об'єкт в історію, а лише те, що потрібно для ШІ
            if (aiResponseObject.draft) {
                conversationHistory.push({ role: 'assistant', content: aiResponseObject.draft });
            }

            processAIResponse(aiResponseObject);
        } catch (error) {
            console.error("Fetch Error:", error);
            processAIResponse({ type: 'message', text: "Вибачте, виникла проблема зі з'єднанням." });
        }
    }

    function processAIResponse(responseObject) {
        removeTypingIndicator();

        switch (responseObject.type) {
            case 'question':
                if (responseObject.statement) {
                    addMessage('concierge', responseObject.statement);
                }
                handleFinalQuestion(responseObject.question, responseObject.step);
                break;
            
            case 'draft':
                if (responseObject.statement) {
                    addMessage('concierge', responseObject.statement);
                }
                createEditableDraft(responseObject.draft);
                // Для налагодження: виводимо аналіз ШІ в консоль розробника
                console.log('AI Analysis:', responseObject.analysis);
                break;
            
            case 'message':
                addMessage('concierge', responseObject.text);
                break;
        }
    }

    function handleFinalQuestion(question, step) {
        addMessage('concierge', question, false, true);
        updateProgressBar(step);
        
        if (step === 1) { // Мета візиту
            const tier1Options = ["📱 Новий телефон/пристрій", "🔄 Зміна/оновлення тарифу", "🔧 Технічна підтримка", "💳 Оплата рахунку", "👤 Реєстрація нового номера"];
            createMultiSelectButtons(tier1Options, 'purpose');
        } else if (step === 2) { // Враження
            const tier2Options = ["⭐ Компетентні працівники", "💨 Швидке обслуговування", "🏬 Чистота в магазині", "👍 Простий процес", "🤝 Проблему вирішено"];
            createMultiSelectButtons(tier2Options, 'experience');
        }
    }

    // --- Решта файлу залишається майже без змін ---
    // ... (всі інші функції, такі як startConversation, addMessage, createPostButtons і т.д., залишаються такими ж, як у попередній версії)
    
    // Повний код для довідки
    const contentArea = document.getElementById('content-area');
    const welcomeScreen = document.getElementById('welcome-screen');
    const choiceScreen = document.getElementById('choice-screen');
    const chatView = document.getElementById('chat-view');
    const recoveryScreen = document.getElementById('recovery-screen');
    const chatBody = document.getElementById('chat-body');
    const quickRepliesContainer = document.getElementById('quick-replies-container');
    const progressContainer = document.getElementById('progress-container');

    contentArea.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (!button) return;
        const buttonId = button.id;
        const buttonText = button.innerText.trim();
        switch (buttonId) {
            case 'great-btn': welcomeScreen.style.display = 'none'; choiceScreen.classList.remove('hidden'); break;
            case 'okay-btn': case 'bad-btn': welcomeScreen.style.display = 'none'; recoveryScreen.classList.remove('hidden'); break;
            case 'ai-draft-btn': choiceScreen.style.display = 'none'; startConversation("Все було чудово!"); break;
            case 'manual-review-btn': window.open(googleReviewUrl, '_blank'); choiceScreen.innerHTML = `<h1 class="main-title">Дякуємо!</h1><p class="subtitle">Ми відкрили сторінку відгуків Google у новій вкладці.</p>`; break;
            case 'request-assistance-btn': alert('Перенаправлення до чату підтримки...'); break;
            case 'schedule-callback-btn': alert('Перенаправлення на сторінку планування дзвінка...'); break;
            case 'start-return-btn': alert('Перенаправлення на сторінку повернення...'); break;
            case 'google-review-fallback-btn': window.open(googleReviewUrl, '_blank'); recoveryScreen.innerHTML = `<h1 class="main-title">Дякуємо!</h1><p class="subtitle">Ми відкрили сторінку відгуків Google у новій вкладці.</p>`; break;
        }
    });

    function updateProgressBar(step) {
        const segments = progressContainer.querySelectorAll('.progress-segment');
        segments.forEach((segment, index) => { segment.classList.toggle('active', index < step); });
        const labels = progressContainer.querySelectorAll('.progress-label');
        labels.forEach((label, index) => { label.classList.toggle('active', index === step - 1); });
    }

    function startConversation(firstMessage) {
        welcomeScreen.style.display = 'none';
        choiceScreen.style.display = 'none';
        chatView.classList.remove('hidden');
        if (firstMessage.includes("чудово")) { progressContainer.classList.remove('hidden'); }
        getAIResponse(firstMessage);
    }

    let conversationHistory = [];
    const placeId = 'Your_Google_Place_ID_Here';
    const googleReviewUrl = `https://search.google.com/local/writereview?placeid=${placeId}`;
    const avatarUrl = 'https://ucarecdn.com/c679e989-5032-408b-ae8a-83c7d204c67d/Vodafonebot.webp';

    function addMessage(sender, text, isHtml = false, isQuestion = false) {
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
    }

    function showTypingIndicator() { /* ... */ }
    function removeTypingIndicator() { /* ... */ }

    function createEditableDraft(reviewText) {
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
    }

    function createMultiSelectButtons(options, step) {
        clearQuickReplies();
        options.forEach(optionText => {
            const button = document.createElement('button');
            button.className = 'quick-reply-btn';
            button.innerText = optionText;
            button.onclick = () => { button.classList.toggle('selected'); };
            quickRepliesContainer.appendChild(button);
        });
        const continueButton = document.createElement('button');
        continueButton.className = 'quick-reply-btn continue-btn';
        continueButton.innerText = 'Далі';
        continueButton.onclick = () => {
            const selectedButtons = quickRepliesContainer.querySelectorAll('.quick-reply-btn.selected');
            const selectedKeywords = Array.from(selectedButtons).map(btn => btn.innerText);
            let combinedMessage = selectedKeywords.length > 0 ? selectedKeywords.join(', ') : "Нічого конкретного не виділено";
            if (step === 'purpose') {
                combinedMessage = `Мета візиту: ${combinedMessage}`;
            } else if (step === 'experience') {
                combinedMessage = `Враження від обслуговування: ${combinedMessage}`;
            }
            getAIResponse(combinedMessage);
        };
        quickRepliesContainer.appendChild(continueButton);
    }

    function createPostButtons() {
        clearQuickReplies();
        const postButton = document.createElement('button');
        postButton.className = 'quick-reply-btn primary-action choice-button'; 
        postButton.innerHTML = `<div class="button-main-text">✅ Відкрити Google для публікації</div><div class="button-sub-text">Ваш відгук скопійовано — просто вставте та оцініть</div>`;
        postButton.onclick = () => {
            const draftText = document.getElementById('review-draft-textarea').value;
            window.open(googleReviewUrl, '_blank');
            navigator.clipboard.writeText(draftText);
            clearQuickReplies();
            addMessage('concierge', "Дякуємо за ваш відгук!");
        };
        const regenerateButton = document.createElement('button');
        regenerateButton.className = 'quick-reply-btn';
        regenerateButton.innerText = '🔄 Інша версія';
        regenerateButton.onclick = () => { getAIResponse("Це не зовсім те, спробуй, будь ласка, інший варіант.", true); };
        quickRepliesContainer.appendChild(regenerateButton);
        quickRepliesContainer.appendChild(postButton);
    }

    function clearQuickReplies() {
        quickRepliesContainer.innerHTML = '';
    }
});
