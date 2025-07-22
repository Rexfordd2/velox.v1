import Foundation
import Firebase
import FirebaseFirestore

class MessagesViewModel: ObservableObject {
    @Published var chats: [Chat] = []
    @Published var messages: [Message] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let db = Firestore.firestore()
    private var listenerRegistration: ListenerRegistration?
    
    func fetchChats() {
        guard let currentUserId = Auth.auth().currentUser?.uid else { return }
        
        isLoading = true
        
        db.collection("chats")
            .whereField("participants", arrayContains: currentUserId)
            .addSnapshotListener { [weak self] snapshot, error in
                self?.isLoading = false
                
                if let error = error {
                    self?.errorMessage = error.localizedDescription
                    return
                }
                
                guard let documents = snapshot?.documents else { return }
                
                self?.chats = documents.compactMap { document in
                    let data = document.data()
                    let participants = data["participants"] as? [String] ?? []
                    let lastMessageData = data["lastMessage"] as? [String: Any]
                    let lastMessage = lastMessageData.map { Message(dictionary: $0) }
                    let unreadCount = data["unreadCount"] as? Int ?? 0
                    
                    return Chat(
                        id: document.documentID,
                        participants: participants,
                        lastMessage: lastMessage,
                        unreadCount: unreadCount
                    )
                }
            }
    }
    
    func fetchMessages(for chatId: String) {
        guard let currentUserId = Auth.auth().currentUser?.uid else { return }
        
        listenerRegistration?.remove()
        
        listenerRegistration = db.collection("chats")
            .document(chatId)
            .collection("messages")
            .order(by: "timestamp", descending: false)
            .addSnapshotListener { [weak self] snapshot, error in
                if let error = error {
                    self?.errorMessage = error.localizedDescription
                    return
                }
                
                guard let documents = snapshot?.documents else { return }
                
                self?.messages = documents.compactMap { document in
                    var data = document.data()
                    data["id"] = document.documentID
                    return Message(dictionary: data)
                }
                
                // Mark messages as read
                self?.markMessagesAsRead(chatId: chatId)
            }
    }
    
    func sendMessage(_ content: String, to receiverId: String) {
        guard let currentUserId = Auth.auth().currentUser?.uid else { return }
        
        let chatId = [currentUserId, receiverId].sorted().joined(separator: "_")
        let messageData: [String: Any] = [
            "senderId": currentUserId,
            "receiverId": receiverId,
            "content": content,
            "timestamp": Timestamp(date: Date()),
            "isRead": false
        ]
        
        let batch = db.batch()
        
        // Add message to chat
        let messageRef = db.collection("chats").document(chatId).collection("messages").document()
        batch.setData(messageData, forDocument: messageRef)
        
        // Update chat metadata
        let chatRef = db.collection("chats").document(chatId)
        batch.setData([
            "participants": [currentUserId, receiverId],
            "lastMessage": messageData,
            "unreadCount": FieldValue.increment(Int64(1))
        ], forDocument: chatRef, merge: true)
        
        batch.commit { [weak self] error in
            if let error = error {
                self?.errorMessage = error.localizedDescription
                return
            }
            
            self?.fetchMessages(for: chatId)
        }
    }
    
    private func markMessagesAsRead(chatId: String) {
        guard let currentUserId = Auth.auth().currentUser?.uid else { return }
        
        let unreadMessages = messages.filter { !$0.isRead && $0.receiverId == currentUserId }
        
        for message in unreadMessages {
            db.collection("chats")
                .document(chatId)
                .collection("messages")
                .document(message.id)
                .updateData(["isRead": true])
        }
        
        // Update unread count
        db.collection("chats")
            .document(chatId)
            .updateData(["unreadCount": 0])
    }
    
    deinit {
        listenerRegistration?.remove()
    }
} 