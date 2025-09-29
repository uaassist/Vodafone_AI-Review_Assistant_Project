document.addEventListener('DOMContentLoaded', () => {
    // --- Element selectors for all views ---
    const contentArea = document.getElementById('content-area');
    const welcomeScreen = document.getElementById('welcome-screen');
    const choiceScreen = document.getElementById('choice-screen');
    const chatView = document.getElementById('chat-view');
    const chatBody = document.getElementById('chat-body');
    const quickRepliesContainer = document.getElementById('quick-replies-container');
    const progressContainer = document.getElementById('progress-container');

    // --- Single Event Listener using Event Delegation ---
    contentArea.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (!button) return;

        const buttonId = button.id;
        const buttonText = button.innerText.trim();

        switch (buttonId) {
            case 'great-btn':
                welcomeScreen.style.display = 'none';
                choiceScreen.classList.remove('hidden');
                break;
            
            case 'okay-btn':
            case 'bad-btn':
                welcomeScreen.style.display = 'none';
                recoveryScreen.classList.remove('hidden');
                break;
            
            case 'ai-draft-btn':
                choiceScreen.style.display = 'none';
                startConversation("Все було чудово!");
                break;

            case 'manual-review-btn':
                window.open(googleReviewUrl, '_blank');
                choiceScreen.innerHTML = `<h1 class="main-title">Дякуємо!</h1><p class="subtitle">Ми відкрили сторінку відгуків Google у новій вкладці.</p>`;
                break;
            
            case 'request-assistance-btn':
                alert('Перенаправлення до чату підтримки...');
                break;
            case 'schedule-callback-btn':
                alert('Перенаправлення на сторінку планування дзвінка...');
                break;
            case 'start-return-btn':
                alert('Перенаправлення на сторінку повернення...');
                break;
            case 'google-review-fallback-btn':
                window.open(googleReviewUrl, '_blank');
                recoveryScreen.innerHTML = `<h1 class="main-title">Дякуємо!</h1><p class="subtitle">Ми відкрили сторінку відгуків Google у новій вкладці.</p>`;
                break;
        }
    });

    function updateProgressBar(step) {
        const segments = progressContainer.querySelectorAll('.progress-segment');
        segments.forEach((segment, index) => {
            segment.classList.toggle('active', index < step);
        });
        const labels = progressContainer.querySelectorAll('.progress-label');
        labels.forEach((label, index) => {
            label.classList.toggle('active', index === step - 1);
        });
    }

    function startConversation(firstMessage) {
        welcomeScreen.style.display = 'none';
        choiceScreen.style.display = 'none';
        chatView.classList.remove('hidden');
        if (firstMessage.includes("чудово")) {
            progressContainer.classList.remove('hidden');
        }
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
            const data = await response.json();
            const aiMessage = data.message;
            conversationHistory.push(aiMessage);
            processAIResponse(aiMessage.content);
        } catch (error) {
            console.error("Fetch Error:", error);
            processAIResponse("Вибачте, виникла проблема зі з'єднанням. Спробуйте, будь ласка, пізніше.");
        }
    }
    
    function showTypingIndicator() {
        if (document.querySelector('.typing-indicator')) return;
        const wrapper = document.createElement('div');
        wrapper.className = 'message-wrapper concierge typing-indicator';
        wrapper.innerHTML = `<img src="${avatarUrl}" class="chat-avatar" alt="TOBi друкує"><div class="bubble"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>`;
        chatBody.prepend(wrapper);
    }

    function removeTypingIndicator() {
        const indicator = document.querySelector('.typing-indicator');
        if (indicator) indicator.remove();
    }
    
    // --- ОСНОВНА ЗМІНА ТУТ ---
    function processAIResponse(text) {
        // Спочатку обробляємо текст і додаємо нові повідомлення
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
        
        // І тільки після того, як нові елементи додані в DOM, видаляємо індикатор
        removeTypingIndicator();
    }
    // --- КІНЕЦЬ ЗМІНИ ---

    function handleFinalQuestion(question) {
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
    }

    function createEditableDraft(reviewText) {
        updateProgressBar(3);
        clearQuickReplies();
        const container = document.createElement('div');
        container.className = 'review-draft-container';
        container.classList.add('pulsing-highlight');
        container.addEventListener('focusin', () => {
            container.classList.remove('pulsing-highlight');
        }, { once: true });
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
        postButton.innerHTML = `
            <div class="button-main-text">✅ Відкрити Google для публікації</div>
            <div class="button-sub-text">Ваш відгук скопійовано — просто вставте та оцініть</div>
        `;
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
        regenerateButton.onclick = () => {
             getAIResponse("Це не зовсім те, спробуй, будь ласка, інший варіант.", true);
        };
        quickRepliesContainer.appendChild(regenerateButton);
        quickRepliesContainer.appendChild(postButton);
    }

    function clearQuickReplies() {
        quickRepliesContainer.innerHTML = '';
    }
});
