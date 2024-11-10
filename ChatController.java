package com.web.p82;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;

    public ChatController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/send")
    public void sendMessage(ChatMessage message) {
        // 메시지를 받은 후 /topic/messages로 메시지를 브로드캐스트
        messagingTemplate.convertAndSend("/topic/messages", message);
    }
}
