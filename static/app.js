document.addEventListener('DOMContentLoaded', () => {
    const inputText = document.getElementById('input-text');
    const languageSelect = document.getElementById('language-select');
    const humanizeBtn = document.getElementById('humanize-btn');
    const chatContainer = document.getElementById('chat-container');
    const loadingOverlay = document.getElementById('loading-overlay');
    const charCount = document.getElementById('char-count');

    const userTemplate = document.getElementById('user-message-template');
    const aiTemplate = document.getElementById('ai-message-template');

    // Update character count
    inputText.addEventListener('input', () => {
        charCount.textContent = `${inputText.value.length} characters`;
    });

    // Handle Humanize button click
    humanizeBtn.addEventListener('click', async () => {
        const text = inputText.value.trim();
        const language = languageSelect.value;

        if (!text) {
            alert('Vui lòng nhập văn bản cần humanize!');
            return;
        }

        // Add user message to chat
        addMessage(text, 'user');
        
        // Clear input
        inputText.value = '';
        charCount.textContent = '0 characters';

        // Show loading
        loadingOverlay.classList.remove('hidden');

        try {
            const response = await fetch('/humanize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text, language }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Có lỗi xảy ra khi xử lý.');
            }

            const data = await response.json();
            
            // Add AI response to chat
            addMessage(data.humanized_text, 'ai');

        } catch (error) {
            console.error('Error:', error);
            addMessage(`Lỗi: ${error.message}`, 'ai');
        } finally {
            // Hide loading
            loadingOverlay.classList.add('hidden');
            // Scroll to bottom
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    });

    function addMessage(content, role) {
        const template = role === 'user' ? userTemplate : aiTemplate;
        const clone = template.content.cloneNode(true);
        const messageDiv = clone.querySelector('div');
        const textElement = clone.querySelector('p');
        
        textElement.textContent = content;
        messageDiv.classList.add('animate-fade-in');

        if (role === 'ai') {
            const copyBtn = clone.querySelector('.copy-btn');
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(content).then(() => {
                    const originalText = copyBtn.innerHTML;
                    copyBtn.innerHTML = '<i class="fas fa-check"></i><span>Copied!</span>';
                    setTimeout(() => {
                        copyBtn.innerHTML = originalText;
                    }, 2000);
                });
            });
        }

        chatContainer.appendChild(clone);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // Allow Ctrl+Enter to trigger humanize
    inputText.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            humanizeBtn.click();
        }
    });
});
