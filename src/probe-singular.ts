import { BACKEND_URL } from "./constants";

async function probe() {
  const dummyToken = "Bearer dummy_token_value_for_probing";
  
  const testScenarios = [
    // Singular conversations
    { path: "/api/conversation", method: "GET" },
    { path: "/api/conversation", method: "POST", body: { title: "New Session" } },
    { path: "/api/conversation", method: "PUT", body: { title: "New Title" } },
    { path: "/api/conversation", method: "DELETE" },
    
    // Singular with ID
    { path: "/api/conversation/123", method: "GET" },
    { path: "/api/conversation/123", method: "PUT", body: { title: "New" } },
    { path: "/api/conversation/123", method: "DELETE" },
    
    // Chat endpoint as POST (used to send messages)
    { path: "/api/chat", method: "POST", body: { message: "Hello", conversationId: "123" } },
    { path: "/api/chat", method: "POST", body: { message: "Hello", conversation_id: "123" } },
    { path: "/api/chat", method: "POST", body: { message: "Hello" } },
    
    // Pin, rename, delete variations on singular or other paths
    { path: "/api/conversation/123/pin", method: "POST" },
    { path: "/api/conversation/123/pin", method: "PUT" },
    { path: "/api/conversation/pin", method: "POST", body: { conversationId: "123", pin: true } },
    { path: "/api/conversation/pin", method: "PUT", body: { conversationId: "123", pin: true } },
    
    // Plural conversations variations
    { path: "/api/conversations/123", method: "GET" },
    { path: "/api/conversations", method: "POST", body: { name: "New" } }, // just in case
    
    // Pinned attribute in body
    { path: "/api/conversations", method: "PUT", body: { isPinned: true } },
  ];

  console.log("Probing singular and other endpoint variations...");
  for (const ts of testScenarios) {
    try {
      const res = await fetch(`${BACKEND_URL}${ts.path}`, {
        method: ts.method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": dummyToken
        },
        body: ts.body ? JSON.stringify(ts.body) : null
      });
      const text = await res.text();
      console.log(`[${ts.method}] ${ts.path} -> Status: ${res.status}`);
      console.log(`Response: ${text.slice(0, 300)}`);
    } catch (err: any) {
      console.log(`[${ts.method}] ${ts.path} -> Fetch Error: ${err.message}`);
    }
  }
}

probe();
