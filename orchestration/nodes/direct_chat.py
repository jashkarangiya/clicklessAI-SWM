"""
direct_chat node — handles general_chat intent with a streamed LLM response.
Tokens are forwarded to the WebSocket handler via llm_client's callback registry.
"""
from state import AgentState, normalize_agent_state
from llm_client import chat_stream
from prompts import general_chat_prompt


def direct_chat_node(state: AgentState) -> AgentState:
    normalize_agent_state(state)
    state["metadata"]["nodes_visited"].append("direct_chat")
    messages = general_chat_prompt(state["user_message"], state["conversation_history"])
    try:
        session_id = state.get("session_id", "")
        state["llm_response"] = chat_stream(messages, session_id=session_id)
    except Exception as exc:
        state["llm_response"] = f"I'm having trouble responding right now. ({exc})"
    state["status"] = "completed"
    return state
