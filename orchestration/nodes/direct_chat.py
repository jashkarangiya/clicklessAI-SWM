"""
direct_chat node — handles general_chat intent with a direct LLM response.
No product search or purchase flow involved.
"""
from state import AgentState
from llm_client import chat
from prompts import general_chat_prompt


def direct_chat_node(state: AgentState) -> AgentState:
    state["metadata"]["nodes_visited"].append("direct_chat")
    messages = general_chat_prompt(state["user_message"], state["conversation_history"])
    try:
        state["llm_response"] = chat(messages)
    except Exception as exc:
        state["llm_response"] = f"I'm having trouble responding right now. ({exc})"
    state["status"] = "completed"
    return state
