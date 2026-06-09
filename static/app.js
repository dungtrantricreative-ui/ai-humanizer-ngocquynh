document.addEventListener('DOMContentLoaded', () => {
    const inputText        = document.getElementById('input-text');
    const languageSelect   = document.getElementById('language-select');
    const humanizeBtn      = document.getElementById('humanize-btn');
    const chatContainer    = document.getElementById('chat-container');
    const chatScroll       = document.getElementById('chat-scroll');
    const charCount        = document.getElementById('char-count');
    const processingBadge  = document.getElementById('processing-badge');
    const welcomeScreen    = document.getElementById('welcome-screen');
    const userTpl          = document.getElementById('user-message-template');
    const stepsTpl         = document.getElementById('steps-block-template');
    const stepItemTpl      = document.getElementById('step-item-template');
    const aiTpl            = document.getElementById('ai-message-template');

    let isProcessing = false;
    let currentStepsBlock = null;   // {el, list, countEl, count, doneEl}

    // ─── Helpers ─────────────────────────────────────────────────────────────

    function scrollBottom() {
        chatScroll.scrollTo({ top: chatScroll.scrollHeight, behavior: 'smooth' });
    }

    function hideWelcome() {
        if (welcomeScreen && welcomeScreen.parentNode) {
            welcomeScreen.remove();
        }
    }

    // ─── Character count ────────────────────────────────────────────────────

    inputText.addEventListener('input', () => {
        charCount.textContent = inputText.value.length;
    });



    // ─── User message ────────────────────────────────────────────────────────

    function addUserMessage(text) {
        hideWelcome();
        const clone = userTpl.content.cloneNode(true);
        clone.querySelector('p').textContent = text;
        chatContainer.appendChild(clone);
        scrollBottom();
    }

    // ─── Steps block ─────────────────────────────────────────────────────────

    function createStepsBlock() {
        const clone = stepsTpl.content.cloneNode(true);
        const el       = clone.querySelector('.steps-block');
        const toggle   = clone.querySelector('.steps-toggle');
        const chevron  = clone.querySelector('.steps-chevron');
        const list     = clone.querySelector('.steps-list');
        const countEl  = clone.querySelector('.steps-count');
        const doneEl   = clone.querySelector('.steps-done-badge');

        toggle.addEventListener('click', () => {
            const open = !list.classList.contains('hidden');
            if (open) {
                list.classList.add('hidden');
                chevron.classList.remove('open');
            } else {
                list.classList.remove('hidden');
                chevron.classList.add('open');
            }
        });

        chatContainer.appendChild(el);
        scrollBottom();

        // Return reference to the actual DOM node (not the clone's detached el)
        const domEl = chatContainer.lastElementChild;
        const domList    = domEl.querySelector('.steps-list');
        const domCountEl = domEl.querySelector('.steps-count');
        const domDoneEl  = domEl.querySelector('.steps-done-badge');
        const domChevron = domEl.querySelector('.steps-chevron');
        const domToggle  = domEl.querySelector('.steps-toggle');

        // Expand by default while processing
        domList.classList.remove('hidden');
        domChevron.classList.add('open');

        return {
            el: domEl,
            list: domList,
            countEl: domCountEl,
            doneEl: domDoneEl,
            chevron: domChevron,
            count: 0
        };
    }

    function addStepItem(block, status, name, msg) {
        const clone = stepItemTpl.content.cloneNode(true);
        const item    = clone.querySelector('.step-item');
        const iconEl  = clone.querySelector('.step-icon');
        const nameEl  = clone.querySelector('.step-name');
        const msgEl   = clone.querySelector('.step-msg');

        nameEl.textContent = name;
        msgEl.textContent  = msg || '';
        setStepIcon(iconEl, status);

        block.list.appendChild(item);
        block.count++;
        block.countEl.textContent = block.count;
        scrollBottom();

        // return reference to the actual last step item
        return block.list.lastElementChild;
    }

    function setStepIcon(iconEl, status) {
        if (status === 'running') {
            iconEl.innerHTML = '<div class="step-icon-spin"></div>';
        } else if (status === 'done') {
            iconEl.innerHTML = `<svg class="step-icon-done" width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2.5 6.5L5 9L10.5 4" stroke="#10b981" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        } else if (status === 'error') {
            iconEl.innerHTML = `<svg class="step-icon-error" width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke="#ef4444" stroke-width="1.3"/><path d="M4.5 4.5L8.5 8.5M8.5 4.5L4.5 8.5" stroke="#ef4444" stroke-width="1.3" stroke-linecap="round"/></svg>`;
        }
    }

    function markStepsBlockDone(block) {
        block.doneEl.classList.remove('hidden');
        block.doneEl.classList.add('inline-flex');
        // Collapse after done
        setTimeout(() => {
            block.list.classList.add('hidden');
            block.chevron.classList.remove('open');
        }, 800);
    }

    // ─── AI message ──────────────────────────────────────────────────────────

    function addAIMessage(text) {
        const clone = aiTpl.content.cloneNode(true);
        const mdDiv = clone.querySelector('.markdown-body');
        if (typeof marked !== 'undefined') {
            mdDiv.innerHTML = marked.parse(text);
        } else {
            mdDiv.textContent = text;
        }
        if (typeof renderMathInElement !== 'undefined') {
            setTimeout(() => {
                renderMathInElement(mdDiv, {
                    delimiters: [
                        {left: '$$', right: '$$', display: true},
                        {left: '$', right: '$', display: false}
                    ],
                    throwOnError: false
                });
            }, 0);
        }

        const wrapper  = clone.querySelector('.ai-message-wrapper');
        const copyBtn  = clone.querySelector('.copy-btn');
        const likeBtn  = clone.querySelector('.like-btn');
        const dislikeBtn = clone.querySelector('.dislike-btn');

        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(text).then(() => {
                const orig = copyBtn.innerHTML;
                copyBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2.5 6.5L5 9L10.5 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg> Đã copy`;
                setTimeout(() => { copyBtn.innerHTML = orig; }, 2000);
            });
        });
        likeBtn.addEventListener('click', () => {
            likeBtn.classList.toggle('text-green-600');
            dislikeBtn.classList.remove('text-red-500');
        });
        dislikeBtn.addEventListener('click', () => {
            dislikeBtn.classList.toggle('text-red-500');
            likeBtn.classList.remove('text-green-600');
        });

        chatContainer.appendChild(wrapper);
        scrollBottom();
    }

    // ─── Step tracking map ───────────────────────────────────────────────────
    // Map step_name -> { itemEl, iconEl } so we can update in-place

    let stepMap = {};

    // ─── Main humanize ────────────────────────────────────────────────────────

    humanizeBtn.addEventListener('click', startHumanize);
    inputText.addEventListener('keydown', e => {
        if (e.ctrlKey && e.key === 'Enter') startHumanize();
    });

    async function startHumanize() {
        const text     = inputText.value.trim();
        const language = languageSelect.value;

        if (!text) return;
        if (isProcessing) return;

        addUserMessage(text);
        inputText.value = '';
        charCount.textContent = '0';

        isProcessing = true;
        humanizeBtn.disabled = true;
        processingBadge.classList.add('active');

        // Create steps block
        currentStepsBlock = createStepsBlock();
        stepMap = {};

        try {
            await streamHumanization(text, language);
        } catch (err) {
            console.error(err);
            addAIMessage('Lỗi: ' + err.message);
            if (currentStepsBlock) {
                addStepItem(currentStepsBlock, 'error', 'Lỗi', err.message);
            }
        } finally {
            isProcessing = false;
            humanizeBtn.disabled = false;
            processingBadge.classList.remove('active');
            if (currentStepsBlock) markStepsBlockDone(currentStepsBlock);
        }
    }

    async function streamHumanization(text, language) {
        return new Promise((resolve, reject) => {
            const url = `/humanize?text=${encodeURIComponent(text)}&language=${language}`;
            const es  = new EventSource(url);

            es.addEventListener('message', event => {
                try {
                    const data = JSON.parse(event.data);
                    handleSSEEvent(data, es, resolve, reject);
                } catch (e) {
                    es.close();
                    reject(e);
                }
            });

            es.addEventListener('error', () => {
                es.close();
                reject(new Error('Kết nối bị mất'));
            });
        });
    }

    function handleSSEEvent(data, es, resolve, reject) {
        const block = currentStepsBlock;

        if (data.status === 'info') {
            addStepItem(block, 'running', 'Khởi tạo', data.message);

        } else if (data.status === 'step') {
            // New step starts
            const key = data.step_name;
            if (!stepMap[key]) {
                const itemEl  = addStepItem(block, 'running', data.step_name, data.message);
                const iconEl  = itemEl.querySelector('.step-icon');
                stepMap[key]  = { itemEl, iconEl };
            } else {
                // Update message
                stepMap[key].itemEl.querySelector('.step-msg').textContent = data.message;
            }

        } else if (data.status === 'step_complete') {
            const key = data.step_name;
            if (stepMap[key]) {
                setStepIcon(stepMap[key].iconEl, 'done');
                stepMap[key].itemEl.querySelector('.step-msg').textContent = data.message;
            } else {
                addStepItem(block, 'done', data.step_name, data.message);
            }

        } else if (data.status === 'complete') {
            if (data.final_text) {
                addAIMessage(data.final_text);
            }
            es.close();
            resolve();

        } else if (data.status === 'error') {
            const key = data.step_name || 'Lỗi';
            if (stepMap[key]) {
                setStepIcon(stepMap[key].iconEl, 'error');
                stepMap[key].itemEl.querySelector('.step-msg').textContent = data.message;
            } else {
                addStepItem(block, 'error', key, data.message);
            }
            es.close();
            reject(new Error(data.message));
        }
    }
});
