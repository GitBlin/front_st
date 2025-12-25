**1. 简介**

这是一个基于 AI 的交互式沟通培训系统。用户发送消息后，API不仅会返回AI的回复，还会提供训练提示。

**2. 快速开始🚀**

```
import requests

API_KEY_ST = "app-RM7Cw2hl9Fmo5pp5hLrTLqr7"
API_URL_ST = "http://dify.ai-role.cn/v1/chat-messages"

HEADERS_LLM = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {API_KEY_ST}"
}

conversation_id = None

payload = {
    "inputs": {
	    "Custom":1,
        "title": "职场功劳争夺战",
    },
    "query": "用户发言信息",
    "response_mode": "blocking",
    "conversation_id": conversation_id,
    "user": "abc-123456",
}
response = requests.post(API_URL_ST, headers=HEADERS_LLM, json=payload)
print(response.json())


```
参数说明:

query - 当Custom == 1时，query表示用户最新发言（用户输入字段），Custom == 2时，query默认设置为"请求反馈"，Custom == 3时，query默认设置为"请求评估报告"

Custom - 表示不同任务，为1时表示请求NPC回复和NPC状态信息，为2时表示请求教学反馈，为3时表示请求评估报告（注：若Custom==2，但current_stage==5(达成目标对话成功)，也自动返回评估报告）

inputs - 请求携带的参数

title - 场景对话主题

response_mode - 响应模式：streaming：基于SSE；blocking：等待执行完毕后返回(Cloudflare 100秒超时限制)。

user - 用户ID字段 --- 区分不同用户。

auto_generate_name - 创建对话名称：True为自动创建，False相反。

conversation_id - 对话id：标识每段对话的唯一ID，初始时为空，用于继续之前的对话。


**3. 响应示例**

3.1 NPC回复响应示例（Custom==1）

```
{
  "轮次": 1,
  "user_message": "你什么意思啊",
  "user_emotion": "愤怒",
  "user_belief": "陈卓有意忽视自己的贡献，这种行为是不公平的",
  "user_intention": "质问陈卓的意图并表达不满",
  "user_strategy": "Low_Skill",
  "bot_emotion": "愤怒,警觉",
  "bot_belief": "我才是这个项目的Mover，突出我的贡献是理所当然的。",
  "bot_intention": "我要坚持我的立场，不能让他分走我的核心功劳，这关系到我的晋升。",
  "strategy_sort": "High_Resistance",
  "strategy": "HR_04.讽刺挖苦：同意跟进对话，但全是反话。通过贬低用户的智商或动机来让用户知难而退。",
  "bot": "哦？我什么意思你还不明白吗？这么简单的事情还需要我解释？"
}
```
参数说明:

轮次 - 对话轮次

user_message - 用户最新发言

user_emotion - 用户情绪识别

user_belief - 用户信念识别

user_intention - 用户意图识别

user_strategy - 用户策略识别

bot_emotion - NPC当前情绪

bot_belief - NPC当前信念

bot_intention - NPC当前意图

strategy_sort - NPC回复策略大类

strategy - NPC回复策略

bot - NPC最新回复

3.2 教学反馈响应示例（Custom==2）

```
{
  "current_stage": 1,
  "score": 9,
  "goal_content": "营造理性氛围, 以平和态度开场，避免一上来就情绪化指责。",
  "strategy_name": "缓和气氛",
  "strategy_description": "通过表达理解和寻求澄清来降低对话的紧张程度，避免直接对抗。",
  "example_sentence": "哦...我可能有点误会了，你能再详细说说你的意思吗？"
}
```
参数说明：

current_stage - 用户当前对话阶段（1-4）,5表示对话成功，自动返回评估报告

score - NPC当前依从对抗系数

goal_content - 对话阶段子目标

strategy_name - 教学反馈 --- 策略名

strategy_description - 教学反馈 --- 策略描述

example_sentence - 教学反馈 --- 示例回复

3.3 评估报告响应示例（Custom==3）

```
[
    { 
      "strengths_01": "您保持了基本的礼貌和职业素养，没有在对话中表现出明显的情绪化反应。",
      "strengths_02": "您没有在对话中直接指责对方，避免了可能的关系恶化。",
      "strengths_03": "您尝试了开启对话，虽然没有深入，但表现出了沟通的意愿。"
    },
    {
      "dimension": "非暴力沟通与情绪控制",
      "score": "7",
      "justification": "您保持了基本的礼貌和职业素养，没有在对话中表现出明显的情绪化反应。",
      "suggestion": "建议在后续对话中更明确地表达自己的感受和需求，使用‘我’字句来避免对方产生防御心理。"
    },
    {
      "dimension": "事实引用与逻辑说服",
      "score": "3",
      "justification": "对话中没有提及任何具体的工作内容或证据来支持自己的贡献。",
      "suggestion": "建议在后续对话中准备并引用具体的工作成果和数据，以增强说服力。"
    },
    {
      "dimension": "关系维护与面子给与",
      "score": "6",
      "justification": "您没有直接指责对方，保持了基本的礼貌，但对话过于简短，未能有效维护关系。",
      "suggestion": "建议在后续对话中肯定对方的贡献，并将问题归因于沟通误会，以维护关系。"
    },
    {
      "dimension": "解决方案的可执行性",
      "score": "2",
      "justification": "对话中没有提出任何具体的解决方案或行动计划。",
      "suggestion": "建议在后续对话中提出具体的解决方案，如共同向领导汇报各自贡献，以确保公平认可。"
    }
]
```
参数说明：

strengths_0x(1 <= x <= 3) - 亮点评价

dimension - 评分维度名称

score - 得分（0-10分）

justification - 评分理由

suggestion - 改进建议

**❓常见问题**

返回状态码：

200 - 请求成功

400 - 请求参数错误，inputs字段内容错误

401 - API_Key验证无效

404 - url错误
