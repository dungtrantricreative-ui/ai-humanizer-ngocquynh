document.addEventListener('DOMContentLoaded', () => {
    const inputText = document.getElementById('input-text');
    const languageSelect = document.getElementById('language-select');
    const humanizeBtn = document.getElementById('humanize-btn');
    const chatContainer = document.getElementById('chat-container');
    const charCount = document.getElementById('char-count');
    const statusModal = document.getElementById('status-modal');
    const statusContent = document.getElementById('status-content');
    const closeStatusModalBtn = document.getElementById('close-status-modal');
    const newChatBtn = document.getElementById('new-chat-btn');

    const userTemplate = document.getElementById('user-message-template');
    const aiTemplate = document.getElementById('ai-message-template');
    const statusItemTemplate = document.getElementById('status-item-template');

    let isProcessing = false;
    let currentEventSource = null;

    // Update character count
    inputText.addEventListener('input', () => {
        charCount.textContent = inputText.value.length;
    });

    // New Chat Button
    newChatBtn.addEventListener('click', () => {
        chatContainer.innerHTML = `
            <div class="flex justify-center">
                <div class="text-center max-w-2xl">
                    <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-wand-magic-sparkles text-white text-lg"></i>
                    </div>
                    <h3 class="text-2xl font-bold text-gray-900 mb-2">Chào mừng bạn!</h3>
                    <p class="text-gray-600">Hãy paste văn bản AI của bạn vào đây. Tôi sẽ biến nó thành văn bản tự nhiên như người viết, vượt qua mọi AI detector.</p>
                </div>
            </div>
        `;
        inputText.value = '';
        charCount.textContent = '0';
        statusContent.innerHTML = '';
        statusModal.classList.add('hidden');
    });

    // Close Status Modal
    closeStatusModalBtn.addEventListener('click', () => {
        statusModal.classList.add('hidden');
    });

    // Handle Humanize button click
    humanizeBtn.addEventListener('click', async () => {
        const text = inputText.value.trim();
        const language = languageSelect.value;

        if (!text) {
            alert('Vui lòng nhập văn bản cần humanize!');
            return;
        }

        if (isProcessing) {
            alert('Đang xử lý, vui lòng chờ...');
            return;
        }

        // Add user message to chat
        addMessage(text, 'user');
        
        // Clear input
        inputText.value = '';
        charCount.textContent = '0';

        // Show status modal and clear previous status
        statusContent.innerHTML = '';
        statusModal.classList.remove('hidden');

        isProcessing = true;
        humanizeBtn.disabled = true;

        try {
            await streamHumanization(text, language);
        } catch (error) {
            console.error('Error:', error);
            addMessage(`Lỗi: ${error.message}`, 'ai');
            addStatusItem('error', 'Lỗi xảy ra', error.message);
        } finally {
            isProcessing = false;
            humanizeBtn.disabled = false;
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
            const likeBtn = clone.querySelector('.like-btn');
            const dislikeBtn = clone.querySelector('.dislike-btn');

            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(content).then(() => {
                    const originalHTML = copyBtn.innerHTML;
                    copyBtn.innerHTML = '<i class="fas fa-check text-xs"></i><span class="text-xs">Đã copy!</span>';
                    setTimeout(() => {
                        copyBtn.innerHTML = originalHTML;
                    }, 2000);
                });
            });

            likeBtn.addEventListener('click', () => {
                likeBtn.classList.add('text-green-600');
                dislikeBtn.classList.remove('text-red-600');
            });

            dislikeBtn.addEventListener('click', () => {
                dislikeBtn.classList.add('text-red-600');
                likeBtn.classList.remove('text-green-600');
            });
        }

        chatContainer.appendChild(clone);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function addStatusItem(status, stepName, message) {
        const clone = statusItemTemplate.content.cloneNode(true);
        const statusItem = clone.querySelector('.status-item');
        const statusIcon = clone.querySelector('.status-icon');
        const statusNameEl = clone.querySelector('.status-name');
        const statusMessageEl = clone.querySelector('.status-message');

        statusNameEl.textContent = stepName;
        statusMessageEl.textContent = message;

        if (status === 'step') {
            statusIcon.innerHTML = '<i class="fas fa-circle-notch text-blue-600 text-xs animate-spin"></i>';
            statusItem.classList.remove('complete', 'error');
        } else if (status === 'step_complete') {
            statusIcon.innerHTML = '<i class="fas fa-check-circle text-green-600 text-xs"></i>';
            statusItem.classList.add('complete');
            statusItem.classList.remove('error');
        } else if (status === 'error') {
            statusIcon.innerHTML = '<i class="fas fa-exclamation-circle text-red-600 text-xs"></i>';
            statusItem.classList.add('error');
            statusItem.classList.remove('complete');
        }

        statusContent.appendChild(clone);
        statusContent.scrollTop = statusContent.scrollHeight;
    }

    async function streamHumanization(text, language) {
        return new Promise((resolve, reject) => {
            const eventSource = new EventSource(`/humanize?text=${encodeURIComponent(text)}&language=${language}`);
            currentEventSource = eventSource;

            let finalText = '';

            eventSource.addEventListener('message', (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.status === 'info') {
                        addStatusItem('step', 'Khởi tạo', data.message);
                    } else if (data.status === 'step') {
                        addStatusItem('step', data.step_name, data.message);
                    } else if (data.status === 'step_complete') {
                        addStatusItem('step_complete', data.step_name, data.message);
                        if (data.current_text) {
                            finalText = data.current_text;
                        }
                    } else if (data.status === 'complete') {
                        addStatusItem('step_complete', 'Hoàn tất', data.message);
                        if (data.final_text) {
                            finalText = data.final_text;
                            addMessage(finalText, 'ai');
                        }
                        eventSource.close();
                        resolve();
                    } else if (data.status === 'error') {
                        addStatusItem('error', 'Lỗi', data.message);
                        eventSource.close();
                        reject(new Error(data.message));
                    }
                } catch (e) {
                    console.error('Error parsing event data:', e);
                    eventSource.close();
                    reject(e);
                }
            });

            eventSource.addEventListener('error', (event) => {
                console.error('EventSource error:', event);
                eventSource.close();
                reject(new Error('Kết nối bị mất'));
            });
        });
    }

    // Allow Ctrl+Enter to trigger humanize
    inputText.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            humanizeBtn.click();
        }
    });
});
