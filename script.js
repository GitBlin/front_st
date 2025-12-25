class CommunicationTrainingSystem {
    constructor() {
        this.currentCharacter = null;
        this.conversationHistory = [];
        this.userMessages = [];
        this.npcResponses = [];
        this.startTime = null;
        this.scores = {
            expression: 0,
            logic: 0,
            emotion: 0,
            adaptability: 0
        };
        this.npcMood = 80;
        this.messageCount = 0;
        this.maxMessages = 15;

        this.characters = {
            noise: {
                name: '深夜游戏噪音冲突',
                avatar: '🎮',
                title: '深夜游戏噪音冲突',
                initialMessage: '你凭什么说我声音太大了？白天上班累了，晚上放松一下怎么了？'
            },
            deadline: {
                name: '严格教授',
                avatar: '👨‍🏫',
                title: '向严格教授请求延期',
                initialMessage: '我看到了你的延期申请。你知道我的规定，除非有特殊情况，否则一律不批。'
            },
            slacker: {
                name: '划水同学',
                avatar: '😤',
                title: '小组项目的"划水"成员',
                initialMessage: '我觉得我做的贡献已经够多了，每个人都有自己的长处，不要强求大家都一样努力。'
            },
            debt: {
                name: '借钱的朋友',
                avatar: '💰',
                title: '借钱后迟迟不还的朋友',
                initialMessage: '啊，最近手头确实有点紧，下个月一定还你，相信我。'
            },
            parent: {
                name: '母亲',
                avatar: '👨‍👩‍👧‍👦',
                title: '母亲对未来规划的期望冲突',
                initialMessage: '我还是觉得你应该考公务员，稳定的工作才有保障，你现在做的事情太不稳定了。'
            },
            grade: {
                name: '任课老师',
                avatar: '📝',
                title: '期末成绩申诉',
                initialMessage: '我仔细看了你的试卷和评分标准，这个分数是合理的。如果你觉得有问题，请具体说明哪里需要复议。'
            },
            research: {
                name: '研究伙伴',
                avatar: '🔬',
                title: '课题方向分歧',
                initialMessage: '我觉得你的研究方向有问题，这种方法论在学界已经被证实效果不佳，我们应该换个方向。'
            },
            gossip: {
                name: '朋友',
                avatar: '😮',
                title: '朋友背后说你坏话',
                initialMessage: '听说你昨天在聚会上说我的坏话？我们这么多年的朋友，你怎么能这样对我？'
            },
            heartbreak: {
                name: '失恋的朋友',
                avatar: '💔',
                title: '朋友失恋倾诉但你没时间',
                initialMessage: '我真的很需要你，我失恋了，现在什么都不想干，你能来陪陪我吗？'
            },
            cancelled: {
                name: '放鸽子的朋友',
                avatar: '📱',
                title: '被朋友临时放鸽子',
                initialMessage: '对不起对不起！临时有事来不了了，下次再约吧，我请客！'
            }
        };

        // API配置 - 统一接口
        this.apiConfig = {
            apiUrl: "https://gateway.lingxinai.com/dify-test/v1/chat-messages",
            apiKey: "app-RM7Cw2hl9Fmo5pp5hLrTLqr7",
            userId: "user-" + Math.random().toString(36).substring(2, 9)
        };

        // 对话状态 - 统一使用一个conversation_id
        this.conversationId = null; // 统一的对话ID
        this.currentScore = 8; // 初始score值
        this.currentRound = 0;
        this.currentStage = 1;
        this.currentStageGoal = ''; // 当前阶段目标
        this.lastUserMessage = "";
        this.lastBotMessage = "";
        this.currentNPCState = {
            emotion: '',
            belief: '',
            intention: '',
            strategy: '',
            strategy_sort: ''
        };

        // 发送状态标志
        this.isSending = false;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.showScreen('startScreen');
    }

    setupEventListeners() {
        // 角色选择
        document.querySelectorAll('.character-card').forEach(card => {
            card.addEventListener('click', () => this.selectCharacter(card));
        });

        // 开始按钮
        document.getElementById('startBtn').addEventListener('click', () => this.startConversation());

        // 发送消息
        document.getElementById('sendBtn').addEventListener('click', () => this.sendMessage());
        document.getElementById('userInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // 建议回复按钮
        document.querySelectorAll('.suggestion-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('userInput').value = btn.dataset.response;
                this.sendMessage();
            });
        });

        // 结束对话按钮
        document.getElementById('endConversationBtn').addEventListener('click', () => this.endConversation());

        // 重新开始按钮
        document.getElementById('restartBtn').addEventListener('click', () => this.restart());

        // 导出报告按钮
        document.getElementById('exportBtn').addEventListener('click', () => this.exportReport());
    }

    selectCharacter(card) {
        document.querySelectorAll('.character-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.currentCharacter = card.dataset.character;
        document.getElementById('startBtn').disabled = false;

        // 更新建议回复
        this.updateSuggestions();
    }

    updateSuggestions() {
        const suggestions = document.getElementById('responseSuggestions');
        const characterSuggestions = {
            noise: '你的游戏声音实在太大了，影响我休息',
            deadline: '老师您好，我最近遇到了一些特殊情况，希望能申请作业延期',
            slacker: '小组项目中每个人都有责任，你应该更努力一些',
            debt: '借你钱已经三个月了，什么时候能还？',
            parent: '妈妈，我想和你谈谈我的职业规划',
            grade: '老师，我对这个分数有疑问，希望您能重新审阅',
            research: '我觉得我们应该尝试新的研究方法',
            gossip: '我听说你在背后说了我的坏话',
            heartbreak: '我很理解你现在的心情，但我现在真的很忙',
            cancelled: '这是我们约好的重要事情，你怎么能临时取消'
        };

        suggestions.innerHTML = '';
        const text = characterSuggestions[this.currentCharacter];

        const btn = document.createElement('button');
        btn.className = 'suggestion-btn';
        btn.dataset.response = text;
        btn.textContent = text;
        btn.addEventListener('click', () => {
            // 检查是否正在发送中
            if (!this.isSending) {
                const userInput = document.getElementById('userInput');
                userInput.value = btn.dataset.response;
                userInput.focus();
            }
        });
        suggestions.appendChild(btn);
    }

    startConversation() {
        const character = this.characters[this.currentCharacter];
        console.log('开始对话，角色:', character);

        document.getElementById('npcAvatar').textContent = character.avatar;
        document.getElementById('npcName').textContent = character.name;

        this.resetConversation();
        this.showScreen('conversationScreen');
        this.startTime = Date.now();

        // 设置初始NPC情绪状态
        const initialEmotions = {
            noise: '恼火，羞愧',
            deadline: '平静，恼火，警觉',
            slacker: '平静，羞愧，焦虑',
            debt: '恼火，羞愧，厌倦',
            parent: '焦虑、担忧、失望',
            grade: '平静，厌倦，警觉',
            research: '平静，警觉，失望',
            gossip: '羞愧，恼火',
            heartbreak: '羞愧、悲伤、低落',
            cancelled: '羞愧，不安'
        };

        // 设置初始goal_content
        const initialGoals = {
            noise: '建立非对抗性开场, 避免直接指责，在这个阶段建立谈话的安全氛围',
            deadline: '表达尊重与歉意, 先承认自己造成了麻烦，展现良好的学生态度',
            slacker: '破冰与激活, 尝试通过非指责的方式让王明回复消息',
            debt: '自然引入话题, 不生硬地切入，缓解催债的尴尬',
            parent: '肯定母亲初衷, 承认母亲的建议是出于对自己的爱和保护',
            grade: '表达求知态度, 强调复查是为了弄懂知识点，而非单纯争分',
            research: '汇报前期工作, 证明在原课题上并未消极怠工，而是有过尝试',
            gossip: '私密环境邀约, 确保对话一对一进行，保全对方面子',
            heartbreak: '共情与接纳, 先肯定朋友的痛苦，表示理解',
            cancelled: '表达失望情绪, 真实地告诉对方自己为这次约会做的准备'
        };

        // 设置初始情绪状态
        this.currentNPCState.emotion = initialEmotions[this.currentCharacter] || '';
        const npcEmotionElement = document.getElementById('npcEmotion');
        if (npcEmotionElement && this.currentNPCState.emotion) {
            npcEmotionElement.textContent = this.currentNPCState.emotion;
        }

        // 设置初始goal_content
        this.currentStageGoal = initialGoals[this.currentCharacter] || '';
        this.updateStageDisplay(this.currentStage, this.currentStageGoal);

        // 显示初始消息
        console.log('添加初始消息:', character.initialMessage);
        this.addNPCMessage(character.initialMessage);

        // 初始化lastBotMessage为初始消息
        this.lastBotMessage = character.initialMessage;
    }

    resetConversation() {
        this.conversationHistory = [];
        this.userMessages = [];
        this.npcResponses = [];
        this.npcMood = 80;
        this.messageCount = 0;
        this.scores = {
            expression: 0,
            logic: 0,
            emotion: 0,
            adaptability: 0
        };

        // 重置API对话状态
        this.conversationId = null; // 重置为空，第一次请求时会获得新的conversation_id
        this.currentScore = 8;
        this.currentRound = 0;
        this.currentStage = 1;
        this.currentStageGoal = ''; // 重置阶段目标
        this.lastUserMessage = "";
        // 不重置lastBotMessage，因为它在startConversation中被设置

        // 重置NPC心理状态
        this.currentNPCState = {
            emotion: '',
            belief: '',
            intention: '',
            strategy: '',
            strategy_sort: ''
        };

        document.getElementById('chatHistory').innerHTML = '';
        document.getElementById('userInput').value = '';

        // 清空NPC状态显示
        const npcStateElement = document.getElementById('npcState');
        if (npcStateElement) {
            npcStateElement.innerHTML = '';
        }

        // 清空情绪状态显示
        const npcEmotionElement = document.getElementById('npcEmotion');
        if (npcEmotionElement) {
            npcEmotionElement.textContent = '';
        }

        // 重置阶段显示
        this.updateStageDisplay(this.currentStage, '');

        // 重置建议回复按钮为初始建议
        this.updateSuggestions();

        // 重置反馈内容
        const feedbackContent = document.getElementById('feedbackContent');
        if (feedbackContent) {
            feedbackContent.textContent = '开始对话后，这里会显示实时的沟通技巧反馈...';
        }

        // 重置发送状态
        this.isSending = false;

        // 初始化抵抗性表盘仪
        this.updateResistanceGauge(this.currentScore);

        this.updateProgress();
        this.updateNPCMood();
    }

    async sendMessage() {
        const input = document.getElementById('userInput');
        const message = input.value.trim();

        // 如果正在发送中，阻止重复发送
        if (this.isSending) {
            return;
        }

        if (!message) return;

        // 设置发送状态并禁用输入控件
        this.isSending = true;
        this.disableInputControls();

        this.messageCount++;

        // 添加用户消息
        this.addUserMessage(message);
        this.userMessages.push(message);

        // 分析用户消息（保留原有的评分逻辑）
        this.analyzeMessage(message);

        // 清空输入框
        input.value = '';

        try {
            // 请求NPC回复
            const npcData = await this.requestNPCResponse(message);

            // 添加NPC回复
            this.addNPCMessage(npcData.bot);
            this.npcResponses.push(npcData.bot);

            // 更新NPC心情
            this.updateNPCMood();

            // 更新NPC状态显示
            this.updateNPCState();

            // 收到NPC回复后立即重新启用输入控件
            if (this.currentStage < 5 && this.messageCount < this.maxMessages) {
                this.isSending = false;
                this.enableInputControls();
            }

            // 显示建议回复加载动画
            this.showSuggestionLoading();

            // 更新反馈（异步进行，不阻塞用户输入）
            await this.updateFeedback();

            // 在收到教学反馈后更新阶段显示（确保使用最新的stage和goal）
            this.updateStageDisplay(this.currentStage, this.currentStageGoal || '');

            // 检查是否结束对话
            if (this.currentStage >= 5 || this.messageCount >= this.maxMessages) {
                setTimeout(() => this.endConversation(), 2000);
            }

        } catch (error) {
            console.error('Error in sendMessage:', error);
            // 错误处理
            this.addNPCMessage('抱歉，系统出现了一些问题，请稍后再试。');
            // 错误时也要重新启用输入控件
            this.isSending = false;
            this.enableInputControls();
        }

        this.updateProgress();
    }

    addUserMessage(message) {
        const chatHistory = document.getElementById('chatHistory');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user';
        messageDiv.innerHTML = `<span class="message-text">${this.escapeHtml(message)}</span>`;
        chatHistory.appendChild(messageDiv);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    addNPCMessage(message) {
        const chatHistory = document.getElementById('chatHistory');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message npc';
        messageDiv.innerHTML = `<span class="message-text">${this.escapeHtml(message)}</span>`;
        chatHistory.appendChild(messageDiv);
        chatHistory.scrollTop = chatHistory.scrollHeight;

        // 更新NPC消息面板
        document.getElementById('npcMessage').textContent = message;
    }

    analyzeMessage(message) {
        // 语言表达能力分析
        if (message.length > 20 && message.length < 150) {
            this.scores.expression += 5;
        }
        if (message.includes('请') || message.includes('谢谢') || message.includes('麻烦')) {
            this.scores.expression += 3;
        }

        // 逻辑思维分析
        if (message.includes('因为') || message.includes('所以') || message.includes('首先')) {
            this.scores.logic += 4;
        }
        if (message.includes('问题') || message.includes('解决方案') || message.includes('建议')) {
            this.scores.logic += 3;
        }

        // 情感理解分析
        if (message.includes('理解') || message.includes('认同') || message.includes('赞同')) {
            this.scores.emotion += 5;
        }
        if (message.match(/[吗？]/)) {
            this.scores.emotion += 2;
        }

        // 应变能力分析
        if (this.messageCount > 3 && !message.includes('我想')) {
            this.scores.adaptability += 4;
        }

        // 更新NPC心情
        const positiveWords = ['好的', '明白', '理解', '感谢', '同意', '没问题'];
        const negativeWords = ['不行', '困难', '问题', '麻烦', '反对'];

        positiveWords.forEach(word => {
            if (message.includes(word)) this.npcMood += 5;
        });

        negativeWords.forEach(word => {
            if (message.includes(word)) this.npcMood -= 3;
        });

        this.npcMood = Math.max(0, Math.min(100, this.npcMood));
        this.updateNPCMood();
    }

    // 禁用输入控件（发送消息时调用）
    disableInputControls() {
        const userInput = document.getElementById('userInput');
        const sendBtn = document.getElementById('sendBtn');
        const suggestionBtns = document.querySelectorAll('.suggestion-btn');

        if (userInput) {
            userInput.disabled = true;
            userInput.placeholder = '等待NPC回复...';
            userInput.style.cursor = 'not-allowed';
        }
        if (sendBtn) {
            sendBtn.disabled = true;
            sendBtn.style.cursor = 'not-allowed';
        }
        suggestionBtns.forEach(btn => {
            btn.disabled = true;
            btn.style.cursor = 'not-allowed';
            btn.style.opacity = '0.5';
        });
    }

    // 启用输入控件（收到回复后调用）
    enableInputControls() {
        const userInput = document.getElementById('userInput');
        const sendBtn = document.getElementById('sendBtn');
        const suggestionBtns = document.querySelectorAll('.suggestion-btn');

        if (userInput) {
            userInput.disabled = false;
            userInput.placeholder = '输入您的回复...';
            userInput.style.cursor = 'text';
            userInput.focus();
        }
        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.style.cursor = 'pointer';
        }
        suggestionBtns.forEach(btn => {
            btn.disabled = false;
            btn.style.cursor = 'pointer';
            btn.style.opacity = '1';
        });
    }


    async updateFeedback() {
        const feedbackContent = document.getElementById('feedbackContent');

        // 如果没有有效的NPC回复，跳过教学反馈请求
        if (!this.lastBotMessage || this.lastBotMessage === "抱歉，我没有收到回复") {
            feedbackContent.textContent = '等待对方回复...';
            return;
        }

        // 显示加载动画
        this.showFeedbackLoading(feedbackContent);

        try {
            // 请求教学反馈
            const feedbackData = await this.requestTeachingFeedback();

            // 显示教学反馈
            let feedback = '';
            if (feedbackData.strategy_name && feedbackData.strategy_description) {
                feedback = `<strong>${feedbackData.strategy_name}</strong><br>
                           ${feedbackData.strategy_description}`;
            } else {
                feedback = '继续保持沟通，注意倾听对方的观点和感受。';
            }

            feedbackContent.innerHTML = feedback;

            // 如果有示例回复，更新建议回复按钮
            if (feedbackData.example_sentence) {
                this.updateSuggestionButtons(feedbackData.example_sentence);
            }

        } catch (error) {
            console.error('Error updating feedback:', error);
            // 默认反馈
            feedbackContent.textContent = '继续练习，保持礼貌和清晰的沟通。';
        }
    }

    // 显示教学反馈加载动画
    showFeedbackLoading(container) {
        container.innerHTML = `
            <div class="feedback-loading">
                <div class="feedback-loading-spinner"></div>
                <div class="feedback-loading-text">实时教学生成中...</div>
            </div>
        `;
    }

    // 显示建议回复加载动画
    showSuggestionLoading() {
        const suggestionsContainer = document.getElementById('responseSuggestions');
        if (!suggestionsContainer) return;

        // 清空现有按钮
        suggestionsContainer.innerHTML = '';

        // 创建加载动画按钮
        const loadingBtn = document.createElement('button');
        loadingBtn.className = 'suggestion-btn suggestion-loading-btn';
        loadingBtn.disabled = true;
        loadingBtn.innerHTML = `
            <div class="suggestion-loading-content">
                <div class="suggestion-loading-spinner"></div>
                <span class="suggestion-loading-text">推荐回复生成中...</span>
            </div>
        `;

        suggestionsContainer.appendChild(loadingBtn);
    }

    // 更新建议回复按钮
    updateSuggestionButtons(exampleSentence) {
        const suggestionsContainer = document.getElementById('responseSuggestions');
        if (!suggestionsContainer) return;

        // 清空现有按钮
        suggestionsContainer.innerHTML = '';

        // 创建一个新的建议按钮，使用API返回的示例回复
        const btn = document.createElement('button');
        btn.className = 'suggestion-btn';
        btn.textContent = exampleSentence;
        btn.addEventListener('click', () => {
            if (!this.isSending) {
                const userInput = document.getElementById('userInput');
                userInput.value = exampleSentence;
                userInput.focus();
            }
        });

        suggestionsContainer.appendChild(btn);
    }

    updateProgress() {
        const progress = (this.messageCount / this.maxMessages) * 100;
        document.getElementById('conversationProgress').style.width = progress + '%';
    }

    updateNPCMood() {
        const moodBar = document.getElementById('moodBar');

        // 根据score值计算心情
        this.npcMood = Math.max(0, Math.min(100, 110 - this.currentScore * 10));

        if (moodBar) {
            moodBar.style.width = this.npcMood + '%';

            // 更新心情条颜色
            if (this.npcMood > 60) {
                moodBar.style.background = '#4CAF50';
            } else if (this.npcMood > 30) {
                moodBar.style.background = '#FFC107';
            } else {
                moodBar.style.background = '#f44336';
            }
        }
    }

    updateNPCState() {
        const npcStateElement = document.getElementById('npcState');
        const npcEmotionElement = document.getElementById('npcEmotion');

        if (npcStateElement && this.currentNPCState) {
            let stateHTML = '';

            if (this.currentNPCState.intention) {
                stateHTML += `<div class="npc-state-item"><strong>当前意图:</strong> ${this.currentNPCState.intention}</div>`;
            }

            // 移除内在信念和沟通策略的显示

            npcStateElement.innerHTML = stateHTML;
        }

        // 更新情绪状态显示在状态栏中
        if (npcEmotionElement && this.currentNPCState.emotion) {
            npcEmotionElement.textContent = this.currentNPCState.emotion;
        }
    }

    updateResistanceGauge(score) {
        const canvas = document.getElementById('resistanceGauge');
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 45;

        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 绘制背景圆弧
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI * 0.7, Math.PI * 2.3, false);
        ctx.lineWidth = 15;
        ctx.strokeStyle = '#e0e0e0';
        ctx.stroke();

        // 根据score计算颜色 (0-10: 绿色->黄色->红色)
        let color;
        if (score <= 3) {
            color = '#4CAF50'; // 绿色 - 平静
        } else if (score <= 7) {
            color = '#FFC107'; // 黄色 - 中等
        } else {
            color = '#f44336'; // 红色 - 抵抗
        }

        // 绘制数值圆弧
        const angle = Math.PI * 0.7 + (Math.PI * 1.6 * score / 10);
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI * 0.7, angle, false);
        ctx.lineWidth = 15;
        ctx.strokeStyle = color;
        ctx.stroke();

        // 绘制刻度
        for (let i = 0; i <= 10; i++) {
            const tickAngle = Math.PI * 0.7 + (Math.PI * 1.6 * i / 10);
            const innerRadius = i % 2 === 0 ? radius - 20 : radius - 15;
            const outerRadius = radius - 10;

            const x1 = centerX + Math.cos(tickAngle) * innerRadius;
            const y1 = centerY + Math.sin(tickAngle) * innerRadius;
            const x2 = centerX + Math.cos(tickAngle) * outerRadius;
            const y2 = centerY + Math.sin(tickAngle) * outerRadius;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#666';
            ctx.stroke();
        }

        // 更新数值显示
        document.getElementById('resistanceValue').textContent = score;
    }

    updateStageDisplay(stage, goalContent) {
        // 更新当前阶段显示
        document.getElementById('currentStage').textContent = stage;

        // 更新阶段进度条 (假设有5个阶段)
        const stageProgress = document.getElementById('stageProgress');
        const progressPercentage = (stage / 5) * 100;
        stageProgress.style.width = progressPercentage + '%';

        // 根据阶段更新进度条颜色
        if (stage >= 5) {
            stageProgress.style.background = 'linear-gradient(90deg, #28a745 0%, #1e7e34 100%)'; // 绿色 - 完成
        } else if (stage >= 3) {
            stageProgress.style.background = 'linear-gradient(90deg, #ffc107 0%, #e0a800 100%)'; // 黄色 - 中期
        } else {
            stageProgress.style.background = 'linear-gradient(90deg, #007bff 0%, #0056b3 100%)'; // 蓝色 - 初期
        }

        // 更新阶段目标
        const goalElement = document.getElementById('goalContent');
        if (goalContent) {
            goalElement.textContent = goalContent;
        } else {
            // 根据阶段提供默认目标描述
            const defaultGoals = {
                1: '营造理性氛围，以平和态度开场，避免一上来就情绪化指责。',
                2: '深入了解对方需求，积极倾听并收集更多信息。',
                3: '提出建设性解决方案，寻找双方都能接受的折中方案。',
                4: '推动共识达成，明确下一步行动计划。',
                5: '确认解决方案并建立持续沟通机制。'
            };
            goalElement.textContent = defaultGoals[stage] || '继续推进对话进程。';
        }

        console.log(`更新阶段显示 - 阶段: ${stage}, 目标: ${goalContent || '默认目标'}`);
    }

    // 统一API请求方法
    async makeUnifiedAPIRequest(customValue, query, additionalInputs = {}) {
        const payload = {
            inputs: {
                Custom: customValue,
                title: this.characters[this.currentCharacter].title,
                ...additionalInputs
            },
            query: query,
            response_mode: "blocking",
            conversation_id: this.conversationId, // 使用统一的conversation_id
            user: this.apiConfig.userId
        };

        console.log(`发送统一API请求 (Custom=${customValue}):`, payload);

        const response = await fetch(this.apiConfig.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiConfig.apiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`API响应 (Custom=${customValue}):`, data);

        // 更新统一的conversation_id（第一次请求时会返回新的ID）
        if (data.conversation_id) {
            this.conversationId = data.conversation_id;
            console.log(`更新conversation_id: ${this.conversationId}`);
        }

        // 解析answer字段（如果是JSON字符串）
        if (data.answer && typeof data.answer === 'string') {
            let jsonStr = data.answer;

            // 移除可能的markdown代码块标记
            if (jsonStr.startsWith('```json')) {
                jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (jsonStr.startsWith('```')) {
                jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }

            try {
                return JSON.parse(jsonStr);
            } catch (e) {
                console.error('解析answer JSON失败:', e);
                console.error('原始字符串:', jsonStr);
                return data;
            }
        } else if (data.answer && typeof data.answer === 'object') {
            return data.answer;
        }

        return data;
    }

    // NPC回复请求 (Custom=1)
    async requestNPCResponse(userMessage) {
        try {
            console.log('请求NPC回复，当前场景:', this.characters[this.currentCharacter].title);
            console.log('当前score:', this.currentScore);

            const answerData = await this.makeUnifiedAPIRequest(1, userMessage, {
                score: this.currentScore
            });

            // 更新对话状态
            this.currentRound = answerData.轮次 || this.currentRound + 1;
            this.currentScore = answerData.score || this.currentScore;
            this.lastUserMessage = answerData.user_message || userMessage;
            this.lastBotMessage = answerData.bot || "抱歉，我没有收到回复";

            // 保存NPC的心理状态
            this.currentNPCState = {
                emotion: answerData.bot_emotion || '',
                belief: answerData.bot_belief || '',
                intention: answerData.bot_intention || '',
                strategy: answerData.strategy || '',
                strategy_sort: answerData.strategy_sort || ''
            };

            console.log('更新后状态 - score:', this.currentScore, 'bot message:', this.lastBotMessage);
            console.log('NPC状态 - emotion:', this.currentNPCState.emotion, 'belief:', this.currentNPCState.belief, 'intention:', this.currentNPCState.intention);
            console.log('统一conversation_id:', this.conversationId);

            // 返回解析后的数据
            return {
                bot: this.lastBotMessage,
                score: this.currentScore,
                轮次: this.currentRound,
                fullData: answerData
            };

        } catch (error) {
            console.error('Error requesting NPC response:', error);
            // 返回默认回复
            return {
                bot: '抱歉，我现在无法回应。请稍后再试。',
                score: this.currentScore,
                轮次: this.currentRound + 1
            };
        }
    }

      // 教学反馈请求 (Custom=2)
    async requestTeachingFeedback() {
        try {
            console.log('请求教学反馈');
            console.log('用户消息:', this.lastUserMessage);
            console.log('NPC回复:', this.lastBotMessage);
            console.log('使用统一conversation_id:', this.conversationId);

            const feedbackData = await this.makeUnifiedAPIRequest(2, "请求反馈", {
                user_message: this.lastUserMessage,
                bot_message: this.lastBotMessage,
                score: this.currentScore
            });

                      // 更新状态（从教学反馈API获取stage和goal）
            this.currentStage = feedbackData.current_stage || this.currentStage;
            this.currentStageGoal = feedbackData.goal_content || this.currentStageGoal;
            this.currentScore = feedbackData.score || this.currentScore;

            // 更新抵抗性表盘仪
            this.updateResistanceGauge(this.currentScore);

            console.log('教学反馈返回 - stage:', this.currentStage, 'goal:', this.currentStageGoal, 'score:', this.currentScore);

            return feedbackData;

        } catch (error) {
            console.error('Error requesting teaching feedback:', error);
            // 返回默认反馈
            return {
                strategy_name: "基础沟通技巧",
                strategy_description: "继续练习，保持礼貌和清晰的沟通",
                example_sentence: "我理解你的想法，让我们找一个双方都能接受的解决方案。"
            };
        }
    }

    // 评估报告请求 (Custom=3)
    async requestEvaluationReport() {
        try {
            console.log('请求评估报告，使用统一conversation_id:', this.conversationId);

            const reportData = await this.makeUnifiedAPIRequest(3, "请求评估报告", {
                user_message: this.lastUserMessage,
                bot_message: this.lastBotMessage,
                score: this.currentScore
            });

            console.log('评估报告响应:', reportData);
            return reportData;

        } catch (error) {
            console.error('Error requesting evaluation report:', error);
            // 返回默认报告
            return this.getDefaultReport();
        }
    }

    getDefaultReport() {
        return [
            {
                strengths_01: "您在对话中保持了基本的礼貌",
                strengths_02: "您尝试进行沟通交流",
                strengths_03: "您表现出了解决问题的意愿"
            },
            {
                dimension: "语言表达能力",
                score: Math.round((this.scores.expression / this.messageCount) * 10) || 75,
                justification: "您的语言表达基本清晰",
                suggestion: "建议继续练习清晰表达观点"
            },
            {
                dimension: "逻辑思维能力",
                score: Math.round((this.scores.logic / this.messageCount) * 10) || 70,
                justification: "您展现了基本的逻辑思维",
                suggestion: "建议在对话中更多使用逻辑论证"
            },
            {
                dimension: "情感理解能力",
                score: Math.round((this.scores.emotion / this.messageCount) * 10) || 80,
                justification: "您展现了良好的情感理解",
                suggestion: "继续保持对他人情绪的敏感度"
            },
            {
                dimension: "应变适应能力",
                score: Math.round((this.scores.adaptability / this.messageCount) * 10) || 65,
                justification: "您在应变方面还有提升空间",
                suggestion: "建议练习在不同情境下调整沟通策略"
            }
        ];
    }

    async endConversation() {
        // 检查是否完成至少一轮对话
        if (this.messageCount < 1) {
            this.showToast('请先进行至少一轮对话后再结束对话');
            return;
        }

        // 显示加载遮罩
        this.showLoadingOverlay();

        try {
            await this.generateReport();
            this.hideLoadingOverlay();
            this.showScreen('reportScreen');
        } catch (error) {
            console.error('Error ending conversation:', error);
            this.hideLoadingOverlay();
            // 显示加载消息
            this.showScreen('reportScreen');
            document.getElementById('totalScore').textContent = '加载中...';
            document.getElementById('evaluationText').textContent = '报告生成中，请稍候...';
        }
    }

    showLoadingOverlay() {
        // 检查是否已存在加载遮罩
        if (document.getElementById('loadingOverlay')) {
            return;
        }

        // 创建加载遮罩
        const overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <div class="loading-text">报告生成中...</div>
            </div>
        `;
        document.body.appendChild(overlay);

        // 禁用页面滚动
        document.body.style.overflow = 'hidden';
    }

    hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.remove();
            document.body.style.overflow = '';
        }
    }

    showToast(message) {
        // 检查是否已存在提示框
        const existingToast = document.getElementById('toastMessage');
        if (existingToast) {
            existingToast.remove();
        }

        // 创建提示框
        const toast = document.createElement('div');
        toast.id = 'toastMessage';
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        // 3秒后自动消失
        setTimeout(() => {
            toast.classList.add('toast-hide');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }

    async generateReport() {
        const duration = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;

        // 更新基本信息
        document.getElementById('messageCount').textContent = this.messageCount;
        document.getElementById('duration').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        try {
            // 请求评估报告
            const reportData = await this.requestEvaluationReport();

            // 解析API返回的报告数据
            this.parseApiReport(reportData);

        } catch (error) {
            console.error('Error generating report:', error);
            // 使用默认报告
            this.parseApiReport(this.getDefaultReport());
        }
    }

    parseApiReport(reportData) {
        console.log('解析评估报告:', reportData);

        // 检查reportData的结构
        let strengths, dimensions;

        if (Array.isArray(reportData)) {
            // 如果是数组，第一个元素是亮点评价，后续是维度评分
            strengths = reportData[0] || {};
            dimensions = reportData.slice(1) || [];
        } else if (typeof reportData === 'object') {
            // 如果是对象，尝试提取所需字段
            strengths = {
                strengths_01: reportData.strengths_01 || '',
                strengths_02: reportData.strengths_02 || '',
                strengths_03: reportData.strengths_03 || ''
            };

            // 尝试从对象中构建维度数组
            dimensions = [];

            // 检查对象中是否包含维度数据
            // 可能的格式：dimension_1, dimension_2等，或者直接包含dimension字段的对象数组
            const dimensionKeys = ['dimension_1', 'dimension_2', 'dimension_3', 'dimension_4',
                                  '维度1', '维度2', '维度3', '维度4'];

            dimensionKeys.forEach((key) => {
                if (reportData[key] && typeof reportData[key] === 'object') {
                    dimensions.push({
                        dimension: reportData[key].dimension || key,
                        score: reportData[key].score || '75',
                        justification: reportData[key].justification || '',
                        suggestion: reportData[key].suggestion || ''
                    });
                }
            });

            // 如果没有找到，尝试查找包含dimension字段的所有属性
            if (dimensions.length === 0) {
                Object.keys(reportData).forEach(key => {
                    if (key !== 'strengths_01' && key !== 'strengths_02' && key !== 'strengths_03' &&
                        typeof reportData[key] === 'object' && reportData[key].dimension) {
                        dimensions.push(reportData[key]);
                    }
                });
            }
        } else {
            // 如果格式不识别，使用默认值
            console.warn('未知的报告数据格式，使用默认值');
            strengths = {
                strengths_01: '您在对话中保持了基本的礼貌',
                strengths_02: '您尝试进行沟通交流',
                strengths_03: '您表现出了解决问题的意愿'
            };
            dimensions = [];
        }

        // 解析亮点评价
        const strengthsText = [
            strengths.strengths_01 || '您在对话中保持了基本的礼貌',
            strengths.strengths_02 || '您尝试进行沟通交流',
            strengths.strengths_03 || '您表现出了解决问题的意愿'
        ].filter(text => text).join('；');

        // 计算总分
        let totalScore = 0;
        dimensions.forEach(dim => {
            totalScore += parseInt(dim.score) || 0;
        });
        const avgScore = dimensions.length > 0 ? Math.round(totalScore / dimensions.length) : 75;

        console.log('解析结果 - 总分:', avgScore, '亮点:', strengthsText);

        // 更新报告界面
        document.getElementById('totalScore').textContent = avgScore;

        // 生成评价文本
        this.generateEvaluationFromAPI(avgScore, strengthsText, dimensions);
    }

    generateEvaluationFromAPI(score, strengths, dimensions) {
        let evaluation = '';

        // 综合评价部分 - 使用亮点卡片样式
        evaluation += `<div class="strengths-section">`;
        evaluation += `<h4 class="section-title">
            <span class="title-icon">✨</span>
            <span>您的亮点</span>
        </h4>`;
        evaluation += `<div class="strengths-grid">`;

        // 解析亮点文本
        const strengthPoints = strengths.split('；').filter(s => s.trim());
        strengthPoints.forEach((point, index) => {
            evaluation += `<div class="strength-card">
                <div class="strength-icon">${index + 1}</div>
                <div class="strength-text">${point.trim()}</div>
            </div>`;
        });

        evaluation += `</div></div>`;

        // 各维度详细评价部分
        if (dimensions.length > 0) {
            evaluation += `<div class="dimensions-section">`;
            evaluation += `<h4 class="section-title">
                <span class="title-icon">📊</span>
                <span>各维度详细评价</span>
            </h4>`;

            dimensions.forEach(dim => {
                const scoreNum = parseInt(dim.score) || 0;
                let scoreColor = '#4CAF50'; // 绿色
                if (scoreNum >= 8) scoreColor = '#4CAF50';
                else if (scoreNum >= 5) scoreColor = '#FFC107';
                else scoreColor = '#FF6B6B';

                evaluation += `<div class="dimension-card">`;
                evaluation += `<div class="dimension-header">
                    <div class="dimension-title">${dim.dimension}</div>
                    <div class="dimension-score" style="color: ${scoreColor}">
                        <span class="score-number">${dim.score}</span>
                        <span class="score-max">/10</span>
                    </div>
                </div>`;

                if (dim.justification) {
                    evaluation += `<div class="dimension-justification">
                        <div class="detail-label">
                            <span class="detail-icon">📝</span>
                            <span>评分理由</span>
                        </div>
                        <div class="detail-content">${dim.justification}</div>
                    </div>`;
                }

                if (dim.suggestion) {
                    evaluation += `<div class="dimension-suggestion">
                        <div class="detail-label">
                            <span class="detail-icon">💡</span>
                            <span>改进建议</span>
                        </div>
                        <div class="detail-content suggestion-text">${dim.suggestion}</div>
                    </div>`;
                }

                evaluation += `</div>`;
            });
            evaluation += `</div>`;
        }

        // 设置HTML内容
        document.getElementById('evaluationText').innerHTML = evaluation;
    }

    updateDetailedScores() {
        const scoreItems = [
            { name: 'expression', label: '语言表达', score: this.scores.expression },
            { name: 'logic', label: '逻辑思维', score: this.scores.logic },
            { name: 'emotion', label: '情感理解', score: this.scores.emotion },
            { name: 'adaptability', label: '应变能力', score: this.scores.adaptability }
        ];

        const detailedScores = document.querySelector('.detailed-scores');
        detailedScores.innerHTML = '<h3>能力维度评分</h3>';

        scoreItems.forEach(item => {
            const scoreDiv = document.createElement('div');
            scoreDiv.className = 'score-item';
            scoreDiv.innerHTML = `
                <span class="score-name">${item.label}</span>
                <div class="score-bar">
                    <div class="score-fill" data-score="${item.score}"></div>
                </div>
                <span class="score-value">${item.score}</span>
            `;
            detailedScores.appendChild(scoreDiv);
        });

        // 触发动画
        setTimeout(() => {
            document.querySelectorAll('.score-fill').forEach(bar => {
                bar.style.width = bar.dataset.score + '%';
            });
        }, 100);
    }

    generateEvaluation(totalScore) {
        let evaluation = '';

        if (totalScore >= 90) {
            evaluation = '优秀！您在本次沟通培训中表现出色，展现了出色的沟通技巧和人际交往能力。您的表达清晰、逻辑性强，能够准确理解他人意图并作出恰当回应。建议继续保持这种良好的沟通习惯。';
        } else if (totalScore >= 80) {
            evaluation = '良好！您在本次沟通培训中表现不错，具备了良好的沟通基础。您的语言表达和情感理解能力较强，逻辑思维清晰。建议在应变能力方面继续加强，尝试更多的沟通策略。';
        } else if (totalScore >= 70) {
            evaluation = '中等。您在本次沟通培训中表现合格，基本的沟通技巧已经掌握。在某些方面还有提升空间，建议多练习开放性提问和积极倾听，增强对他人情感的敏感度。';
        } else {
            evaluation = '需要改进。建议您多关注沟通的基本技巧，包括语言表达的清晰度、逻辑思维的条理性，以及情感理解的准确性。可以通过更多的实践来提升沟通能力。';
        }

        // 添加具体建议
        if (this.scores.expression < 80) {
            evaluation += ' 语言表达方面，建议注意用词准确性和表达的连贯性。';
        }
        if (this.scores.logic < 80) {
            evaluation += ' 逻辑思维方面，建议增强论述的条理性和说服力。';
        }
        if (this.scores.emotion < 80) {
            evaluation += ' 情感理解方面，建议多关注对方的情绪变化和潜在需求。';
        }
        if (this.scores.adaptability < 80) {
            evaluation += ' 应变能力方面，建议学会根据不同情况调整沟通策略。';
        }

        document.getElementById('evaluationText').textContent = evaluation;
    }

    restart() {
        this.currentCharacter = null;
        document.querySelectorAll('.character-card').forEach(card => {
            card.classList.remove('selected');
        });
        document.getElementById('startBtn').disabled = true;
        this.showScreen('startScreen');
    }

    exportReport() {
        const reportData = {
            date: new Date().toLocaleString('zh-CN'),
            character: this.characters[this.currentCharacter].name,
            duration: document.getElementById('duration').textContent,
            messageCount: this.messageCount,
            totalScore: document.getElementById('totalScore').textContent,
            scores: this.scores,
            evaluation: document.getElementById('evaluationText').textContent,
            conversationHistory: this.conversationHistory
        };

        const reportText = `
沟通能力评估报告
================

生成时间：${reportData.date}
对话角色：${reportData.character}
对话时长：${reportData.duration}
对话轮数：${reportData.messageCount}

总分：${reportData.totalScore}

能力维度评分：
- 语言表达：${reportData.scores.expression}
- 逻辑思维：${reportData.scores.logic}
- 情感理解：${reportData.scores.emotion}
- 应变能力：${reportData.scores.adaptability}

综合评价：
${reportData.evaluation}

对话记录：
${this.userMessages.map((msg, i) => `用户：${msg}\nNPC：${this.npcResponses[i]}`).join('\n\n')}
        `;

        // 创建下载链接
        const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `沟通培训报告_${new Date().toISOString().slice(0, 10)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 初始化系统
document.addEventListener('DOMContentLoaded', () => {
    new CommunicationTrainingSystem();
});